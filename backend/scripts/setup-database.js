const { sequelize } = require('../config/database');
// Import all models to ensure they are registered with Sequelize
require('../models');
require('dotenv').config();

const setupDatabase = async () => {
  try {
    console.log('🔄 Setting up clean database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Sync database with force to recreate all tables (clean slate)
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized successfully - all tables recreated.');
    
    console.log('\n🎉 Clean database setup completed successfully!');
    console.log('\n📋 Database is now ready for your data:');
    console.log('- All tables have been recreated');
    console.log('- No demo users exist');
    console.log('- Ready for fresh data input');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase(); 