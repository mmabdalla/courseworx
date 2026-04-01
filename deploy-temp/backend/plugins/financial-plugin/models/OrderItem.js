/**
 * Order Item Model for Financial Plugin
 * 
 * This model handles individual items within an order,
 * linking courses to orders with pricing and enrollment details.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrderItem = sequelize.define('FinancialOrderItem', {
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
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id'
      }
    },
    courseType: {
      type: DataTypes.ENUM('online', 'classroom', 'hybrid'),
      allowNull: false
    },
    enrollmentType: {
      type: DataTypes.ENUM('one-time', 'subscription', 'installment'),
      allowNull: false,
      defaultValue: 'one-time'
    },
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    finalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
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
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    enrolledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    enrollmentStatus: {
      type: DataTypes.ENUM('pending', 'enrolled', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    }
  }, {
    tableName: 'financial_order_items',
    timestamps: true,
    indexes: [
      {
        fields: ['orderId']
      },
      {
        fields: ['courseId']
      },
      {
        fields: ['enrollmentStatus']
      }
    ]
  });

  // Instance methods
  OrderItem.prototype.markAsEnrolled = function() {
    this.enrollmentStatus = 'enrolled';
    this.enrolledAt = new Date();
    return this.save();
  };

  OrderItem.prototype.markAsFailed = function() {
    this.enrollmentStatus = 'failed';
    return this.save();
  };

  OrderItem.prototype.calculateDiscount = function(coupon) {
    if (!coupon) {
      this.discountAmount = 0;
      this.finalPrice = this.originalPrice;
      return this;
    }

    if (coupon.type === 'percentage') {
      this.discountAmount = (this.originalPrice * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      this.discountAmount = Math.min(coupon.value, this.originalPrice);
    }

    this.finalPrice = Math.max(0, this.originalPrice - this.discountAmount);
    return this;
  };

  // Static methods
  OrderItem.findByOrder = function(orderId) {
    return this.findAll({
      where: { orderId },
      order: [['createdAt', 'ASC']]
    });
  };

  OrderItem.findByCourse = function(courseId) {
    return this.findAll({
      where: { courseId },
      order: [['createdAt', 'DESC']]
    });
  };

  OrderItem.getCourseStats = function(courseId, startDate, endDate) {
    return this.findAll({
      where: {
        courseId,
        enrollmentStatus: 'enrolled',
        createdAt: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalEnrollments'],
        [sequelize.fn('SUM', sequelize.col('finalPrice')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('finalPrice')), 'averagePrice']
      ]
    });
  };

  return OrderItem;
};
