const express = require('express');
const { param, validationResult } = require('express-validator');
const { Enrollment, Course, User, Attendance } = require('../models');
const { auth, requireTrainer } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/trainee-attendance/:courseId/:traineeId
// @desc    Get trainee attendance for a specific course
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
        return res.status(403).json({ error: 'You can only view attendance for your own courses.' });
      }
    }

    // Get attendance records
    const attendanceRecords = await Attendance.findAll({
      where: { 
        courseId, 
        userId: traineeId 
      },
      order: [['date', 'DESC']]
    });

    // Calculate attendance statistics
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(record => record.status === 'present').length;
    const absentDays = attendanceRecords.filter(record => record.status === 'absent').length;
    const lateDays = attendanceRecords.filter(record => record.status === 'late').length;
    
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Format attendance history
    const history = attendanceRecords.map(record => {
      const checkIn = record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : null;
      const checkOut = record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : null;
      
      let duration = null;
      if (checkIn && checkOut) {
        const start = new Date(record.checkInTime);
        const end = new Date(record.checkOutTime);
        const diffMs = end - start;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        duration = `${diffHours}h ${diffMinutes}m`;
      }

      return {
        id: record.id,
        date: record.date,
        status: record.status,
        checkIn,
        checkOut,
        duration,
        notes: record.notes
      };
    });

    res.json({
      attendanceRate,
      present: presentDays,
      absent: absentDays,
      late: lateDays,
      total: totalDays,
      history
    });

  } catch (error) {
    console.error('Get trainee attendance error:', error);
    res.status(500).json({ error: 'Failed to get trainee attendance.' });
  }
});

module.exports = router;


