/**
 * Database Test Helper Functions
 * Uses REAL PostgreSQL data - NO MOCKS, NO FAKE DATA
 */

const { Sequelize } = require('sequelize');

/**
 * Drop and recreate the test database using Sequelize
 */
const recreateTestDatabase = async () => {
  try {
    console.log('🗑️ Dropping test database CX-Test1...');
    
    // Connect to postgres database to drop/create test database
    const adminSequelize = new Sequelize(
      'postgres',
      process.env.DB_USER || 'mabdalla',
      process.env.DB_PASSWORD || '7ouDa-123q',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false
      }
    );
    
    // Test connection first
    await adminSequelize.authenticate();
    console.log('✅ Connected to PostgreSQL admin database');
    
    // Drop the database (ignore errors if it doesn't exist)
    try {
      await adminSequelize.query('DROP DATABASE IF EXISTS "CX-Test1";');
      console.log('✅ Dropped existing CX-Test1 database');
    } catch (error) {
      console.log('⚠️ Database CX-Test1 did not exist or could not be dropped:', error.message);
    }
    
    console.log('🆕 Creating test database CX-Test1...');
    await adminSequelize.query('CREATE DATABASE "CX-Test1";');
    
    await adminSequelize.close();
    console.log('✅ Test database CX-Test1 recreated successfully');
  } catch (error) {
    console.error('❌ Error recreating test database:', error);
    console.log('💡 This might be due to insufficient permissions. Please ensure the user has CREATEDB privileges.');
    throw error;
  }
};

/**
 * Initialize test database with real PostgreSQL
 */
const initializeTestDatabase = async () => {
  try {
    console.log('🔄 Setting up test database CX-Test1...');
    console.log('💡 Using existing CX-Test1 database. Please ensure it is empty for testing.');
    
    // Create new Sequelize instance for testing
    const sequelize = new Sequelize(
      'CX-Test1',
      process.env.DB_USER || 'mabdalla',
      process.env.DB_PASSWORD || '7ouDa-123q',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false, // Disable SQL logging in tests
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: false
        }
      }
    );
    
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Connected to test database CX-Test1');
    
    // Enable UUID extension for PostgreSQL
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    // Import models to ensure they are registered
    require('../../models');
    
    // Sync all models (create tables)
    await sequelize.sync({ force: true });
    console.log('✅ Test database tables created');
    
    return sequelize;
  } catch (error) {
    console.error('❌ Error initializing test database:', error);
    throw error;
  }
};

/**
 * Close test database connection
 */
const closeTestDatabase = async () => {
  try {
    const { sequelize } = require('../../config/database');
    if (sequelize) {
      await sequelize.close();
      console.log('✅ Database connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing test database:', error);
    throw error;
  }
};

/**
 * Clear all data from test database (but keep tables)
 */
const clearTestDatabase = async () => {
  try {
    const { sequelize } = require('../../config/database');
    if (!sequelize) {
      throw new Error('Test database not initialized');
    }
    
    // Use raw SQL to truncate all tables in the correct order
    const truncateQuery = `
      TRUNCATE TABLE 
        "AttendanceRecords",
        "ClassroomSessions",
        "UserNotes", 
        "CourseStats",
        "LessonCompletions",
        "QuizQuestions",
        "CourseContents",
        "CourseSections",
        "Assignments",
        "Attendances",
        "Enrollments",
        "Courses",
        "Users",
        "test_users"
      RESTART IDENTITY CASCADE;
    `;
    
    await sequelize.query(truncateQuery);
    console.log('✅ Test database cleared (real data removed)');
  } catch (error) {
    console.error('❌ Error clearing test database:', error);
    // If truncate fails, try individual table clearing
    try {
      const { sequelize } = require('../../config/database');
      const models = require('../../models');
      
      // Clear tables one by one
      const modelNames = [
        'AttendanceRecord',
        'ClassroomSession', 
        'UserNotes',
        'CourseStats',
        'LessonCompletion',
        'QuizQuestion',
        'CourseContent',
        'CourseSection',
        'Assignment',
        'Attendance',
        'Enrollment',
        'Course',
        'User'
      ];
      
      for (const modelName of modelNames) {
        if (models[modelName]) {
          try {
            await models[modelName].destroy({
              where: {},
              force: true
            });
          } catch (modelError) {
            // Skip if table doesn't exist or has issues
            console.log(`⚠️ Could not clear ${modelName}, skipping...`);
          }
        }
      }
      
      console.log('✅ Test database cleared (fallback method)');
    } catch (fallbackError) {
      console.error('❌ Fallback clearing also failed:', fallbackError);
      throw fallbackError;
    }
  }
};

module.exports = {
  initializeTestDatabase,
  closeTestDatabase,
  clearTestDatabase,
  recreateTestDatabase
};