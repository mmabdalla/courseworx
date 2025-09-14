const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const ExchangeRateHistory = sequelize.define('ExchangeRateHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  exchangeRateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'exchange_rates',
      key: 'id'
    }
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
  previousRate: {
    type: DataTypes.DECIMAL(15, 8),
    allowNull: true
  },
  newRate: {
    type: DataTypes.DECIMAL(15, 8),
    allowNull: false,
    validate: {
      min: 0.00000001
    }
  },
  changePercentage: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true
  },
  changeDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  changeReason: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'manual_update',
    validate: {
      isIn: [['manual_update', 'api_update', 'scheduled_update', 'correction']]
    }
  },
  changedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'exchange_rate_history',
  indexes: [
    {
      fields: ['exchangeRateId']
    },
    {
      fields: ['fromCurrencyId', 'toCurrencyId']
    },
    {
      fields: ['changeDate']
    },
    {
      fields: ['changeReason']
    }
  ]
});

module.exports = ExchangeRateHistory;
