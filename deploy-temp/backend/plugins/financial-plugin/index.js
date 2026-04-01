/**
 * Financial Plugin for CourseWorx
 * 
 * This plugin provides financial management capabilities including:
 * - Payment processing
 * - Revenue tracking
 * - Payout management
 * - Financial reporting
 */

const pluginEventSystem = require('../../core/plugin-events');

/**
 * Plugin registration function
 * @param {Object} context - Registration context
 */
async function register(context) {
  const { app, registry, pluginName, packageJson } = context;
  
  console.log(`💰 Registering Financial Plugin: ${pluginName} v${packageJson.version}`);
  
  // 1. Register API Routes (load routes conditionally to avoid Stripe initialization issues)
  try {
    const financialRouter = require('./routes/api');
    const cartRouter = require('./routes/cart');
    const checkoutRouter = require('./routes/checkout');
    const ordersRouter = require('./routes/orders');
    const couponsRouter = require('./routes/coupons');
    const currenciesRouter = require('./routes/currencies');
    registry.registerApiRoutes(pluginName, '/api/financial', financialRouter);
    registry.registerApiRoutes(pluginName, '/api/financial/cart', cartRouter);
    registry.registerApiRoutes(pluginName, '/api/financial/checkout', checkoutRouter);
    registry.registerApiRoutes(pluginName, '/api/financial/orders', ordersRouter);
    registry.registerApiRoutes(pluginName, '/api/financial/coupons', couponsRouter);
    registry.registerApiRoutes(pluginName, '/api/financial', currenciesRouter);
    
    console.log(`✅ Financial Plugin routes registered successfully`);
  } catch (error) {
    console.error(`❌ Failed to load financial plugin routes: ${error.message}`);
    // Continue with plugin registration even if routes fail
  }
  
  // 2. Register Admin Menu Items
  const menuItems = [
    {
      section: 'sa', // Super Admin
      title: 'Financial Dashboard',
      path: '/admin/financial',
      icon: 'CurrencyDollarIcon',
      order: 1
    },
    {
      section: 'sa',
      title: 'Payment Management',
      path: '/admin/payments',
      icon: 'CreditCardIcon',
      order: 2
    },
    {
      section: 'sa',
      title: 'Order Management',
      path: '/admin/orders',
      icon: 'ClipboardDocumentListIcon',
      order: 3
    },
    {
      section: 'sa',
      title: 'Coupon Management',
      path: '/admin/coupons',
      icon: 'TicketIcon',
      order: 4
    },
    {
      section: 'sa',
      title: 'Revenue Reports',
      path: '/admin/revenue',
      icon: 'ChartBarIcon',
      order: 5
    },
    {
      section: 'sa',
      title: 'Currency Management',
      path: '/admin/currencies',
      icon: 'CurrencyDollarIcon',
      order: 6
    },
    {
      section: 'sa',
      title: 'Exchange Rates',
      path: '/admin/exchange-rates',
      icon: 'ArrowsRightLeftIcon',
      order: 7
    },
    {
      section: 'trainer', // Trainers
      title: 'My Payouts',
      path: '/trainer/payouts',
      icon: 'BanknotesIcon',
      order: 1
    },
    {
      section: 'trainer',
      title: 'Earnings',
      path: '/trainer/earnings',
      icon: 'TrendingUpIcon',
      order: 2
    },
    {
      section: 'trainee', // Trainees
      title: 'Shopping Cart',
      path: '/cart',
      icon: 'ShoppingCartIcon',
      order: 1
    },
    {
      section: 'trainee',
      title: 'My Orders',
      path: '/orders',
      icon: 'ClipboardDocumentListIcon',
      order: 2
    }
  ];
  
  registry.registerMenuItems(pluginName, menuItems);
  
  // 3. Register Event Listeners
  registry.registerEventListener(pluginName, 'enrollment:created', async (context) => {
    const { data, log } = context;
    log(`Processing payment for enrollment: ${data.enrollmentId}`);
    
    // Simulate payment processing
    const payment = {
      id: `pay_${Date.now()}`,
      enrollmentId: data.enrollmentId,
      amount: data.coursePrice || 0,
      status: 'pending',
      createdAt: new Date()
    };
    
    log(`Payment created: ${payment.id}`);
    return payment;
  });
  
  registry.registerEventListener(pluginName, 'enrollment:completed', async (context) => {
    const { data, log } = context;
    log(`Processing completion payout for enrollment: ${data.enrollmentId}`);
    
    // Simulate payout processing
    const payout = {
      id: `payout_${Date.now()}`,
      enrollmentId: data.enrollmentId,
      amount: data.payoutAmount || 0,
      status: 'pending',
      createdAt: new Date()
    };
    
    log(`Payout created: ${payout.id}`);
    return payout;
  });
  
  // 4. Register Hooks
  registry.registerHook(pluginName, 'before:course:save', async (context) => {
    const { data, log, setData } = context;
    
    // Add financial metadata to course
    if (!data.financial) {
      setData('financial', {
        price: data.price || 0,
        currency: 'USD',
        platformFee: 10,
        createdAt: new Date()
      });
      log('Added financial metadata to course');
    }
    
    return data;
  });
  
  registry.registerHook(pluginName, 'after:course:save', async (context) => {
    const { data, log } = context;
    
    // Log course financial information
    if (data.financial) {
      log(`Course ${data.title} saved with price: $${data.financial.price}`);
    }
    
    return data;
  });
  
  // 5. Register Custom Permissions
  const permissions = [
    'read:payments',
    'write:payments',
    'read:revenue',
    'write:revenue',
    'read:payouts',
    'write:payouts',
    'admin:financial',
    'read:cart',
    'write:cart',
    'read:orders',
    'write:orders',
    'read:coupons',
    'write:coupons',
    'read:invoices',
    'write:invoices'
  ];
  
  registry.registerPermissions(pluginName, permissions);
  
  // 6. Initialize plugin settings
  const defaultSettings = {
    stripeApiKey: '',
    stripePublishableKey: '',
    stripeWebhookSecret: '',
    currency: 'usd',
    cartSessionTimeout: 24,
    maxCartItems: 10,
    taxEnabled: true,
    defaultTaxRate: 0,
    couponSystemEnabled: true,
    payoutSchedule: 'weekly',
    minimumPayoutAmount: 50,
    platformFeePercentage: 10,
    enableAutomaticPayouts: true
  };
  
  registry.setPluginSettings(pluginName, defaultSettings);
  
  // 7. Emit plugin loaded event
  await pluginEventSystem.emitEvent('plugin:loaded', {
    pluginName,
    version: packageJson.version,
    description: packageJson.description
  });
  
  console.log(`✅ Financial Plugin registered successfully: ${pluginName}`);
}

/**
 * Plugin cleanup function (optional)
 */
async function cleanup() {
  console.log('🧹 Cleaning up Financial Plugin...');
  
  // Cleanup any resources, close connections, etc.
  
  console.log('✅ Financial Plugin cleanup completed');
}

module.exports = {
  register,
  cleanup
};
