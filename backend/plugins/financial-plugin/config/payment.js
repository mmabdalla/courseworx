/**
 * Payment Configuration for Financial Plugin
 * 
 * This file contains all payment-related configuration settings
 * that can be customized through the plugin settings interface.
 */

module.exports = {
  // Stripe Configuration
  stripe: {
    // These will be loaded from plugin settings
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    currency: process.env.STRIPE_CURRENCY || 'usd',
    apiVersion: '2023-10-16'
  },
  
  // Revenue Split Configuration
  revenueSplit: {
    defaultTrainerShare: 0.70, // 70% to trainer
    platformShare: 0.30, // 30% to platform
    configurablePerTrainer: true,
    minimumPayoutAmount: 50.00 // Minimum payout amount in USD
  },
  
  // Tax Configuration
  tax: {
    enabled: true,
    manualRates: true, // Admin configures rates manually
    defaultRate: 0.00,
    ratesByRegion: {
      // Will be configured through admin interface
      'US': 0.00,
      'EU': 0.00,
      'CA': 0.00
    }
  },
  
  // Cart Configuration
  cart: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    maxItems: 10,
    allowMultipleQuantities: false,
    persistInDatabase: true
  },
  
  // Order Configuration
  order: {
    generateInvoiceNumbers: true,
    invoiceNumberPrefix: 'INV-',
    orderNumberPrefix: 'ORD-',
    autoEnrollOnPayment: true
  },
  
  // Payment Methods
  paymentMethods: {
    card: true,
    bankTransfer: false,
    paypal: false,
    applePay: false,
    googlePay: false
  },
  
  // Webhook Configuration
  webhooks: {
    enabled: true,
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
    timeout: 30000 // 30 seconds
  }
};
