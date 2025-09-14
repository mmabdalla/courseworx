const express = require('express');
const { param, validationResult } = require('express-validator');
const { Enrollment, Course, User, CourseContent, LessonCompletion, CourseSection } = require('../models');
const { auth, requireTrainer } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/trainee-progress/:courseId/:traineeId
// @desc    Get trainee progress for a specific course
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
        return res.status(403).json({ error: 'You can only view progress for your own courses.' });
      }
    }

    // Get course sections and content
    const sections = await CourseSection.findAll({
      where: { courseId },
      include: [{
        model: CourseContent,
        as: 'contents',
        attributes: ['id', 'title', 'type', 'order']
      }],
      order: [['order', 'ASC'], [{ model: CourseContent, as: 'contents' }, 'order', 'ASC']]
    });

    // Get lesson completions
    const completions = await LessonCompletion.findAll({
      where: { 
        courseId, 
        userId: traineeId 
      },
      attributes: ['contentId', 'isCompleted', 'completedAt', 'timeSpent']
    });

    const completionMap = {};
    completions.forEach(completion => {
      completionMap[completion.contentId] = completion;
    });

    // Calculate progress
    let totalLessons = 0;
    let completedLessons = 0;
    let totalTimeSpent = 0;

    const sectionsWithProgress = sections.map(section => {
      const sectionContents = section.contents || [];
      const sectionCompleted = sectionContents.filter(content => 
        completionMap[content.id]?.isCompleted
      ).length;
      
      totalLessons += sectionContents.length;
      completedLessons += sectionCompleted;

      // Calculate time spent for this section
      const sectionTimeSpent = sectionContents.reduce((total, content) => {
        const completion = completionMap[content.id];
        return total + (completion?.timeSpent || 0);
      }, 0);

      totalTimeSpent += sectionTimeSpent;

      return {
        id: section.id,
        name: section.title,
        order: section.order,
        totalLessons: sectionContents.length,
        completedLessons: sectionCompleted,
        progress: sectionContents.length > 0 ? Math.round((sectionCompleted / sectionContents.length) * 100) : 0,
        timeSpent: sectionTimeSpent,
        lessons: sectionContents.map(content => {
          const completion = completionMap[content.id];
          return {
            id: content.id,
            title: content.title,
            type: content.type,
            order: content.order,
            status: completion?.isCompleted ? 'completed' : 'not-started',
            completedAt: completion?.completedAt,
            timeSpent: completion?.timeSpent || 0
          };
        })
      };
    });

    const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Get recent activity (last 10 completions)
    const recentActivity = completions
      .filter(completion => completion.isCompleted)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 10)
      .map(completion => {
        const content = sections
          .flatMap(s => s.contents || [])
          .find(c => c.id === completion.contentId);
        
        return {
          description: content ? `Completed: ${content.title}` : 'Completed lesson',
          timestamp: new Date(completion.completedAt).toLocaleString(),
          type: 'completion'
        };
      });

    res.json({
      overallProgress,
      totalLessons,
      completedLessons,
      totalTimeSpent,
      sections: sectionsWithProgress,
      recentActivity
    });

  } catch (error) {
    console.error('Get trainee progress error:', error);
    res.status(500).json({ error: 'Failed to get trainee progress.' });
  }
});

module.exports = router;


