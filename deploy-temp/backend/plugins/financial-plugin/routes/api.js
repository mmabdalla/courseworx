/**
 * Financial Plugin API Routes
 * 
 * This module provides API endpoints for financial management
 * including payments, revenue tracking, and payouts.
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth');
const pluginRegistry = require('../../../core/plugin-registry');

// Import currency models
const { Currency, ExchangeRate, ExchangeRateHistory, CourseCurrency } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/financial/dashboard
 * Get financial dashboard data (Super Admin only)
 */
router.get('/dashboard', /* auth, */ async (req, res) => {
  try {
    // Check if user is Super Admin
    // if (req.user.role !== 'sa') {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Super Admin privileges required.'
    //   });
    // }
    
    // Simulate financial dashboard data
    const dashboardData = {
      totalRevenue: 125000,
      monthlyRevenue: 15000,
      totalPayments: 1250,
      pendingPayments: 45,
      totalPayouts: 980,
      pendingPayouts: 23,
      platformFees: 12500,
      activeSubscriptions: 850,
      revenueGrowth: 12.5,
      topCourses: [
        { name: 'Advanced JavaScript', revenue: 25000 },
        { name: 'React Masterclass', revenue: 22000 },
        { name: 'Node.js Backend', revenue: 18000 }
      ],
      recentTransactions: [
        { id: 'txn_001', amount: 99, status: 'completed', date: '2024-12-19' },
        { id: 'txn_002', amount: 149, status: 'pending', date: '2024-12-18' },
        { id: 'txn_003', amount: 79, status: 'completed', date: '2024-12-17' }
      ]
    };
    
    res.json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error('Error getting financial dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get financial dashboard'
    });
  }
});

/**
 * GET /api/financial/payments
 * Get list of payments (Super Admin only)
 */
router.get('/payments', auth, async (req, res) => {
  try {
    // Check if user is Super Admin
    if (req.user.role !== 'sa') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin privileges required.'
      });
    }
    
    const { page = 1, limit = 20, status } = req.query;
    
    // Simulate payments data
    const payments = Array.from({ length: 50 }, (_, i) => ({
      id: `pay_${i + 1}`,
      enrollmentId: `enroll_${i + 1}`,
      userId: `user_${i + 1}`,
      courseId: `course_${i + 1}`,
      amount: Math.floor(Math.random() * 200) + 50,
      currency: 'USD',
      status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
      paymentMethod: ['credit_card', 'paypal', 'stripe'][Math.floor(Math.random() * 3)],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    }));
    
    // Filter by status if provided
    let filteredPayments = payments;
    if (status) {
      filteredPayments = payments.filter(payment => payment.status === status);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPayments = filteredPayments.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        payments: paginatedPayments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredPayments.length,
          pages: Math.ceil(filteredPayments.length / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payments'
    });
  }
});

/**
 * GET /api/financial/payments/:id
 * Get specific payment details
 */
