const express = require('express');
const { body, validationResult } = require('express-validator');
const { Course, User, Enrollment } = require('../models');
const { auth, requireSuperAdmin, requireTrainer } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Multer storage for course images
const courseImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const courseName = req.body.courseName || req.params.courseName;
    const dir = path.join(__dirname, '../uploads/courses', courseName);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
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
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
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
  body('category').optional().isLength({ min: 2, max: 100 })
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
      endDate
    } = req.body;

    const course = await Course.create({
      title,
      description,
      shortDescription,
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
  body('category').optional().isLength({ min: 2, max: 100 })
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
    res.json({
      message: 'Image uploaded successfully.',
      imageUrl: `/uploads/courses/${req.params.courseName}/${req.file.filename}`
    });
  } catch (error) {
    console.error('Upload course image error:', error);
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
    console.log('Get available trainers request from user:', req.user.id, 'role:', req.user.role);
    
    const trainers = await User.findAll({
      where: {
        role: 'trainer',
        isActive: true
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });

    console.log('Found trainers:', trainers.length);
    res.json({ trainers });
  } catch (error) {
    console.error('Get available trainers error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/courses/stats/overview
// @desc    Get course statistics (Super Admin or Trainer)
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
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

    res.json({
      stats: {
        totalCourses,
        publishedCourses,
        unpublishedCourses: totalCourses - publishedCourses,
        featuredCourses
      }
    });
  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router; 