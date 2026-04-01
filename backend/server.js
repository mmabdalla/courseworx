const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./config/database');
// Import models to ensure they are registered with Sequelize
require('./models');

// Logger and Notification Service
const logger = require('./utils/logger');
const notificationService = require('./services/NotificationService');

// Plugin System
const pluginLoader = require('./core/plugin-loader');
const pluginEventSystem = require('./core/plugin-events');

// Core Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const courseContentRoutes = require('./routes/courseContent');
const courseSectionRoutes = require('./routes/courseSections');
const enrollmentRoutes = require('./routes/enrollments');
const attendanceRoutes = require('./routes/attendance');
const deviceAttendanceRoutes = require('./routes/deviceAttendance');
const classroomSessionRoutes = require('./routes/classroomSessions');
const assignmentRoutes = require('./routes/assignments');
const lessonCompletionRoutes = require('./routes/lessonCompletion');
const courseStatsRoutes = require('./routes/courseStats');
const userNotesRoutes = require('./routes/userNotes');
const coreApiRoutes = require('./routes/core-api');
const financialRoutes = require('./routes/financial');
const traineeProgressRoutes = require('./routes/traineeProgress');
const traineeAttendanceRoutes = require('./routes/traineeAttendance');
const traineeAssignmentsRoutes = require('./routes/traineeAssignments');
const traineeNotesRoutes = require('./routes/traineeNotes');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Global CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    logger.info(`CORS Origin received: ${origin}`);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Configurable origins from .env
    const allowedFromConfig = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
    const serverIP = process.env.SERVER_IP || '10.0.0.50';
    
    // Core allowed origins
    const allowedOrigins = [
      'http://localhost:3050',
      'http://127.0.0.1:3050',
      `http://${serverIP}:3050`,
      'https://cx.sawa.im',
      ...allowedFromConfig
    ];
    
    // Dynamic network IP matching (10.0.0.x range) or sawa.im subdomains
    if (origin.match(/^http:\/\/10\.0\.0\.\d+:3050$/) || origin.endsWith('.sawa.im')) {
      return callback(null, true);
    }
    
    // Local development matching
    if (origin.match(/^http:\/\/localhost:\d+$/) || origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    logger.warn(`CORS: Blocking origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Range'],
  exposedHeaders: ['Content-Length', 'Content-Range']
};

// File serving CORS configuration (no credentials needed for static files)
const filesCorsOptions = {
  origin: process.env.CORS_ORIGIN || ['http://localhost:3050', 'http://10.0.0.50:3050', 'http://127.0.0.1:3050'],
  credentials: false,
  methods: ['GET', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Range'],
  exposedHeaders: ['Content-Length', 'Content-Range', 'Content-Type']
};

// Apply CORS globally first
app.use(cors(corsOptions));

// Handle OPTIONS preflight requests globally
app.options('*', cors(corsOptions));

// Middleware - Disable CSP for now to test image loading
app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files - completely disable CORS and serve directly
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: function (res, path, stat) {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Range');
  }
}));

// Secure Media Serving - Single endpoint for all media files
const secureMediaRoutes = require('./routes/secureMedia');
app.use('/api/media', secureMediaRoutes);

// Legacy route compatibility - redirect to secure media endpoint
app.get('/api/image/*', (req, res) => {
  const imagePath = req.path.replace('/api/image/', '');
  res.redirect(301, `/api/media/${imagePath}`);
});

// Core API Routes (Plugin System)
app.use('/api/core', coreApiRoutes);

// Core Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/course-content', courseContentRoutes);
app.use('/api/course-sections', courseSectionRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/device-attendance', deviceAttendanceRoutes);
app.use('/api/classroom-sessions', classroomSessionRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/lesson-completion', lessonCompletionRoutes);
app.use('/api/course-stats', courseStatsRoutes);
app.use('/api/user-notes', userNotesRoutes);

// Trainee detail routes
app.use('/api/trainee-progress', traineeProgressRoutes);
app.use('/api/trainee-attendance', traineeAttendanceRoutes);
app.use('/api/trainee-assignments', traineeAssignmentsRoutes);
app.use('/api/trainee-notes', traineeNotesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Production: Serve frontend build assets and handle SPA routing
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../frontend/build');
  app.use(express.static(buildPath));
  
  // Custom SPA catch-all (must be after /api routes)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Financial routes
app.use('/api/financial', financialRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'CourseWorx API is running' });
});

// Mobile connectivity test endpoint
app.get('/api/mobile-test', (req, res) => {
  console.log('Mobile test endpoint called:', {
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    headers: req.headers
  });
  res.json({ 
    status: 'OK', 
    message: 'Mobile connectivity test successful',
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled request error:', err);
  
  // Notify Super Admins of Backend Errors
  notificationService.reportSystemError({
    message: err.message || 'An unexpected backend error occurred.'
  }).catch(e => logger.error('Failed to send error notification:', e));

  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized.');
    }
    
    // Initialize Plugin System
    console.log('🔌 Initializing plugin system...');
    await pluginLoader.initialize(app);
    
    // 404 handler (must be after plugin routes)
    app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
    
    // Register core hook points
    pluginEventSystem.registerHook('before:user:create', async (data, context) => {
      console.log('🔗 Hook: before:user:create', { userId: data.id, email: data.email });
      return data;
    });
    
    pluginEventSystem.registerHook('after:user:create', async (data, context) => {
      console.log('🔗 Hook: after:user:create', { userId: data.id, email: data.email });
      return data;
    });
    
    pluginEventSystem.registerHook('before:course:save', async (data, context) => {
      console.log('🔗 Hook: before:course:save', { courseId: data.id, title: data.title });
      return data;
    });
    
    pluginEventSystem.registerHook('after:course:save', async (data, context) => {
      console.log('🔗 Hook: after:course:save', { courseId: data.id, title: data.title });
      return data;
    });
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 API available at http://localhost:${PORT}/api`);
      console.log(`🌐 Network accessible at http://0.0.0.0:${PORT}/api`);
      console.log(`🔌 Plugin system ready at http://localhost:${PORT}/api/core`);
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer(); 