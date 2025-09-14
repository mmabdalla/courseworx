/**
 * Stripe Integration Utilities for Financial Plugin
 * 
 * This file contains utility functions for Stripe payment processing
 * including payment intent creation, webhook handling, and refunds.
 */

const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

/**
 * Create a payment intent for an order
 * @param {Object} order - Order object
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Stripe payment intent
 */
async function createPaymentIntent(order, options = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.finalAmount * 100), // Convert to cents
      currency: options.currency || 'usd',
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId
      },
      payment_method: options.paymentMethodId,
      confirmation_method: 'manual',
      confirm: !!options.paymentMethodId,
      ...options
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
}

/**
 * Confirm a payment intent
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Object>} Confirmed payment intent
 */
async function confirmPaymentIntent(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent confirmation error:', error);
    throw new Error(`Failed to confirm payment intent: ${error.message}`);
  }
}

/**
 * Retrieve a payment intent
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Object>} Payment intent object
 */
async function getPaymentIntent(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent retrieval error:', error);
    throw new Error(`Failed to retrieve payment intent: ${error.message}`);
  }
}

/**
 * Create a refund for a payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @param {Object} options - Refund options
 * @returns {Promise<Object>} Stripe refund object
 */
async function createRefund(paymentIntentId, options = {}) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: options.amount ? Math.round(options.amount * 100) : undefined,
      reason: options.reason || 'requested_by_customer',
      metadata: options.metadata || {}
    });

    return refund;
  } catch (error) {
    console.error('Stripe refund creation error:', error);
    throw new Error(`Failed to create refund: ${error.message}`);
  }
}

/**
 * Verify webhook signature
 * @param {Buffer} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @param {string} webhookSecret - Webhook secret
 * @returns {Object} Webhook event object
 */
function verifyWebhookSignature(payload, signature, webhookSecret) {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    console.error('Stripe webhook signature verification error:', error);
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

/**
 * Create a customer in Stripe
 * @param {Object} user - User object
 * @returns {Promise<Object>} Stripe customer object
 */
async function createCustomer(user) {
  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: {
        userId: user.id,
        role: user.role
      }
    });

    return customer;
  } catch (error) {
    console.error('Stripe customer creation error:', error);
    throw new Error(`Failed to create customer: ${error.message}`);
  }
}

/**
 * Retrieve a customer from Stripe
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object>} Stripe customer object
 */
async function getCustomer(customerId) {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer;
  } catch (error) {
    console.error('Stripe customer retrieval error:', error);
    throw new Error(`Failed to retrieve customer: ${error.message}`);
  }
}

/**
 * Create a payment method
 * @param {Object} options - Payment method options
 * @returns {Promise<Object>} Stripe payment method object
 */
async function createPaymentMethod(options) {
  try {
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: options.card,
      billing_details: options.billingDetails || {}
    });

    return paymentMethod;
  } catch (error) {
    console.error('Stripe payment method creation error:', error);
    throw new Error(`Failed to create payment method: ${error.message}`);
  }
}

/**
 * Attach a payment method to a customer
 * @param {string} paymentMethodId - Stripe payment method ID
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object>} Attached payment method
 */
async function attachPaymentMethod(paymentMethodId, customerId) {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });

    return paymentMethod;
  } catch (error) {
    console.error('Stripe payment method attachment error:', error);
    throw new Error(`Failed to attach payment method: ${error.message}`);
  }
}

/**
 * List customer payment methods
 * @param {string} customerId - Stripe customer ID
 * @param {Object} options - List options
 * @returns {Promise<Object>} Payment methods list
 */
async function listPaymentMethods(customerId, options = {}) {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
      ...options
    });

    return paymentMethods;
  } catch (error) {
    console.error('Stripe payment methods list error:', error);
    throw new Error(`Failed to list payment methods: ${error.message}`);
  }
}

/**
 * Create a setup intent for saving payment methods
 * @param {string} customerId - Stripe customer ID
 * @param {Object} options - Setup intent options
 * @returns {Promise<Object>} Stripe setup intent
 */
async function createSetupIntent(customerId, options = {}) {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      ...options
    });

    return setupIntent;
  } catch (error) {
    console.error('Stripe setup intent creation error:', error);
    throw new Error(`Failed to create setup intent: ${error.message}`);
  }
}

/**
 * Calculate platform and gateway fees
 * @param {number} amount - Order amount
 * @param {Object} options - Fee calculation options
 * @returns {Object} Fee breakdown
 */
function calculateFees(amount, options = {}) {
  const platformFeePercentage = options.platformFeePercentage || 10;
  const gatewayFeePercentage = options.gatewayFeePercentage || 2.9;
  const gatewayFeeFixed = options.gatewayFeeFixed || 0.30;

  const platformFee = (amount * platformFeePercentage) / 100;
  const gatewayFee = (amount * gatewayFeePercentage) / 100 + gatewayFeeFixed;
  const netAmount = amount - platformFee - gatewayFee;

  return {
    totalAmount: amount,
    platformFee: Math.round(platformFee * 100) / 100,
    gatewayFee: Math.round(gatewayFee * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100
  };
}

/**
 * Format amount for Stripe (convert to cents)
 * @param {number} amount - Amount in dollars
 * @returns {number} Amount in cents
 */
function formatAmountForStripe(amount) {
  return Math.round(amount * 100);
}

/**
 * Format amount from Stripe (convert from cents)
 * @param {number} amount - Amount in cents
 * @returns {number} Amount in dollars
 */
function formatAmountFromStripe(amount) {
  return amount / 100;
}

module.exports = {
  createPaymentIntent,
  confirmPaymentIntent,
  getPaymentIntent,
  createRefund,
  verifyWebhookSignature,
  createCustomer,
  getCustomer,
  createPaymentMethod,
  attachPaymentMethod,
  listPaymentMethods,
  createSetupIntent,
  calculateFees,
  formatAmountForStripe,
  formatAmountFromStripe
};
