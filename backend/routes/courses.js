const express = require('express');
const { body, validationResult } = require('express-validator');
const { Course, User, Enrollment } = require('../models');
const { auth, requireSuperAdmin, requireTrainer } = require('../middleware/auth');
const { requireEnrollment } = require('../middleware/courseAccess');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Helper function to create a safe directory name from a course title
const createSafeDirectoryName = (title, language = 'english') => {
  if (!title || typeof title !== 'string') {
    return 'course-' + Date.now();
  }

  let safeName;
  
  if (language === 'arabic') {
    // For Arabic courses, use first three words separated by hyphens
    const words = title.trim().split(/\s+/).filter(word => word.length > 0);
    safeName = words.slice(0, 3).join('-');
    
    // Clean up any remaining special characters
    safeName = safeName.replace(/[^\p{L}\p{N}\s-]/gu, '');
    
    // If still empty, use fallback
    if (!safeName || safeName.trim() === '') {
      safeName = 'arabic-course-' + Date.now();
    }
  } else {
    // For all other languages, use the first 3 words approach consistently
    const words = title.trim().split(/\s+/).filter(word => word.length > 0);
    safeName = words.slice(0, 3).join('-');
    
    // Clean up special characters
    safeName = safeName
      .replace(/[^\p{L}\p{N}\s-]/gu, '') // Keep letters (including non-Latin), numbers, spaces, and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 100); // Limit length to prevent path issues
    
    // If the result is empty, use a fallback
    if (!safeName || safeName.trim() === '') {
      safeName = 'course-' + Date.now();
    }
  }
  
  return safeName;
};

