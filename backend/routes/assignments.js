const express = require('express');
const { body, validationResult } = require('express-validator');
const { Assignment, Course, User } = require('../models');
const { auth, requireTrainer } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/assignments
// @desc    Create new assignment (Trainer or Super Admin)
// @access  Private
router.post('/', [
  auth,
  requireTrainer,
  body('title').isLength({ min: 3, max: 200 }),
  body('description').notEmpty(),
  body('courseId').isUUID(),
  body('maxScore').isInt({ min: 1, max: 1000 }),
  body('weight').isFloat({ min: 0, max: 100 }),
  body('type').isIn(['homework', 'quiz', 'project', 'exam', 'presentation']),
  body('dueDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      instructions,
      courseId,
      dueDate,
      maxScore,
      weight,
      type,
      isRequired,
      allowLateSubmission,
      latePenalty,
      attachments,
      rubric
    } = req.body;

    // Check if course exists and user has permission
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    if (req.user.role !== 'super_admin' && course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to create assignments for this course.' });
    }

    const assignment = await Assignment.create({
      title,
      description,
      instructions,
      courseId,
      trainerId: req.user.id,
      dueDate,
      maxScore,
      weight,
      type,
      isRequired: isRequired !== undefined ? isRequired : true,
      allowLateSubmission: allowLateSubmission !== undefined ? allowLateSubmission : false,
      latePenalty,
      attachments: attachments || [],
      rubric: rubric || null,
      isPublished: req.user.role === 'super_admin' // Auto-publish for super admin
    });

    const assignmentWithDetails = await Assignment.findByPk(assignment.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'trainer',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.status(201).json({
      message: 'Assignment created successfully.',
      assignment: assignmentWithDetails
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/assignments/course/:courseId
// @desc    Get assignments for a specific course
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { type, isPublished = true, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Check if user can access this course
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const canAccess = req.user.role === 'super_admin' || 
                     course.trainerId === req.user.id ||
                     await course.hasEnrollment(req.user.id);

    if (!canAccess) {
      return res.status(403).json({ error: 'Not authorized to view assignments for this course.' });
    }

    const whereClause = { courseId };
    if (type) whereClause.type = type;
    if (isPublished !== undefined) whereClause.isPublished = isPublished === 'true';

    const { count, rows: assignments } = await Assignment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'trainer',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      assignments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/assignments/:id
// @desc    Get assignment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id, {
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
          as: 'trainer',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Check if user can access this assignment
    const canAccess = req.user.role === 'super_admin' || 
                     assignment.trainerId === req.user.id ||
                     await assignment.course.hasEnrollment(req.user.id);

    if (!canAccess) {
      return res.status(403).json({ error: 'Not authorized to view this assignment.' });
    }

    res.json({ assignment });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/assignments/:id
// @desc    Update assignment (Owner or Super Admin)
// @access  Private
router.put('/:id', [
  auth,
  body('title').optional().isLength({ min: 3, max: 200 }),
  body('description').optional().notEmpty(),
  body('maxScore').optional().isInt({ min: 1, max: 1000 }),
  body('weight').optional().isFloat({ min: 0, max: 100 }),
  body('type').optional().isIn(['homework', 'quiz', 'project', 'exam', 'presentation']),
  body('dueDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Check permissions
    if (req.user.role !== 'super_admin' && assignment.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this assignment.' });
    }

    const updateData = req.body;
    await assignment.update(updateData);

    const updatedAssignment = await Assignment.findByPk(assignment.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'trainer',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.json({
      message: 'Assignment updated successfully.',
      assignment: updatedAssignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   DELETE /api/assignments/:id
// @desc    Delete assignment (Owner or Super Admin)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Check permissions
    if (req.user.role !== 'super_admin' && assignment.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this assignment.' });
    }

    await assignment.destroy();

    res.json({ message: 'Assignment deleted successfully.' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/assignments/:id/publish
// @desc    Publish/unpublish assignment (Owner or Super Admin)
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

    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Check permissions
    if (req.user.role !== 'super_admin' && assignment.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this assignment.' });
    }

    await assignment.update({ isPublished: req.body.isPublished });

    res.json({
      message: `Assignment ${req.body.isPublished ? 'published' : 'unpublished'} successfully.`,
      assignment: {
        id: assignment.id,
        title: assignment.title,
        isPublished: assignment.isPublished
      }
    });
  } catch (error) {
    console.error('Publish assignment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/assignments/my
// @desc    Get user's assignments (as trainee)
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get courses where user is enrolled
    const enrollments = await require('../models').Enrollment.findAll({
      where: { userId: req.user.id, status: 'active' },
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            {
              model: Assignment,
              as: 'assignments',
              where: { isPublished: true },
              required: false
            }
          ]
        }
      ]
    });

    const courseIds = enrollments.map(enrollment => enrollment.courseId);
    
    const whereClause = { courseId: courseIds };
    if (status) whereClause.status = status;

    const { count, rows: assignments } = await Assignment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'thumbnail']
        },
        {
          model: User,
          as: 'trainer',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ],
      order: [['dueDate', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      assignments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get my assignments error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router; 