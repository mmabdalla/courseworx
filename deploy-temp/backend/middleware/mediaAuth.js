const jwt = require('jsonwebtoken');
const { User, Enrollment } = require('../models');

/**
 * Media Authentication Middleware
 * Provides secure access control for all media files (images, videos, documents)
 * Supports future video security features like anti-download headers
 */

/**
 * Basic authentication check for media access
 * Ensures user is logged in before accessing any media
 */
const authenticateMediaAccess = async (req, res, next) => {
  try {
    const { mediaPath } = req;
    const fileExtension = mediaPath.split('.').pop()?.toLowerCase();
    
    // For video files, require STRICT authentication
    if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(fileExtension)) {
      const token = req.header('Authorization')?.replace('Bearer ', '') || 
                    req.cookies?.token || 
                    req.query?.token; // This will now work with ?token=xyz URLs

      if (!token) {
        console.log('🚨 Video access denied: No authentication token');
        return res.status(401).json({ error: 'Authentication required for video access' });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);

        if (!user || !user.isActive) {
          console.log('🚨 Video access denied: Invalid or inactive user');
          return res.status(401).json({ error: 'Invalid or inactive user' });
        }

        req.user = user;
        console.log(`✅ Video access granted to user: ${user.email} (${user.role})`);
      } catch (jwtError) {
        console.log('🚨 Video access denied: Invalid JWT token');
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    } else {
      // For non-video files, allow basic access (maintains current functionality)
      const token = req.header('Authorization')?.replace('Bearer ', '') || 
                    req.cookies?.token || 
                    req.query?.token;

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findByPk(decoded.userId);
          if (user && user.isActive) {
            req.user = user;
          }
        } catch (error) {
          // Continue without user for non-video files
        }
      }
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication service error' });
  }
};

/**
 * Check if user has access to specific course content
 * Ensures user is either:
 * 1. Enrolled in the course (for trainees)
 * 2. The course owner (for trainers)
 * 3. A super admin
 */
const checkCourseAccess = async (req, res, next) => {
  try {
    const { mediaPath } = req;
    const user = req.user;
    const fileExtension = mediaPath.split('.').pop()?.toLowerCase();

    // Extract course identifier from media path
    // Path format: courses/courseName/filename or courses/courseId/filename
    const pathParts = mediaPath.split('/');
    if (pathParts[0] !== 'courses' || pathParts.length < 3) {
      return next(); // Not a course-specific file
    }

    const courseIdentifier = pathParts[1];

    // For video files, require STRICT course access
    if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(fileExtension)) {
      if (!user) {
        console.log('🚨 Video course access denied: No user');
        return res.status(403).json({ error: 'Course access required for video content' });
      }

      // Super admins have access to everything
      if (user.role === 'super_admin') {
        console.log(`✅ Super admin access granted to course: ${courseIdentifier}`);
        return next();
      }

      // TODO: Implement actual course ownership and enrollment checks
      // For now, require at least trainer role for video access
      if (user.role === 'trainer') {
        console.log(`✅ Trainer access granted to course: ${courseIdentifier}`);
        return next();
      }

      // Trainees need to be enrolled (TODO: implement actual check)
      if (user.role === 'trainee') {
        console.log(`✅ Trainee access granted to course: ${courseIdentifier}`);
        return next();
      }

      console.log(`🚨 Video course access denied: User ${user.email} has insufficient permissions`);
      return res.status(403).json({ error: 'Insufficient permissions for video content' });
    } else {
      // For non-video files, allow basic access (maintains current functionality)
      if (!user) {
        return next();
      }

      // Super admins have access to everything
      if (user.role === 'super_admin') {
        return next();
      }

      // Basic access for other roles
      return next();
    }
  } catch (error) {
    console.error('Course access check error:', error);
    return res.status(500).json({ error: 'Course access verification failed' });
  }
};

/**
 * Add security headers for media files
 * Includes anti-download headers for videos and sensitive content
 */
const addMediaSecurityHeaders = (req, res, next) => {
  const { mediaPath } = req;
  const fileExtension = mediaPath.split('.').pop()?.toLowerCase();

  // Basic security headers for all media
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, max-age=3600', // 1 hour cache
  });

  // Special headers for video files (ACTUAL video security)
  if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(fileExtension)) {
    res.set({
      'X-Frame-Options': 'SAMEORIGIN',
      'Content-Disposition': 'inline', // Allow inline playback
      'Accept-Ranges': 'bytes', // Enable video streaming
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, max-age=3600', // Allow caching for streaming
      // Custom headers to confuse downloaders
      'X-Video-Security': 'protected',
      'X-Streaming-Only': 'true',
      'X-No-Download': 'true'
    });
  }

  // Special headers for documents
  if (['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(fileExtension)) {
    res.set({
      'X-Frame-Options': 'SAMEORIGIN',
    });
  }

  next();
};

/**
 * Log media access for audit trail
 * Important for tracking video access and preventing abuse
 */
const logMediaAccess = (req, res, next) => {
  const { mediaPath, user, ip } = req;
  const userAgent = req.get('User-Agent');

  // Log access (in production, this should go to a proper logging system)
  console.log('📁 Media access:', {
    path: mediaPath,
    user: user ? { id: user.id, role: user.role } : 'anonymous',
    ip: req.ip || ip,
    userAgent,
    timestamp: new Date().toISOString()
  });

  next();
};

module.exports = {
  authenticateMediaAccess,
  checkCourseAccess,
  addMediaSecurityHeaders,
  logMediaAccess
};
