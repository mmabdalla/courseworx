const express = require('express');
const router = express.Router();
const { CourseStats, Course, Enrollment, CourseContent } = require('../models');
const { auth, requireTrainer } = require('../middleware/auth');

// Get course statistics by course ID
router.get('/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get or create course stats
    let courseStats = await CourseStats.findOne({ where: { courseId } });
    
    if (!courseStats) {
      // Create default stats if none exist
      const enrollmentCount = await Enrollment.count({ where: { courseId } });
      const totalLessons = await CourseContent.count({ where: { courseId } });
      
      courseStats = await CourseStats.create({
        courseId,
        enrollmentCount,
        totalLessons,
        skillLevel: 'beginner',
        language: 'English',
        publishedDate: course.createdAt,
        certificateAvailable: true
      });
    }

    res.json(courseStats);
  } catch (error) {
    console.error('Error fetching course stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update course statistics (trainer only)
router.put('/:courseId', auth, requireTrainer, async (req, res) => {
  try {
    const { courseId } = req.params;
    const updateData = req.body;
    
    // Check if course exists and user is the trainer
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this course' });
    }

    // Update or create stats
    const [courseStats, created] = await CourseStats.findOrCreate({
      where: { courseId },
      defaults: {
        courseId,
        skillLevel: 'beginner',
        language: 'English',
        publishedDate: course.createdAt,
        certificateAvailable: true
      }
    });

    await courseStats.update(updateData);
    res.json(courseStats);
  } catch (error) {
    console.error('Error updating course stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create course statistics (trainer only)
router.post('/:courseId', auth, requireTrainer, async (req, res) => {
  try {
    const { courseId } = req.params;
    const statsData = req.body;
    
    // Check if course exists and user is the trainer
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (course.trainerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to create stats for this course' });
    }

    // Check if stats already exist
    const existingStats = await CourseStats.findOne({ where: { courseId } });
    if (existingStats) {
      return res.status(400).json({ error: 'Course statistics already exist' });
    }

    // Create new stats
    const courseStats = await CourseStats.create({
      courseId,
      ...statsData,
      publishedDate: statsData.publishedDate || course.createdAt
    });

    res.status(201).json(courseStats);
  } catch (error) {
    console.error('Error creating course stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
