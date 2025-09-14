/**
 * Checkout Routes for Financial Plugin
 * 
 * This file handles the checkout process including payment intent creation,
 * payment confirmation, and order processing.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../../../middleware/auth');
const { Cart, Order, OrderItem, Coupon } = require('../models');
// Initialize Stripe only if API key is available
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
} catch (error) {
  console.warn('Stripe not configured, payment processing will be simulated');
}
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Middleware to get cart
const getCart = async (req, res, next) => {
  try {
    const { userId } = req.user || {};
    const sessionId = req.headers['x-session-id'] || req.sessionID;
    
    const cart = await Cart.findByUserOrSession(userId, sessionId);
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ 
        error: 'Cart is empty' 
      });
    }
    
    if (cart.isExpired()) {
      await cart.destroy();
      return res.status(400).json({ 
        error: 'Cart has expired' 
      });
    }
    
    req.cart = cart;
    next();
  } catch (error) {
    console.error('Cart middleware error:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
};

// @route   POST /api/financial/checkout/create-intent
// @desc    Create payment intent for checkout
// @access  Private
router.post('/create-intent', [
  auth,
  getCart,
  body('paymentMethodId').optional().isString().withMessage('Valid payment method ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentMethodId } = req.body;
    const cart = req.cart;
    const { userId } = req.user;
    
    // Create order
    const order = await Order.create({
      userId,
      orderNumber: Order.generateOrderNumber(),
      status: 'pending',
      totalAmount: cart.totalAmount,
      discountAmount: cart.discountAmount,
      taxAmount: cart.taxAmount,
      finalAmount: cart.finalAmount,
      couponId: cart.couponCode ? await Coupon.findByCode(cart.couponCode).then(c => c?.id) : null,
      metadata: {
        cartId: cart.id,
        items: cart.items
      }
    });
    
    // Create order items
    for (const item of cart.items) {
      await OrderItem.create({
        orderId: order.id,
        courseId: item.courseId,
        courseType: item.type,
        enrollmentType: 'one-time',
        originalPrice: item.price,
        finalPrice: item.price,
        quantity: item.quantity,
        metadata: {
          addedAt: item.addedAt
        }
      });
    }
    
    // Create payment intent (Stripe or simulated)
    let paymentIntent;
    if (stripe) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(cart.finalAmount * 100), // Convert to cents
        currency: 'usd', // This should come from plugin settings
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: userId
        },
        payment_method: paymentMethodId,
        confirmation_method: 'manual',
        confirm: !!paymentMethodId
      });
    } else {
      // Simulate payment intent when Stripe is not configured
      paymentIntent = {
        id: `pi_simulated_${Date.now()}`,
        client_secret: `pi_simulated_${Date.now()}_secret`,
        status: 'requires_confirmation'
      };
    }
    
    res.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        finalAmount: parseFloat(order.finalAmount)
      },
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      }
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// @route   POST /api/financial/checkout/confirm
// @desc    Confirm payment and complete order
// @access  Private
router.post('/confirm', [
  auth,
  body('paymentIntentId').isString().withMessage('Payment intent ID is required'),
  body('orderId').isUUID().withMessage('Order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentIntentId, orderId } = req.body;
    const { userId } = req.user;
    
    // Get order
    const order = await Order.findByPk(orderId, {
      where: { userId }
    });
    
    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found' 
      });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Order is not pending' 
      });
    }
    
    // Confirm payment intent (Stripe or simulated)
    let paymentIntent;
    if (stripe) {
      paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    } else {
      // Simulate payment confirmation when Stripe is not configured
      paymentIntent = {
        id: paymentIntentId,
        status: 'succeeded'
      };
    }
    
    if (paymentIntent.status === 'succeeded') {
      // Mark order as paid
      await order.markAsPaid(paymentIntent.id, 'card');
      
      // Get order items
      const orderItems = await OrderItem.findByOrder(orderId);
      
      // Mark items as enrolled (this will trigger course enrollment)
      for (const item of orderItems) {
        await item.markAsEnrolled();
      }
      
      // Clear cart
      const cart = await Cart.findByUserOrSession(userId, req.headers['x-session-id']);
      if (cart) {
        await cart.destroy();
      }
      
      res.json({
        success: true,
        message: 'Payment successful',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: parseFloat(order.totalAmount),
          finalAmount: parseFloat(order.finalAmount),
          paidAt: order.paidAt
        }
      });
    } else {
      // Payment failed
      await order.markAsFailed();
      
      res.status(400).json({
        success: false,
        error: 'Payment failed',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status
        }
      });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// @route   POST /api/financial/checkout/webhook
// @desc    Handle Stripe webhooks
// @access  Public (but secured with webhook signature)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    if (stripe) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Simulate webhook event when Stripe is not configured
      event = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_simulated_webhook',
            status: 'succeeded'
          }
        }
      };
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Webhook handlers
async function handlePaymentSucceeded(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findByPk(orderId);
    
    if (order && order.status === 'pending') {
      await order.markAsPaid(paymentIntent.id, 'card');
      
      // Get order items and mark as enrolled
      const orderItems = await OrderItem.findByOrder(orderId);
      for (const item of orderItems) {
        await item.markAsEnrolled();
      }
      
      console.log(`Order ${order.orderNumber} payment confirmed via webhook`);
    }
  } catch (error) {
    console.error('Handle payment succeeded error:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findByPk(orderId);
    
    if (order && order.status === 'pending') {
      await order.markAsFailed();
      console.log(`Order ${order.orderNumber} payment failed via webhook`);
    }
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
}

// @route   GET /api/financial/checkout/session/:orderId
// @desc    Get checkout session details
// @access  Private
router.get('/session/:orderId', [
  auth
], async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.user;
    
    const order = await Order.findByPk(orderId, {
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: 'items'
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
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        items: order.items
      }
    });
  } catch (error) {
    console.error('Get checkout session error:', error);
    res.status(500).json({ error: 'Failed to get checkout session' });
  }
});

module.exports = router;
