const express = require('express');
const path = require('path');
const fs = require('fs');
const {
  authenticateMediaAccess,
  checkCourseAccess,
  addMediaSecurityHeaders,
  logMediaAccess
} = require('../middleware/mediaAuth');

const router = express.Router();

/**
 * Secure Media Serving Route
 * Single endpoint for all media files with proper security
 * Replaces the multiple fragmented routes created during CORS attempts
 */

/**
 * GET /api/media/*
 * Serves all media files (images, videos, documents) with security controls
 */
router.get('/*', 
  // Extract media path from request
  (req, res, next) => {
    req.mediaPath = req.path.substring(1); // Remove leading slash
    next();
  },
  
  // Security middleware chain
  authenticateMediaAccess,
  checkCourseAccess,
  addMediaSecurityHeaders,
  logMediaAccess,
  
  // Serve the actual file
  async (req, res) => {
    try {
      const { mediaPath } = req;
      
      // Decode URL-encoded characters (important for Arabic folder names)
      const decodedPath = decodeURIComponent(mediaPath);
      const fullPath = path.join(__dirname, '../uploads', decodedPath);
      
      // Security check: Ensure path is within uploads directory
      const uploadsDir = path.join(__dirname, '../uploads');
      const resolvedPath = path.resolve(fullPath);
      if (!resolvedPath.startsWith(path.resolve(uploadsDir))) {
        return res.status(403).json({ error: 'Access denied: Invalid path' });
      }
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ 
          error: 'File not found', 
          path: decodedPath 
        });
      }
      
      // Get file stats for proper headers
      const stats = fs.statSync(fullPath);
      const fileExtension = path.extname(fullPath).toLowerCase();
      
      // Set appropriate content type
      let contentType = 'application/octet-stream'; // default
      
      // Image types
      if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
        contentType = 'image/jpeg';
      } else if (fileExtension === '.png') {
        contentType = 'image/png';
      } else if (fileExtension === '.gif') {
        contentType = 'image/gif';
      } else if (fileExtension === '.webp') {
        contentType = 'image/webp';
      } else if (fileExtension === '.svg') {
        contentType = 'image/svg+xml';
      }
      // Video types
      else if (fileExtension === '.mp4') {
        contentType = 'video/mp4';
      } else if (fileExtension === '.webm') {
        contentType = 'video/webm';
      } else if (fileExtension === '.avi') {
        contentType = 'video/avi';
      }
      // Document types
      else if (fileExtension === '.pdf') {
        contentType = 'application/pdf';
      } else if (fileExtension === '.doc') {
        contentType = 'application/msword';
      } else if (fileExtension === '.docx') {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
      
      // Set content headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      
      // Handle range requests for video streaming
      const range = req.headers.range;
      if (range && contentType.startsWith('video/')) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = (end - start) + 1;
        
        const fileStream = fs.createReadStream(fullPath, { start, end });
        
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
        });
        
        fileStream.pipe(res);
      } else {
        // Serve entire file
        res.sendFile(fullPath);
      }
      
    } catch (error) {
      console.error('Media serving error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'File serving failed'
      });
    }
  }
);

module.exports = router;
