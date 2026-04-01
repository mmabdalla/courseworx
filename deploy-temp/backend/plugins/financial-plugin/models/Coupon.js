/**
 * Coupon Model for Financial Plugin
 * 
 * This model handles discount coupons and promotional codes
 * for the shopping cart and checkout system.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Coupon = sequelize.define('FinancialCoupon', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        isUppercase: true
      }
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('percentage', 'fixed', 'free_shipping'),
      allowNull: false
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    maxUses: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    usedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    validTo: {
      type: DataTypes.DATE,
      allowNull: true
    },
    applicableCourses: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null // null means applicable to all courses
    },
    minOrderAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    tableName: 'financial_coupons',
    timestamps: true,
    indexes: [
      {
        fields: ['code']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['validFrom', 'validTo']
      }
    ]
  });

  // Instance methods
  Coupon.prototype.isValid = function() {
    const now = new Date();
    
    // Check if coupon is active
    if (!this.isActive) {
      return { valid: false, reason: 'Coupon is not active' };
    }
    
    // Check if coupon has expired
    if (this.validTo && now > this.validTo) {
      return { valid: false, reason: 'Coupon has expired' };
    }
    
    // Check if coupon is not yet valid
    if (now < this.validFrom) {
      return { valid: false, reason: 'Coupon is not yet valid' };
    }
    
    // Check usage limits
    if (this.maxUses && this.usedCount >= this.maxUses) {
      return { valid: false, reason: 'Coupon usage limit reached' };
    }
    
    return { valid: true };
  };

  Coupon.prototype.canApplyToCourse = function(courseId) {
    if (!this.applicableCourses) {
      return true; // Applicable to all courses
    }
    
    return this.applicableCourses.includes(courseId);
  };

  Coupon.prototype.canApplyToOrder = function(orderAmount) {
    if (!this.minOrderAmount) {
      return true; // No minimum order amount required
    }
    
    return orderAmount >= this.minOrderAmount;
  };

  Coupon.prototype.calculateDiscount = function(orderAmount, courseId) {
    const validation = this.isValid();
    if (!validation.valid) {
      return { discount: 0, reason: validation.reason };
    }
    
    if (!this.canApplyToCourse(courseId)) {
      return { discount: 0, reason: 'Coupon not applicable to this course' };
    }
    
    if (!this.canApplyToOrder(orderAmount)) {
      return { discount: 0, reason: `Minimum order amount of $${this.minOrderAmount} required` };
    }
    
    let discount = 0;
    
    if (this.type === 'percentage') {
      discount = (orderAmount * this.value) / 100;
    } else if (this.type === 'fixed') {
      discount = Math.min(this.value, orderAmount);
    } else if (this.type === 'free_shipping') {
      // Free shipping logic would be implemented here
      discount = 0; // Placeholder
    }
    
    return { discount, reason: null };
  };

  Coupon.prototype.incrementUsage = function() {
    this.usedCount += 1;
    return this.save();
  };

  Coupon.prototype.decrementUsage = function() {
    if (this.usedCount > 0) {
      this.usedCount -= 1;
      return this.save();
    }
    return this;
  };

  // Static methods
  Coupon.findByCode = function(code) {
    return this.findOne({
      where: { 
        code: code.toUpperCase(),
        isActive: true
      }
    });
  };

  Coupon.findActive = function() {
    const now = new Date();
    return this.findAll({
      where: {
        isActive: true,
        validFrom: {
          [sequelize.Sequelize.Op.lte]: now
        },
        [sequelize.Sequelize.Op.or]: [
          { validTo: null },
          { validTo: { [sequelize.Sequelize.Op.gte]: now } }
        ]
      },
      order: [['createdAt', 'DESC']]
    });
  };

  Coupon.generateCode = function(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  Coupon.createUniqueCode = async function(length = 8) {
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = this.generateCode(length);
      const existing = await this.findByCode(code);
      if (!existing) {
        isUnique = true;
      }
    }
    
    return code;
  };

  return Coupon;
};
