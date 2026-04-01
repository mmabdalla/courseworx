const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { auth, requireTrainer, requireSuperAdmin } = require('../middleware/auth');
const AttendanceRecord = require('../models/AttendanceRecord');
const ClassroomSession = require('../models/ClassroomSession');
const Course = require('../models/Course');
const User = require('../models/User');
const router = express.Router();

// Device-based check in
router.post('/device/checkin', [
  body('sessionId').isUUID().withMessage('Valid session ID is required'),
  body('deviceId').isString().withMessage('Device ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId, deviceId } = req.body;

    // Find the session
    const session = await ClassroomSession.findByPk(sessionId, {
      include: [{ model: Course, as: 'Course' }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if already checked in
    const existingCheckin = await AttendanceRecord.findOne({
      where: {
        sessionId,
        deviceId,
        status: 'checked_in'
      }
    });

    if (existingCheckin) {
      return res.status(400).json({ error: 'Already checked in for this session' });
    }

    // Create check-in record
    const attendanceRecord = await AttendanceRecord.create({
      sessionId,
      deviceId,
      status: 'checked_in',
      checkInTime: new Date()
    });

    res.status(201).json({
      message: 'Successfully checked in',
      attendanceRecord: {
        id: attendanceRecord.id,
        status: attendanceRecord.status,
        checkInTime: attendanceRecord.checkInTime
      }
    });

  } catch (error) {
    console.error('Device check-in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Device-based check out
router.post('/device/checkout', [
  body('sessionId').isUUID().withMessage('Valid session ID is required'),
  body('deviceId').isString().withMessage('Device ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId, deviceId } = req.body;

    // Find existing check-in record
    const attendanceRecord = await AttendanceRecord.findOne({
      where: {
        sessionId,
        deviceId,
        status: 'checked_in'
      }
    });

    if (!attendanceRecord) {
      return res.status(400).json({ error: 'No active check-in found for this device' });
    }

    // Update to checked out
    await attendanceRecord.update({
      status: 'checked_out',
      checkOutTime: new Date()
    });

    res.json({
      message: 'Successfully checked out',
      attendanceRecord: {
        id: attendanceRecord.id,
        status: attendanceRecord.status,
        checkInTime: attendanceRecord.checkInTime,
        checkOutTime: attendanceRecord.checkOutTime
      }
    });

  } catch (error) {
    console.error('Device check-out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Link device to user
router.post('/device/link', [
  auth,
  body('deviceId').isString().withMessage('Device ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { deviceId } = req.body;
    const userId = req.user.id;

    // Update attendance records to link device to user
    await AttendanceRecord.update(
      { traineeId: userId },
      { where: { deviceId, traineeId: null } }
    );

    res.json({
      message: 'Device successfully linked to user account',
      deviceId,
      userId
    });

  } catch (error) {
    console.error('Device link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get device attendance history
router.get('/device/:deviceId/history', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const attendanceHistory = await AttendanceRecord.findAll({
      where: { deviceId },
      include: [
        { model: ClassroomSession, as: 'ClassroomSession' },
        { model: User, as: 'User' }
      ],
      order: [['checkInTime', 'DESC']]
    });

    res.json({
      deviceId,
      attendanceHistory
    });

  } catch (error) {
    console.error('Device attendance history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
