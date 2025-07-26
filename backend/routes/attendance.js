const express = require('express');
const { body, validationResult } = require('express-validator');
const { Attendance, User, Course } = require('../models');
const { auth, requireTrainee } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/attendance/sign-in
// @desc    Sign in for a course session
// @access  Private (Trainee)
router.post('/sign-in', [
  auth,
  requireTrainee,
  body('courseId').isUUID(),
  body('location').optional().isString(),
  body('deviceInfo').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, location, deviceInfo } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Check if already signed in today
    const existingAttendance = await Attendance.findOne({
      where: {
        userId: req.user.id,
        courseId,
        date: today
      }
    });

    if (existingAttendance && existingAttendance.signInTime) {
      return res.status(400).json({ error: 'Already signed in for today.' });
    }

    let attendance;
    if (existingAttendance) {
      // Update existing record
      attendance = await existingAttendance.update({
        signInTime: new Date(),
        status: 'present',
        location,
        deviceInfo,
        ipAddress: req.ip
      });
    } else {
      // Create new record
      attendance = await Attendance.create({
        userId: req.user.id,
        courseId,
        date: today,
        signInTime: new Date(),
        status: 'present',
        location,
        deviceInfo,
        ipAddress: req.ip
      });
    }

    const attendanceWithDetails = await Attendance.findByPk(attendance.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.status(201).json({
      message: 'Successfully signed in.',
      attendance: attendanceWithDetails
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/attendance/sign-out
// @desc    Sign out from a course session
// @access  Private (Trainee)
router.post('/sign-out', [
  auth,
  requireTrainee,
  body('courseId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      where: {
        userId: req.user.id,
        courseId,
        date: today
      }
    });

    if (!attendance) {
      return res.status(404).json({ error: 'No sign-in record found for today.' });
    }

    if (attendance.signOutTime) {
      return res.status(400).json({ error: 'Already signed out for today.' });
    }

    const signOutTime = new Date();
    const duration = Math.round((signOutTime - attendance.signInTime) / (1000 * 60)); // in minutes

    await attendance.update({
      signOutTime,
      duration,
      status: duration < 30 ? 'early_departure' : 'present' // Less than 30 minutes is early departure
    });

    const updatedAttendance = await Attendance.findByPk(attendance.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.json({
      message: 'Successfully signed out.',
      attendance: updatedAttendance
    });
  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/attendance/my
// @desc    Get user's attendance records
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const { courseId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = { userId: req.user.id };
    if (courseId) whereClause.courseId = courseId;
    if (startDate) whereClause.date = { [require('sequelize').Op.gte]: startDate };
    if (endDate) whereClause.date = { [require('sequelize').Op.lte]: endDate };

    const { count, rows: attendance } = await Attendance.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'thumbnail']
        }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      attendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/attendance/course/:courseId
// @desc    Get attendance for a specific course (Trainer or Super Admin)
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // Check if user can access this course attendance
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    if (req.user.role !== 'super_admin' && course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this course attendance.' });
    }

    const whereClause = { courseId };
    if (date) whereClause.date = date;

    const { count, rows: attendance } = await Attendance.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ],
      order: [['date', 'DESC'], ['signInTime', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      attendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get course attendance error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record (Trainer or Super Admin)
// @access  Private
router.put('/:id', [
  auth,
  body('status').optional().isIn(['present', 'absent', 'late', 'early_departure']),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const attendance = await Attendance.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'course'
        }
      ]
    });

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found.' });
    }

    // Check permissions
    if (req.user.role !== 'super_admin' && attendance.course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this attendance record.' });
    }

    const updateData = {};
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;

    await attendance.update(updateData);

    res.json({
      message: 'Attendance record updated successfully.',
      attendance: {
        id: attendance.id,
        status: attendance.status,
        notes: attendance.notes
      }
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/attendance/stats/my
// @desc    Get user's attendance statistics
// @access  Private
router.get('/stats/my', auth, async (req, res) => {
  try {
    const { courseId, startDate, endDate } = req.query;
    
    const whereClause = { userId: req.user.id };
    if (courseId) whereClause.courseId = courseId;
    if (startDate) whereClause.date = { [require('sequelize').Op.gte]: startDate };
    if (endDate) whereClause.date = { [require('sequelize').Op.lte]: endDate };

    const totalSessions = await Attendance.count({ where: whereClause });
    const presentSessions = await Attendance.count({ 
      where: { ...whereClause, status: 'present' } 
    });
    const absentSessions = await Attendance.count({ 
      where: { ...whereClause, status: 'absent' } 
    });
    const lateSessions = await Attendance.count({ 
      where: { ...whereClause, status: 'late' } 
    });

    const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;

    res.json({
      stats: {
        totalSessions,
        presentSessions,
        absentSessions,
        lateSessions,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      }
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router; 