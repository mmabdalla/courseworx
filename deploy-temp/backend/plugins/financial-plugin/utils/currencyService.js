/**
 * Currency Service
 * 
 * This service provides utility functions for currency operations,
 * exchange rate calculations, and currency formatting.
 */

const { Currency, ExchangeRate, CourseCurrency } = require('../models');
const { Op } = require('sequelize');

class CurrencyService {
  /**
   * Get all active currencies
   */
  static async getActiveCurrencies() {
    return await Currency.findAll({
      where: { isActive: true },
      order: [['code', 'ASC']]
    });
  }

  /**
   * Get currency by code
   */
  static async getCurrencyByCode(code) {
    return await Currency.findOne({
      where: { 
        code: code.toUpperCase(),
        isActive: true 
      }
    });
  }

  /**
   * Get base currency
   */
  static async getBaseCurrency() {
    return await Currency.findOne({
      where: { 
        isBaseCurrency: true,
        isActive: true 
      }
    });
  }

  /**
   * Get exchange rate between two currencies
   */
  static async getExchangeRate(fromCurrencyId, toCurrencyId) {
    const exchangeRate = await ExchangeRate.findOne({
      where: {
        fromCurrencyId,
        toCurrencyId,
        isActive: true,
        [Op.or]: [
          { expiryDate: null },
          { expiryDate: { [Op.gt]: new Date() } }
        ]
      },
      order: [['effectiveDate', 'DESC']]
    });

    return exchangeRate;
  }

