const { closeTestDatabase } = require('./helpers/database');

module.exports = async () => {
  console.log('\n🧹 Cleaning up test environment...');
  await closeTestDatabase();
  console.log('✅ Test environment cleanup complete');
};