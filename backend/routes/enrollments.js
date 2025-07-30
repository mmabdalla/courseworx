const express = require('express');
const { body, validationResult } = require('express-validator');
const { Enrollment, Course, User } = require('../models');
const { auth, requireTrainer } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/enrollments
// @desc    Get all enrollments (filtered by user role)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      courseId, 
      userId, 
      status, 
      paymentStatus, 
      page = 1, 
      limit = 20,
      sortBy = 'enrolledAt',
      sortOrder = 'DESC'
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    // Filter by course if provided
    if (courseId) whereClause.courseId = courseId;
    
    // Filter by user if provided or if user is not admin/trainer
    if (userId) {
      whereClause.userId = userId;
    } else if (req.user.role === 'trainee') {
      whereClause.userId = req.user.id;
    }
    
    if (status) whereClause.status = status;
    if (paymentStatus) whereClause.paymentStatus = paymentStatus;

    const { count, rows: enrollments } = await Enrollment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'thumbnail', 'price', 'trainerId'],
          include: [
            {
              model: User,
              as: 'trainer',
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      enrollments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/enrollments/my
// @desc    Get current user's enrollments
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const { 
      status, 
      paymentStatus, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = { userId: req.user.id };
    
    if (status) whereClause.status = status;
    if (paymentStatus) whereClause.paymentStatus = paymentStatus;

    const { count, rows: enrollments } = await Enrollment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'thumbnail', 'price', 'description', 'level', 'category'],
          include: [
            {
              model: User,
              as: 'trainer',
              attributes: ['id', 'firstName', 'lastName', 'avatar']
            }
          ]
        }
      ],
      order: [['enrolledAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      enrollments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get my enrollments error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/enrollments/:id
// @desc    Get enrollment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            {
              model: User,
              as: 'trainer',
              attributes: ['id', 'firstName', 'lastName', 'avatar', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
        }
      ]
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Check if user has access to this enrollment
    if (req.user.role === 'trainee' && enrollment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this enrollment.' });
    }

    res.json({ enrollment });
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/enrollments
// @desc    Create new enrollment (subscribe to course)
// @access  Private
router.post('/', [
  auth,
  body('courseId').isUUID(),
  body('paymentAmount').optional().isFloat({ min: 0 }),
  body('notes').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, paymentAmount, notes } = req.body;

    // Check if course exists and is published
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }
    if (!course.isPublished) {
      return res.status(400).json({ error: 'Course is not published.' });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      where: { userId: req.user.id, courseId }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course.' });
    }

    // Check course capacity
    if (course.maxStudents) {
      const enrolledCount = await Enrollment.count({
        where: { courseId, status: ['active', 'pending'] }
      });
      if (enrolledCount >= course.maxStudents) {
        return res.status(400).json({ error: 'Course is at maximum capacity.' });
      }
    }

    const enrollment = await Enrollment.create({
      userId: req.user.id,
      courseId,
      status: 'pending',
      paymentStatus: course.price > 0 ? 'pending' : 'paid',
      paymentAmount: paymentAmount || course.price,
      notes
    });

    const enrollmentWithDetails = await Enrollment.findByPk(enrollment.id, {
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            {
              model: User,
              as: 'trainer',
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    res.status(201).json({
      message: 'Enrollment created successfully.',
      enrollment: enrollmentWithDetails
    });
  } catch (error) {
    console.error('Create enrollment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/enrollments/:id/status
// @desc    Update enrollment status
// @access  Private (Course owner or Super Admin)
router.put('/:id/status', [
  auth,
  body('status').isIn(['pending', 'active', 'completed', 'cancelled']),
  body('notes').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const enrollment = await Enrollment.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'course'
        }
      ]
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Check permissions
    const canUpdate = req.user.role === 'super_admin' || 
                     enrollment.course.trainerId === req.user.id ||
                     enrollment.userId === req.user.id;

    if (!canUpdate) {
      return res.status(403).json({ error: 'Not authorized to update this enrollment.' });
    }

    const { status, notes } = req.body;
    const updateData = { status };

    if (status === 'completed' && enrollment.status !== 'completed') {
      updateData.completedAt = new Date();
    }

    if (notes) {
      updateData.notes = notes;
    }

    await enrollment.update(updateData);

    res.json({
      message: 'Enrollment status updated successfully.',
      enrollment
    });
  } catch (error) {
    console.error('Update enrollment status error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/enrollments/:id/payment
// @desc    Update enrollment payment status
// @access  Private (Course owner or Super Admin)
router.put('/:id/payment', [
  auth,
  body('paymentStatus').isIn(['pending', 'paid', 'failed', 'refunded']),
  body('paymentAmount').optional().isFloat({ min: 0 }),
  body('notes').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const enrollment = await Enrollment.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'course'
        }
      ]
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Check permissions
    const canUpdate = req.user.role === 'super_admin' || 
                     enrollment.course.trainerId === req.user.id;

    if (!canUpdate) {
      return res.status(403).json({ error: 'Not authorized to update payment status.' });
    }

    const { paymentStatus, paymentAmount, notes } = req.body;
    const updateData = { paymentStatus };

    if (paymentStatus === 'paid' && enrollment.paymentStatus !== 'paid') {
      updateData.paymentDate = new Date();
    }

    if (paymentAmount) {
      updateData.paymentAmount = paymentAmount;
    }

    if (notes) {
      updateData.notes = notes;
    }

    await enrollment.update(updateData);

    res.json({
      message: 'Payment status updated successfully.',
      enrollment
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/enrollments/:id/progress
// @desc    Update enrollment progress
// @access  Private (Enrolled user or Course owner)
router.put('/:id/progress', [
  auth,
  body('progress').isInt({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const enrollment = await Enrollment.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'course'
        }
      ]
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Check permissions
    const canUpdate = req.user.role === 'super_admin' || 
                     enrollment.course.trainerId === req.user.id ||
                     enrollment.userId === req.user.id;

    if (!canUpdate) {
      return res.status(403).json({ error: 'Not authorized to update progress.' });
    }

    const { progress } = req.body;
    await enrollment.update({ progress });

    res.json({
      message: 'Progress updated successfully.',
      enrollment
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   DELETE /api/enrollments/:id
// @desc    Cancel enrollment
// @access  Private (Enrolled user or Course owner)
router.delete('/:id', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'course'
        }
      ]
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Check permissions
    const canCancel = req.user.role === 'super_admin' || 
                     enrollment.course.trainerId === req.user.id ||
                     enrollment.userId === req.user.id;

    if (!canCancel) {
      return res.status(403).json({ error: 'Not authorized to cancel this enrollment.' });
    }

    await enrollment.update({ status: 'cancelled' });

    res.json({ message: 'Enrollment cancelled successfully.' });
  } catch (error) {
    console.error('Cancel enrollment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/enrollments/stats/overview
// @desc    Get enrollment statistics
// @access  Private (Super Admin or Trainer)
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const whereClause = {};
    
    // If trainer, only show their course enrollments
    if (req.user.role === 'trainer') {
      const trainerCourses = await Course.findAll({
        where: { trainerId: req.user.id },
        attributes: ['id']
      });
      whereClause.courseId = trainerCourses.map(c => c.id);
    }

    // If trainee, only show their enrollments
    if (req.user.role === 'trainee') {
      whereClause.userId = req.user.id;
    }

    const totalEnrollments = await Enrollment.count({ where: whereClause });
    const activeEnrollments = await Enrollment.count({ 
      where: { ...whereClause, status: 'active' } 
    });
    const completedEnrollments = await Enrollment.count({ 
      where: { ...whereClause, status: 'completed' } 
    });
    const pendingEnrollments = await Enrollment.count({ 
      where: { ...whereClause, status: 'pending' } 
    });

    // Get unique students count for trainers
    let myStudents = 0;
    if (req.user.role === 'trainer') {
      const trainerCourses = await Course.findAll({
        where: { trainerId: req.user.id },
        attributes: ['id']
      });
      
      if (trainerCourses.length > 0) {
        const uniqueStudents = await Enrollment.findAll({
          where: { 
            courseId: trainerCourses.map(c => c.id),
            status: { [require('sequelize').Op.in]: ['active', 'completed'] }
          },
          attributes: ['userId'],
          group: ['userId']
        });
        myStudents = uniqueStudents.length;
      }
    }

    // Get my enrollments count for trainees
    let myEnrollments = 0;
    let completedCourses = 0;
    if (req.user.role === 'trainee') {
      myEnrollments = await Enrollment.count({ 
        where: { userId: req.user.id } 
      });
      completedCourses = await Enrollment.count({ 
        where: { userId: req.user.id, status: 'completed' } 
      });
    }

    res.json({
      stats: {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        pendingEnrollments,
        cancelledEnrollments: totalEnrollments - activeEnrollments - completedEnrollments - pendingEnrollments,
        myStudents,
        myEnrollments,
        completedCourses
      }
    });
  } catch (error) {
    console.error('Get enrollment stats error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router; 