  /**
   * Convert amount between currencies
   */
  static async convertAmount(amount, fromCurrencyId, toCurrencyId) {
    if (fromCurrencyId === toCurrencyId) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        exchangeRate: 1,
        fromCurrencyId,
        toCurrencyId
      };
    }

    const exchangeRate = await this.getExchangeRate(fromCurrencyId, toCurrencyId);
    
    if (!exchangeRate) {
      throw new Error(`Exchange rate not found from ${fromCurrencyId} to ${toCurrencyId}`);
    }

    const convertedAmount = parseFloat(amount) * parseFloat(exchangeRate.rate);

    return {
      originalAmount: parseFloat(amount),
      convertedAmount: convertedAmount,
      exchangeRate: parseFloat(exchangeRate.rate),
      fromCurrencyId,
      toCurrencyId,
      effectiveDate: exchangeRate.effectiveDate
    };
  }

  /**
   * Get course currency configuration
   */
  static async getCourseCurrencyConfig(courseId) {
    const courseCurrency = await CourseCurrency.findOne({
      where: { courseId, isActive: true },
      include: [
        { model: Currency, as: 'baseCurrency' }
      ]
    });

    if (!courseCurrency) {
      return null;
    }

    // Get allowed payment currencies
    const allowedCurrencies = await Currency.findAll({
      where: {
        id: courseCurrency.allowedPaymentCurrencies,
        isActive: true
      }
    });

    return {
      ...courseCurrency.toJSON(),
      allowedPaymentCurrencies: allowedCurrencies
    };
  }

  /**
   * Calculate course price in different currencies
   */
  static async getCoursePricesInCurrencies(courseId, targetCurrencies = []) {
    const courseConfig = await this.getCourseCurrencyConfig(courseId);
    
    if (!courseConfig) {
      throw new Error('Course currency configuration not found');
    }

    const baseCurrencyId = courseConfig.baseCurrencyId;
    const basePrice = courseConfig.basePrice;
    
    const prices = [];
    
    // Add base currency price
    const baseCurrency = await Currency.findByPk(baseCurrencyId);
    prices.push({
      currencyId: baseCurrencyId,
      currency: baseCurrency,
      price: basePrice,
      isBasePrice: true
    });

    // Calculate prices for target currencies
    for (const targetCurrencyId of targetCurrencies) {
      if (targetCurrencyId === baseCurrencyId) {
        continue; // Skip if same as base currency
      }

      try {
        const conversion = await this.convertAmount(basePrice, baseCurrencyId, targetCurrencyId);
        const targetCurrency = await Currency.findByPk(targetCurrencyId);
        
        prices.push({
          currencyId: targetCurrencyId,
          currency: targetCurrency,
          price: conversion.convertedAmount,
          exchangeRate: conversion.exchangeRate,
          isBasePrice: false
        });
      } catch (error) {
        console.warn(`Failed to convert price for currency ${targetCurrencyId}:`, error.message);
      }
    }

    return prices;
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount, currency) {
    if (!currency) {
      return `${amount.toFixed(2)}`;
    }

    const formattedAmount = parseFloat(amount).toFixed(currency.decimalPlaces);
    
    // Simple formatting - can be enhanced with proper locale formatting
    switch (currency.code) {
      case 'USD':
        return `$${formattedAmount}`;
      case 'EUR':
        return `€${formattedAmount}`;
      case 'GBP':
        return `£${formattedAmount}`;
      case 'JPY':
        return `¥${formattedAmount}`;
      default:
        return `${currency.symbol}${formattedAmount}`;
    }
  }

  /**
   * Get exchange rate history for a currency pair
   */
  static async getExchangeRateHistory(fromCurrencyId, toCurrencyId, limit = 30) {
    const { ExchangeRateHistory } = require('../models');
    
    return await ExchangeRateHistory.findAll({
      where: {
        fromCurrencyId,
        toCurrencyId
      },
      include: [
        { model: Currency, as: 'fromCurrency' },
        { model: Currency, as: 'toCurrency' }
      ],
      order: [['changeDate', 'DESC']],
      limit
    });
  }

  /**
   * Update exchange rate with history tracking
   */
  static async updateExchangeRate(fromCurrencyId, toCurrencyId, newRate, userId, notes = null) {
    const { ExchangeRateHistory } = require('../models');
    
    // Find existing rate
    const existingRate = await ExchangeRate.findOne({
      where: {
        fromCurrencyId,
        toCurrencyId,
        isActive: true
      }
    });

    let exchangeRate;

    if (existingRate) {
      // Create history record
      await ExchangeRateHistory.create({
        exchangeRateId: existingRate.id,
        fromCurrencyId,
        toCurrencyId,
        previousRate: existingRate.rate,
        newRate: newRate,
        changePercentage: ((newRate - existingRate.rate) / existingRate.rate) * 100,
        changeReason: 'manual_update',
        changedBy: userId,
        notes: notes || 'Rate updated'
      });

      // Update existing rate
      await existingRate.update({
        rate: newRate,
        effectiveDate: new Date(),
        notes,
        createdBy: userId
      });

      exchangeRate = existingRate;
    } else {
      // Create new rate
      exchangeRate = await ExchangeRate.create({
        fromCurrencyId,
        toCurrencyId,
        rate: newRate,
        effectiveDate: new Date(),
        source: 'manual',
        notes,
        createdBy: userId
      });
    }

    return exchangeRate;
  }

  /**
   * Validate currency configuration for a course
   */
  static async validateCourseCurrencyConfig(courseId, baseCurrencyId, allowedPaymentCurrencies) {
    const errors = [];

    // Check if base currency exists and is active
    const baseCurrency = await Currency.findByPk(baseCurrencyId);
    if (!baseCurrency || !baseCurrency.isActive) {
      errors.push('Base currency is invalid or inactive');
    }

    // Check if allowed payment currencies exist and are active
    if (allowedPaymentCurrencies && allowedPaymentCurrencies.length > 0) {
      const validCurrencies = await Currency.findAll({
        where: {
          id: allowedPaymentCurrencies,
          isActive: true
        }
      });

      if (validCurrencies.length !== allowedPaymentCurrencies.length) {
        errors.push('One or more allowed payment currencies are invalid or inactive');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = CurrencyService;
