/**
 * Cart Model for Financial Plugin
 * 
 * This model handles shopping cart functionality including
 * adding/removing items, calculating totals, and managing sessions.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cart = sequelize.define('FinancialCart', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // Allow anonymous carts
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.STRING(255),
      allowNull: true, // For anonymous users
      unique: true
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidItems(value) {
          if (!Array.isArray(value)) {
            throw new Error('Items must be an array');
          }
          value.forEach(item => {
            if (!item.courseId || !item.price || !item.type) {
              throw new Error('Each item must have courseId, price, and type');
            }
          });
        }
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
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
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    couponCode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    }
  }, {
    tableName: 'financial_carts',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['sessionId']
      },
      {
        fields: ['expiresAt']
      }
    ]
  });

  // Instance methods
  Cart.prototype.addItem = function(courseId, price, type, quantity = 1) {
    const items = [...this.items];
    const existingItemIndex = items.findIndex(item => item.courseId === courseId);
    
    if (existingItemIndex >= 0) {
      items[existingItemIndex].quantity += quantity;
    } else {
      items.push({
        courseId,
        price: parseFloat(price),
        type,
        quantity,
        addedAt: new Date()
      });
    }
    
    this.items = items;
    this.calculateTotals();
    return this;
  };

  Cart.prototype.removeItem = function(courseId) {
    this.items = this.items.filter(item => item.courseId !== courseId);
    this.calculateTotals();
    return this;
  };

  Cart.prototype.updateItemQuantity = function(courseId, quantity) {
    if (quantity <= 0) {
      return this.removeItem(courseId);
    }
    
    const items = [...this.items];
    const itemIndex = items.findIndex(item => item.courseId === courseId);
    
    if (itemIndex >= 0) {
      items[itemIndex].quantity = quantity;
      this.items = items;
      this.calculateTotals();
    }
    
    return this;
  };

  Cart.prototype.calculateTotals = function() {
    const subtotal = this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    this.totalAmount = subtotal;
    this.finalAmount = subtotal - this.discountAmount + this.taxAmount;
    
    return this;
  };

  Cart.prototype.applyCoupon = function(coupon) {
    if (!coupon) return this;
    
    this.couponCode = coupon.code;
    
    if (coupon.type === 'percentage') {
      this.discountAmount = (this.totalAmount * coupon.value) / 100;
    } else if (coupon.type === 'fixed') {
      this.discountAmount = Math.min(coupon.value, this.totalAmount);
    }
    
    this.calculateTotals();
    return this;
  };

  Cart.prototype.clear = function() {
    this.items = [];
    this.totalAmount = 0;
    this.discountAmount = 0;
    this.taxAmount = 0;
    this.finalAmount = 0;
    this.couponCode = null;
    return this;
  };

  Cart.prototype.isExpired = function() {
    return new Date() > this.expiresAt;
  };

  // Static methods
  Cart.findByUserOrSession = function(userId, sessionId) {
    if (userId) {
      return this.findOne({ where: { userId } });
    } else if (sessionId) {
      return this.findOne({ where: { sessionId } });
    }
    return null;
  };

  Cart.cleanupExpired = function() {
    return this.destroy({
      where: {
        expiresAt: {
          [sequelize.Sequelize.Op.lt]: new Date()
        }
      }
    });
  };

  return Cart;
};
