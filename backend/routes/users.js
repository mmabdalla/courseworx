const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { auth, requireSuperAdmin, requireTrainer } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Multer storage for slider images
const sliderImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/slider');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const uploadSliderImage = multer({
  storage: sliderImageStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Utility to remove BOM from a file (in-place)
function removeBOMFromFile(filePath) {
  const fs = require('fs');
  const data = fs.readFileSync(filePath);
  // UTF-8 BOM is 0xEF,0xBB,0xBF
  if (data[0] === 0xEF && data[1] === 0xBB && data[2] === 0xBF) {
    fs.writeFileSync(filePath, data.slice(3));
  }
}

// @route   GET /api/users
// @desc    Get all users (Super Admin only)
// @access  Private (Super Admin)
router.get('/', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (role) whereClause.role = role;
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { firstName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { lastName: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { email: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Super Admin only)
// @access  Private (Super Admin)
router.get('/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id', [
  auth,
  requireSuperAdmin,
  body('firstName').optional().isLength({ min: 2, max: 50 }),
  body('lastName').optional().isLength({ min: 2, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['super_admin', 'trainer', 'trainee']),
  body('phone').optional().isMobilePhone(),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { firstName, lastName, email, role, phone, isActive } = req.body;
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    await user.update(updateData);

    res.json({
      message: 'User updated successfully.',
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
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   PUT /api/users/:id/password
// @desc    Change user password (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/password', [
  auth,
  requireSuperAdmin,
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { password } = req.body;
    await user.update({ password });

    res.json({
      message: 'User password updated successfully.'
    });
  } catch (error) {
    console.error('Update user password error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Super Admin only)
// @access  Private (Super Admin)
router.delete('/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Prevent deleting super admin accounts
    if (user.role === 'super_admin') {
      return res.status(403).json({ error: 'Cannot delete super admin accounts.' });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics (Super Admin only)
// @access  Private (Super Admin)
router.get('/stats/overview', auth, requireSuperAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const trainers = await User.count({ where: { role: 'trainer' } });
    const trainees = await User.count({ where: { role: 'trainee' } });

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        trainers,
        trainees,
        superAdmins: totalUsers - trainers - trainees
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// @route   POST /api/users/import
// @desc    Import users from CSV (Super Admin or Trainer)
// @access  Private
router.post('/import', [
  auth,
  requireTrainer,
  upload.single('file')
], async (req, res) => {
  // Remove BOM if present
  if (req.file && req.file.path) {
    removeBOMFromFile(req.file.path);
  }
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded.' });
    }

    const results = [];
    const errors = [];
    let created = 0;
    let skipped = 0;

    // Parse CSV file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        try {
          // Process each row
          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            const rowNumber = i + 2; // +2 because CSV has header and arrays are 0-indexed

            try {
              // Validate required fields
              if (!row.firstName || !row.lastName || !row.email) {
                errors.push(`Row ${rowNumber}: Missing required fields (firstName, lastName, email)`);
                continue;
              }

              // Validate email format
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(row.email)) {
                errors.push(`Row ${rowNumber}: Invalid email format`);
                continue;
              }

              // Check if user already exists
              const existingUser = await User.findOne({ where: { email: row.email.toLowerCase() } });
              if (existingUser) {
                skipped++;
                continue;
              }

              // Hash default password
              const defaultPassword = req.body.defaultPassword || 'changeme123';
              const hashedPassword = await bcrypt.hash(defaultPassword, 10);

              // Create user
              await User.create({
                firstName: row.firstName.trim(),
                lastName: row.lastName.trim(),
                email: row.email.toLowerCase().trim(),
                phone: row.phone ? row.phone.trim() : null,
                password: hashedPassword,
                role: 'trainee',
                isActive: true,
                requiresPasswordChange: true // Flag for first login password change
              });

              created++;
            } catch (error) {
              errors.push(`Row ${rowNumber}: ${error.message}`);
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(req.file.path);

          res.json({
            message: 'Import completed successfully.',
            created,
            skipped,
            errors: errors.length,
            errorDetails: errors
          });
        } catch (error) {
          // Clean up uploaded file
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          throw error;
        }
      })
      .on('error', (error) => {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        console.error('CSV parsing error:', error);
        res.status(500).json({ error: 'Error parsing CSV file.' });
      });

  } catch (error) {
    console.error('Import users error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   POST /api/slider/image
// @desc    Upload slider image (Super Admin only)
// @access  Private
router.post('/slider/image', [auth, requireSuperAdmin, uploadSliderImage.single('image')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }
    res.json({
      message: 'Slider image uploaded successfully.',
      imageUrl: `/uploads/slider/${req.file.filename}`
    });
  } catch (error) {
    console.error('Upload slider image error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router; 