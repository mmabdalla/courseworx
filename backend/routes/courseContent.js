const express = require('express');
const { body, validationResult } = require('express-validator');
const { CourseContent, QuizQuestion, Course } = require('../models');
const { auth, requireTrainer } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer storage for course content files
const contentFileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const courseId = req.params.courseId;
    const contentType = req.params.contentType || 'documents';
    const dir = path.join(__dirname, '../uploads/courses', courseId, contentType);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
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
// @access  Private (Course owner or enrolled students)
router.get('/:courseId/content', auth, async (req, res) => {
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
// @access  Private (Course owner or enrolled students)
router.get('/:courseId/content/:contentId', auth, async (req, res) => {
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
  body('isRequired').optional().isBoolean()
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
      certificateTemplate
    } = req.body;

    // Verify course ownership
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    if (course.trainerId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to add content to this course.' });
    }

    const courseContent = await CourseContent.create({
      courseId,
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
  body('isPublished').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contentId } = req.params;

    const content = await CourseContent.findByPk(contentId, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found.' });
    }

    // Verify course ownership
    if (content.course.trainerId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to update this content.' });
    }

    const updateData = req.body;
    await content.update(updateData);

    res.json({
      message: 'Content updated successfully.',
      content
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Server error.' });
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
    if (content.course.trainerId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to delete this content.' });
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

    // Verify course ownership
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    if (course.trainerId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to upload content to this course.' });
    }

    const fileUrl = `/uploads/courses/${courseId}/${contentType}/${req.file.filename}`;

    // Update content if contentId is provided
    if (contentId) {
      const content = await CourseContent.findByPk(contentId);
      if (content) {
        await content.update({
          fileUrl,
          fileSize: req.file.size,
          fileType: req.file.mimetype
        });
      }
    }

    res.json({
      message: 'File uploaded successfully.',
      fileUrl,
      fileSize: req.file.size,
      fileType: req.file.mimetype
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
    if (content.course.trainerId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to add questions to this content.' });
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