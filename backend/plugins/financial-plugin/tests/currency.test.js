/**
 * Multi-Currency System Tests
 * 
 * This test suite validates the multi-currency functionality
 * including currency management, exchange rates, and conversions.
 */

const { Currency, ExchangeRate, CourseCurrency, CurrencyService } = require('../models');
const { sequelize } = require('../../../config/database');

describe('Multi-Currency System', () => {
  let testCurrencies = [];
  let testExchangeRates = [];

  beforeAll(async () => {
    // Setup test database connection
    await sequelize.authenticate();
  });

  beforeEach(async () => {
    // Create test currencies
    testCurrencies = await Currency.bulkCreate([
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        decimalPlaces: 2,
        isActive: true,
        isBaseCurrency: true
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        decimalPlaces: 2,
        isActive: true,
        isBaseCurrency: false
      },
      {
        code: 'EGP',
        name: 'Egyptian Pound',
        symbol: 'E£',
        decimalPlaces: 2,
        isActive: true,
        isBaseCurrency: false
      }
    ]);

    // Create test exchange rates
    testExchangeRates = await ExchangeRate.bulkCreate([
      {
        fromCurrencyId: testCurrencies[0].id, // USD
        toCurrencyId: testCurrencies[1].id,   // EUR
        rate: 0.85,
        effectiveDate: new Date(),
        isActive: true,
        source: 'manual'
      },
      {
        fromCurrencyId: testCurrencies[0].id, // USD
        toCurrencyId: testCurrencies[2].id,   // EGP
        rate: 30.50,
        effectiveDate: new Date(),
        isActive: true,
        source: 'manual'
      }
    ]);
  });

  afterEach(async () => {
    // Clean up test data
    await ExchangeRate.destroy({ where: {} });
    await CourseCurrency.destroy({ where: {} });
    await Currency.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Currency Management', () => {
    test('should create currency with proper validation', async () => {
      const currency = await Currency.create({
        code: 'GBP',
        name: 'British Pound Sterling',
        symbol: '£',
        decimalPlaces: 2,
        isActive: true,
        isBaseCurrency: false
      });

      expect(currency.code).toBe('GBP');
      expect(currency.name).toBe('British Pound Sterling');
      expect(currency.symbol).toBe('£');
      expect(currency.decimalPlaces).toBe(2);
      expect(currency.isActive).toBe(true);
      expect(currency.isBaseCurrency).toBe(false);
    });

    test('should enforce unique currency codes', async () => {
      await expect(
        Currency.create({
          code: 'USD', // Duplicate code
          name: 'Duplicate USD',
          symbol: '$',
          decimalPlaces: 2,
          isActive: true
        })
      ).rejects.toThrow();
    });

    test('should get active currencies', async () => {
      const activeCurrencies = await CurrencyService.getActiveCurrencies();
      expect(activeCurrencies.length).toBeGreaterThan(0);
      expect(activeCurrencies.every(c => c.isActive)).toBe(true);
    });

    test('should get currency by code', async () => {
      const usd = await CurrencyService.getCurrencyByCode('USD');
      expect(usd).toBeTruthy();
      expect(usd.code).toBe('USD');
    });

    test('should get base currency', async () => {
      const baseCurrency = await CurrencyService.getBaseCurrency();
      expect(baseCurrency).toBeTruthy();
      expect(baseCurrency.isBaseCurrency).toBe(true);
    });
  });

  describe('Exchange Rate Management', () => {
    test('should create exchange rate', async () => {
      const exchangeRate = await ExchangeRate.create({
        fromCurrencyId: testCurrencies[1].id, // EUR
        toCurrencyId: testCurrencies[2].id,   // EGP
        rate: 35.88,
        effectiveDate: new Date(),
        isActive: true,
        source: 'manual'
      });

      expect(exchangeRate.rate).toBe('35.88');
      expect(exchangeRate.fromCurrencyId).toBe(testCurrencies[1].id);
      expect(exchangeRate.toCurrencyId).toBe(testCurrencies[2].id);
    });

    test('should get exchange rate between currencies', async () => {
      const rate = await CurrencyService.getExchangeRate(
        testCurrencies[0].id, // USD
        testCurrencies[1].id  // EUR
      );

      expect(rate).toBeTruthy();
      expect(parseFloat(rate.rate)).toBe(0.85);
    });

    test('should return null for non-existent exchange rate', async () => {
      const rate = await CurrencyService.getExchangeRate(
        testCurrencies[1].id, // EUR
        testCurrencies[0].id  // USD (reverse direction)
      );

      expect(rate).toBeNull();
    });
  });

  describe('Currency Conversion', () => {
    test('should convert amount between currencies', async () => {
      const conversion = await CurrencyService.convertAmount(
        100, // 100 USD
        testCurrencies[0].id, // USD
        testCurrencies[1].id  // EUR
      );

      expect(conversion.originalAmount).toBe(100);
      expect(conversion.convertedAmount).toBe(85); // 100 * 0.85
      expect(conversion.exchangeRate).toBe(0.85);
    });

    test('should return same amount for same currency', async () => {
      const conversion = await CurrencyService.convertAmount(
        100,
        testCurrencies[0].id, // USD
        testCurrencies[0].id  // USD
      );

      expect(conversion.originalAmount).toBe(100);
      expect(conversion.convertedAmount).toBe(100);
      expect(conversion.exchangeRate).toBe(1);
    });

    test('should throw error for non-existent exchange rate', async () => {
      await expect(
        CurrencyService.convertAmount(
          100,
          testCurrencies[1].id, // EUR
          testCurrencies[0].id  // USD (no rate exists)
        )
      ).rejects.toThrow('Exchange rate not found');
    });
  });

  describe('Course Currency Configuration', () => {
    test('should create course currency configuration', async () => {
      const courseCurrency = await CourseCurrency.create({
        courseId: 'test-course-id',
        baseCurrencyId: testCurrencies[0].id, // USD
        basePrice: 99.99,
        allowedPaymentCurrencies: [testCurrencies[1].id, testCurrencies[2].id], // EUR, EGP
        isActive: true
      });

      expect(courseCurrency.courseId).toBe('test-course-id');
      expect(courseCurrency.baseCurrencyId).toBe(testCurrencies[0].id);
      expect(courseCurrency.basePrice).toBe('99.99');
      expect(courseCurrency.allowedPaymentCurrencies).toEqual([
        testCurrencies[1].id,
        testCurrencies[2].id
      ]);
    });

    test('should get course currency configuration', async () => {
      const courseCurrency = await CourseCurrency.create({
        courseId: 'test-course-id',
        baseCurrencyId: testCurrencies[0].id,
        basePrice: 99.99,
        allowedPaymentCurrencies: [testCurrencies[1].id],
        isActive: true
      });

      const config = await CurrencyService.getCourseCurrencyConfig('test-course-id');
      expect(config).toBeTruthy();
      expect(config.courseId).toBe('test-course-id');
      expect(config.baseCurrencyId).toBe(testCurrencies[0].id);
    });

    test('should return null for non-existent course configuration', async () => {
      const config = await CurrencyService.getCourseCurrencyConfig('non-existent-course');
      expect(config).toBeNull();
    });
  });

  describe('Currency Formatting', () => {
    test('should format USD currency', () => {
      const usd = testCurrencies[0];
      const formatted = CurrencyService.formatCurrency(99.99, usd);
      expect(formatted).toBe('$99.99');
    });

    test('should format EUR currency', () => {
      const eur = testCurrencies[1];
      const formatted = CurrencyService.formatCurrency(85.50, eur);
      expect(formatted).toBe('€85.50');
    });

    test('should format EGP currency', () => {
      const egp = testCurrencies[2];
      const formatted = CurrencyService.formatCurrency(3050.00, egp);
      expect(formatted).toBe('E£3050.00');
    });

    test('should format without currency object', () => {
      const formatted = CurrencyService.formatCurrency(99.99);
      expect(formatted).toBe('99.99');
    });
  });

  describe('Exchange Rate History', () => {
    test('should track exchange rate changes', async () => {
      const { ExchangeRateHistory } = require('../models');
      
      // Update an exchange rate
      const updatedRate = await CurrencyService.updateExchangeRate(
        testCurrencies[0].id, // USD
        testCurrencies[1].id, // EUR
        0.90, // New rate
        'test-user-id',
        'Test rate update'
      );

      // Check history was created
      const history = await ExchangeRateHistory.findOne({
        where: {
          fromCurrencyId: testCurrencies[0].id,
          toCurrencyId: testCurrencies[1].id
        }
      });

      expect(history).toBeTruthy();
      expect(parseFloat(history.previousRate)).toBe(0.85);
      expect(parseFloat(history.newRate)).toBe(0.90);
      expect(history.changeReason).toBe('manual_update');
    });
  });

  describe('Validation', () => {
    test('should validate course currency configuration', async () => {
      const validation = await CurrencyService.validateCourseCurrencyConfig(
        'test-course-id',
        testCurrencies[0].id, // Valid base currency
        [testCurrencies[1].id, testCurrencies[2].id] // Valid payment currencies
      );

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject invalid base currency', async () => {
      const validation = await CurrencyService.validateCourseCurrencyConfig(
        'test-course-id',
        'invalid-currency-id',
        [testCurrencies[1].id]
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Base currency is invalid or inactive');
    });

    test('should reject invalid payment currencies', async () => {
      const validation = await CurrencyService.validateCourseCurrencyConfig(
        'test-course-id',
        testCurrencies[0].id,
        ['invalid-currency-id']
      );

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('One or more allowed payment currencies are invalid or inactive');
    });
  });
});

// Integration tests
describe('Multi-Currency Integration', () => {
  test('should handle complete course pricing workflow', async () => {
    // This would test the complete workflow from course creation
    // to payment processing with multiple currencies
    // Implementation would depend on the full system integration
  });

  test('should handle payment processing with currency conversion', async () => {
    // This would test payment processing with currency conversion
    // Implementation would depend on payment system integration
  });
});
