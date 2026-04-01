const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const ExchangeRate = sequelize.define('ExchangeRate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fromCurrencyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'currencies',
      key: 'id'
    }
  },
  toCurrencyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'currencies',
      key: 'id'
    }
  },
  rate: {
    type: DataTypes.DECIMAL(15, 8),
    allowNull: false,
    validate: {
      min: 0.00000001
    }
  },
  effectiveDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  source: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'manual',
    validate: {
      isIn: [['manual', 'api', 'import']]
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'exchange_rates',
  indexes: [
    {
      fields: ['fromCurrencyId', 'toCurrencyId']
    },
    {
      fields: ['effectiveDate']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['fromCurrencyId', 'toCurrencyId', 'effectiveDate']
    }
  ]
});

module.exports = ExchangeRate;
