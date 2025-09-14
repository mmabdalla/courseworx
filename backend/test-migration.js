/**
 * Manual Migration Runner for Currency Tables
 * Run this to create the currency tables
 */

const { sequelize } = require('./config/database');
const { DataTypes } = require('sequelize');

async function runMigration() {
  try {
    console.log('🚀 Starting currency tables migration...');

    // Create currencies table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS currencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(3) UNIQUE NOT NULL,
        name VARCHAR NOT NULL,
        symbol VARCHAR(10) NOT NULL,
        "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
        "isActive" BOOLEAN DEFAULT true,
        "isBaseCurrency" BOOLEAN DEFAULT false,
        "bankAccountDetails" JSONB,
        metadata JSONB DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create exchange_rates table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "fromCurrencyId" UUID NOT NULL REFERENCES currencies(id),
        "toCurrencyId" UUID NOT NULL REFERENCES currencies(id),
        rate DECIMAL(15,8) NOT NULL,
        "effectiveDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "expiryDate" TIMESTAMP WITH TIME ZONE,
        "isActive" BOOLEAN DEFAULT true,
        source VARCHAR DEFAULT 'manual',
        notes TEXT,
        "createdBy" UUID REFERENCES users(id),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create exchange_rate_history table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS exchange_rate_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "exchangeRateId" UUID NOT NULL REFERENCES exchange_rates(id),
        "fromCurrencyId" UUID NOT NULL REFERENCES currencies(id),
        "toCurrencyId" UUID NOT NULL REFERENCES currencies(id),
        "previousRate" DECIMAL(15,8),
        "newRate" DECIMAL(15,8) NOT NULL,
        "changePercentage" DECIMAL(8,4),
        "changeDate" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "changeReason" VARCHAR DEFAULT 'manual_update',
        "changedBy" UUID REFERENCES users(id),
        notes TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create course_currencies table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS course_currencies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "courseId" UUID NOT NULL REFERENCES courses(id),
        "baseCurrencyId" UUID NOT NULL REFERENCES currencies(id),
        "basePrice" DECIMAL(10,2) NOT NULL,
        "allowedPaymentCurrencies" UUID[] DEFAULT '{}',
        "customExchangeRates" JSONB DEFAULT '{}',
        "isActive" BOOLEAN DEFAULT true,
        metadata JSONB DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_currencies_active ON currencies("isActive");`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_currencies_base ON currencies("isBaseCurrency");`);
    
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON exchange_rates("fromCurrencyId", "toCurrencyId");`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates("effectiveDate");`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_exchange_rates_active ON exchange_rates("isActive");`);
    
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_course_currencies_course ON course_currencies("courseId");`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_course_currencies_base ON course_currencies("baseCurrencyId");`);

    console.log('✅ Currency tables migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
