/**
 * Simple Database Test
 * Tests basic database connectivity with REAL PostgreSQL data
 */

const { Sequelize, DataTypes } = require('sequelize');
const { initializeTestDatabase, closeTestDatabase, clearTestDatabase } = require('./helpers/database');

describe('Simple Database Test - Real PostgreSQL', () => {
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

  it('should connect to PostgreSQL database', async () => {
    expect(testDb).toBeDefined();
    await testDb.authenticate();
    expect(true).toBe(true); // If authenticate doesn't throw, connection is good
  });

  it('should create a simple table', async () => {
    const TestModel = testDb.define('TestModel', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: DataTypes.STRING,
      value: DataTypes.INTEGER
    }, { freezeTableName: true });
    
    await TestModel.sync({ force: true });
    const tables = await testDb.getQueryInterface().showAllTables();
    expect(tables).toContain('TestModel');
  });

  it('should handle basic CRUD operations', async () => {
    const TestModel = testDb.define('TestModel', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: DataTypes.STRING,
      value: DataTypes.INTEGER
    }, { freezeTableName: true });
    
    await TestModel.sync({ force: true });

    // Create
    const item = await TestModel.create({ name: 'Test Item', value: 100 });
    expect(item).toBeDefined();
    expect(item.name).toBe('Test Item');

    // Read
    const foundItem = await TestModel.findByPk(item.id);
    expect(foundItem).toBeDefined();
    expect(foundItem.value).toBe(100);

    // Update
    await foundItem.update({ value: 200 });
    const updatedItem = await TestModel.findByPk(item.id);
    expect(updatedItem.value).toBe(200);

    // Delete
    await updatedItem.destroy();
    const deletedItem = await TestModel.findByPk(item.id);
    expect(deletedItem).toBeNull();
  });

  it('should test UUID functionality', async () => {
    // Enable UUID extension
    await testDb.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    
    const TestModel = testDb.define('TestModel', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: DataTypes.STRING
    }, { freezeTableName: true });
    
    await TestModel.sync({ force: true });

    const item = await TestModel.create({ name: 'UUID Test' });
    expect(item).toBeDefined();
    expect(item.id).toBeDefined();
    expect(typeof item.id).toBe('string');
    expect(item.id.length).toBeGreaterThan(30); // UUID should be long
  });
});



