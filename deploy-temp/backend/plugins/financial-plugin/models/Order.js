/**
 * Order Model for Financial Plugin
 * 
 * This model handles order management including order creation,
 * status tracking, and order history.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('FinancialOrder', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    finalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    gatewayTransactionId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    couponId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'financial_coupons',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00
    }
  }, {
    tableName: 'financial_orders',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['orderNumber']
      },
      {
        fields: ['status']
      },
      {
        fields: ['gatewayTransactionId']
      }
    ]
  });

  // Instance methods
  Order.prototype.markAsPaid = function(transactionId, paymentMethod) {
    this.status = 'paid';
    this.gatewayTransactionId = transactionId;
    this.paymentMethod = paymentMethod;
    this.paidAt = new Date();
    return this.save();
  };

  Order.prototype.markAsFailed = function() {
    this.status = 'failed';
    return this.save();
  };

  Order.prototype.markAsRefunded = function(refundAmount) {
    this.status = 'refunded';
    this.refundAmount = refundAmount;
    this.refundedAt = new Date();
    return this.save();
  };

  Order.prototype.markAsCancelled = function() {
    this.status = 'cancelled';
    return this.save();
  };

  Order.prototype.calculateTotals = function() {
    // This will be calculated based on order items
    // Implementation will be added when OrderItem model is created
    return this;
  };

  // Static methods
  Order.generateOrderNumber = function() {
    const prefix = 'ORD-';
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}${timestamp}${random}`.toUpperCase();
  };

  Order.findByOrderNumber = function(orderNumber) {
    return this.findOne({ where: { orderNumber } });
  };

  Order.findByUser = function(userId, options = {}) {
    return this.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      ...options
    });
  };

  Order.getRevenueStats = function(startDate, endDate) {
    return this.findAll({
      where: {
        status: 'paid',
        createdAt: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('finalAmount')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('finalAmount')), 'averageOrderValue']
      ]
    });
  };

  return Order;
};
