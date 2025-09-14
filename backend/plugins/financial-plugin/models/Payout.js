/**
 * Payout Model for Financial Plugin
 * 
 * This model handles instructor payouts including
 * revenue sharing, platform fees, and transfer tracking.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payout = sequelize.define('FinancialPayout', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    trainerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
        onDelete: 'CASCADE'
      }
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
    platformFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    trainerShare: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    stripeTransferId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'financial_payouts',
    timestamps: true,
    indexes: [
      {
        fields: ['trainerId']
      },
      {
        fields: ['orderId']
      },
      {
        fields: ['status']
      }
    ]
  });

  // Instance methods
  Payout.prototype.markAsProcessing = function() {
    this.status = 'processing';
    return this.save();
  };

  Payout.prototype.markAsCompleted = function(stripeTransferId) {
    this.status = 'completed';
    this.stripeTransferId = stripeTransferId;
    this.processedAt = new Date();
    return this.save();
  };

  Payout.prototype.markAsFailed = function() {
    this.status = 'failed';
    this.processedAt = new Date();
    return this.save();
  };

  // Static methods
  Payout.findByTrainer = function(trainerId, options = {}) {
    return this.findAll({
      where: { trainerId },
      order: [['createdAt', 'DESC']],
      ...options
    });
  };

  Payout.getTrainerEarnings = function(trainerId, startDate, endDate) {
    return this.findAll({
      where: {
        trainerId,
        status: 'completed',
        createdAt: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalPayouts'],
        [sequelize.fn('SUM', sequelize.col('trainerShare')), 'totalEarnings'],
        [sequelize.fn('SUM', sequelize.col('platformFee')), 'totalPlatformFees']
      ]
    });
  };

  Payout.getPendingPayouts = function() {
    return this.findAll({
      where: { status: 'pending' },
      order: [['createdAt', 'ASC']]
    });
  };

  return Payout;
};
