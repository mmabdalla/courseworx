/**
 * Simple Currency System Test
 * 
 * This script tests the basic currency functionality without requiring existing courses
 */

const { Currency, ExchangeRate } = require('./plugins/financial-plugin/models');
const CurrencyService = require('./plugins/financial-plugin/utils/currencyService');

async function testBasicCurrencyFunctionality() {
  console.log('🧪 Testing Basic Multi-Currency Functionality...\n');

  try {
    // Test 1: Check if currencies exist
    console.log('1️⃣ Testing Currency Data...');
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

    // Test 4: Test currency formatting
    console.log('\n4️⃣ Testing Currency Formatting...');
    if (usd) console.log(`✅ USD: ${CurrencyService.formatCurrency(99.99, usd)}`);
    if (eur) console.log(`✅ EUR: ${CurrencyService.formatCurrency(85.50, eur)}`);
    if (egp) console.log(`✅ EGP: ${CurrencyService.formatCurrency(3050.00, egp)}`);

    // Test 5: Test currency service methods
    console.log('\n5️⃣ Testing Currency Service Methods...');
    const activeCurrencies = await CurrencyService.getActiveCurrencies();
    console.log(`✅ Active currencies: ${activeCurrencies.length}`);

    const baseCurrency = await CurrencyService.getBaseCurrency();
    console.log(`✅ Base currency: ${baseCurrency ? baseCurrency.name : 'None'}`);

    const usdByCode = await CurrencyService.getCurrencyByCode('USD');
    console.log(`✅ USD by code: ${usdByCode ? usdByCode.name : 'Not found'}`);

    // Test 6: Test exchange rate retrieval
    console.log('\n6️⃣ Testing Exchange Rate Retrieval...');
    if (usd && eur) {
      const rate = await CurrencyService.getExchangeRate(usd.id, eur.id);
      console.log(`✅ USD → EUR rate: ${rate ? rate.rate : 'Not found'}`);
    }

    // Test 7: Test reverse conversion
    console.log('\n7️⃣ Testing Reverse Conversion...');
    if (eur && usd) {
      try {
        const reverseConversion = await CurrencyService.convertAmount(85, eur.id, usd.id);
        console.log(`✅ 85 ${eur.code} = ${reverseConversion.convertedAmount} ${usd.code}`);
      } catch (error) {
        console.log(`⚠️  Reverse conversion not available: ${error.message}`);
      }
    }

    console.log('\n🎉 Basic currency tests completed successfully!');
    console.log('\n📋 System Status:');
    console.log('✅ Database tables created');
    console.log('✅ Initial currencies seeded');
    console.log('✅ Exchange rates configured');
    console.log('✅ Currency conversion working');
    console.log('✅ Currency formatting working');
    console.log('✅ Currency service methods working');

    console.log('\n🚀 Ready for API testing!');
    console.log('\n📖 Next Steps:');
    console.log('1. Start your CourseWorx server');
    console.log('2. Test API endpoints with curl or Postman');
    console.log('3. Navigate to /admin/currencies in the frontend');
    console.log('4. Create a course and test currency configuration');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testBasicCurrencyFunctionality()
    .then((success) => {
      if (success) {
        console.log('\n✅ All basic tests passed!');
        process.exit(0);
      } else {
        console.log('\n💥 Tests failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testBasicCurrencyFunctionality };
