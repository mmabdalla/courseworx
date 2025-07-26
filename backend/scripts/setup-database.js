const { sequelize } = require('../config/database');
// Import all models to ensure they are registered with Sequelize
require('../models');
const { User } = require('../models');
require('dotenv').config();

const setupDatabase = async () => {
  try {
    console.log('🔄 Setting up database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Sync database with force to recreate all tables
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized successfully.');
    
    // Create super admin user
    const superAdmin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@courseworx.com',
      password: 'admin123',
      role: 'super_admin',
      phone: '+1234567890',
      isActive: true
    });
    
    console.log('✅ Super admin user created successfully.');
    console.log('📧 Email: admin@courseworx.com');
    console.log('🔑 Password: admin123');
    
    // Create sample trainer
    const trainer = await User.create({
      firstName: 'John',
      lastName: 'Trainer',
      email: 'trainer@courseworx.com',
      password: 'trainer123',
      role: 'trainer',
      phone: '+1234567891',
      isActive: true
    });
    
    console.log('✅ Sample trainer created successfully.');
    console.log('📧 Email: trainer@courseworx.com');
    console.log('🔑 Password: trainer123');
    
    // Create sample trainee
    const trainee = await User.create({
      firstName: 'Jane',
      lastName: 'Trainee',
      email: 'trainee@courseworx.com',
      password: 'trainee123',
      role: 'trainee',
      phone: '+1234567892',
      isActive: true
    });
    
    console.log('✅ Sample trainee created successfully.');
    console.log('📧 Email: trainee@courseworx.com');
    console.log('🔑 Password: trainee123');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Default Users:');
    console.log('Super Admin: admin@courseworx.com / admin123');
    console.log('Trainer: trainer@courseworx.com / trainer123');
    console.log('Trainee: trainee@courseworx.com / trainee123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

setupDatabase(); 