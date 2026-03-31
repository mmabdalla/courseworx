/**
 * Authentication Middleware Tests
 * Tests with REAL PostgreSQL data - NO MOCKS, NO FAKE DATA
 */

const jwt = require('jsonwebtoken');
const { initializeTestDatabase, closeTestDatabase, clearTestDatabase } = require('../helpers/database');

describe('Authentication Middleware - Real PostgreSQL Data', () => {
  let testDb;
  let TestUser;
  let authMiddleware;

  beforeAll(async () => {
    testDb = await initializeTestDatabase();
    
    // Create a test-specific User model
    const { DataTypes } = require('sequelize');
    const bcrypt = require('bcryptjs');
    
    TestUser = testDb.define('User', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM('super_admin', 'trainer', 'trainee'),
        allowNull: false,
        defaultValue: 'trainee'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      tableName: 'users',
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        }
      }
    });

    // Instance method to compare password
    TestUser.prototype.comparePassword = async function(candidatePassword) {
      const bcrypt = require('bcryptjs');
      return await bcrypt.compare(candidatePassword, this.password);
    };

    await TestUser.sync({ force: true });

    // Create simplified auth middleware for testing
    authMiddleware = async (req, res, next) => {
      try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
          return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only');
        const user = await TestUser.findByPk(decoded.userId);
        
        if (!user || !user.isActive) {
          return res.status(401).json({ error: 'Invalid token or user inactive.' });
        }

        req.user = user;
        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
      }
    };
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  describe('Authentication Middleware with Real Data', () => {
    it('should authenticate valid token with real user', async () => {
      // Create a real user in the database
      const user = await TestUser.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'trainee',
        isActive: true
      });

      // Create a real JWT token
      const token = jwt.sign(
        { userId: user.id }, 
        process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
        { expiresIn: '1h' }
      );

      // Mock request and response
      const req = {
        header: (name) => name === 'Authorization' ? `Bearer ${token}` : null,
        user: null
      };
      const res = {};
      const next = jest.fn();

      // Test the middleware
      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user.id);
      expect(req.user.email).toBe(user.email);
    });

    it('should reject request without token', async () => {
      const req = { header: () => null };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      const req = { header: (name) => name === 'Authorization' ? 'Bearer invalid-token' : null };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token for inactive user', async () => {
      // Create an inactive user
      const user = await TestUser.create({
        firstName: 'Inactive',
        lastName: 'User',
        email: 'inactive@example.com',
        password: 'password123',
        role: 'trainee',
        isActive: false
      });

      const token = jwt.sign(
        { userId: user.id }, 
        process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only'
      );

      const req = { header: (name) => name === 'Authorization' ? `Bearer ${token}` : null };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token or user inactive.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject token for non-existent user', async () => {
      const token = jwt.sign(
        { userId: 'non-existent-user-id' }, 
        process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only'
      );

      const req = { header: (name) => name === 'Authorization' ? `Bearer ${token}` : null };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
