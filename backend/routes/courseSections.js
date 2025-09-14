const express = require('express');
const { body, validationResult } = require('express-validator');
const { CourseSection, CourseContent, Course } = require('../models');
const { auth, requireTrainer } = require('../middleware/auth');
const { requirePaidEnrollment, requireEnrollment, requireCourseAccess } = require('../middleware/courseAccess');

const router = express.Router();

// @route   GET /api/course-sections/:courseId
// @desc    Get all sections for a course
// @access  Private (Course owner or enrolled students)
router.get('/:courseId', auth, requireCourseAccess, async (req, res) => {
  try {
    const { courseId } = req.params;
    const isTrainer = req.user.role === 'trainer' || req.user.role === 'super_admin';

    // For trainers/admins, show all content. For students, only show published content
    const sectionWhere = isTrainer ? { courseId } : { courseId, isPublished: true };
    const contentWhere = isTrainer ? {} : { isPublished: true };

    const sections = await CourseSection.findAll({
      where: sectionWhere,
      include: [
        {
          model: CourseContent,
          as: 'contents',
          where: contentWhere,
          required: false,
          order: [['order', 'ASC']]
        }
      ],
      order: [['order', 'ASC']]
    });

    res.json({ sections });
  } catch (error) {
    console.error('Get course sections error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/course-sections/:courseId
// @desc    Create a new section for a course
// @access  Private (Course trainer or Super Admin)
router.post('/:courseId', [
  auth,
  requireTrainer,
  body('title').isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId } = req.params;
    const { title, description, order } = req.body;

    // Check if course exists and user is the trainer
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    if (course.trainerId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to create sections for this course.' });
    }

    // Get the next order if not provided
    let sectionOrder = order;
    if (sectionOrder === undefined) {
      const lastSection = await CourseSection.findOne({
        where: { courseId },
        order: [['order', 'DESC']]
      });
      sectionOrder = lastSection ? lastSection.order + 1 : 0;
    }

    const section = await CourseSection.create({
      courseId,
      title,
      description,
      order: sectionOrder
    });

    res.status(201).json({
      message: 'Section created successfully.',
      section
    });
  } catch (error) {
    console.error('Create course section error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/course-sections/:sectionId
// @desc    Update a course section
// @access  Private (Course trainer or Super Admin)
router.put('/:sectionId', [
  auth,
  requireTrainer,
  body('title').optional().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a positive integer'),
  body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
  body('isCollapsible').optional().isBoolean().withMessage('isCollapsible must be a boolean'),
  body('isExpanded').optional().isBoolean().withMessage('isExpanded must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sectionId } = req.params;
    const updateData = req.body;

    const section = await CourseSection.findByPk(sectionId, {
      include: [
        {
          model: Course,
          as: 'course'
        }
      ]
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found.' });
    }

    if (section.course.trainerId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to update this section.' });
    }

    await section.update(updateData);

    res.json({
      message: 'Section updated successfully.',
      section
    });
  } catch (error) {
    console.error('Update course section error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   DELETE /api/course-sections/:sectionId
// @desc    Delete a course section
// @access  Private (Course trainer or Super Admin)
router.delete('/:sectionId', [
  auth,
  requireTrainer
], async (req, res) => {
  try {
    const { sectionId } = req.params;

    const section = await CourseSection.findByPk(sectionId, {
      include: [
        {
          model: Course,
          as: 'course'
        }
      ]
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found.' });
    }

    if (section.course.trainerId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to delete this section.' });
    }

    // Check if section has content
    const contentCount = await CourseContent.count({
      where: { sectionId }
    });

    if (contentCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete section with content. Move or delete all content first.' 
      });
    }

    await section.destroy();

    res.json({
      message: 'Section deleted successfully.'
    });
  } catch (error) {
    console.error('Delete course section error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/course-sections/:sectionId/reorder
// @desc    Reorder sections
// @access  Private (Course trainer or Super Admin)
router.put('/:sectionId/reorder', [
  auth,
  requireTrainer,
  body('newOrder').isInt({ min: 0 }).withMessage('New order must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sectionId } = req.params;
    const { newOrder } = req.body;

    const section = await CourseSection.findByPk(sectionId, {
      include: [
        {
          model: Course,
          as: 'course'
        }
      ]
    });

    if (!section) {
      return res.status(404).json({ error: 'Section not found.' });
    }

    if (section.course.trainerId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Not authorized to reorder this section.' });
    }

    const oldOrder = section.order;

    if (newOrder > oldOrder) {
      // Moving down - decrease order of sections in between
      await CourseSection.update(
        { order: sequelize.literal('order - 1') },
        {
          where: {
            courseId: section.courseId,
            order: { [require('sequelize').Op.between]: [oldOrder + 1, newOrder] }
          }
        }
      );
    } else if (newOrder < oldOrder) {
      // Moving up - increase order of sections in between
      await CourseSection.update(
        { order: sequelize.literal('order + 1') },
        {
          where: {
            courseId: section.courseId,
            order: { [require('sequelize').Op.between]: [newOrder, oldOrder - 1] }
          }
        }
      );
    }

    await section.update({ order: newOrder });

    res.json({
      message: 'Section reordered successfully.',
      section
    });
  } catch (error) {
    console.error('Reorder course section error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
