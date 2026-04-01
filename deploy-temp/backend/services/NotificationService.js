const { Notification, User, Course } = require('../models');
const { Op } = require('sequelize');

class NotificationService {
  /**
   * Create a notification for a specific user
   */
  async notifyUser(userId, { title, message, type = 'info', link = null }) {
    try {
      return await Notification.create({
        userId,
        title,
        message,
        type,
        link,
        isRead: false
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  /**
   * Notify all Super Admins
   */
  async notifySuperAdmins({ title, message, type = 'info', link = null }) {
    try {
      const superAdmins = await User.findAll({
        where: { role: 'super_admin', isActive: true },
        attributes: ['id']
      });

      const notifications = superAdmins.map(admin => ({
        userId: admin.id,
        title,
        message,
        type,
        link,
        isRead: false
      }));

      return await Notification.bulkCreate(notifications);
    } catch (error) {
      console.error('Error notifying super admins:', error);
    }
  }

  /**
   * Notify the trainer of a specific course
   */
  async notifyTrainer(courseId, { title, message, type = 'info', link = null }) {
    try {
      const course = await Course.findByPk(courseId, {
        attributes: ['trainerId']
      });

      if (course && course.trainerId) {
        return await this.notifyUser(course.trainerId, { title, message, type, link });
      }
    } catch (error) {
      console.error('Error notifying trainer:', error);
    }
  }

  /**
   * Notify all trainees enrolled in a course
   */
  // Future use case: Announcements or content updates
  async notifyEnrolledTrainees(courseId, { title, message, type = 'info', link = null }) {
    try {
      const { Enrollment } = require('../models');
      const enrollments = await Enrollment.findAll({
        where: { courseId, status: 'active' },
        attributes: ['userId']
      });

      const notifications = enrollments.map(enrollment => ({
        userId: enrollment.userId,
        title,
        message,
        type,
        link,
        isRead: false
      }));

      return await Notification.bulkCreate(notifications);
    } catch (error) {
      console.error('Error notifying enrolled trainees:', error);
    }
  }

  /**
   * System Error Notification (Specifically for Super Admins)
   */
  async reportSystemError(errorDetails) {
    return await this.notifySuperAdmins({
      title: '🚨 Backend System Error',
      message: `A critical error occurred: ${errorDetails.message || 'Unknown error'}. Check system logs for details.`,
      type: 'error',
      link: '/admin/logs'
    });
  }
}

module.exports = new NotificationService();
