/**
 * Transaction Model for Financial Plugin
 * 
 * This model handles payment transactions including
 * gateway responses, fees, and processing status.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('FinancialTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'financial_orders',
        key: 'id',
        onDelete: 'CASCADE'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    gatewayFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    platformFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    gatewayResponse: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    webhookData: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'financial_transactions',
    timestamps: true,
    indexes: [
      {
        fields: ['orderId']
      },
      {
        fields: ['status']
      }
    ]
  });

  // Instance methods
  Transaction.prototype.markAsCompleted = function(gatewayResponse) {
    this.status = 'completed';
    this.gatewayResponse = gatewayResponse;
    this.processedAt = new Date();
    return this.save();
  };

  Transaction.prototype.markAsFailed = function(gatewayResponse) {
    this.status = 'failed';
    this.gatewayResponse = gatewayResponse;
    this.processedAt = new Date();
    return this.save();
  };

  Transaction.prototype.markAsRefunded = function() {
    this.status = 'refunded';
    this.processedAt = new Date();
    return this.save();
  };

  // Static methods
  Transaction.findByOrder = function(orderId) {
    return this.findAll({
      where: { orderId },
      order: [['createdAt', 'DESC']]
    });
  };

  Transaction.getTotalFees = function(orderId) {
    return this.sum('gatewayFee', {
      where: { orderId, status: 'completed' }
    });
  };

  return Transaction;
};
