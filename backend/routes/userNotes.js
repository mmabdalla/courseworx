const express = require('express');
const router = express.Router();
const { UserNotes, Course, CourseContent } = require('../models');
const { auth } = require('../middleware/auth');
const { requirePaidEnrollment } = require('../middleware/courseAccess');

// Get user notes for a course (requires paid enrollment)
router.get('/:courseId', auth, requirePaidEnrollment, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.query;
    
    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get notes for the user and course
    const notes = await UserNotes.findAll({
      where: {
        courseId,
        userId: userId || req.user.id
      },
      include: [
        {
          model: CourseContent,
          as: 'content',
          attributes: ['id', 'title', 'type']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(notes);
  } catch (error) {
    console.error('Error fetching user notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user notes for specific content (requires paid enrollment)
router.get('/:courseId/content/:contentId', auth, requirePaidEnrollment, async (req, res) => {
  try {
    const { courseId, contentId } = req.params;
    const { userId } = req.query;
    
    // Check if course and content exist
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const content = await CourseContent.findOne({
      where: { id: contentId, courseId }
    });
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Get notes for the user, course, and content
    const notes = await UserNotes.findAll({
      where: {
        courseId,
        contentId,
        userId: userId || req.user.id
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(notes);
  } catch (error) {
    console.error('Error fetching content notes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new note (requires paid enrollment)
router.post('/:courseId', auth, requirePaidEnrollment, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { contentId, notes, tabType, isPublic } = req.body;
    
    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // If contentId is provided, check if content exists
    if (contentId) {
      const content = await CourseContent.findOne({
        where: { id: contentId, courseId }
      });
      if (!content) {
        return res.status(404).json({ error: 'Content not found' });
      }
    }

    // Create the note
    const userNote = await UserNotes.create({
      userId: req.user.id,
      courseId,
      contentId: contentId || null,
      notes: notes || '',
      tabType: tabType || 'notes',
      isPublic: isPublic || false
    });

    res.status(201).json(userNote);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a note
router.put('/:noteId', auth, async (req, res) => {
  try {
    const { noteId } = req.params;
    const updateData = req.body;
    
    // Find the note and check ownership
    const note = await UserNotes.findByPk(noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    if (note.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this note' });
    }

    // Update the note
    await note.update(updateData);
    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a note
router.delete('/:noteId', auth, async (req, res) => {
  try {
    const { noteId } = req.params;
    
    // Find the note and check ownership
    const note = await UserNotes.findByPk(noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    if (note.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this note' });
    }

    // Delete the note
    await note.destroy();
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
