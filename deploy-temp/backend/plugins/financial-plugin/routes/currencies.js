/**
 * Currency Management Routes
 * 
 * This module provides API endpoints for managing currencies,
 * exchange rates, and course currency configurations.
 */

const express = require('express');
const router = express.Router();
const { Currency, ExchangeRate, ExchangeRateHistory, CourseCurrency, Course } = require('../models');
const { Op } = require('sequelize');

// Middleware for authentication and authorization
const { auth } = require('../../../middleware/auth');

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
 * GET /api/financial/currencies/:id
 * Get a specific currency by ID
 */
router.get('/currencies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const currency = await Currency.findByPk(id);
    
    if (!currency) {
      return res.status(404).json({
        success: false,
        message: 'Currency not found'
      });
    }
    
    res.json({
      success: true,
      data: currency
    });
  } catch (error) {
    console.error('Error fetching currency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currency',
      error: error.message
    });
  }
});

/**
 * POST /api/financial/currencies
 * Create a new currency (Admin only)
 */
router.post('/currencies', auth, async (req, res) => {
  try {
    // Check if user has admin permissions
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    const currencyData = req.body;
    
    // Validate required fields
    if (!currencyData.code || !currencyData.name || !currencyData.symbol) {
      return res.status(400).json({
        success: false,
        message: 'Code, name, and symbol are required'
      });
    }
    
    // Check if currency code already exists
    const existingCurrency = await Currency.findOne({
      where: { code: currencyData.code.toUpperCase() }
    });
    
    if (existingCurrency) {
      return res.status(409).json({
        success: false,
        message: 'Currency code already exists'
      });
    }
    
    // Ensure code is uppercase
    currencyData.code = currencyData.code.toUpperCase();
    
    const currency = await Currency.create(currencyData);
    
    res.status(201).json({
      success: true,
      data: currency,
      message: 'Currency created successfully'
    });
  } catch (error) {
    console.error('Error creating currency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create currency',
      error: error.message
    });
  }
});

/**
 * PUT /api/financial/currencies/:id
 * Update a currency (Admin only)
 */
