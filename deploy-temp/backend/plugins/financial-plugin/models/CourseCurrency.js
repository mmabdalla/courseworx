const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const CourseCurrency = sequelize.define('CourseCurrency', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  baseCurrencyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'currencies',
      key: 'id'
    }
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  allowedPaymentCurrencies: {
    type: DataTypes.ARRAY(DataTypes.UUID),
    allowNull: false,
    defaultValue: []
  },
  customExchangeRates: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'course_currencies',
  indexes: [
    {
      fields: ['courseId']
    },
    {
      fields: ['baseCurrencyId']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = CourseCurrency;
