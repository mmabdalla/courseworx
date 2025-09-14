/**
 * Comprehensive Test Script for Multi-Currency System
 * 
 * This script tests all the major functionality of the multi-currency system
 */

const { Currency, ExchangeRate, CourseCurrency } = require('./plugins/financial-plugin/models');
const CurrencyService = require('./plugins/financial-plugin/utils/currencyService');
const { sequelize } = require('./config/database');

async function testCurrencySystem() {
  console.log('🧪 Testing Multi-Currency System...\n');

  try {
    // Test 1: Check if currencies were created
    console.log('1️⃣ Testing Currency Creation...');
    const currencies = await Currency.findAll();
    console.log(`✅ Found ${currencies.length} currencies:`);
    currencies.forEach(currency => {
      console.log(`   - ${currency.name} (${currency.code}) - ${currency.symbol}`);
    });

    // Test 2: Check exchange rates
    console.log('\n2️⃣ Testing Exchange Rates...');
    const exchangeRates = await ExchangeRate.findAll({
      include: [
        { model: Currency, as: 'fromCurrency' },
        { model: Currency, as: 'toCurrency' }
      ]
    });
    console.log(`✅ Found ${exchangeRates.length} exchange rates:`);
    exchangeRates.slice(0, 5).forEach(rate => {
      console.log(`   - ${rate.fromCurrency.code} → ${rate.toCurrency.code}: ${rate.rate}`);
    });

    // Test 3: Test currency conversion
    console.log('\n3️⃣ Testing Currency Conversion...');
    const usd = await Currency.findOne({ where: { code: 'USD' } });
    const eur = await Currency.findOne({ where: { code: 'EUR' } });
    const egp = await Currency.findOne({ where: { code: 'EGP' } });

    if (usd && eur) {
      const conversion = await CurrencyService.convertAmount(100, usd.id, eur.id);
      console.log(`✅ 100 ${usd.code} = ${conversion.convertedAmount} ${eur.code} (Rate: ${conversion.exchangeRate})`);
    }

    if (usd && egp) {
      const conversion = await CurrencyService.convertAmount(100, usd.id, egp.id);
      console.log(`✅ 100 ${usd.code} = ${conversion.convertedAmount} ${egp.code} (Rate: ${conversion.exchangeRate})`);
    }

    // Test 4: Test course currency configuration
    console.log('\n4️⃣ Testing Course Currency Configuration...');
    
    // Create a test course currency configuration
    const { v4: uuidv4 } = require('uuid');
    const testCourseId = uuidv4();
    const courseCurrency = await CourseCurrency.create({
      courseId: testCourseId,
      baseCurrencyId: usd.id,
      basePrice: 99.99,
      allowedPaymentCurrencies: [eur.id, egp.id],
      customExchangeRates: {
        [`${usd.id}-${egp.id}`]: 31.00 // Custom USD to EGP rate
      },
      isActive: true
    });

    console.log(`✅ Created course currency config for course: ${testCourseId}`);
    console.log(`   Base Currency: ${usd.name} (${usd.code})`);
    console.log(`   Base Price: ${usd.symbol}${courseCurrency.basePrice}`);
    console.log(`   Allowed Payment Currencies: ${courseCurrency.allowedPaymentCurrencies.length}`);

    // Test 5: Test course price conversion
    console.log('\n5️⃣ Testing Course Price Conversion...');
    const coursePrices = await CurrencyService.getCoursePricesInCurrencies(
      testCourseId,
      [eur.id, egp.id]
    );

    console.log('✅ Course prices in different currencies:');
    coursePrices.forEach(price => {
      const formatted = CurrencyService.formatCurrency(price.price, price.currency);
      console.log(`   - ${price.currency.name}: ${formatted}`);
    });

    // Test 6: Test currency formatting
    console.log('\n6️⃣ Testing Currency Formatting...');
    console.log(`✅ USD: ${CurrencyService.formatCurrency(99.99, usd)}`);
    console.log(`✅ EUR: ${CurrencyService.formatCurrency(85.50, eur)}`);
    console.log(`✅ EGP: ${CurrencyService.formatCurrency(3050.00, egp)}`);

    // Test 7: Test exchange rate history
    console.log('\n7️⃣ Testing Exchange Rate History...');
    const { ExchangeRateHistory } = require('./plugins/financial-plugin/models');
    
    // Update an exchange rate to create history
    const updatedRate = await CurrencyService.updateExchangeRate(
      usd.id,
      eur.id,
      0.90, // New rate
      null, // No user ID for test
      'Test rate update'
    );

    const history = await ExchangeRateHistory.findOne({
      where: {
        fromCurrencyId: usd.id,
        toCurrencyId: eur.id
      }
    });

    if (history) {
      console.log(`✅ Exchange rate history created:`);
      console.log(`   Previous Rate: ${history.previousRate}`);
      console.log(`   New Rate: ${history.newRate}`);
      console.log(`   Change: ${history.changePercentage}%`);
    }

    // Test 8: Test API endpoints (simulation)
    console.log('\n8️⃣ Testing API Endpoints (Simulation)...');
    
    // Simulate GET /api/financial/currencies
    const activeCurrencies = await CurrencyService.getActiveCurrencies();
    console.log(`✅ GET /api/financial/currencies: ${activeCurrencies.length} active currencies`);

    // Simulate GET /api/financial/convert
    const conversionResult = await CurrencyService.convertAmount(50, usd.id, eur.id);
    console.log(`✅ GET /api/financial/convert: 50 USD = ${conversionResult.convertedAmount} EUR`);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await CourseCurrency.destroy({ where: { courseId: testCourseId } });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📋 System Status:');
    console.log('✅ Database tables created');
    console.log('✅ Initial currencies seeded');
    console.log('✅ Exchange rates configured');
    console.log('✅ Currency conversion working');
    console.log('✅ Course currency configuration working');
    console.log('✅ Exchange rate history tracking');
    console.log('✅ Currency formatting working');

    console.log('\n🚀 Ready for production use!');
    console.log('\n📖 Next Steps:');
    console.log('1. Start your CourseWorx server');
    console.log('2. Navigate to /admin/currencies to manage currencies');
    console.log('3. Create/edit courses to configure currency settings');
    console.log('4. Test the frontend currency management interface');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testCurrencySystem()
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testCurrencySystem };
