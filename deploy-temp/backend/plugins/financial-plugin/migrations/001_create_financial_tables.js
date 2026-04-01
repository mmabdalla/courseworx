/**
 * Migration: Create Financial Plugin Tables
 * 
 * This migration creates all the necessary tables for the financial plugin
 * including cart, orders, coupons, and related tables.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create financial_carts table
    await queryInterface.createTable('financial_carts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      sessionId: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true
      },
      items: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      discountAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      taxAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      finalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      couponCode: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP + INTERVAL \'24 hours\'')
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create financial_orders table
    await queryInterface.createTable('financial_orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      orderNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'failed', 'refunded', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      discountAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      taxAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      finalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      paymentMethod: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      gatewayTransactionId: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      couponId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      refundedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      refundAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create financial_order_items table
    await queryInterface.createTable('financial_order_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'financial_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      courseId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'courses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      courseType: {
        type: Sequelize.ENUM('online', 'classroom', 'hybrid'),
        allowNull: false
      },
      enrollmentType: {
        type: Sequelize.ENUM('one-time', 'subscription', 'installment'),
        allowNull: false,
        defaultValue: 'one-time'
      },
      originalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      finalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      discountAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      enrolledAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      enrollmentStatus: {
        type: Sequelize.ENUM('pending', 'enrolled', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create financial_coupons table
    await queryInterface.createTable('financial_coupons', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('percentage', 'fixed', 'free_shipping'),
        allowNull: false
      },
      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      maxUses: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      usedCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      validFrom: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      validTo: {
        type: Sequelize.DATE,
        allowNull: true
      },
      applicableCourses: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null
      },
      minOrderAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create financial_transactions table
    await queryInterface.createTable('financial_transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'financial_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      gatewayFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      platformFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      gatewayResponse: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      webhookData: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create financial_payouts table
    await queryInterface.createTable('financial_payouts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      trainerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'financial_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      platformFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      trainerShare: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      stripeTransferId: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add foreign key constraint for couponId in financial_orders
    await queryInterface.addConstraint('financial_orders', {
      fields: ['couponId'],
      type: 'foreign key',
      name: 'fk_financial_orders_coupon_id',
      references: {
        table: 'financial_coupons',
        field: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Create indexes
    await queryInterface.addIndex('financial_carts', ['userId']);
    await queryInterface.addIndex('financial_carts', ['sessionId']);
    await queryInterface.addIndex('financial_carts', ['expiresAt']);
    
    await queryInterface.addIndex('financial_orders', ['userId']);
    await queryInterface.addIndex('financial_orders', ['orderNumber']);
    await queryInterface.addIndex('financial_orders', ['status']);
    await queryInterface.addIndex('financial_orders', ['gatewayTransactionId']);
    
    await queryInterface.addIndex('financial_order_items', ['orderId']);
    await queryInterface.addIndex('financial_order_items', ['courseId']);
    await queryInterface.addIndex('financial_order_items', ['enrollmentStatus']);
    
    await queryInterface.addIndex('financial_coupons', ['code']);
    await queryInterface.addIndex('financial_coupons', ['isActive']);
    await queryInterface.addIndex('financial_coupons', ['validFrom', 'validTo']);
    
    await queryInterface.addIndex('financial_transactions', ['orderId']);
    await queryInterface.addIndex('financial_transactions', ['status']);
    
    await queryInterface.addIndex('financial_payouts', ['trainerId']);
    await queryInterface.addIndex('financial_payouts', ['orderId']);
    await queryInterface.addIndex('financial_payouts', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('financial_payouts');
    await queryInterface.dropTable('financial_transactions');
    await queryInterface.dropTable('financial_coupons');
    await queryInterface.dropTable('financial_order_items');
    await queryInterface.dropTable('financial_orders');
    await queryInterface.dropTable('financial_carts');
  }
};