router.put('/currencies/:id', auth, async (req, res) => {
  try {
    // Check if user has admin permissions
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    const { id } = req.params;
    const updateData = req.body;
    
    const currency = await Currency.findByPk(id);
    
    if (!currency) {
      return res.status(404).json({
        success: false,
        message: 'Currency not found'
      });
    }
    
    // Ensure code is uppercase if provided
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }
    
    await currency.update(updateData);
    
    res.json({
      success: true,
      data: currency,
      message: 'Currency updated successfully'
    });
  } catch (error) {
    console.error('Error updating currency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update currency',
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
 * POST /api/financial/exchange-rates
 * Create or update exchange rate (Admin only)
 */
router.post('/exchange-rates', auth, async (req, res) => {
  try {
    // Check if user has admin permissions
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    const { fromCurrencyId, toCurrencyId, rate, effectiveDate, notes } = req.body;
    
    // Validate required fields
    if (!fromCurrencyId || !toCurrencyId || !rate) {
      return res.status(400).json({
        success: false,
        message: 'From currency, to currency, and rate are required'
      });
    }
    
    // Check if currencies exist
    const [fromCurrency, toCurrency] = await Promise.all([
      Currency.findByPk(fromCurrencyId),
      Currency.findByPk(toCurrencyId)
    ]);
    
    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Invalid currency IDs'
      });
    }
    
    // Check for existing exchange rate in either direction (USD->EGP or EGP->USD)
    const existingRate = await ExchangeRate.findOne({
      where: {
        [Op.or]: [
          { fromCurrencyId, toCurrencyId },
          { fromCurrencyId: toCurrencyId, toCurrencyId: fromCurrencyId }
        ],
        isActive: true
      }
    });
    
    let exchangeRate;
    let inverseExchangeRate;
    
    if (existingRate) {
      // Check if this is the same direction or inverse
      const isSameDirection = existingRate.fromCurrencyId === fromCurrencyId && existingRate.toCurrencyId === toCurrencyId;
      
      if (isSameDirection) {
        // Update existing rate in same direction
        await ExchangeRateHistory.create({
          exchangeRateId: existingRate.id,
          fromCurrencyId,
          toCurrencyId,
          previousRate: existingRate.rate,
          newRate: rate,
          changePercentage: ((rate - existingRate.rate) / existingRate.rate) * 100,
          changeReason: 'manual_update',
          changedBy: req.user.id,
          notes: notes || 'Rate updated'
        });
        
        await existingRate.update({
          rate,
          effectiveDate: effectiveDate || new Date(),
          notes,
          createdBy: req.user.id
        });
        
        exchangeRate = existingRate;
        
        // Update or create inverse rate
        const inverseRate = 1 / rate;
        const existingInverseRate = await ExchangeRate.findOne({
          where: {
            fromCurrencyId: toCurrencyId,
            toCurrencyId: fromCurrencyId,
            isActive: true
          }
        });
        
        if (existingInverseRate) {
          await ExchangeRateHistory.create({
            exchangeRateId: existingInverseRate.id,
            fromCurrencyId: toCurrencyId,
            toCurrencyId: fromCurrencyId,
            previousRate: existingInverseRate.rate,
            newRate: inverseRate,
            changePercentage: ((inverseRate - existingInverseRate.rate) / existingInverseRate.rate) * 100,
            changeReason: 'auto_calculated_inverse',
            changedBy: req.user.id,
            notes: `Auto-calculated inverse of ${fromCurrency.code}->${toCurrency.code}`
          });
          
          await existingInverseRate.update({
            rate: inverseRate,
            effectiveDate: effectiveDate || new Date(),
            notes: `Auto-calculated inverse of ${fromCurrency.code}->${toCurrency.code}`,
            createdBy: req.user.id
          });
          
          inverseExchangeRate = existingInverseRate;
        } else {
          inverseExchangeRate = await ExchangeRate.create({
            fromCurrencyId: toCurrencyId,
            toCurrencyId: fromCurrencyId,
            rate: inverseRate,
            effectiveDate: effectiveDate || new Date(),
            source: 'auto_calculated',
            notes: `Auto-calculated inverse of ${fromCurrency.code}->${toCurrency.code}`,
            createdBy: req.user.id
          });
        }
      } else {
        // User is trying to add inverse rate, but it already exists
        return res.status(409).json({
          success: false,
          message: `Exchange rate already exists for ${toCurrency.code} -> ${fromCurrency.code}. Please update the existing rate instead.`
        });
      }
    } else {
      // Create new exchange rate pair (both directions)
      exchangeRate = await ExchangeRate.create({
        fromCurrencyId,
        toCurrencyId,
        rate,
        effectiveDate: effectiveDate || new Date(),
        source: 'manual',
        notes,
        createdBy: req.user.id
      });
      
      // Create inverse exchange rate
      const inverseRate = 1 / rate;
      inverseExchangeRate = await ExchangeRate.create({
        fromCurrencyId: toCurrencyId,
        toCurrencyId: fromCurrencyId,
        rate: inverseRate,
        effectiveDate: effectiveDate || new Date(),
        source: 'auto_calculated',
        notes: `Auto-calculated inverse of ${fromCurrency.code}->${toCurrency.code}`,
        createdBy: req.user.id
      });
    }
    
    // Fetch the complete exchange rate with currency details
    const completeExchangeRate = await ExchangeRate.findByPk(exchangeRate.id, {
      include: [
        { model: Currency, as: 'fromCurrency' },
        { model: Currency, as: 'toCurrency' }
      ]
    });
    
    res.status(201).json({
      success: true,
      data: completeExchangeRate,
      message: 'Exchange rate created/updated successfully'
    });
  } catch (error) {
    console.error('Error creating/updating exchange rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update exchange rate',
      error: error.message
    });
  }
});

/**
 * PUT /api/financial/exchange-rates/:id
 * Update exchange rate (Admin only)
 */
