const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { auth, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Handle OPTIONS preflight for auth routes
router.options('*', (req, res) => {
  // Use the same CORS origin as the main server
  const allowedOrigins = ['http://localhost:3000', 'http://10.0.0.96:3000', 'http://127.0.0.1:3000'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @route   GET /api/auth/setup-status
// @desc    Check if system setup is required
// @access  Public
router.get('/setup-status', async (req, res) => {
  try {
    const superAdminCount = await User.count({ where: { role: 'super_admin' } });
    res.json({
      setupRequired: superAdminCount === 0,
      superAdminCount
    });
  } catch (error) {
    console.error('Setup status check error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/auth/setup
// @desc    First-time setup - Create super admin (Public)
// @access  Public (only when no SA exists)
router.post('/setup', [
  body('firstName').isLength({ min: 2, max: 50 }),
  body('lastName').isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    // Check if setup is already completed
    const superAdminCount = await User.count({ where: { role: 'super_admin' } });
    if (superAdminCount > 0) {
      return res.status(400).json({ error: 'System setup already completed.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user already exists (by email or phone)
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email },
          { phone }
        ]
      }
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      } else {
        return res.status(400).json({ error: 'User with this phone number already exists.' });
      }
    }

    // Create the first super admin
    const superAdmin = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'super_admin',
      phone,
      isActive: true
    });

    console.log('Super Admin created during setup:', {
      id: superAdmin.id,
      email: superAdmin.email,
      phone: superAdmin.phone,
      role: superAdmin.role
    });

    // Generate token for immediate login
    const token = generateToken(superAdmin.id);

    res.status(201).json({
      message: 'System setup completed successfully. Super Admin account created.',
      token,
      user: {
        id: superAdmin.id,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        email: superAdmin.email,
        phone: superAdmin.phone,
        role: superAdmin.role
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('identifier').notEmpty().withMessage('Email or phone number is required'),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    console.log('Login attempt:', { 
      identifier: req.body.identifier, 
      passwordLength: req.body.password?.length,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    // Find user by email or phone
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email: identifier },
          { phone: identifier }
        ],
        isActive: true
      }
    });
    
    console.log('User lookup result:', { 
      found: !!user, 
      userId: user?.id, 
      role: user?.role, 
      isActive: user?.isActive 
    });
    
    if (!user || !user.isActive) {
      console.log('Login failed: User not found or inactive');
      return res.status(401).json({ error: 'Invalid credentials or account inactive.' });
    }

    const isPasswordValid = await user.comparePassword(password);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    const token = generateToken(user.id);
    console.log('Login successful:', { userId: user.id, role: user.role });
    
    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        requiresPasswordChange: user.requiresPasswordChange
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user (Super Admin only)
// @access  Private (Super Admin)
router.post('/register', [
  auth,
  requireSuperAdmin,
  body('firstName').isLength({ min: 2, max: 50 }),
  body('lastName').isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['super_admin', 'trainer', 'trainee']),
  body('phone').notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, role, phone, isActive = true } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Prevent creating another super admin if not during setup
    if (role === 'super_admin') {
      const superAdminCount = await User.count({ where: { role: 'super_admin' } });
      if (superAdminCount > 0) {
        return res.status(400).json({ error: 'Super Admin account already exists. Cannot create another one.' });
      }
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      isActive
    });

    console.log('User created successfully:', {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });

    res.status(201).json({
      message: 'User created successfully.',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        phone: req.user.phone,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('firstName').optional().isLength({ min: 2, max: 50 }),
  body('lastName').optional().isLength({ min: 2, max: 50 }),
  body('phone').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, phone } = req.body;
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;

    await req.user.update(updateData);

    res.json({
      message: 'Profile updated successfully.',
      user: {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        phone: req.user.phone
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', [
  auth,
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    await req.user.update({ password: newPassword });

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/auth/first-password-change
// @desc    Change password on first login (for imported users)
// @access  Private
router.put('/first-password-change', [
  auth,
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newPassword } = req.body;

    // Check if user requires password change
    if (!req.user.requiresPasswordChange) {
      return res.status(400).json({ error: 'Password change not required.' });
    }

    await req.user.update({ 
      password: newPassword,
      requiresPasswordChange: false
    });

    res.json({ 
      message: 'Password changed successfully.',
      user: {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        phone: req.user.phone,
        requiresPasswordChange: false
      }
    });
  } catch (error) {
    console.error('First password change error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/auth/trainee-login
// @desc    Login trainee with phone or email
// @access  Public
router.post('/trainee-login', [
  body('identifier').notEmpty().withMessage('Phone or email is required'),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, password } = req.body;

    // Find user by email or phone
    const user = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email: identifier },
          { phone: identifier }
        ],
        role: 'trainee',
        isActive: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials or account inactive.' });
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    const token = generateToken(user.id);
    
    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        requiresPasswordChange: user.requiresPasswordChange
      }
    });
  } catch (error) {
    console.error('Trainee login error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/auth/check-enrollment
// @desc    Check if trainee is enrolled in any courses
// @access  Private (Trainee)
router.post('/check-enrollment', auth, async (req, res) => {
  try {
    if (req.user.role !== 'trainee') {
      return res.status(403).json({ error: 'Only trainees can check enrollment.' });
    }

    const { Enrollment, Course } = require('../models');
    
    const enrollments = await Enrollment.findAll({
      where: { 
        userId: req.user.id,
        status: ['active', 'pending']
      },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'thumbnail', 'description'],
          include: [
            {
              model: User,
              as: 'trainer',
              attributes: ['id', 'firstName', 'lastName']
            }
          ]
        }
      ],
      order: [['enrolledAt', 'DESC']]
    });

    res.json({
      hasEnrollments: enrollments.length > 0,
      enrollments: enrollments.map(e => ({
        id: e.id,
        status: e.status,
        progress: e.progress,
        enrolledAt: e.enrolledAt,
        course: e.course
      }))
    });
  } catch (error) {
    console.error('Check enrollment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router; 