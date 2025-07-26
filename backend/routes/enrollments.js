const express = require('express');
const { body, validationResult } = require('express-validator');
const { Enrollment, Course, User } = require('../models');
const { auth, requireTrainee } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/enrollments
// @desc    Enroll in a course
// @access  Private (Trainee)
router.post('/', [
  auth,
  requireTrainee,
  body('courseId').isUUID(),
  body('paymentAmount').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, paymentAmount } = req.body;

    // Check if course exists and is published
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    if (!course.isPublished) {
      return res.status(400).json({ error: 'Course is not available for enrollment.' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      where: { userId: req.user.id, courseId }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this course.' });
    }

    // Check if course is full
    if (course.maxStudents) {
      const enrolledCount = await Enrollment.count({
        where: { courseId, status: ['active', 'pending'] }
      });

      if (enrolledCount >= course.maxStudents) {
        return res.status(400).json({ error: 'Course is full.' });
      }
    }

    const enrollment = await Enrollment.create({
      userId: req.user.id,
      courseId,
      paymentAmount,
      status: 'pending',
      paymentStatus: 'pending'
    });

    const enrollmentWithDetails = await Enrollment.findByPk(enrollment.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'thumbnail', 'price']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName']
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

// @route   GET /api/enrollments/my
// @desc    Get user's enrollments
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { userId: req.user.id };
    if (status) whereClause.status = status;

    const { count, rows: enrollments } = await Enrollment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'thumbnail', 'price', 'duration', 'level', 'category']
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
    console.error('Get enrollments error:', error);
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
              attributes: ['id', 'firstName', 'lastName', 'avatar']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ]
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Check if user can access this enrollment
    if (req.user.role !== 'super_admin' && enrollment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this enrollment.' });
    }

    res.json({ enrollment });
  } catch (error) {
    console.error('Get enrollment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/enrollments/:id/status
// @desc    Update enrollment status
// @access  Private (Super Admin or Course Trainer)
router.put('/:id/status', [
  auth,
  body('status').isIn(['pending', 'active', 'completed', 'cancelled']),
  body('progress').optional().isInt({ min: 0, max: 100 })
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

    const updateData = { status: req.body.status };
    if (req.body.progress !== undefined) {
      updateData.progress = req.body.progress;
    }

    if (req.body.status === 'completed') {
      updateData.completedAt = new Date();
    }

    await enrollment.update(updateData);

    res.json({
      message: 'Enrollment status updated successfully.',
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        progress: enrollment.progress,
        completedAt: enrollment.completedAt
      }
    });
  } catch (error) {
    console.error('Update enrollment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/enrollments/:id/payment
// @desc    Update payment status
// @access  Private (Super Admin)
router.put('/:id/payment', [
  auth,
  requireTrainee,
  body('paymentStatus').isIn(['pending', 'paid', 'failed', 'refunded'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const enrollment = await Enrollment.findByPk(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Only the enrolled user or super admin can update payment status
    if (req.user.role !== 'super_admin' && enrollment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this enrollment.' });
    }

    const updateData = { paymentStatus: req.body.paymentStatus };
    if (req.body.paymentStatus === 'paid') {
      updateData.paymentDate = new Date();
      updateData.status = 'active'; // Auto-activate enrollment when paid
    }

    await enrollment.update(updateData);

    res.json({
      message: 'Payment status updated successfully.',
      enrollment: {
        id: enrollment.id,
        paymentStatus: enrollment.paymentStatus,
        paymentDate: enrollment.paymentDate,
        status: enrollment.status
      }
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   DELETE /api/enrollments/:id
// @desc    Cancel enrollment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findByPk(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Check permissions
    if (req.user.role !== 'super_admin' && enrollment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this enrollment.' });
    }

    await enrollment.update({ status: 'cancelled' });

    res.json({ message: 'Enrollment cancelled successfully.' });
  } catch (error) {
    console.error('Cancel enrollment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router; 