router.put('/exchange-rates/:id', auth, async (req, res) => {
  try {
    // Check if user has admin permissions
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    const { id } = req.params;
    const { rate, effectiveDate, notes } = req.body;
    
    // Validate required fields
    if (!rate) {
      return res.status(400).json({
        success: false,
        message: 'Rate is required'
      });
    }
    
    // Find existing exchange rate
    const existingRate = await ExchangeRate.findByPk(id, {
      include: [
        { model: Currency, as: 'fromCurrency' },
        { model: Currency, as: 'toCurrency' }
      ]
    });
    
    if (!existingRate) {
      return res.status(404).json({
        success: false,
        message: 'Exchange rate not found'
      });
    }
    
    // Create history record for the old rate
    await ExchangeRateHistory.create({
      exchangeRateId: existingRate.id,
      fromCurrencyId: existingRate.fromCurrencyId,
      toCurrencyId: existingRate.toCurrencyId,
      previousRate: existingRate.rate,
      newRate: rate,
      changePercentage: ((rate - existingRate.rate) / existingRate.rate) * 100,
      changeReason: 'manual_update',
      changedBy: req.user.id,
      notes: notes || 'Rate updated'
    });
    
    // Update the exchange rate
    await existingRate.update({
      rate,
      effectiveDate: effectiveDate || new Date(),
      notes,
      createdBy: req.user.id
    });
    
    // Update or create inverse rate
    const inverseRate = 1 / rate;
    const existingInverseRate = await ExchangeRate.findOne({
      where: {
        fromCurrencyId: existingRate.toCurrencyId,
        toCurrencyId: existingRate.fromCurrencyId,
        isActive: true
      }
    });
    
    if (existingInverseRate) {
      await ExchangeRateHistory.create({
        exchangeRateId: existingInverseRate.id,
        fromCurrencyId: existingRate.toCurrencyId,
        toCurrencyId: existingRate.fromCurrencyId,
        previousRate: existingInverseRate.rate,
        newRate: inverseRate,
        changePercentage: ((inverseRate - existingInverseRate.rate) / existingInverseRate.rate) * 100,
        changeReason: 'auto_calculated_inverse',
        changedBy: req.user.id,
        notes: `Auto-calculated inverse of ${existingRate.fromCurrency.code}->${existingRate.toCurrency.code}`
      });
      
      await existingInverseRate.update({
        rate: inverseRate,
        effectiveDate: effectiveDate || new Date(),
        notes: `Auto-calculated inverse of ${existingRate.fromCurrency.code}->${existingRate.toCurrency.code}`,
        createdBy: req.user.id
      });
    } else {
      await ExchangeRate.create({
        fromCurrencyId: existingRate.toCurrencyId,
        toCurrencyId: existingRate.fromCurrencyId,
        rate: inverseRate,
        effectiveDate: effectiveDate || new Date(),
        source: 'auto_calculated',
        notes: `Auto-calculated inverse of ${existingRate.fromCurrency.code}->${existingRate.toCurrency.code}`,
        createdBy: req.user.id
      });
    }
    
    // Fetch the updated exchange rate with currency details
    const updatedExchangeRate = await ExchangeRate.findByPk(existingRate.id, {
      include: [
        { model: Currency, as: 'fromCurrency' },
        { model: Currency, as: 'toCurrency' }
      ]
    });
    
    res.json({
      success: true,
      data: updatedExchangeRate,
      message: 'Exchange rate updated successfully'
    });
  } catch (error) {
    console.error('Error updating exchange rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update exchange rate',
      error: error.message
    });
  }
});

/**
 * DELETE /api/financial/exchange-rates/:id
 * Delete exchange rate (Admin only)
 */
router.delete('/exchange-rates/:id', auth, async (req, res) => {
  try {
    // Check if user has admin permissions
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    const { id } = req.params;
    
    // Find existing exchange rate
    const existingRate = await ExchangeRate.findByPk(id, {
      include: [
        { model: Currency, as: 'fromCurrency' },
        { model: Currency, as: 'toCurrency' }
      ]
    });
    
    if (!existingRate) {
      return res.status(404).json({
        success: false,
        message: 'Exchange rate not found'
      });
    }
    
    // Find and deactivate inverse rate
    const inverseRate = await ExchangeRate.findOne({
      where: {
        fromCurrencyId: existingRate.toCurrencyId,
        toCurrencyId: existingRate.fromCurrencyId,
        isActive: true
      }
    });
    
    // Deactivate both rates
    await existingRate.update({ isActive: false });
    if (inverseRate) {
      await inverseRate.update({ isActive: false });
    }
    
    res.json({
      success: true,
      message: 'Exchange rate deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting exchange rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete exchange rate',
      error: error.message
    });
  }
});

