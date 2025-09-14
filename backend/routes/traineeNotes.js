const express = require('express');
const { param, validationResult } = require('express-validator');
const { Enrollment, Course, User, UserNotes } = require('../models');
const { auth, requireTrainer } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/trainee-notes/:courseId/:traineeId
// @desc    Get trainee notes and communication for a specific course
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
        return res.status(403).json({ error: 'You can only view notes for your own courses.' });
      }
    }

    // Get notes for this trainee and course
    const notes = await UserNotes.findAll({
      where: { 
        courseId, 
        userId: traineeId 
      },
      order: [['createdAt', 'DESC']]
    });

    // Format notes
    const formattedNotes = notes.map(note => ({
      id: note.id,
      content: note.content,
      type: note.type || 'general',
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    }));

    res.json(formattedNotes);

  } catch (error) {
    console.error('Get trainee notes error:', error);
    res.status(500).json({ error: 'Failed to get trainee notes.' });
  }
});

module.exports = router;
