const { initializeTestDatabase } = require('./helpers/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config/test.env') });

module.exports = async () => {
  console.log('\n🚀 Setting up test environment with REAL PostgreSQL data...');
  
  // Ensure test environment variables are loaded
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'CX-Test1';
  
  // Initialize the database for all tests
  await initializeTestDatabase();
  console.log('✅ Test environment setup complete with real PostgreSQL data');
};