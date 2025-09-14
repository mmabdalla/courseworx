/**
 * API Endpoints Test Script
 * 
 * This script tests the multi-currency API endpoints
 */

const baseUrl = 'http://localhost:5000/api/financial';

async function testApiEndpoints() {
  console.log('🌐 Testing Multi-Currency API Endpoints...\n');

  try {
    // Test 1: Get all currencies
    console.log('1️⃣ Testing GET /api/financial/currencies');
    const currenciesResponse = await fetch(`${baseUrl}/currencies`);
    const currenciesData = await currenciesResponse.json();
    
    if (currenciesData.success) {
      console.log(`✅ Found ${currenciesData.data.length} currencies`);
      currenciesData.data.slice(0, 3).forEach(currency => {
        console.log(`   - ${currency.name} (${currency.code})`);
      });
    } else {
      console.log('❌ Failed to fetch currencies');
    }

    // Test 2: Get exchange rates
    console.log('\n2️⃣ Testing GET /api/financial/exchange-rates');
    const ratesResponse = await fetch(`${baseUrl}/exchange-rates`);
    const ratesData = await ratesResponse.json();
    
    if (ratesData.success) {
      console.log(`✅ Found ${ratesData.data.length} exchange rates`);
      ratesData.data.slice(0, 3).forEach(rate => {
        console.log(`   - ${rate.fromCurrency.code} → ${rate.toCurrency.code}: ${rate.rate}`);
      });
    } else {
      console.log('❌ Failed to fetch exchange rates');
    }

    // Test 3: Test currency conversion
    console.log('\n3️⃣ Testing GET /api/financial/convert');
    const convertResponse = await fetch(`${baseUrl}/convert?amount=100&from=USD&to=EUR`);
    const convertData = await convertResponse.json();
    
    if (convertData.success) {
      console.log(`✅ Currency conversion: ${convertData.data.originalAmount} ${convertData.data.fromCurrency} = ${convertData.data.convertedAmount} ${convertData.data.toCurrency}`);
    } else {
      console.log('❌ Failed to convert currency');
    }

    console.log('\n🎉 API endpoint tests completed!');
    console.log('\n📋 Available Endpoints:');
    console.log('✅ GET /api/financial/currencies - List currencies');
    console.log('✅ GET /api/financial/exchange-rates - List exchange rates');
    console.log('✅ GET /api/financial/convert - Convert currencies');
    console.log('✅ POST /api/financial/currencies - Create currency (Admin)');
    console.log('✅ POST /api/financial/exchange-rates - Create/update rate (Admin)');
    console.log('✅ GET /api/financial/courses/:id/currency - Get course currency config');
    console.log('✅ POST /api/financial/courses/:id/currency - Set course currency config');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n💡 Make sure your CourseWorx server is running on http://localhost:5000');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testApiEndpoints();
}

module.exports = { testApiEndpoints };
