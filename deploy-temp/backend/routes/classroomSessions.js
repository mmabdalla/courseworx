const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { auth, requireTrainer, requireSuperAdmin } = require('../middleware/auth');
const ClassroomSession = require('../models/ClassroomSession');
const Course = require('../models/Course');
const User = require('../models/User');
const AttendanceRecord = require('../models/AttendanceRecord');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { getFrontendURL } = require('../utils/getServerIP');
const router = express.Router();

// Get all classroom sessions for a course
router.get('/course/:courseId', [
  auth,
  requireTrainer,
  param('courseId').isUUID().withMessage('Invalid course ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Check if user has access to this course
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user.role !== 'super_admin' && course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const whereClause = { courseId };
    if (status) {
      whereClause.status = status;
    }

    const sessions = await ClassroomSession.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Course,
          as: 'Course',
          attributes: ['id', 'title', 'courseType']
        }
      ],
      order: [['sessionDate', 'DESC'], ['startTime', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      sessions: sessions.rows,
      totalCount: sessions.count,
      totalPages: Math.ceil(sessions.count / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching classroom sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new classroom session
router.post('/', [
  auth,
  requireTrainer,
  body('courseId').isUUID().withMessage('Invalid course ID'),
  body('sessionDate').isISO8601().withMessage('Invalid session date'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time format'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time format'),
  body('location').optional().isString().isLength({ max: 500 }),
  body('roomNumber').optional().isString().isLength({ max: 50 }),
  body('maxCapacity').optional().isInt({ min: 1 }),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, sessionDate, startTime, endTime, location, roomNumber, maxCapacity, notes } = req.body;

    // Check if course exists and user has access
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user.role !== 'super_admin' && course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if course is classroom type
    if (course.courseType !== 'classroom' && course.courseType !== 'hybrid') {
      return res.status(400).json({ error: 'Course must be classroom or hybrid type' });
    }

    // Generate unique QR code
    const sessionId = uuidv4();
    
    // Create QR code URL using server IP for network access
    const baseUrl = process.env.FRONTEND_URL || getFrontendURL(3000);
    const qrCodeUrl = `${baseUrl}/attendance/join/${sessionId}`;
    
    const qrCode = await QRCode.toDataURL(qrCodeUrl);

    // Set QR code expiry to end of session day + 1 day
    const qrCodeExpiry = new Date(sessionDate);
    qrCodeExpiry.setDate(qrCodeExpiry.getDate() + 1);
    qrCodeExpiry.setHours(23, 59, 59, 999);

    const session = await ClassroomSession.create({
      id: sessionId,
      courseId,
      sessionDate,
      startTime,
      endTime,
      location: location || course.location,
      roomNumber,
      qrCode: qrCodeUrl,
      qrCodeExpiry,
      maxCapacity,
      notes
    });

    res.status(201).json({
      session,
      qrCodeImage: qrCode
    });
  } catch (error) {
    console.error('Error creating classroom session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get QR code for a session
router.get('/:sessionId/qr-code', [
  auth,
  requireTrainer,
  param('sessionId').isUUID().withMessage('Invalid session ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId } = req.params;

    const session = await ClassroomSession.findByPk(sessionId, {
      include: [
        {
          model: Course,
          as: 'Course',
          attributes: ['id', 'title', 'trainerId']
        }
      ]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check access
    if (req.user.role !== 'super_admin' && session.Course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate QR code image from URL
    const qrCodeImage = await QRCode.toDataURL(session.qrCode);

    res.json({
      session: {
        id: session.id,
        courseId: session.courseId,
        sessionDate: session.sessionDate,
        startTime: session.startTime,
        endTime: session.endTime,
        location: session.location,
        roomNumber: session.roomNumber,
        status: session.status,
        qrCodeExpiry: session.qrCodeExpiry
      },
      qrCodeImage
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update session status
router.patch('/:sessionId/status', [
  auth,
  requireTrainer,
  param('sessionId').isUUID().withMessage('Invalid session ID'),
  body('status').isIn(['scheduled', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId } = req.params;
    const { status } = req.body;

    const session = await ClassroomSession.findByPk(sessionId, {
      include: [
        {
          model: Course,
          as: 'Course',
          attributes: ['id', 'trainerId']
        }
      ]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check access
    if (req.user.role !== 'super_admin' && session.Course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await session.update({ status });

    res.json({ message: 'Session status updated successfully', session });
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session attendance
router.get('/:sessionId/attendance', [
  auth,
  requireTrainer,
  param('sessionId').isUUID().withMessage('Invalid session ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId } = req.params;

    const session = await ClassroomSession.findByPk(sessionId, {
      include: [
        {
          model: Course,
          as: 'Course',
          attributes: ['id', 'title', 'trainerId']
        }
      ]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check access
    if (req.user.role !== 'super_admin' && session.Course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const attendance = await AttendanceRecord.findAll({
      where: { sessionId },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }
      ],
      order: [['checkInTime', 'ASC']]
    });

    res.json({
      session: {
        id: session.id,
        courseId: session.courseId,
        sessionDate: session.sessionDate,
        startTime: session.startTime,
        endTime: session.endTime,
        location: session.location,
        roomNumber: session.roomNumber,
        status: session.status
      },
      attendance
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a session
router.delete('/:sessionId', [
  auth,
  requireTrainer,
  param('sessionId').isUUID().withMessage('Invalid session ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId } = req.params;

    const session = await ClassroomSession.findByPk(sessionId, {
      include: [
        {
          model: Course,
          as: 'Course',
          attributes: ['id', 'trainerId']
        }
      ]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check access
    if (req.user.role !== 'super_admin' && session.Course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete attendance records first
    await AttendanceRecord.destroy({ where: { sessionId } });
    
    // Delete session
    await session.destroy();

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
