const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { auth, requireTrainer, requireSuperAdmin } = require('../middleware/auth');
const AttendanceRecord = require('../models/AttendanceRecord');
const ClassroomSession = require('../models/ClassroomSession');
const Course = require('../models/Course');
const User = require('../models/User');
const router = express.Router();

// Check in using QR code
router.post('/checkin', [
  auth,
  body('qrCodeData').isString().withMessage('QR code data is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { qrCodeData } = req.body;
    const traineeId = req.user.id;

    // Parse QR code data
    let qrData;
    try {
      qrData = JSON.parse(qrCodeData);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid QR code format' });
    }

    // Find session by QR code
    const session = await ClassroomSession.findOne({
      where: { qrCode: qrCodeData },
      include: [
        {
          model: Course,
          as: 'Course',
          attributes: ['id', 'title', 'courseType', 'trainerId']
        }
      ]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found or QR code expired' });
    }

    // Check if QR code is still valid
    if (new Date() > session.qrCodeExpiry) {
      return res.status(400).json({ error: 'QR code has expired' });
    }

    // Check if trainee is enrolled in the course
    const enrollment = await Course.findOne({
      where: {
        id: session.courseId,
        '$Enrollments.traineeId$': traineeId
      },
      include: [
        {
          model: require('../models/Enrollment'),
          where: { traineeId },
          required: true
        }
      ]
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // Check if already checked in
    const existingRecord = await AttendanceRecord.findOne({
      where: {
        sessionId: session.id,
        traineeId
      }
    });

    if (existingRecord && existingRecord.checkInTime) {
      return res.status(400).json({ error: 'You have already checked in for this session' });
    }

    // Determine if late
    const sessionStartTime = new Date(`${session.sessionDate}T${session.startTime}`);
    const isLate = new Date() > sessionStartTime;

    // Create or update attendance record
    const attendanceData = {
      sessionId: session.id,
      traineeId,
      checkInTime: new Date(),
      checkInMethod: 'qr_code',
      status: isLate ? 'late' : 'present',
      isPresent: true
    };

    if (existingRecord) {
      await existingRecord.update(attendanceData);
    } else {
      await AttendanceRecord.create(attendanceData);
    }

    res.json({
      message: isLate ? 'Checked in successfully (marked as late)' : 'Checked in successfully',
      attendance: {
        sessionId: session.id,
        courseTitle: session.Course.title,
        sessionDate: session.sessionDate,
        startTime: session.startTime,
        endTime: session.endTime,
        location: session.location,
        checkInTime: attendanceData.checkInTime,
        status: attendanceData.status
      }
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check out using QR code
router.post('/checkout', [
  auth,
  body('qrCodeData').isString().withMessage('QR code data is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { qrCodeData } = req.body;
    const traineeId = req.user.id;

    // Parse QR code data
    let qrData;
    try {
      qrData = JSON.parse(qrCodeData);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid QR code format' });
    }

    // Find session by QR code
    const session = await ClassroomSession.findOne({
      where: { qrCode: qrCodeData },
      include: [
        {
          model: Course,
          as: 'Course',
          attributes: ['id', 'title', 'courseType', 'trainerId']
        }
      ]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found or QR code expired' });
    }

    // Check if QR code is still valid
    if (new Date() > session.qrCodeExpiry) {
      return res.status(400).json({ error: 'QR code has expired' });
    }

    // Find attendance record
    const attendanceRecord = await AttendanceRecord.findOne({
      where: {
        sessionId: session.id,
        traineeId
      }
    });

    if (!attendanceRecord) {
      return res.status(404).json({ error: 'No check-in record found for this session' });
    }

    if (attendanceRecord.checkOutTime) {
      return res.status(400).json({ error: 'You have already checked out for this session' });
    }

    // Calculate duration
    const checkOutTime = new Date();
    const duration = Math.round((checkOutTime - attendanceRecord.checkInTime) / (1000 * 60)); // in minutes

    // Determine if left early
    const sessionEndTime = new Date(`${session.sessionDate}T${session.endTime}`);
    const leftEarly = checkOutTime < sessionEndTime;

    // Update attendance record
    await attendanceRecord.update({
      checkOutTime,
      checkOutMethod: 'qr_code',
      status: leftEarly ? 'left_early' : attendanceRecord.status,
      duration
    });

    res.json({
      message: leftEarly ? 'Checked out successfully (marked as left early)' : 'Checked out successfully',
      attendance: {
        sessionId: session.id,
        courseTitle: session.Course.title,
        sessionDate: session.sessionDate,
        startTime: session.startTime,
        endTime: session.endTime,
        checkInTime: attendanceRecord.checkInTime,
        checkOutTime,
        duration,
        status: leftEarly ? 'left_early' : attendanceRecord.status
      }
    });
  } catch (error) {
    console.error('Error during check-out:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual attendance management (for trainers)
router.post('/manual', [
  auth,
  requireTrainer,
  body('sessionId').isUUID().withMessage('Invalid session ID'),
  body('traineeId').isUUID().withMessage('Invalid trainee ID'),
  body('action').isIn(['checkin', 'checkout']).withMessage('Action must be checkin or checkout'),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId, traineeId, action, notes } = req.body;

    // Check if session exists and user has access
    const session = await ClassroomSession.findByPk(sessionId, {
      include: [
        {
          model: Course,
          attributes: ['id', 'title', 'trainerId']
        }
      ]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (req.user.role !== 'super_admin' && session.Course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if trainee is enrolled
    const enrollment = await Course.findOne({
      where: {
        id: session.courseId,
        '$Enrollments.traineeId$': traineeId
      },
      include: [
        {
          model: require('../models/Enrollment'),
          where: { traineeId },
          required: true
        }
      ]
    });

    if (!enrollment) {
      return res.status(400).json({ error: 'Trainee is not enrolled in this course' });
    }

    // Find or create attendance record
    let attendanceRecord = await AttendanceRecord.findOne({
      where: { sessionId, traineeId }
    });

    if (!attendanceRecord) {
      attendanceRecord = await AttendanceRecord.create({
        sessionId,
        traineeId,
        checkInMethod: 'manual',
        status: 'present',
        isPresent: true
      });
    }

    if (action === 'checkin') {
      if (attendanceRecord.checkInTime) {
        return res.status(400).json({ error: 'Trainee has already checked in' });
      }

      const sessionStartTime = new Date(`${session.sessionDate}T${session.startTime}`);
      const isLate = new Date() > sessionStartTime;

      await attendanceRecord.update({
        checkInTime: new Date(),
        checkInMethod: 'manual',
        status: isLate ? 'late' : 'present',
        isPresent: true,
        notes: notes || attendanceRecord.notes
      });

      res.json({
        message: 'Manual check-in recorded successfully',
        attendance: attendanceRecord
      });
    } else if (action === 'checkout') {
      if (!attendanceRecord.checkInTime) {
        return res.status(400).json({ error: 'Trainee must check in before checking out' });
      }

      if (attendanceRecord.checkOutTime) {
        return res.status(400).json({ error: 'Trainee has already checked out' });
      }

      const checkOutTime = new Date();
      const duration = Math.round((checkOutTime - attendanceRecord.checkInTime) / (1000 * 60));
      const sessionEndTime = new Date(`${session.sessionDate}T${session.endTime}`);
      const leftEarly = checkOutTime < sessionEndTime;

      await attendanceRecord.update({
        checkOutTime,
        checkOutMethod: 'manual',
        status: leftEarly ? 'left_early' : attendanceRecord.status,
        duration,
        notes: notes || attendanceRecord.notes
      });

      res.json({
        message: 'Manual check-out recorded successfully',
        attendance: attendanceRecord
      });
    }
  } catch (error) {
    console.error('Error in manual attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trainee's attendance history
router.get('/trainee/:traineeId', [
  auth,
  requireTrainer,
  param('traineeId').isUUID().withMessage('Invalid trainee ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { traineeId } = req.params;
    const { courseId, page = 1, limit = 10 } = req.query;

    const whereClause = { traineeId };
    if (courseId) {
      whereClause['$ClassroomSession.courseId$'] = courseId;
    }

    const attendance = await AttendanceRecord.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ClassroomSession,
          as: 'ClassroomSession',
          include: [
            {
          model: Course,
          as: 'Course',
          attributes: ['id', 'title', 'courseType']
            }
          ]
        },
        {
          model: User,
          as: 'User',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['checkInTime', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      attendance: attendance.rows,
      totalCount: attendance.count,
      totalPages: Math.ceil(attendance.count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching trainee attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;