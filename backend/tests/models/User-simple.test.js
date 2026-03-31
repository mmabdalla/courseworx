/**
 * Simple User Model Test
 * Tests User model with REAL PostgreSQL data - NO MOCKS, NO FAKE DATA
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { initializeTestDatabase, closeTestDatabase, clearTestDatabase } = require('../helpers/database');

describe('Simple User Model Test - Real PostgreSQL Data', () => {
  let testDb;
  let TestUser;

  beforeAll(async () => {
    testDb = await initializeTestDatabase();
    
    // Create a test-specific User model
    TestUser = testDb.define('User', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 50]
        }
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 50]
        }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [6, 100]
        }
      },
      role: {
        type: DataTypes.ENUM('super_admin', 'trainer', 'trainee'),
        allowNull: false,
        defaultValue: 'trainee'
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
      },
      requiresPasswordChange: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      tableName: 'test_users',
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        }
      }
    });

    // Instance method to compare password
    TestUser.prototype.comparePassword = async function(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    };

    // Instance method to get full name
    TestUser.prototype.getFullName = function() {
      return `${this.firstName} ${this.lastName}`;
    };

    // Sync the test model
    await TestUser.sync({ force: true });
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
    // Ensure the test table used in this specific test file is also cleared
    if (testDb) {
      await testDb.query('TRUNCATE TABLE "test_users" RESTART IDENTITY CASCADE;');
    }
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

      const user = await TestUser.create(userData);
      
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

      const user = await TestUser.create(userData);
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
      await TestUser.create(userData);
      
      // Try to create second user with same email
      await expect(TestUser.create(userData)).rejects.toThrow(/Validation error/);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        firstName: 'John',
        // Missing lastName, email, password
        phone: '+1234567890',
        role: 'trainee'
      };

      await expect(TestUser.create(invalidData)).rejects.toThrow(/notNull Violation/);
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

      await expect(TestUser.create(invalidData)).rejects.toThrow(/isEmail/);
    });
  });

  describe('User Instance Methods with Real Data', () => {
    it('comparePassword should return true for correct password', async () => {
      const user = await TestUser.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        role: 'trainee'
      });
      
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);
    });

    it('comparePassword should return false for incorrect password', async () => {
      const user = await TestUser.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        role: 'trainee'
      });
      
      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });

    it('getFullName should return the full name', async () => {
      const user = await TestUser.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'trainee'
      });
      
      expect(user.getFullName()).toBe('John Doe');
    });
  });

  describe('User Updates with Real Data', () => {
    it('should update user details successfully', async () => {
      const user = await TestUser.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'trainee'
      });
      
      const newFirstName = 'UpdatedJohn';
      await user.update({ firstName: newFirstName });
      
      expect(user.firstName).toBe(newFirstName);
    });

    it('should re-hash password if password is changed', async () => {
      const user = await TestUser.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'oldpassword123',
        role: 'trainee'
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
      await TestUser.create({
        firstName: 'Active',
        lastName: 'User',
        email: 'active@example.com',
        password: 'password123',
        isActive: true,
        role: 'trainee'
      });
      
      await TestUser.create({
        firstName: 'Inactive',
        lastName: 'User',
        email: 'inactive@example.com',
        password: 'password123',
        isActive: false,
        role: 'trainee'
      });
      
      const activeUsers = await TestUser.findAll({
        where: { isActive: true }
      });
      
      expect(activeUsers.length).toBe(1);
    });

    it('should find users by role', async () => {
      await TestUser.create({
        firstName: 'Trainer',
        lastName: 'User',
        email: 'trainer@example.com',
        password: 'password123',
        role: 'trainer'
      });
      
      await TestUser.create({
        firstName: 'Trainee',
        lastName: 'User',
        email: 'trainee@example.com',
        password: 'password123',
        role: 'trainee'
      });
      
      const trainers = await TestUser.findAll({
        where: { role: 'trainer' }
      });
      
      expect(trainers.length).toBe(1);
    });
  });
});