/**
 * GET /api/financial/exchange-rates/history
 * Get exchange rate history
 */
router.get('/exchange-rates/history', async (req, res) => {
  try {
    const { 
      fromCurrency, 
      toCurrency,
      page = 1,
      limit = 50
    } = req.query;
    
    const whereClause = {};
    
    if (fromCurrency) {
      whereClause.fromCurrencyId = fromCurrency;
    }
    
    if (toCurrency) {
      whereClause.toCurrencyId = toCurrency;
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: history } = await ExchangeRateHistory.findAndCountAll({
      where: whereClause,
      include: [
        { model: Currency, as: 'fromCurrency' },
        { model: Currency, as: 'toCurrency' }
      ],
      order: [['changeDate', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: history,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching exchange rate history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exchange rate history',
      error: error.message
    });
  }
});

/**
 * GET /api/financial/courses/:courseId/currency
 * Get course currency configuration
 */
router.get('/courses/:courseId/currency', async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const courseCurrency = await CourseCurrency.findOne({
      where: { courseId }
    });
    
    if (!courseCurrency) {
      return res.status(404).json({
        success: false,
        message: 'Course currency configuration not found'
      });
    }
    
    // Get base currency
    const baseCurrency = await Currency.findByPk(courseCurrency.baseCurrencyId);
    
    // Get allowed payment currencies
    const allowedCurrencies = await Currency.findAll({
      where: {
        id: courseCurrency.allowedPaymentCurrencies,
        isActive: true
      }
    });
    
    res.json({
      success: true,
      data: {
        ...courseCurrency.toJSON(),
        baseCurrency: baseCurrency,
        allowedPaymentCurrencies: allowedCurrencies
      }
    });
  } catch (error) {
    console.error('Error fetching course currency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course currency configuration',
      error: error.message
    });
  }
});

/**
 * POST /api/financial/courses/:courseId/currency
 * Create or update course currency configuration
 */
router.post('/courses/:courseId/currency', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { baseCurrencyId, basePrice, allowedPaymentCurrencies, customExchangeRates } = req.body;
    
    // Check if user has permission to modify this course
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if user is the trainer or super admin
    if (req.user.role !== 'super_admin' && course.trainerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    // Validate base currency exists
    const baseCurrency = await Currency.findByPk(baseCurrencyId);
    if (!baseCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Invalid base currency'
      });
    }
    
    // Validate allowed payment currencies
    if (allowedPaymentCurrencies && allowedPaymentCurrencies.length > 0) {
      const validCurrencies = await Currency.findAll({
        where: {
          id: allowedPaymentCurrencies,
          isActive: true
        }
      });
      
      if (validCurrencies.length !== allowedPaymentCurrencies.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more allowed payment currencies are invalid'
        });
      }
    }
    
    // Create or update course currency configuration
    const [courseCurrency, created] = await CourseCurrency.upsert({
      courseId,
      baseCurrencyId,
      basePrice,
      allowedPaymentCurrencies: allowedPaymentCurrencies || [],
      customExchangeRates: customExchangeRates || {},
      isActive: true
    });
    
    // Fetch complete configuration
    const completeConfig = await CourseCurrency.findByPk(courseCurrency.id, {
      include: [
        { model: Course, as: 'course' },
        { model: Currency, as: 'baseCurrency' }
      ]
    });
    
    res.status(created ? 201 : 200).json({
      success: true,
      data: completeConfig,
      message: created ? 'Course currency configuration created' : 'Course currency configuration updated'
    });
  } catch (error) {
    console.error('Error updating course currency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course currency configuration',
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