router.get('/payments/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check permissions
    if (req.user.role !== 'sa' && !req.user.permissions?.includes('read:payments')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Payment read permission required.'
      });
    }
    
    // Simulate payment details
    const payment = {
      id,
      enrollmentId: `enroll_${id.split('_')[1]}`,
      userId: `user_${id.split('_')[1]}`,
      courseId: `course_${id.split('_')[1]}`,
      amount: 99,
      currency: 'USD',
      status: 'completed',
      paymentMethod: 'credit_card',
      transactionId: `txn_${id}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        courseName: 'Advanced JavaScript Course',
        userName: 'John Doe',
        userEmail: 'john@example.com'
      }
    };
    
    res.json({
      success: true,
      data: payment
    });
    
  } catch (error) {
    console.error('Error getting payment details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payment details'
    });
  }
});

/**
 * GET /api/financial/payouts
 * Get list of payouts (Trainers and Super Admin)
 */
router.get('/payouts', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    // Check permissions
    if (req.user.role !== 'sa' && req.user.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Trainer or Super Admin privileges required.'
      });
    }
    
    // Simulate payouts data
    const payouts = Array.from({ length: 30 }, (_, i) => ({
      id: `payout_${i + 1}`,
      trainerId: `trainer_${i + 1}`,
      amount: Math.floor(Math.random() * 500) + 100,
      currency: 'USD',
      status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
      method: ['bank_transfer', 'paypal', 'stripe'][Math.floor(Math.random() * 3)],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      processedAt: new Date(),
      metadata: {
        trainerName: `Trainer ${i + 1}`,
        courseCount: Math.floor(Math.random() * 10) + 1,
        enrollmentCount: Math.floor(Math.random() * 50) + 10
      }
    }));
    
    // Filter by user role
    let filteredPayouts = payouts;
    if (req.user.role === 'trainer') {
      // Trainers can only see their own payouts
      filteredPayouts = payouts.filter(payout => payout.trainerId === `trainer_${req.user.id}`);
    }
    
    // Filter by status if provided
    if (status) {
      filteredPayouts = filteredPayouts.filter(payout => payout.status === status);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPayouts = filteredPayouts.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        payouts: paginatedPayouts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredPayouts.length,
          pages: Math.ceil(filteredPayouts.length / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting payouts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get payouts'
    });
  }
});

/**
 * GET /api/financial/revenue
 * Get revenue reports (Super Admin only)
 */
router.get('/revenue', auth, async (req, res) => {
  try {
    // Check if user is Super Admin
    if (req.user.role !== 'sa') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin privileges required.'
      });
    }
    
    const { period = 'monthly', startDate, endDate } = req.query;
    
    // Simulate revenue data
    const revenueData = {
      totalRevenue: 125000,
      periodRevenue: 15000,
      growthRate: 12.5,
      currency: 'USD',
      breakdown: {
        byCourse: [
          { course: 'Advanced JavaScript', revenue: 25000, percentage: 20 },
          { course: 'React Masterclass', revenue: 22000, percentage: 17.6 },
          { course: 'Node.js Backend', revenue: 18000, percentage: 14.4 },
          { course: 'Python Data Science', revenue: 15000, percentage: 12 },
          { course: 'UI/UX Design', revenue: 12000, percentage: 9.6 }
        ],
        byMonth: [
          { month: 'January', revenue: 12000 },
          { month: 'February', revenue: 13500 },
          { month: 'March', revenue: 14200 },
          { month: 'April', revenue: 13800 },
          { month: 'May', revenue: 15600 },
          { month: 'June', revenue: 16800 },
          { month: 'July', revenue: 17200 },
          { month: 'August', revenue: 18500 },
          { month: 'September', revenue: 19200 },
          { month: 'October', revenue: 20100 },
          { month: 'November', revenue: 21800 },
          { month: 'December', revenue: 22500 }
        ]
      },
      metrics: {
        averageOrderValue: 125,
        conversionRate: 3.2,
        customerLifetimeValue: 450,
        repeatPurchaseRate: 25.5
      }
    };
    
    res.json({
      success: true,
      data: revenueData
    });
    
  } catch (error) {
    console.error('Error getting revenue reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get revenue reports'
    });
  }
});

/**
 * GET /api/financial/earnings
 * Get trainer earnings (Trainers only)
 */
router.get('/earnings', auth, async (req, res) => {
  try {
    // Check if user is Trainer
    if (req.user.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Trainer privileges required.'
      });
    }
    
    // Simulate trainer earnings data
    const earningsData = {
      totalEarnings: 8500,
      monthlyEarnings: 1200,
      pendingEarnings: 350,
      currency: 'USD',
      courses: [
        { name: 'Advanced JavaScript', earnings: 2500, enrollments: 25 },
        { name: 'React Masterclass', earnings: 2200, enrollments: 22 },
        { name: 'Node.js Backend', earnings: 1800, enrollments: 18 }
      ],
      monthlyBreakdown: [
        { month: 'January', earnings: 800 },
        { month: 'February', earnings: 950 },
        { month: 'March', earnings: 1100 },
        { month: 'April', earnings: 1050 },
        { month: 'May', earnings: 1200 },
        { month: 'June', earnings: 1350 },
        { month: 'July', earnings: 1400 },
        { month: 'August', earnings: 1550 },
        { month: 'September', earnings: 1600 },
        { month: 'October', earnings: 1700 },
        { month: 'November', earnings: 1850 },
        { month: 'December', earnings: 2000 }
      ],
      metrics: {
        averagePerCourse: 2167,
        totalEnrollments: 65,
        completionRate: 85.5,
        rating: 4.8
      }
    };
    
    res.json({
      success: true,
      data: earningsData
    });
    
  } catch (error) {
    console.error('Error getting trainer earnings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get earnings'
    });
  }
});

/**
 * POST /api/financial/settings
 * Update plugin settings (Super Admin only)
 */
router.post('/settings', auth, async (req, res) => {
  try {
    // Check if user is Super Admin
    if (req.user.role !== 'sa') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin privileges required.'
      });
    }
    
    const { settings } = req.body;
    
    // Update plugin settings
    pluginRegistry.setPluginSettings('financial-plugin', settings);
    
    res.json({
      success: true,
      message: 'Financial plugin settings updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating financial settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
});

/**
 * GET /api/financial/settings
 * Get plugin settings (Super Admin only)
 */
router.get('/settings', auth, async (req, res) => {
  try {
    // Check if user is Super Admin
    if (req.user.role !== 'sa') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin privileges required.'
      });
    }
    
    const settings = pluginRegistry.getPluginSettings('financial-plugin');
    
    res.json({
      success: true,
      data: settings
    });
    
  } catch (error) {
    console.error('Error getting financial settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get settings'
    });
  }
});

/**
 * GET /api/financial/currencies
 * Get all active currencies
 */
router.get('/currencies', async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    
    const whereClause = includeInactive === 'true' ? {} : { isActive: true };
    
    const currencies = await Currency.findAll({
      where: whereClause,
      order: [['code', 'ASC']]
    });
    
    res.json({
      success: true,
      data: currencies
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currencies',
      error: error.message
    });
  }
});

/**
 * GET /api/financial/exchange-rates
 * Get exchange rates with optional filtering
 */
router.get('/exchange-rates', async (req, res) => {
  try {
    const { 
      fromCurrency, 
      toCurrency, 
      active = true,
      page = 1,
      limit = 50
    } = req.query;
    
    const whereClause = {};
    
    if (active === 'true') {
      whereClause.isActive = true;
    }
    
    if (fromCurrency) {
      whereClause.fromCurrencyId = fromCurrency;
    }
    
    if (toCurrency) {
      whereClause.toCurrencyId = toCurrency;
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: exchangeRates } = await ExchangeRate.findAndCountAll({
      where: whereClause,
      include: [
        { model: Currency, as: 'fromCurrency' },
        { model: Currency, as: 'toCurrency' }
      ],
      order: [['effectiveDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: exchangeRates,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exchange rates',
      error: error.message
    });
  }
});

/**
 * GET /api/financial/convert
 * Convert amount between currencies
 */
router.get('/convert', async (req, res) => {
  try {
    const { amount, from, to } = req.query;
    
    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Amount, from currency, and to currency are required'
      });
    }
    
    const fromCurrency = await Currency.findOne({ where: { code: from.toUpperCase() } });
    const toCurrency = await Currency.findOne({ where: { code: to.toUpperCase() } });
    
    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency codes'
      });
    }
    
    // Find exchange rate
    const exchangeRate = await ExchangeRate.findOne({
      where: {
        fromCurrencyId: fromCurrency.id,
        toCurrencyId: toCurrency.id,
        isActive: true
      }
    });
    
    if (!exchangeRate) {
      return res.status(404).json({
        success: false,
        message: 'Exchange rate not found'
      });
    }
    
    const convertedAmount = parseFloat(amount) * parseFloat(exchangeRate.rate);
    
    res.json({
      success: true,
      data: {
        originalAmount: parseFloat(amount),
        convertedAmount: convertedAmount,
        fromCurrency: fromCurrency.code,
        toCurrency: toCurrency.code,
        exchangeRate: parseFloat(exchangeRate.rate),
        effectiveDate: exchangeRate.effectiveDate
      }
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert currency',
      error: error.message
    });
  }
});

module.exports = router;
