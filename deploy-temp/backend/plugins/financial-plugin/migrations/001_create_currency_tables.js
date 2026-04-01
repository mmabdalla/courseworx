/**
 * Migration: Create Currency and Exchange Rate Tables
 * 
 * This migration creates the necessary tables for multi-currency support:
 * - currencies: Store currency information
 * - exchange_rates: Store current exchange rates
 * - exchange_rate_history: Store historical exchange rate changes
 * - course_currencies: Link courses to their base currency and allowed payment currencies
 */

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create currencies table
    await queryInterface.createTable('currencies', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      code: {
        type: DataTypes.STRING(3),
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      symbol: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      decimalPlaces: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2
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
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Create exchange_rates table
    await queryInterface.createTable('exchange_rates', {
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
        allowNull: false
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
        type: DataTypes.ENUM('manual', 'api', 'import'),
        allowNull: false,
        defaultValue: 'manual'
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Create exchange_rate_history table
    await queryInterface.createTable('exchange_rate_history', {
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
        allowNull: false
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
        type: DataTypes.ENUM('manual_update', 'api_update', 'scheduled_update', 'correction'),
        allowNull: false,
        defaultValue: 'manual_update'
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Create course_currencies table
    await queryInterface.createTable('course_currencies', {
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
        allowNull: false
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Create indexes
    await queryInterface.addIndex('currencies', ['code']);
    await queryInterface.addIndex('currencies', ['isActive']);
    await queryInterface.addIndex('currencies', ['isBaseCurrency']);

    await queryInterface.addIndex('exchange_rates', ['fromCurrencyId', 'toCurrencyId']);
    await queryInterface.addIndex('exchange_rates', ['effectiveDate']);
    await queryInterface.addIndex('exchange_rates', ['isActive']);
    await queryInterface.addIndex('exchange_rates', ['fromCurrencyId', 'toCurrencyId', 'effectiveDate']);

    await queryInterface.addIndex('exchange_rate_history', ['exchangeRateId']);
    await queryInterface.addIndex('exchange_rate_history', ['fromCurrencyId', 'toCurrencyId']);
    await queryInterface.addIndex('exchange_rate_history', ['changeDate']);
    await queryInterface.addIndex('exchange_rate_history', ['changeReason']);

    await queryInterface.addIndex('course_currencies', ['courseId']);
    await queryInterface.addIndex('course_currencies', ['baseCurrencyId']);
    await queryInterface.addIndex('course_currencies', ['isActive']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order due to foreign key constraints
    await queryInterface.dropTable('course_currencies');
    await queryInterface.dropTable('exchange_rate_history');
    await queryInterface.dropTable('exchange_rates');
    await queryInterface.dropTable('currencies');
  }
};
