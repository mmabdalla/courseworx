const express = require('express');
const { body, validationResult } = require('express-validator');
const { Course, User, Enrollment } = require('../models');
const { auth, requireSuperAdmin, requireTrainer } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses (with filters)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      level, 
      trainerId, 
      isPublished = true, 
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
    if (isPublished !== undefined) whereClause.isPublished = isPublished === 'true';
    
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
      isPublished: req.user.role === 'super_admin' // Auto-publish for super admin
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