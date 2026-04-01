const express = require('express');
const { param, validationResult } = require('express-validator');
const { Enrollment, Course, User, Assignment } = require('../models');
const { auth, requireTrainer } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/trainee-assignments/:courseId/:traineeId
// @desc    Get trainee assignments for a specific course
// @access  Private (Trainer or Super Admin)
router.get('/:courseId/:traineeId', [
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

    // Check if enrollment exists
    const enrollment = await Enrollment.findOne({
      where: { courseId, userId: traineeId },
      include: [{
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'trainerId']
      }]
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found.' });
    }

    // Check permissions
    if (req.user.role === 'trainer') {
      if (enrollment.course.trainerId !== req.user.id) {
        return res.status(403).json({ error: 'You can only view assignments for your own courses.' });
      }
    }

    // Get assignments for this course
    const assignments = await Assignment.findAll({
      where: { courseId },
      order: [['dueDate', 'ASC']]
    });

    // Calculate basic statistics
    const total = assignments.length;
    const completed = 0; // No submission system yet
    const pending = total; // All assignments are pending without submission system
    const overdue = assignments.filter(assignment => {
      if (!assignment.dueDate) return false;
      return new Date(assignment.dueDate) < new Date();
    }).length;

    // Format assignment list
    const assignmentList = assignments.map(assignment => {
      const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
      
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        points: assignment.maxScore,
        dueDate: assignment.dueDate,
        status: isOverdue ? 'overdue' : 'not-started',
        submission: null // No submission system yet
      };
    });

    res.json({
      total,
      completed,
      pending,
      overdue,
      list: assignmentList
    });

  } catch (error) {
    console.error('Get trainee assignments error:', error);
    res.status(500).json({ error: 'Failed to get trainee assignments.' });
  }
});

module.exports = router;
