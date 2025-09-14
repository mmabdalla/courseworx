const express = require('express');
const { body, validationResult } = require('express-validator');
const { CourseContent, QuizQuestion, Course } = require('../models');
const { auth, requireTrainer } = require('../middleware/auth');
const { requirePaidEnrollment, requireEnrollment, requireCourseAccess } = require('../middleware/courseAccess');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createSafeDirectoryName } = require('../utils/folderNaming');
const ffprobe = require('ffprobe-static');
const { spawn } = require('child_process');

const router = express.Router();

// Function to extract video duration using ffprobe
const getVideoDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    const ffprobePath = ffprobe.path;
    const args = [
      '-v', 'quiet',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      filePath
    ];
    
    const process = spawn(ffprobePath, args);
    let output = '';
    let error = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        const duration = parseFloat(output.trim());
        if (!isNaN(duration)) {
          resolve(Math.round(duration)); // Return duration in seconds
        } else {
          resolve(null);
        }
      } else {
        console.log('FFprobe error:', error);
        resolve(null);
      }
    });
    
    process.on('error', (err) => {
      console.log('FFprobe spawn error:', err);
      resolve(null);
    });
  });
};

// Multer storage for course content files
const contentFileStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const courseId = req.params.courseId;
      const contentType = req.params.contentType || 'documents';
      
      // Get course title to create consistent folder naming
      const course = await require('../models/Course').findByPk(courseId);
      if (!course) {
        return cb(new Error('Course not found'), null);
      }
      
      // Use the consistent folder naming utility
      const courseDirName = createSafeDirectoryName(course.title, course.language);
      const dir = path.join(__dirname, '../uploads/courses', courseDirName, contentType);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}_${originalName}`);
  }
});

const uploadContentFile = multer({
  storage: contentFileStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = {
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi']
    };
    
    const contentType = req.params.contentType;
    if (allowedTypes[contentType] && allowedTypes[contentType].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${contentType}`), false);
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// @route   GET /api/courses/:courseId/content
// @desc    Get all content for a course
// @access  Private (Course owner or enrolled students who have paid)
router.get('/:courseId/content', auth, requireCourseAccess, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { type, isPublished } = req.query;

    const whereClause = { courseId };
    if (type) whereClause.type = type;
    if (isPublished !== undefined) {
      whereClause.isPublished = isPublished === 'true';
    }

    const contents = await CourseContent.findAll({
      where: whereClause,
      include: [
        {
          model: QuizQuestion,
          as: 'questions',
          attributes: ['id', 'question', 'questionType', 'points', 'order']
        }
      ],
      order: [['order', 'ASC']]
    });

    res.json({ contents });
  } catch (error) {
    console.error('Get course content error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/courses/:courseId/content/:contentId
// @desc    Get specific content by ID
// @access  Private (Course owner or enrolled students who have paid)
router.get('/:courseId/content/:contentId', auth, requireCourseAccess, async (req, res) => {
  try {
    const { contentId } = req.params;

    const content = await CourseContent.findByPk(contentId, {
      include: [
        {
          model: QuizQuestion,
          as: 'questions',
          order: [['order', 'ASC']]
        }
      ]
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found.' });
    }

    res.json({ content });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/courses/:courseId/content
// @desc    Create new course content
// @access  Private (Course owner only)
router.post('/:courseId/content', [
  auth,
  requireTrainer,
  body('title').isLength({ min: 1, max: 200 }),
  body('type').isIn(['document', 'image', 'video', 'article', 'quiz', 'certificate']),
  body('description').optional().isLength({ max: 1000 }),
  body('order').optional().isInt({ min: 0 }),
  body('points').optional().isInt({ min: 0 }),
  body('isRequired').optional().isBoolean(),
  body('sectionId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId } = req.params;
    const {
      title,
      description,
      type,
      content,
      order,
      points,
      isRequired,
      articleContent,
      quizData,
      certificateTemplate,
      sectionId
    } = req.body;

    // Verify course ownership
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    
    // Allow super admins and course trainers to add content
    // If trainerId is not set, allow the user to add content (they might be the creator)
    if (course.trainerId && course.trainerId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to add content to this course.' });
    }
    
    // If course doesn't have a trainer assigned, assign the current user as trainer
    if (!course.trainerId && req.user.role === 'trainer') {
      await course.update({ trainerId: req.user.id });
    }

    const courseContent = await CourseContent.create({
      courseId,
      sectionId,
      title,
      description,
      type,
      content: content || {},
      order: order || 0,
      points: points || 0,
      isRequired: isRequired !== undefined ? isRequired : true,
      articleContent,
      quizData,
      certificateTemplate
    });

    res.status(201).json({
      message: 'Content created successfully.',
      content: courseContent
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/courses/:courseId/content/:contentId
// @desc    Update course content
// @access  Private (Course owner only)
router.put('/:courseId/content/:contentId', [
  auth,
  requireTrainer,
  body('title').optional().isLength({ min: 1, max: 200 }),
  body('description').optional().isLength({ max: 1000 }),
  body('order').optional().isInt({ min: 0 }),
  body('points').optional().isInt({ min: 0 }),
  body('isRequired').optional().isBoolean(),
  body('isPublished').optional().isBoolean(),
  body('sectionId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contentId } = req.params;

    const content = await CourseContent.findByPk(contentId);

    if (!content) {
      return res.status(404).json({ error: 'Content not found.' });
    }

    // Get the course to verify ownership
    const course = await Course.findByPk(content.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Verify course ownership
    // Allow super admins and course trainers to update content
    // If trainerId is not set, allow the user to update content (they might be the creator)
    if (course.trainerId && course.trainerId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to update this content.' });
    }
    
    // If course doesn't have a trainer assigned, assign the current user as trainer
    if (!course.trainerId && req.user.role === 'trainer') {
      await course.update({ trainerId: req.user.id });
    }

    const updateData = { ...req.body };
    
    // Handle articleContent transformation - convert object to string if needed
    if (updateData.articleContent !== undefined) {
      if (typeof updateData.articleContent === 'object') {
        updateData.articleContent = JSON.stringify(updateData.articleContent);
      }
      // If it's already a string, keep it as is
    }
    
    // Handle content field transformation
    if (updateData.content && typeof updateData.content === 'string') {
      try {
        updateData.content = JSON.parse(updateData.content);
      } catch (e) {
        // If it's not valid JSON, keep it as is
      }
    }

    await content.update(updateData);

    res.json({
      message: 'Content updated successfully.',
      content
    });
  } catch (error) {
    console.error('Update content error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error.', details: error.message });
  }
});

// @route   DELETE /api/courses/:courseId/content/:contentId
// @desc    Delete course content
// @access  Private (Course owner only)
router.delete('/:courseId/content/:contentId', auth, requireTrainer, async (req, res) => {
  try {
    const { contentId } = req.params;

    const content = await CourseContent.findByPk(contentId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found.' });
    }

    // Verify course ownership
    // Allow super admins and course trainers to delete content
    // If trainerId is not set, allow the user to delete content (they might be the creator)
    if (content.course.trainerId && content.course.trainerId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to delete this content.' });
    }
    
    // If course doesn't have a trainer assigned, assign the current user as trainer
    if (!content.course.trainerId && req.user.role === 'trainer') {
      await content.course.update({ trainerId: req.user.id });
    }

    // Delete associated file if exists
    if (content.fileUrl) {
      const filePath = path.join(__dirname, '..', content.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await content.destroy();

    res.json({ message: 'Content deleted successfully.' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/courses/:courseId/content/:contentType/upload
// @desc    Upload file for course content
// @access  Private (Course owner only)
router.post('/:courseId/content/:contentType/upload', [
  auth,
  requireTrainer,
  uploadContentFile.single('file')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { courseId, contentType } = req.params;
    const { contentId } = req.body;

    console.log('📤 Upload request details:', {
      courseId,
      contentType,
      contentId,
      fileName: req.file?.filename,
      fileSize: req.file?.size,
      fileMimeType: req.file?.mimetype
    });

    // Verify course ownership
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    // Allow super admins and course trainers to upload content
    // If trainerId is not set, allow the user to upload content (they might be the creator)
    if (course.trainerId && course.trainerId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to upload content to this course.' });
    }
    
    // If course doesn't have a trainer assigned, assign the current user as trainer
    if (!course.trainerId && req.user.role === 'trainer') {
      await course.update({ trainerId: req.user.id });
    }

    // Use consistent folder naming based on course title
    const courseDirName = createSafeDirectoryName(course.title, course.language);
    const fileUrl = `/uploads/courses/${courseDirName}/${contentType}/${req.file.filename}`;

    // Extract video duration if it's a video file
    let duration = null;
    if (contentType === 'video') {
      try {
        duration = await getVideoDuration(req.file.path);
        console.log(`📹 Video duration extracted: ${duration} seconds`);
      } catch (error) {
        console.log('❌ Error extracting video duration:', error);
      }
    }

    // Update content if contentId is provided
    if (contentId) {
      console.log('🔍 Looking for content with ID:', contentId);
      const content = await CourseContent.findByPk(contentId);
      if (content) {
        console.log('✅ Found content, updating with file details:', {
          fileUrl,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          duration
        });
        await content.update({
          fileUrl,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          duration: duration // Store the extracted duration
        });
        console.log('✅ Content updated successfully');
      } else {
        console.log('❌ Content not found with ID:', contentId);
      }
    } else {
      console.log('⚠️ No contentId provided, file uploaded but not associated with content');
    }

    res.json({
      message: 'File uploaded successfully.',
      fileUrl,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      duration: duration
    });
  } catch (error) {
    console.error('Upload content file error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/courses/:courseId/content/:contentId/questions
// @desc    Add quiz questions to content
// @access  Private (Course owner only)
router.post('/:courseId/content/:contentId/questions', [
  auth,
  requireTrainer,
  body('questions').isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contentId } = req.params;
    const { questions } = req.body;

    const content = await CourseContent.findByPk(contentId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found.' });
    }

    if (content.type !== 'quiz') {
      return res.status(400).json({ error: 'Can only add questions to quiz content.' });
    }

    // Verify course ownership
    // Allow super admins and course trainers to add questions
    // If trainerId is not set, allow the user to add questions (they might be the creator)
    if (content.course.trainerId && content.course.trainerId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to add questions to this content.' });
    }
    
    // If course doesn't have a trainer assigned, assign the current user as trainer
    if (!content.course.trainerId && req.user.role === 'trainer') {
      await content.course.update({ trainerId: req.user.id });
    }

    const createdQuestions = await QuizQuestion.bulkCreate(
      questions.map((q, index) => ({
        contentId,
        ...q,
        order: q.order || index
      }))
    );

    res.status(201).json({
      message: 'Questions added successfully.',
      questions: createdQuestions
    });
  } catch (error) {
    console.error('Add quiz questions error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router; 