// Multer storage for course images
const courseImageStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      let courseName;
      
      // Handle both course name and course ID endpoints
      if (req.params.courseName) {
        // For course image endpoint, use the courseName parameter
        courseName = req.params.courseName;
      } else if (req.params.id) {
        // For thumbnail endpoint, we need to get the course title
        // We'll use a temporary name and rename the directory after upload
        courseName = 'temp-' + req.params.id;
      } else {
        courseName = 'temp';
      }
      
      const dir = path.join(__dirname, '../uploads/courses', courseName);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const uploadCourseImage = multer({
  storage: courseImageStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// @route   GET /api/courses
// @desc    Get all courses (with filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      level, 
      courseType,
      trainerId, 
      isPublished, 
      page = 1, 
      limit = 12,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    if (category) whereClause.category = category;
    if (level) whereClause.level = level;
    if (courseType) whereClause.courseType = courseType;
    if (trainerId) whereClause.trainerId = trainerId;
    // Only apply isPublished filter if it's provided in the query
    if (isPublished !== undefined) {
      whereClause.isPublished = isPublished === 'true';
    } else {
      // For non-authenticated users, only show published courses
      if (!req.user || req.user.role === 'trainee') {
        whereClause.isPublished = true;
      }
    }
    
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { title: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { description: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { shortDescription: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: courses } = await Course.findAndCountAll({
      where: whereClause,
      attributes: { 
        include: ['id', 'title', 'description', 'shortDescription', 'courseType', 'language', 'thumbnail', 'price', 'duration', 'level', 'category', 'tags', 'isPublished', 'isFeatured', 'maxStudents', 'startDate', 'endDate', 'requirements', 'learningOutcomes', 'curriculum', 'rating', 'totalRatings', 'enrolledStudents', 'trainerId', 'location', 'allowRecording', 'recordForReplay', 'recordForFutureStudents', 'createdAt', 'updatedAt']
      },
      include: [
        {
          model: User,
          as: 'trainer',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      courses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Private (Enrolled students or course owner)
router.get('/:id', auth, requireEnrollment, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      attributes: { 
        include: ['id', 'title', 'description', 'shortDescription', 'courseType', 'language', 'thumbnail', 'price', 'duration', 'level', 'category', 'tags', 'isPublished', 'isFeatured', 'maxStudents', 'startDate', 'endDate', 'requirements', 'learningOutcomes', 'curriculum', 'rating', 'totalRatings', 'enrolledStudents', 'trainerId', 'location', 'allowRecording', 'recordForReplay', 'recordForFutureStudents', 'createdAt', 'updatedAt']
      },
      include: [
        {
          model: User,
          as: 'trainer',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'email']
        },
        {
          model: Enrollment,
          as: 'enrollments',
          attributes: ['id', 'status', 'enrolledAt', 'progress'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName', 'avatar']
            }
          ]
        }
      ]
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    res.json({ course });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/courses
// @desc    Create new course (Super Admin or Trainer)
// @access  Private
router.post('/', [
  auth,
  requireTrainer,
  body('title').isLength({ min: 3, max: 200 }),
  body('description').notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('level').isIn(['beginner', 'intermediate', 'advanced']),
  body('category').optional().isLength({ min: 2, max: 100 }),
  body('courseType').isIn(['online', 'classroom', 'hybrid']),
  body('language').isIn(['english', 'arabic', 'french', 'spanish', 'german', 'chinese', 'japanese', 'korean', 'hindi', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      shortDescription,
      courseType,
      language,
      price,
      duration,
      level,
      category,
      tags,
      requirements,
      learningOutcomes,
      curriculum,
      maxStudents,
      startDate,
      endDate,
      location,
      allowRecording,
      recordForReplay,
      recordForFutureStudents
    } = req.body;

    const course = await Course.create({
      title,
      description,
      shortDescription,
      courseType,
      language,
      price,
      duration,
      level,
      category,
      tags: tags || [],
      requirements,
      learningOutcomes,
      curriculum: curriculum || [],
      maxStudents,
      startDate,
      endDate,
      location,
      allowRecording,
      recordForReplay,
      recordForFutureStudents,
      trainerId: req.user.id,
      isPublished: true // Auto-publish for all users
    });

    const courseWithTrainer = await Course.findByPk(course.id, {
      include: [
        {
          model: User,
          as: 'trainer',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ]
    });

    res.status(201).json({
      message: 'Course created successfully.',
      course: courseWithTrainer
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course (Owner or Super Admin)
// @access  Private
router.put('/:id', [
  auth,
  body('title').optional().isLength({ min: 3, max: 200 }),
  body('description').optional().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  body('level').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('category').optional().isLength({ min: 2, max: 100 }),
  body('courseType').optional().isIn(['online', 'classroom', 'hybrid']),
  body('language').optional().isIn(['english', 'arabic', 'french', 'spanish', 'german', 'chinese', 'japanese', 'korean', 'hindi', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Check permissions
    if (req.user.role !== 'super_admin' && course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this course.' });
    }

    const updateData = req.body;
    await course.update(updateData);

    const updatedCourse = await Course.findByPk(course.id, {
      include: [
        {
          model: User,
          as: 'trainer',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ]
    });

    res.json({
      message: 'Course updated successfully.',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course (Owner or Super Admin)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Check permissions
    if (req.user.role !== 'super_admin' && course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this course.' });
    }

    await course.destroy();

    res.json({ message: 'Course deleted successfully.' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/courses/:id/publish
// @desc    Publish/unpublish course (Owner or Super Admin)
// @access  Private
router.put('/:id/publish', [
  auth,
  body('isPublished').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Check permissions
    if (req.user.role !== 'super_admin' && course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this course.' });
    }

    await course.update({ isPublished: req.body.isPublished });

    res.json({
      message: `Course ${req.body.isPublished ? 'published' : 'unpublished'} successfully.`,
      course: {
        id: course.id,
        title: course.title,
        isPublished: course.isPublished
      }
    });
  } catch (error) {
    console.error('Publish course error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/courses/:courseName/image
// @desc    Upload course image (Super Admin or Trainer)
// @access  Private
router.post('/:courseName/image', [auth, requireTrainer, uploadCourseImage.single('image')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }
    
    // For consistency, we should use the course title instead of courseName parameter
    // But since this route might be used for existing courses, we'll keep the current behavior
    // and update the frontend to use the thumbnail route instead for new courses
    
    res.json({
      message: 'Image uploaded successfully.',
      imageUrl: `/uploads/courses/${req.params.courseName}/${req.file.filename}`
    });
  } catch (error) {
    console.error('Upload course image error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/courses/:id/thumbnail
// @desc    Upload and set course thumbnail (Super Admin or Trainer)
// @access  Private
router.post('/:id/thumbnail', [auth, requireTrainer, uploadCourseImage.single('image')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Check permissions
    if (req.user.role !== 'super_admin' && course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this course.' });
    }

    // Generate proper course directory name
    const courseDirName = createSafeDirectoryName(course.title, course.language);
    const tempDir = path.join(__dirname, '../uploads/courses', `temp-${req.params.id}`);
    const finalDir = path.join(__dirname, '../uploads/courses', courseDirName);
    
    console.log('📁 Creating directory for course:', {
      originalTitle: course.title,
      safeDirName: courseDirName,
      tempDir: tempDir,
      finalDir: finalDir
    });
    
    // Validate the safe directory name
    if (!courseDirName || courseDirName.trim() === '') {
      throw new Error('Failed to generate safe directory name from course title');
    }
    
    // Create final directory if it doesn't exist
    try {
      if (!fs.existsSync(finalDir)) {
        fs.mkdirSync(finalDir, { recursive: true });
        console.log('✅ Directory created successfully:', finalDir);
      } else {
        console.log('✅ Directory already exists:', finalDir);
      }
    } catch (dirError) {
      console.error('❌ Error creating directory:', dirError);
      throw new Error(`Failed to create directory: ${dirError.message}`);
    }
    
    // Move file from temp directory to final directory
    const tempFilePath = req.file.path;
    const finalFilePath = path.join(finalDir, path.basename(req.file.filename));
    
    // Copy file to final location
    fs.copyFileSync(tempFilePath, finalFilePath);
    
    // Remove temp file and directory
    fs.unlinkSync(tempFilePath);
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir, { recursive: true });
    }
    
    // Generate image URL using proxy route to avoid CORS issues
    const imageUrl = `/uploads/courses/${courseDirName}/${path.basename(req.file.filename)}`;
    
    // Update course thumbnail
    await course.update({ thumbnail: imageUrl });

    res.json({
      message: 'Course thumbnail updated successfully.',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Upload course thumbnail error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/courses/categories/all
// @desc    Get all course categories
// @access  Public
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await Course.findAll({
      attributes: [
        [require('sequelize').fn('DISTINCT', require('sequelize').col('category')), 'category']
      ],
      where: {
        category: { [require('sequelize').Op.not]: null },
        isPublished: true
      },
      raw: true
    });

    const categoryList = categories
      .map(cat => cat.category)
      .filter(cat => cat)
      .sort();

    res.json({ categories: categoryList });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/courses/:id/assign-trainer
// @desc    Assign trainer to course (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/assign-trainer', [
  auth,
  requireSuperAdmin,
  body('trainerId').isUUID().withMessage('Valid trainer ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const { trainerId } = req.body;

    // Verify the trainer exists and is actually a trainer
    const trainer = await User.findByPk(trainerId);
    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found.' });
    }

    if (trainer.role !== 'trainer') {
      return res.status(400).json({ error: 'Selected user is not a trainer.' });
    }

    if (!trainer.isActive) {
      return res.status(400).json({ error: 'Selected trainer account is inactive.' });
    }

    // Update the course with the new trainer
    await course.update({ trainerId });

    const updatedCourse = await Course.findByPk(course.id, {
      include: [
        {
          model: User,
          as: 'trainer',
          attributes: ['id', 'firstName', 'lastName', 'avatar', 'email']
        }
      ]
    });

    res.json({
      message: 'Trainer assigned successfully.',
      course: updatedCourse
    });
  } catch (error) {
    console.error('Assign trainer error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/courses/trainers/available
// @desc    Get available trainers for assignment (Super Admin only)
// @access  Private (Super Admin)
router.get('/trainers/available', auth, requireSuperAdmin, async (req, res) => {
  try {
    console.log('Available trainers endpoint called by user:', req.user.id, req.user.role);
    
    const trainers = await User.findAll({
      where: {
        role: 'trainer',
        isActive: true
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });

    console.log('Available trainers found:', trainers.length, trainers.map(t => ({ id: t.id, name: `${t.firstName} ${t.lastName}`, email: t.email })));

    res.json({ trainers });
  } catch (error) {
    console.error('Get available trainers error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/courses/trainer/:trainerId
// @desc    Get courses for a specific trainer
// @access  Private (Trainer can only see their own courses, Super Admin can see any trainer's courses)
router.get('/trainer/:trainerId', auth, async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { isPublished, page = 1, limit = 12, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    
    // Check if user can access this trainer's courses
    if (req.user.role === 'trainer' && req.user.id !== trainerId) {
      return res.status(403).json({ error: 'Access denied. You can only view your own courses.' });
    }
    
    const offset = (page - 1) * limit;
    const whereClause = { trainerId };
    
    // Apply filters
    if (isPublished !== undefined) {
      whereClause.isPublished = isPublished === 'true';
    }
    
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { title: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { description: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { shortDescription: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: courses } = await Course.findAndCountAll({
      where: whereClause,
      attributes: { 
        include: ['id', 'title', 'description', 'shortDescription', 'courseType', 'language', 'thumbnail', 'price', 'duration', 'level', 'category', 'tags', 'isPublished', 'isFeatured', 'maxStudents', 'startDate', 'endDate', 'requirements', 'learningOutcomes', 'curriculum', 'rating', 'totalRatings', 'enrolledStudents', 'trainerId', 'location', 'allowRecording', 'recordForReplay', 'recordForFutureStudents', 'createdAt', 'updatedAt']
      },
      include: [
        {
          model: User,
          as: 'trainer',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      courses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get trainer courses error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/courses/stats/overview
// @desc    Get course statistics (Super Admin or Trainer)
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    console.log('Course stats endpoint called by user:', req.user.id, req.user.role);
    
    const whereClause = {};
    if (req.user.role === 'trainer') {
      whereClause.trainerId = req.user.id;
    }

    const totalCourses = await Course.count({ where: whereClause });
    const publishedCourses = await Course.count({ 
      where: { ...whereClause, isPublished: true } 
    });
    const featuredCourses = await Course.count({ 
      where: { ...whereClause, isFeatured: true } 
    });

    console.log('Course stats calculated:', { totalCourses, publishedCourses, featuredCourses, whereClause });

    // For trainers, provide specific stats
    let myCourses = 0;
    let myPublishedCourses = 0;
    if (req.user.role === 'trainer') {
      myCourses = totalCourses;
      myPublishedCourses = publishedCourses;
    }

    res.json({
      stats: {
        totalCourses,
        publishedCourses,
        unpublishedCourses: totalCourses - publishedCourses,
        featuredCourses,
        myCourses,
        myPublishedCourses
      }
    });
  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router; 