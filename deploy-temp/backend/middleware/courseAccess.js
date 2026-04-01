/**
 * Course Access Middleware
 * 
 * This middleware verifies that a user has paid for a course before allowing access
 * to course content and other protected resources.
 */

const { Enrollment, Course } = require('../models');

/**
 * Middleware to check if user has paid for a course
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requirePaidEnrollment = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    
    if (!courseId) {
      return res.status(400).json({ 
        error: 'Course ID is required',
        message: 'Course ID must be provided in the request parameters'
      });
    }

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ 
        error: 'Course not found',
        message: 'The requested course does not exist'
      });
    }

    // Allow Super Admins to access all courses
    if (req.user.role === 'super_admin') {
      req.course = course;
      return next();
    }

    // Allow Trainers to access courses they are assigned to teach
    if (req.user.role === 'trainer' && course.trainerId === req.user.id) {
      req.course = course;
      return next();
    }

    // If course is free, allow access
    if (course.price === 0) {
      return next();
    }

    // Check if user is enrolled and has paid
    const enrollment = await Enrollment.findOne({
      where: {
        userId: req.user.id,
        courseId: courseId
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You must enroll in this course before accessing its content',
        requiresEnrollment: true,
        coursePrice: course.price
      });
    }

    // Check payment status
    if (enrollment.paymentStatus !== 'paid') {
      return res.status(403).json({
        error: 'Payment required',
        message: 'You must complete payment before accessing this course content',
        requiresPayment: true,
        paymentStatus: enrollment.paymentStatus,
        coursePrice: course.price,
        enrollmentId: enrollment.id
      });
    }

    // Check enrollment status
    if (enrollment.status !== 'active') {
      return res.status(403).json({
        error: 'Enrollment not active',
        message: 'Your enrollment is not currently active',
        enrollmentStatus: enrollment.status,
        requiresActivation: enrollment.status === 'pending'
      });
    }

    // User has paid and is enrolled, allow access
    req.enrollment = enrollment;
    req.course = course;
    next();

  } catch (error) {
    console.error('Course access middleware error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Unable to verify course access'
    });
  }
};

/**
 * Middleware to check if user is enrolled in a course (regardless of payment)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireEnrollment = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    
    if (!courseId) {
      return res.status(400).json({ 
        error: 'Course ID is required',
        message: 'Course ID must be provided in the request parameters'
      });
    }

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ 
        error: 'Course not found',
        message: 'The requested course does not exist'
      });
    }

    // Allow Super Admins to access all courses
    if (req.user.role === 'super_admin') {
      req.course = course;
      return next();
    }

    // Allow Trainers to access courses they are assigned to teach
    if (req.user.role === 'trainer' && course.trainerId === req.user.id) {
      req.course = course;
      return next();
    }

    // Check if user is enrolled
    const enrollment = await Enrollment.findOne({
      where: {
        userId: req.user.id,
        courseId: courseId
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You must enroll in this course before accessing its content',
        requiresEnrollment: true,
        coursePrice: course.price
      });
    }

    // User is enrolled, allow access
    req.enrollment = enrollment;
    req.course = course;
    next();

  } catch (error) {
    console.error('Course enrollment middleware error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Unable to verify course enrollment'
    });
  }
};

/**
 * Middleware to check if user can access course content (very permissive for trainees)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireCourseAccess = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    
    if (!courseId) {
      return res.status(400).json({ 
        error: 'Course ID is required',
        message: 'Course ID must be provided in the request parameters'
      });
    }

    // Check if course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ 
        error: 'Course not found',
        message: 'The requested course does not exist'
      });
    }

    // Allow Super Admins to access all courses
    if (req.user.role === 'super_admin') {
      req.course = course;
      return next();
    }

    // Allow Trainers to access courses they are assigned to teach
    if (req.user.role === 'trainer' && course.trainerId === req.user.id) {
      req.course = course;
      return next();
    }

    // For trainees, if they can access this API, they should be able to see content
    // This is more permissive than requiring formal enrollment
    if (req.user.role === 'trainee') {
      req.course = course;
      return next();
    }

    // For other roles, check enrollment
    const enrollment = await Enrollment.findOne({
      where: {
        userId: req.user.id,
        courseId: courseId
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You must enroll in this course before accessing its content',
        requiresEnrollment: true,
        coursePrice: course.price
      });
    }

    // User is enrolled, allow access
    req.enrollment = enrollment;
    req.course = course;
    next();

  } catch (error) {
    console.error('Course access middleware error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Unable to verify course access'
    });
  }
};

module.exports = {
  requirePaidEnrollment,
  requireEnrollment,
  requireCourseAccess
};
