const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config/test.env') });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'CX-Test1'; // Use the test database

// Increase timeout for database operations
jest.setTimeout(60000);

// Global test utilities
global.testUtils = {
  // Generate test data
  generateTestUser: (overrides = {}) => ({
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    phone: '+1234567890',
    role: 'trainee',
    isActive: true,
    ...overrides
  }),

  generateTestCourse: (overrides = {}) => ({
    title: 'Test Course',
    description: 'Test Course Description',
    shortDescription: 'Short test description',
    price: 99.99,
    duration: 30,
    level: 'beginner',
    category: 'Technology',
    courseType: 'online',
    language: 'english',
    isPublished: true,
    ...overrides
  }),

  generateTestEnrollment: (overrides = {}) => ({
    status: 'active',
    paymentStatus: 'paid',
    enrolledAt: new Date(),
    ...overrides
  }),

  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random string
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate random email
  randomEmail: () => `test${Date.now()}${Math.random().toString(36).substr(2, 5)}@example.com`,

  // Generate random phone
  randomPhone: () => `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`
};

// Mock console methods in test environment to reduce noise
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Restore console for debugging when needed
global.restoreConsole = () => {
  global.console = originalConsole;
};

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // Clear timers
  jest.clearAllTimers();

  // Reset modules if needed
  jest.resetModules();
});

// Global cleanup after all tests
afterAll(async () => {
  // Close any open database connections
  try {
    const { sequelize } = require('../config/database');
    if (sequelize && sequelize.close) {
      await sequelize.close();
    }
  } catch (error) {
    // Ignore errors during cleanup
  }
});