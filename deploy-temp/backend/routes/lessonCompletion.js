const express = require('express');
const { body, validationResult } = require('express-validator');
const { LessonCompletion, CourseContent, Enrollment } = require('../models');
const { auth } = require('../middleware/auth');
const { requirePaidEnrollment, requireEnrollment, requireCourseAccess } = require('../middleware/courseAccess');

const router = express.Router();

// @route   GET /api/lesson-completion/:courseId/progress
// @desc    Get user's progress for a specific course
// @access  Private (Enrolled students who have paid)
router.get('/:courseId/progress', auth, requireCourseAccess, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const isTrainer = req.user.role === 'trainer' || req.user.role === 'super_admin';

    // Check if user is enrolled in the course (only for non-trainers)
    let enrollment = null;
    if (!isTrainer) {
      enrollment = await Enrollment.findOne({
        where: { userId, courseId, status: ['active', 'completed'] }
      });
    }

    // Get all course content
    // For trainers, show all content. For trainees, only show published content
    const contentWhere = isTrainer ? { courseId } : { courseId, isPublished: true };
    const courseContents = await CourseContent.findAll({
      where: contentWhere,
      order: [['order', 'ASC']]
    });

    // Get user's lesson completions
    const lessonCompletions = await LessonCompletion.findAll({
      where: { userId, courseId }
    });

    // Calculate progress
    const totalLessons = courseContents.length;
    const completedLessons = lessonCompletions.filter(lc => lc.isCompleted).length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Update enrollment progress if enrollment exists
    if (enrollment) {
      await enrollment.update({ progress });
    }

    res.json({
      progress,
      totalLessons,
      completedLessons,
      lessonCompletions: lessonCompletions.map(lc => ({
        contentId: lc.contentId,
        isCompleted: lc.isCompleted,
        progress: lc.progress,
        timeSpent: lc.timeSpent,
        lastAccessedAt: lc.lastAccessedAt
      }))
    });
  } catch (error) {
    console.error('Get lesson progress error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/lesson-completion/:courseId/:contentId
// @desc    Mark a lesson as completed or update progress
// @access  Private (Enrolled students who have paid)
router.post('/:courseId/:contentId', [
  auth,
  requireEnrollment,
  body('isCompleted').optional().isBoolean(),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('timeSpent').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, contentId } = req.params;
    const userId = req.user.id;
    const { isCompleted, progress, timeSpent } = req.body;

    // Check if user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      where: { userId, courseId, status: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course.' });
    }

    // Check if content exists and belongs to the course
    const courseContent = await CourseContent.findOne({
      where: { id: contentId, courseId, isPublished: true }
    });

    if (!courseContent) {
      return res.status(404).json({ error: 'Course content not found.' });
    }

    // Find or create lesson completion record
    let lessonCompletion = await LessonCompletion.findOne({
      where: { userId, courseId, contentId }
    });

    if (!lessonCompletion) {
      lessonCompletion = await LessonCompletion.create({
        userId,
        courseId,
        contentId,
        isCompleted: false,
        progress: 0,
        timeSpent: 0
      });
    }

    // Update the record
    const updateData = {
      lastAccessedAt: new Date()
    };

    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      if (isCompleted) {
        updateData.completedAt = new Date();
      }
    }

    if (progress !== undefined) {
      updateData.progress = progress;
    }

    if (timeSpent !== undefined) {
      updateData.timeSpent = lessonCompletion.timeSpent + timeSpent;
    }

    await lessonCompletion.update(updateData);

    // Recalculate overall course progress
    const allCourseContents = await CourseContent.findAll({
      where: { courseId, isPublished: true }
    });

    const allLessonCompletions = await LessonCompletion.findAll({
      where: { userId, courseId }
    });

    const totalLessons = allCourseContents.length;
    const completedLessons = allLessonCompletions.filter(lc => lc.isCompleted).length;
    const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Update enrollment progress
    await enrollment.update({ progress: overallProgress });

    res.json({
      message: 'Lesson completion updated successfully.',
      lessonCompletion: {
        contentId: lessonCompletion.contentId,
        isCompleted: lessonCompletion.isCompleted,
        progress: lessonCompletion.progress,
        timeSpent: lessonCompletion.timeSpent,
        lastAccessedAt: lessonCompletion.lastAccessedAt
      },
      overallProgress
    });
  } catch (error) {
    console.error('Update lesson completion error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/lesson-completion/:courseId/:contentId
// @desc    Get user's progress for a specific lesson
// @access  Private (Enrolled students who have paid)
router.get('/:courseId/:contentId', auth, requirePaidEnrollment, async (req, res) => {
  try {
    const { courseId, contentId } = req.params;
    const userId = req.user.id;

    // Check if user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      where: { userId, courseId, status: ['active', 'completed'] }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course.' });
    }

    // Get lesson completion record
    const lessonCompletion = await LessonCompletion.findOne({
      where: { userId, courseId, contentId }
    });

    if (!lessonCompletion) {
      return res.json({
        contentId,
        isCompleted: false,
        progress: 0,
        timeSpent: 0,
        lastAccessedAt: null
      });
    }

    res.json({
      contentId: lessonCompletion.contentId,
      isCompleted: lessonCompletion.isCompleted,
      progress: lessonCompletion.progress,
      timeSpent: lessonCompletion.timeSpent,
      lastAccessedAt: lessonCompletion.lastAccessedAt
    });
  } catch (error) {
    console.error('Get lesson completion error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
