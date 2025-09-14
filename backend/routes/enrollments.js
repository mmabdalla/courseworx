const express = require('express');
const { body, param, validationResult } = require('express-validator');
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

// @route   GET /api/enrollments/course/:courseId/trainees
// @desc    Get all trainees enrolled in a specific course
// @access  Private (Course trainer or Super Admin)
router.get('/course/:courseId/trainees', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = { courseId };
    
    if (status) whereClause.status = status;

    // Check if course exists and user has permission
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Check if user is trainer of this course or super admin
    if (req.user.role !== 'super_admin' && course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view trainees for this course.' });
    }

    const { count, rows: enrollments } = await Enrollment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'avatar'],
          where: { role: 'trainee' }
        }
      ],
      order: [['enrolledAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      trainees: enrollments.map(e => ({
        ...e.user.toJSON(),
        enrollmentId: e.id,
        status: e.status,
        progress: e.progress,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get course trainees error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/enrollments/available-trainees
// @desc    Get available trainees for course enrollment
// @access  Private (Trainer or Super Admin)
router.get('/available-trainees', auth, async (req, res) => {
  try {
    const { courseId, search, page = 1, limit = 20 } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = { role: 'trainee', isActive: true };
    
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { firstName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { lastName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { phone: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    // Get all trainees
    const { count, rows: trainees } = await User.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'avatar'],
      order: [['firstName', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // If courseId is provided, filter out already enrolled trainees
    let availableTrainees = trainees;
    if (courseId) {
      const enrolledTraineeIds = await Enrollment.findAll({
        where: { courseId },
        attributes: ['userId']
      });
      
      const enrolledIds = enrolledTraineeIds.map(e => e.userId);
      availableTrainees = trainees.filter(t => !enrolledIds.includes(t.id));
    }

    res.json({
      trainees: availableTrainees,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get available trainees error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/enrollments/trainer/:trainerId
// @desc    Get enrollments for courses taught by a specific trainer
// @access  Private (Trainer can only see their own course enrollments, Super Admin can see any trainer's enrollments)
router.get('/trainer/:trainerId', auth, async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { courseId, status, page = 1, limit = 20 } = req.query;
    
    // Check if user can access this trainer's enrollments
    if (req.user.role === 'trainer' && req.user.id !== trainerId) {
      return res.status(403).json({ error: 'Access denied. You can only view your own course enrollments.' });
    }
    
    const offset = (page - 1) * limit;
    
    // Get trainer's courses
    const trainerCourses = await Course.findAll({
      where: { trainerId },
      attributes: ['id']
    });
    
    if (trainerCourses.length === 0) {
      return res.json({
        enrollments: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit)
        }
      });
    }
    
    const courseIds = trainerCourses.map(c => c.id);
    const whereClause = { courseId: { [require('sequelize').Op.in]: courseIds } };
    
    // Apply additional filters
    if (courseId) {
      whereClause.courseId = courseId;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: enrollments } = await Enrollment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'description', 'thumbnail']
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
    console.error('Get trainer enrollments error:', error);
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
  body('paymentAmount').optional().custom((value) => {
    if (value === undefined || value === null) return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  }).withMessage('Payment amount must be a valid number greater than or equal to 0'),
  body('notes').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, notes } = req.body;
    const paymentAmount = req.body.paymentAmount ? parseFloat(req.body.paymentAmount) : undefined;

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

// @route   POST /api/enrollments/bulk
// @desc    Bulk enroll trainees to a course (Trainer only)
// @access  Private (Trainer or Super Admin)
router.post('/bulk', [
  auth,
  body('courseId').isUUID(),
  body('traineeIds').isArray({ min: 1 }),
  body('traineeIds.*').isUUID(),
  body('status').optional().isIn(['pending', 'active']),
  body('notes').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, traineeIds, status = 'active', notes } = req.body;

    // Check if course exists and user has permission
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Check if user is trainer of this course or super admin
    if (req.user.role !== 'super_admin' && course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to enroll trainees to this course.' });
    }

    // Check course capacity
    if (course.maxStudents) {
      const enrolledCount = await Enrollment.count({
        where: { courseId, status: ['active', 'pending'] }
      });
      const remainingCapacity = course.maxStudents - enrolledCount;
      if (traineeIds.length > remainingCapacity) {
        return res.status(400).json({ 
          error: `Course capacity exceeded. Only ${remainingCapacity} more trainees can be enrolled.` 
        });
      }
    }

    // Get existing trainees to avoid duplicates
    const existingEnrollments = await Enrollment.findAll({
      where: { 
        courseId, 
        userId: traineeIds 
      },
      attributes: ['userId']
    });
    const existingTraineeIds = existingEnrollments.map(e => e.userId);

    // Filter out already enrolled trainees
    const newTraineeIds = traineeIds.filter(id => !existingTraineeIds.includes(id));

    if (newTraineeIds.length === 0) {
      return res.status(400).json({ error: 'All selected trainees are already enrolled in this course.' });
    }

    // Create enrollments
    const enrollments = await Promise.all(
      newTraineeIds.map(traineeId => 
        Enrollment.create({
          userId: traineeId,
          courseId,
          status,
          paymentStatus: course.price > 0 ? 'pending' : 'paid',
          paymentAmount: course.price,
          notes
        })
      )
    );

    // Get enrollment details with user and course info
    const enrollmentsWithDetails = await Enrollment.findAll({
      where: { id: enrollments.map(e => e.id) },
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
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }
      ]
    });

    res.status(201).json({
      message: `Successfully enrolled ${enrollments.length} trainees to the course.`,
      enrollments: enrollmentsWithDetails,
      skipped: existingTraineeIds.length
    });
  } catch (error) {
    console.error('Bulk enrollment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/enrollments/assign
// @desc    Assign a single trainee to a course (Trainer only)
// @access  Private (Trainer or Super Admin)
router.post('/assign', [
  auth,
  body('courseId').isUUID(),
  body('traineeId').isUUID(),
  body('status').optional().isIn(['pending', 'active']),
  body('notes').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, traineeId, status = 'active', notes } = req.body;

    // Check if course exists and user has permission
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Check if user is trainer of this course or super admin
    if (req.user.role !== 'super_admin' && course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to assign trainees to this course.' });
    }

    // Check if trainee exists
    const trainee = await User.findByPk(traineeId);
    if (!trainee || trainee.role !== 'trainee') {
      return res.status(404).json({ error: 'Trainee not found.' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      where: { userId: traineeId, courseId }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Trainee is already enrolled in this course.' });
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
      userId: traineeId,
      courseId,
      status,
      paymentStatus: course.price > 0 ? 'pending' : 'paid',
      paymentAmount: course.price,
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
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }
      ]
    });

    res.status(201).json({
      message: 'Trainee successfully assigned to course.',
      enrollment: enrollmentWithDetails
    });
  } catch (error) {
    console.error('Assign trainee error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   DELETE /api/enrollments/:id
// @desc    Remove a single enrollment
// @access  Private (Trainer or Super Admin)
router.delete('/:id', [
  auth,
  requireTrainer,
  param('id').isUUID().withMessage('Invalid enrollment ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Find the enrollment
    const enrollment = await Enrollment.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }, {
        model: Course,
        as: 'course',
        attributes: ['id', 'title']
      }]
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Check if user has permission to remove this enrollment
    if (req.user.role === 'trainer') {
      const course = await Course.findByPk(enrollment.courseId);
      if (!course || course.trainerId !== req.user.id) {
        return res.status(403).json({ error: 'You can only remove enrollments from your own courses.' });
      }
    }

    // Remove the enrollment
    await enrollment.destroy();

    res.json({
      message: `${enrollment.user.firstName} ${enrollment.user.lastName} has been removed from ${enrollment.course.title}`,
      removedEnrollment: {
        id: enrollment.id,
        traineeName: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
        courseTitle: enrollment.course.title
      }
    });

  } catch (error) {
    console.error('Remove enrollment error:', error);
    res.status(500).json({ error: 'Failed to remove enrollment.' });
  }
});

// @route   DELETE /api/enrollments/bulk/remove
// @desc    Remove multiple enrollments
// @access  Private (Trainer or Super Admin)
router.delete('/bulk/remove', [
  auth,
  requireTrainer,
  body('enrollmentIds').isArray({ min: 1 }).withMessage('At least one enrollment ID is required'),
  body('enrollmentIds.*').isUUID().withMessage('Invalid enrollment ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { enrollmentIds } = req.body;

    // Find all enrollments
    const enrollments = await Enrollment.findAll({
      where: {
        id: enrollmentIds
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }, {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'trainerId']
      }]
    });

    if (enrollments.length === 0) {
      return res.status(404).json({ error: 'No enrollments found.' });
    }

    // Check permissions for each enrollment
    if (req.user.role === 'trainer') {
      const unauthorizedEnrollments = enrollments.filter(
        enrollment => enrollment.course.trainerId !== req.user.id
      );
      
      if (unauthorizedEnrollments.length > 0) {
        return res.status(403).json({ 
          error: 'You can only remove enrollments from your own courses.',
          unauthorizedCourses: unauthorizedEnrollments.map(e => e.course.title)
        });
      }
    }

    // Remove all enrollments
    const removedCount = await Enrollment.destroy({
      where: {
        id: enrollmentIds
      }
    });

    res.json({
      message: `${removedCount} enrollment(s) removed successfully`,
      removedCount,
      removedEnrollments: enrollments.map(enrollment => ({
        id: enrollment.id,
        traineeName: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
        courseTitle: enrollment.course.title
      }))
    });

  } catch (error) {
    console.error('Bulk remove enrollments error:', error);
    res.status(500).json({ error: 'Failed to remove enrollments.' });
  }
});

// @route   GET /api/enrollments/course/:courseId/trainee/:traineeId
// @desc    Get detailed trainee information for a specific course
// @access  Private (Trainer or Super Admin)
router.get('/course/:courseId/trainee/:traineeId', [
  auth,
  requireTrainer,
  param('courseId').isUUID().withMessage('Invalid course ID'),
  param('traineeId').isUUID().withMessage('Invalid trainee ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, traineeId } = req.params;

    // Find the enrollment
    const enrollment = await Enrollment.findOne({
      where: {
        courseId,
        userId: traineeId
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdAt']
      }, {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'description', 'trainerId']
      }]
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Check permissions
    if (req.user.role === 'trainer') {
      if (enrollment.course.trainerId !== req.user.id) {
        return res.status(403).json({ error: 'You can only view trainees from your own courses.' });
      }
    }

    res.json({
      ...enrollment.user.toJSON(),
      enrollmentId: enrollment.id,
      status: enrollment.status,
      notes: enrollment.notes,
      paymentAmount: enrollment.paymentAmount,
      paymentStatus: enrollment.paymentStatus,
      enrolledAt: enrollment.createdAt,
      course: enrollment.course
    });

  } catch (error) {
    console.error('Get trainee details error:', error);
    res.status(500).json({ error: 'Failed to get trainee details.' });
  }
});

module.exports = router; 