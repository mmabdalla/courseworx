/**
 * Order Management Routes for Financial Plugin
 * 
 * This file handles order management including order history,
 * order details, refunds, and invoice generation.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, requireSuperAdmin } = require('../../../middleware/auth');
const { Order, OrderItem, Coupon } = require('../models');
// Initialize Stripe only if API key is available
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
} catch (error) {
  console.warn('Stripe not configured, payment processing will be simulated');
}

const router = express.Router();

// @route   GET /api/financial/orders
// @desc    Get user's order history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 20, status } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = { userId };
    
    if (status) {
      whereClause.status = status;
    }
    
    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'items'
        },
        {
          model: Coupon,
          as: 'coupon',
          attributes: ['code', 'name', 'type', 'value']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        discountAmount: parseFloat(order.discountAmount),
        taxAmount: parseFloat(order.taxAmount),
        finalAmount: parseFloat(order.finalAmount),
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        items: order.items,
        coupon: order.coupon
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// @route   GET /api/financial/orders/:id
// @desc    Get order details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    const order = await Order.findByPk(id, {
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: 'items'
        },
        {
          model: Coupon,
          as: 'coupon',
          attributes: ['code', 'name', 'type', 'value']
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }
    
    res.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        discountAmount: parseFloat(order.discountAmount),
        taxAmount: parseFloat(order.taxAmount),
        finalAmount: parseFloat(order.finalAmount),
        paymentMethod: order.paymentMethod,
        gatewayTransactionId: order.gatewayTransactionId,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        refundedAt: order.refundedAt,
        refundAmount: parseFloat(order.refundAmount || 0),
        items: order.items,
        coupon: order.coupon,
        metadata: order.metadata
      }
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ error: 'Failed to get order details' });
  }
});

// @route   POST /api/financial/orders/:id/refund
// @desc    Request refund for order
// @access  Private
router.post('/:id/refund', [
  auth,
  body('amount').optional().isFloat({ min: 0 }).withMessage('Refund amount must be positive'),
  body('reason').optional().isLength({ min: 5, max: 500 }).withMessage('Reason must be between 5 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { amount, reason } = req.body;
    const { userId } = req.user;
    
    const order = await Order.findByPk(id, {
      where: { userId }
    });
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }
    
    if (order.status !== 'paid') {
      return res.status(400).json({ 
        error: 'Only paid orders can be refunded' 
      });
    }
    
    if (order.refundedAt) {
      return res.status(400).json({ 
        error: 'Order has already been refunded' 
      });
    }
    
    const refundAmount = amount || order.finalAmount;
    
    if (refundAmount > order.finalAmount) {
      return res.status(400).json({ 
        error: 'Refund amount cannot exceed order total' 
      });
    }
    
    // Process refund (Stripe or simulated)
    let refund;
    if (stripe) {
      refund = await stripe.refunds.create({
        payment_intent: order.gatewayTransactionId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          reason: reason || 'No reason provided'
        }
      });
    } else {
      // Simulate refund when Stripe is not configured
      refund = {
        id: `re_simulated_${Date.now()}`,
        amount: Math.round(refundAmount * 100),
        status: 'succeeded'
      };
    }
    
    // Update order status
    await order.markAsRefunded(refundAmount);
    
    res.json({
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: refund.status,
        reason: reason || 'No reason provided'
      },
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        refundAmount: parseFloat(order.refundAmount)
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// @route   GET /api/financial/orders/:id/invoice
// @desc    Download order invoice
// @access  Private
router.get('/:id/invoice', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    const order = await Order.findByPk(id, {
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: 'items'
        },
        {
          model: Coupon,
          as: 'coupon',
          attributes: ['code', 'name', 'type', 'value']
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }
    
    // Generate invoice data
    const invoiceData = {
      invoiceNumber: `INV-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      date: order.createdAt,
      status: order.status,
      customer: {
        // This would come from user data
        name: 'Customer Name', // Placeholder
        email: 'customer@example.com' // Placeholder
      },
      items: order.items.map(item => ({
        courseId: item.courseId,
        courseType: item.courseType,
        quantity: item.quantity,
        originalPrice: parseFloat(item.originalPrice),
        finalPrice: parseFloat(item.finalPrice),
        discount: parseFloat(item.discountAmount || 0)
      })),
      totals: {
        subtotal: parseFloat(order.totalAmount),
        discount: parseFloat(order.discountAmount),
        tax: parseFloat(order.taxAmount),
        total: parseFloat(order.finalAmount)
      },
      payment: {
        method: order.paymentMethod,
        transactionId: order.gatewayTransactionId,
        paidAt: order.paidAt
      }
    };
    
    // For now, return JSON. In production, you'd generate a PDF
    res.json({
      invoice: invoiceData
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// @route   GET /api/financial/orders/admin/all
// @desc    Get all orders (admin only)
// @access  Private (Super Admin)
router.get('/admin/all', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId, startDate, endDate } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (userId) whereClause.userId = userId;
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[sequelize.Sequelize.Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[sequelize.Sequelize.Op.lte] = new Date(endDate);
    }
    
    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: OrderItem,
          as: 'items'
        },
        {
          model: Coupon,
          as: 'coupon',
          attributes: ['code', 'name', 'type', 'value']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        discountAmount: parseFloat(order.discountAmount),
        taxAmount: parseFloat(order.taxAmount),
        finalAmount: parseFloat(order.finalAmount),
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        items: order.items,
        coupon: order.coupon
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

module.exports = router;
