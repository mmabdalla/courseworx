/**
 * Financial Plugin Models Index
 * 
 * This file initializes all financial plugin models with Sequelize
 * and sets up their associations.
 */

const { sequelize } = require('../../../config/database');
const { User, Course } = require('../../../models');

// Initialize financial plugin models
const Cart = require('./Cart')(sequelize);
const Order = require('./Order')(sequelize);
const OrderItem = require('./OrderItem')(sequelize);
const Coupon = require('./Coupon')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const Payout = require('./Payout')(sequelize);

// Currency and exchange rate models
const Currency = require('./Currency');
const ExchangeRate = require('./ExchangeRate');
const ExchangeRateHistory = require('./ExchangeRateHistory');
const CourseCurrency = require('./CourseCurrency');

// Set up associations
// Cart associations
Cart.belongsTo(User, { as: 'user', foreignKey: 'userId' });

// Order associations
Order.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Order.belongsTo(Coupon, { as: 'coupon', foreignKey: 'couponId' });
Order.hasMany(OrderItem, { as: 'items', foreignKey: 'orderId' });
Order.hasMany(Transaction, { as: 'transactions', foreignKey: 'orderId' });
Order.hasMany(Payout, { as: 'payouts', foreignKey: 'orderId' });

// OrderItem associations
OrderItem.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });
OrderItem.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });

// Coupon associations
Coupon.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// Transaction associations
Transaction.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });

// Payout associations
Payout.belongsTo(User, { as: 'trainer', foreignKey: 'trainerId' });
Payout.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });

// Currency associations
ExchangeRate.belongsTo(Currency, { as: 'fromCurrency', foreignKey: 'fromCurrencyId' });
ExchangeRate.belongsTo(Currency, { as: 'toCurrency', foreignKey: 'toCurrencyId' });
ExchangeRate.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

// Exchange rate history associations
ExchangeRateHistory.belongsTo(ExchangeRate, { as: 'exchangeRate', foreignKey: 'exchangeRateId' });
ExchangeRateHistory.belongsTo(Currency, { as: 'fromCurrency', foreignKey: 'fromCurrencyId' });
ExchangeRateHistory.belongsTo(Currency, { as: 'toCurrency', foreignKey: 'toCurrencyId' });
ExchangeRateHistory.belongsTo(User, { as: 'changer', foreignKey: 'changedBy' });

// Course currency associations
CourseCurrency.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });
CourseCurrency.belongsTo(Currency, { as: 'baseCurrency', foreignKey: 'baseCurrencyId' });

module.exports = {
  Cart,
  Order,
  OrderItem,
  Coupon,
  Transaction,
  Payout,
  Currency,
  ExchangeRate,
  ExchangeRateHistory,
  CourseCurrency
};
