/**
 * Shopping Cart Routes for Financial Plugin
 * 
 * This file handles all shopping cart operations including
 * adding/removing items, calculating totals, and applying coupons.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../../../middleware/auth');
const { Cart, Coupon } = require('../models');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Middleware to get or create cart
const getOrCreateCart = async (req, res, next) => {
  try {
    const { userId } = req.user || {};
    const sessionId = req.headers['x-session-id'] || req.sessionID;
    
    let cart = await Cart.findByUserOrSession(userId, sessionId);
    
    if (!cart) {
      cart = await Cart.create({
        userId: userId || null,
        sessionId: userId ? null : sessionId,
        items: [],
        totalAmount: 0,
        discountAmount: 0,
        taxAmount: 0,
        finalAmount: 0
      });
    }
    
    req.cart = cart;
    next();
  } catch (error) {
    console.error('Cart middleware error:', error);
    res.status(500).json({ error: 'Failed to initialize cart' });
  }
};

// @route   GET /api/financial/cart
// @desc    Get current cart contents
// @access  Private
router.get('/', auth, getOrCreateCart, async (req, res) => {
  try {
    const cart = req.cart;
    
    // Check if cart is expired
    if (cart.isExpired()) {
      await cart.destroy();
      return res.json({
        cart: {
          id: null,
          items: [],
          totalAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          finalAmount: 0,
          couponCode: null,
          expiresAt: null
        }
      });
    }
    
    res.json({
      cart: {
        id: cart.id,
        items: cart.items,
        totalAmount: parseFloat(cart.totalAmount),
        discountAmount: parseFloat(cart.discountAmount),
        taxAmount: parseFloat(cart.taxAmount),
        finalAmount: parseFloat(cart.finalAmount),
        couponCode: cart.couponCode,
        expiresAt: cart.expiresAt
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

// @route   POST /api/financial/cart/add
// @desc    Add course to cart
// @access  Private
router.post('/add', [
  auth,
  getOrCreateCart,
  body('courseId').isUUID().withMessage('Valid course ID is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('type').isIn(['online', 'classroom', 'hybrid']).withMessage('Valid course type is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, price, type, quantity = 1 } = req.body;
    const cart = req.cart;
    
    // Check cart item limit
    const maxItems = 10; // This should come from plugin settings
    if (cart.items.length >= maxItems) {
      return res.status(400).json({ 
        error: 'Cart is full. Maximum 10 items allowed.' 
      });
    }
    
    // Check if course is already in cart
    const existingItem = cart.items.find(item => item.courseId === courseId);
    if (existingItem) {
      return res.status(400).json({ 
        error: 'Course is already in cart' 
      });
    }
    
    // Add item to cart
    cart.addItem(courseId, price, type, quantity);
    await cart.save();
    
    res.json({
      message: 'Course added to cart successfully',
      cart: {
        id: cart.id,
        items: cart.items,
        totalAmount: parseFloat(cart.totalAmount),
        discountAmount: parseFloat(cart.discountAmount),
        taxAmount: parseFloat(cart.taxAmount),
        finalAmount: parseFloat(cart.finalAmount),
        couponCode: cart.couponCode
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add course to cart' });
  }
});

// @route   DELETE /api/financial/cart/remove/:courseId
// @desc    Remove course from cart
// @access  Private
router.delete('/remove/:courseId', [
  auth,
  getOrCreateCart,
  body('courseId').isUUID().withMessage('Valid course ID is required')
], async (req, res) => {
  try {
    const { courseId } = req.params;
    const cart = req.cart;
    
    // Remove item from cart
    cart.removeItem(courseId);
    await cart.save();
    
    res.json({
      message: 'Course removed from cart successfully',
      cart: {
        id: cart.id,
        items: cart.items,
        totalAmount: parseFloat(cart.totalAmount),
        discountAmount: parseFloat(cart.discountAmount),
        taxAmount: parseFloat(cart.taxAmount),
        finalAmount: parseFloat(cart.finalAmount),
        couponCode: cart.couponCode
      }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove course from cart' });
  }
});

// @route   PUT /api/financial/cart/update
// @desc    Update cart item quantity
// @access  Private
router.put('/update', [
  auth,
  getOrCreateCart,
  body('courseId').isUUID().withMessage('Valid course ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, quantity } = req.body;
    const cart = req.cart;
    
    // Update item quantity
    cart.updateItemQuantity(courseId, quantity);
    await cart.save();
    
    res.json({
      message: 'Cart updated successfully',
      cart: {
        id: cart.id,
        items: cart.items,
        totalAmount: parseFloat(cart.totalAmount),
        discountAmount: parseFloat(cart.discountAmount),
        taxAmount: parseFloat(cart.taxAmount),
        finalAmount: parseFloat(cart.finalAmount),
        couponCode: cart.couponCode
      }
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// @route   POST /api/financial/cart/apply-coupon
// @desc    Apply coupon to cart
// @access  Private
router.post('/apply-coupon', [
  auth,
  getOrCreateCart,
  body('couponCode').isLength({ min: 3, max: 50 }).withMessage('Valid coupon code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { couponCode } = req.body;
    const cart = req.cart;
    
    // Find coupon
    const coupon = await Coupon.findByCode(couponCode);
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
    if (!coupon.canApplyToOrder(cart.totalAmount)) {
      return res.status(400).json({ 
        error: `Minimum order amount of $${coupon.minOrderAmount} required` 
      });
    }
    
    // Apply coupon to cart
    cart.applyCoupon(coupon);
    await cart.save();
    
    res.json({
      message: 'Coupon applied successfully',
      cart: {
        id: cart.id,
        items: cart.items,
        totalAmount: parseFloat(cart.totalAmount),
        discountAmount: parseFloat(cart.discountAmount),
        taxAmount: parseFloat(cart.taxAmount),
        finalAmount: parseFloat(cart.finalAmount),
        couponCode: cart.couponCode
      },
      coupon: {
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: parseFloat(coupon.value)
      }
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ error: 'Failed to apply coupon' });
  }
});

// @route   DELETE /api/financial/cart/remove-coupon
// @desc    Remove coupon from cart
// @access  Private
router.delete('/remove-coupon', [
  auth,
  getOrCreateCart
], async (req, res) => {
  try {
    const cart = req.cart;
    
    // Remove coupon from cart
    cart.couponCode = null;
    cart.discountAmount = 0;
    cart.calculateTotals();
    await cart.save();
    
    res.json({
      message: 'Coupon removed successfully',
      cart: {
        id: cart.id,
        items: cart.items,
        totalAmount: parseFloat(cart.totalAmount),
        discountAmount: parseFloat(cart.discountAmount),
        taxAmount: parseFloat(cart.taxAmount),
        finalAmount: parseFloat(cart.finalAmount),
        couponCode: cart.couponCode
      }
    });
  } catch (error) {
    console.error('Remove coupon error:', error);
    res.status(500).json({ error: 'Failed to remove coupon' });
  }
});

// @route   DELETE /api/financial/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete('/clear', [
  auth,
  getOrCreateCart
], async (req, res) => {
  try {
    const cart = req.cart;
    
    // Clear cart
    cart.clear();
    await cart.save();
    
    res.json({
      message: 'Cart cleared successfully',
      cart: {
        id: cart.id,
        items: cart.items,
        totalAmount: parseFloat(cart.totalAmount),
        discountAmount: parseFloat(cart.discountAmount),
        taxAmount: parseFloat(cart.taxAmount),
        finalAmount: parseFloat(cart.finalAmount),
        couponCode: cart.couponCode
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;
