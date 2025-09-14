/**
 * Coupon Management Routes for Financial Plugin
 * 
 * This file handles coupon creation, validation, and management
 * for the shopping cart and checkout system.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, requireSuperAdmin } = require('../../../middleware/auth');
const { Coupon } = require('../models');

const router = express.Router();

// @route   POST /api/financial/coupons
// @desc    Create new coupon
// @access  Private (Super Admin)
router.post('/', [
  auth,
  requireSuperAdmin,
  body('name').isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),
  body('code').optional().isLength({ min: 3, max: 50 }).withMessage('Code must be between 3 and 50 characters'),
  body('type').isIn(['percentage', 'fixed', 'free_shipping']).withMessage('Type must be percentage, fixed, or free_shipping'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('maxUses').optional().isInt({ min: 1 }).withMessage('Max uses must be a positive integer'),
  body('validFrom').optional().isISO8601().withMessage('Valid from must be a valid date'),
  body('validTo').optional().isISO8601().withMessage('Valid to must be a valid date'),
  body('minOrderAmount').optional().isFloat({ min: 0 }).withMessage('Minimum order amount must be positive'),
  body('applicableCourses').optional().isArray().withMessage('Applicable courses must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      code,
      type,
      value,
      maxUses,
      validFrom,
      validTo,
      minOrderAmount,
      applicableCourses,
      description
    } = req.body;
    
    // Generate code if not provided
    let couponCode = code;
    if (!couponCode) {
      couponCode = await Coupon.createUniqueCode();
    } else {
      couponCode = couponCode.toUpperCase();
    }
    
    // Check if code already exists
    const existingCoupon = await Coupon.findByCode(couponCode);
    if (existingCoupon) {
      return res.status(400).json({ 
        error: 'Coupon code already exists' 
      });
    }
    
    // Validate date range
    if (validFrom && validTo && new Date(validFrom) >= new Date(validTo)) {
      return res.status(400).json({ 
        error: 'Valid from date must be before valid to date' 
      });
    }
    
    // Create coupon
    const coupon = await Coupon.create({
      name,
      code: couponCode,
      description,
      type,
      value,
      maxUses,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validTo: validTo ? new Date(validTo) : null,
      minOrderAmount,
      applicableCourses,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      message: 'Coupon created successfully',
      coupon: {
        id: coupon.id,
        name: coupon.name,
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: parseFloat(coupon.value),
        maxUses: coupon.maxUses,
        usedCount: coupon.usedCount,
        validFrom: coupon.validFrom,
        validTo: coupon.validTo,
        minOrderAmount: parseFloat(coupon.minOrderAmount || 0),
        applicableCourses: coupon.applicableCourses,
        isActive: coupon.isActive,
        createdAt: coupon.createdAt
      }
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// @route   GET /api/financial/coupons
// @desc    Get all coupons
// @access  Private (Super Admin)
router.get('/', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, type } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    const { count, rows: coupons } = await Coupon.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      coupons: coupons.map(coupon => ({
        id: coupon.id,
        name: coupon.name,
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: parseFloat(coupon.value),
        maxUses: coupon.maxUses,
        usedCount: coupon.usedCount,
        validFrom: coupon.validFrom,
        validTo: coupon.validTo,
        minOrderAmount: parseFloat(coupon.minOrderAmount || 0),
        applicableCourses: coupon.applicableCourses,
        isActive: coupon.isActive,
        createdAt: coupon.createdAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({ error: 'Failed to get coupons' });
  }
});

// @route   GET /api/financial/coupons/:id
// @desc    Get coupon details
// @access  Private (Super Admin)
router.get('/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const coupon = await Coupon.findByPk(id);
    
    if (!coupon) {
      return res.status(404).json({ 
        error: 'Coupon not found' 
      });
    }
    
    res.json({
      coupon: {
        id: coupon.id,
        name: coupon.name,
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: parseFloat(coupon.value),
        maxUses: coupon.maxUses,
        usedCount: coupon.usedCount,
        validFrom: coupon.validFrom,
        validTo: coupon.validTo,
        minOrderAmount: parseFloat(coupon.minOrderAmount || 0),
        applicableCourses: coupon.applicableCourses,
        isActive: coupon.isActive,
        createdAt: coupon.createdAt
      }
    });
  } catch (error) {
    console.error('Get coupon details error:', error);
    res.status(500).json({ error: 'Failed to get coupon details' });
  }
});

// @route   PUT /api/financial/coupons/:id
// @desc    Update coupon
// @access  Private (Super Admin)
router.put('/:id', [
  auth,
  requireSuperAdmin,
  body('name').optional().isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),
  body('type').optional().isIn(['percentage', 'fixed', 'free_shipping']).withMessage('Type must be percentage, fixed, or free_shipping'),
  body('value').optional().isFloat({ min: 0 }).withMessage('Value must be a positive number'),
  body('maxUses').optional().isInt({ min: 1 }).withMessage('Max uses must be a positive integer'),
  body('validFrom').optional().isISO8601().withMessage('Valid from must be a valid date'),
  body('validTo').optional().isISO8601().withMessage('Valid to must be a valid date'),
  body('minOrderAmount').optional().isFloat({ min: 0 }).withMessage('Minimum order amount must be positive'),
  body('applicableCourses').optional().isArray().withMessage('Applicable courses must be an array'),
  body('isActive').optional().isBoolean().withMessage('Is active must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;
    
    const coupon = await Coupon.findByPk(id);
    
    if (!coupon) {
      return res.status(404).json({ 
        error: 'Coupon not found' 
      });
    }
    
    // Validate date range if both dates are provided
    if (updateData.validFrom && updateData.validTo) {
      if (new Date(updateData.validFrom) >= new Date(updateData.validTo)) {
        return res.status(400).json({ 
          error: 'Valid from date must be before valid to date' 
        });
      }
    }
    
    // Update coupon
    await coupon.update(updateData);
    
    res.json({
      message: 'Coupon updated successfully',
      coupon: {
        id: coupon.id,
        name: coupon.name,
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: parseFloat(coupon.value),
        maxUses: coupon.maxUses,
        usedCount: coupon.usedCount,
        validFrom: coupon.validFrom,
        validTo: coupon.validTo,
        minOrderAmount: parseFloat(coupon.minOrderAmount || 0),
        applicableCourses: coupon.applicableCourses,
        isActive: coupon.isActive,
        updatedAt: coupon.updatedAt
      }
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// @route   DELETE /api/financial/coupons/:id
// @desc    Delete coupon
// @access  Private (Super Admin)
router.delete('/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const coupon = await Coupon.findByPk(id);
    
    if (!coupon) {
      return res.status(404).json({ 
        error: 'Coupon not found' 
      });
    }
    
    // Check if coupon has been used
    if (coupon.usedCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete coupon that has been used' 
      });
    }
    
    await coupon.destroy();
    
    res.json({
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// @route   POST /api/financial/coupons/validate
// @desc    Validate coupon code
// @access  Private
router.post('/validate', [
  auth,
  body('code').isLength({ min: 3, max: 50 }).withMessage('Valid coupon code is required'),
  body('orderAmount').isFloat({ min: 0 }).withMessage('Order amount must be positive'),
  body('courseId').optional().isUUID().withMessage('Valid course ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, orderAmount, courseId } = req.body;
    
    const coupon = await Coupon.findByCode(code);
    
    if (!coupon) {
      return res.status(400).json({ 
        error: 'Invalid coupon code' 
      });
    }
    
    // Validate coupon
    const validation = coupon.isValid();
    if (!validation.valid) {
      return res.status(400).json({ 
        error: validation.reason 
      });
    }
    
    // Check minimum order amount
    if (!coupon.canApplyToOrder(orderAmount)) {
      return res.status(400).json({ 
        error: `Minimum order amount of $${coupon.minOrderAmount} required` 
      });
    }
    
    // Check course applicability
    if (courseId && !coupon.canApplyToCourse(courseId)) {
      return res.status(400).json({ 
        error: 'Coupon not applicable to this course' 
      });
    }
    
    // Calculate discount
    const discountResult = coupon.calculateDiscount(orderAmount, courseId);
    
    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        name: coupon.name,
        code: coupon.code,
        type: coupon.type,
        value: parseFloat(coupon.value)
      },
      discount: {
        amount: discountResult.discount,
        reason: discountResult.reason
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

module.exports = router;
