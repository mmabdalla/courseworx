/**
 * User Model Tests
 * Tests with REAL PostgreSQL data - NO MOCKS, NO FAKE DATA
 */

const { User } = require('../../models');
const { 
  initializeTestDatabase, 
  closeTestDatabase, 
  clearTestDatabase 
} = require('../helpers/database');
const { createTestUser } = require('../helpers/factories');

describe('User Model - Real PostgreSQL Data', () => {
  let testDb;

  beforeAll(async () => {
    testDb = await initializeTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('User Creation with Real Data', () => {
    it('should create a user successfully with valid data', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+1234567890',
        role: 'trainee'
      };

      const user = await User.create(userData);
      
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.firstName).toBe(userData.firstName);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.isActive).toBe(true);
      expect(user.password).not.toBe(userData.password); // Password should be hashed
    });

    it('should hash the password before creating a user', async () => {
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'password123',
        phone: '+1234567891',
        role: 'trainer'
      };

      const user = await User.create(userData);
      const isMatch = await user.comparePassword(userData.password);
      expect(isMatch).toBe(true);
    });

    it('should not allow creating a user with a duplicate email', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'duplicate@example.com',
        password: 'password123',
        phone: '+1234567890',
        role: 'trainee'
      };

      // Create first user
      await User.create(userData);
      
      // Try to create second user with same email
      await expect(User.create(userData)).rejects.toThrow(/Validation error/);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        firstName: 'John',
        // Missing lastName, email, password
        phone: '+1234567890',
        role: 'trainee'
      };

      await expect(User.create(invalidData)).rejects.toThrow(/notEmpty/);
    });

    it('should validate email format', async () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email-format',
        password: 'password123',
        phone: '+1234567890',
        role: 'trainee'
      };

      await expect(User.create(invalidData)).rejects.toThrow(/isEmail/);
    });
  });

  describe('User Instance Methods with Real Data', () => {
    it('comparePassword should return true for correct password', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123'
      });
      
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);
    });

    it('comparePassword should return false for incorrect password', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        password: 'password123'
      });
      
      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    it('getFullName should return the full name', async () => {
      const user = await createTestUser({
        firstName: 'John',
        lastName: 'Doe'
      });
      
      expect(user.getFullName()).toBe('John Doe');
    });
  });

  describe('User Updates with Real Data', () => {
    it('should update user details successfully', async () => {
      const user = await createTestUser({
        firstName: 'John',
        lastName: 'Doe'
      });
      
      const newFirstName = 'UpdatedJohn';
      await user.update({ firstName: newFirstName });
      
      expect(user.firstName).toBe(newFirstName);
    });

    it('should re-hash password if password is changed', async () => {
      const user = await createTestUser({
        password: 'oldpassword123'
      });
      
      const oldPasswordHash = user.password;
      const newPassword = 'newSecurePassword123';
      
      await user.update({ password: newPassword });
      
      expect(user.password).not.toBe(oldPasswordHash);
      const isMatch = await user.comparePassword(newPassword);
      expect(isMatch).toBe(true);
    });
  });

  describe('User Queries with Real Data', () => {
    it('should find active users', async () => {
      await createTestUser({ isActive: true });
      await createTestUser({ isActive: false });
      
      const activeUsers = await User.findAll({
        where: { isActive: true }
      });
      
      expect(activeUsers.length).toBe(1);
    });

    it('should find users by role', async () => {
      await createTestUser({ role: 'trainer' });
      await createTestUser({ role: 'trainee' });
      
      const trainers = await User.findAll({
        where: { role: 'trainer' }
      });
      
      expect(trainers.length).toBe(1);
    });
  });
});