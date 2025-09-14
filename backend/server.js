const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./config/database');
// Import models to ensure they are registered with Sequelize
require('./models');

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

const app = express();
const PORT = process.env.PORT || 5000;

// Global CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log('CORS Origin received:', origin);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Allow localhost and server IP addresses
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://127.0.0.1:3000',
      'http://10.0.0.96:3000',
      'http://10.0.0.96:5000',
      'http://localhost:5000',
      'http://127.0.0.1:5000'
    ];
    
    // Allow any IP in the 10.0.0.x range for mobile devices
    if (origin.match(/^http:\/\/10\.0\.0\.\d+:3000$/)) {
      console.log('CORS: Allowing network IP:', origin);
      return callback(null, true);
    }
    
    // Allow any localhost port for development
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      console.log('CORS: Allowing localhost port:', origin);
      return callback(null, true);
    }
    
    // Allow any 127.0.0.1 port for development
    if (origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
      console.log('CORS: Allowing 127.0.0.1 port:', origin);
      return callback(null, true);
    }
    
    // Allow any custom hostname with port 3000 for development
    if (origin.match(/^http:\/\/[^:]+:3000$/)) {
      console.log('CORS: Allowing custom hostname port 3000:', origin);
      return callback(null, true);
    }
    
    // Allow any localhost-like hostname for development
    if (origin.match(/^http:\/\/[a-zA-Z0-9-]+:\d+$/)) {
      console.log('CORS: Allowing custom hostname with port:', origin);
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('CORS: Allowing from allowed origins:', origin);
      return callback(null, true);
    }
    
    console.log('CORS: Blocking origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Range'],
  exposedHeaders: ['Content-Length', 'Content-Range']
};

// File serving CORS configuration (no credentials needed for static files)
const filesCorsOptions = {
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://10.0.0.96:3000', 'http://127.0.0.1:3000'],
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
  console.error(err.stack);
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