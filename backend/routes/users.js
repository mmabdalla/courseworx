const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { auth, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

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

module.exports = router; 