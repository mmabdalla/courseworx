/**
 * Currency Seeding Script
 * 
 * This script seeds the database with initial currency data including
 * common currencies and their basic information.
 */

const { Currency, ExchangeRate } = require('../models');
const { sequelize } = require('../../../config/database');

const initialCurrencies = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimalPlaces: 2,
    isActive: true,
    isBaseCurrency: true,
    bankAccountDetails: {
      accountType: 'checking',
      routingNumber: '',
      accountNumber: '',
      bankName: '',
      bankAddress: ''
    }
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimalPlaces: 2,
    isActive: true,
    isBaseCurrency: false,
    bankAccountDetails: {
      accountType: 'checking',
      iban: '',
      swift: '',
      bankName: '',
      bankAddress: ''
    }
  },
  {
    code: 'GBP',
    name: 'British Pound Sterling',
    symbol: '£',
    decimalPlaces: 2,
    isActive: true,
    isBaseCurrency: false,
    bankAccountDetails: {
      accountType: 'checking',
      sortCode: '',
      accountNumber: '',
      bankName: '',
      bankAddress: ''
    }
  },
  {
    code: 'EGP',
    name: 'Egyptian Pound',
    symbol: 'E£',
    decimalPlaces: 2,
    isActive: true,
    isBaseCurrency: false,
    bankAccountDetails: {
      accountType: 'checking',
      accountNumber: '',
      bankName: '',
      bankAddress: ''
    }
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    decimalPlaces: 2,
    isActive: true,
    isBaseCurrency: false,
    bankAccountDetails: {
      accountType: 'checking',
      routingNumber: '',
      accountNumber: '',
      bankName: '',
      bankAddress: ''
    }
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    decimalPlaces: 2,
    isActive: true,
    isBaseCurrency: false,
    bankAccountDetails: {
      accountType: 'checking',
      bsb: '',
      accountNumber: '',
      bankName: '',
      bankAddress: ''
    }
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    decimalPlaces: 0,
    isActive: true,
    isBaseCurrency: false,
    bankAccountDetails: {
      accountType: 'checking',
      accountNumber: '',
      bankName: '',
      bankAddress: ''
    }
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    decimalPlaces: 2,
    isActive: true,
    isBaseCurrency: false,
    bankAccountDetails: {
      accountType: 'checking',
      iban: '',
      swift: '',
      bankName: '',
      bankAddress: ''
    }
  }
];

const initialExchangeRates = [
  // USD to other currencies (approximate rates)
  { from: 'USD', to: 'EUR', rate: 0.85 },
  { from: 'USD', to: 'GBP', rate: 0.73 },
  { from: 'USD', to: 'EGP', rate: 30.50 },
  { from: 'USD', to: 'CAD', rate: 1.25 },
  { from: 'USD', to: 'AUD', rate: 1.35 },
  { from: 'USD', to: 'JPY', rate: 110.00 },
  { from: 'USD', to: 'CHF', rate: 0.92 },
  
  // EUR to other currencies
  { from: 'EUR', to: 'USD', rate: 1.18 },
  { from: 'EUR', to: 'GBP', rate: 0.86 },
  { from: 'EUR', to: 'EGP', rate: 36.00 },
  
  // GBP to other currencies
  { from: 'GBP', to: 'USD', rate: 1.37 },
  { from: 'GBP', to: 'EUR', rate: 1.16 },
  { from: 'GBP', to: 'EGP', rate: 41.80 },
  
  // EGP to other currencies
  { from: 'EGP', to: 'USD', rate: 0.033 },
  { from: 'EGP', to: 'EUR', rate: 0.028 },
  { from: 'EGP', to: 'GBP', rate: 0.024 }
];

async function seedCurrencies() {
  try {
    console.log('🌱 Starting currency seeding...');
    
    // Check if currencies already exist
    const existingCurrencies = await Currency.count();
    if (existingCurrencies > 0) {
      console.log('⚠️  Currencies already exist. Skipping currency seeding.');
      return;
    }
    
    // Create currencies
    console.log('📝 Creating currencies...');
    const createdCurrencies = await Currency.bulkCreate(initialCurrencies);
    console.log(`✅ Created ${createdCurrencies.length} currencies`);
    
    // Create exchange rates
    console.log('📝 Creating exchange rates...');
    const currencyMap = {};
    createdCurrencies.forEach(currency => {
      currencyMap[currency.code] = currency.id;
    });
    
    const exchangeRatesToCreate = [];
    for (const rate of initialExchangeRates) {
      if (currencyMap[rate.from] && currencyMap[rate.to]) {
        exchangeRatesToCreate.push({
          fromCurrencyId: currencyMap[rate.from],
          toCurrencyId: currencyMap[rate.to],
          rate: rate.rate,
          effectiveDate: new Date(),
          isActive: true,
          source: 'manual',
          notes: 'Initial seeding data'
        });
      }
    }
    
    if (exchangeRatesToCreate.length > 0) {
      await ExchangeRate.bulkCreate(exchangeRatesToCreate);
      console.log(`✅ Created ${exchangeRatesToCreate.length} exchange rates`);
    }
    
    console.log('🎉 Currency seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding currencies:', error);
    throw error;
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    await seedCurrencies();
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { seedCurrencies };
