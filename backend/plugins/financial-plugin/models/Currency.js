const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Currency = sequelize.define('Currency', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(3),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 3],
      isUppercase: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  symbol: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  decimalPlaces: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    validate: {
      min: 0,
      max: 4
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isBaseCurrency: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bankAccountDetails: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'currencies',
  indexes: [
    {
      fields: ['code']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['isBaseCurrency']
    }
  ]
});

module.exports = Currency;
