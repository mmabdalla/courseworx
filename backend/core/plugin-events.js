/**
 * CourseWorx Plugin Event System
 * 
 * This module provides an event-driven communication system for plugins,
 * allowing them to listen to core events and register hooks for custom
 * functionality. It's inspired by WordPress hooks and filters.
 */

const EventEmitter = require('events');
const pluginRegistry = require('./plugin-registry');

class PluginEventSystem extends EventEmitter {
  constructor() {
    super();
    this.hooks = new Map();
    this.filters = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Emit an event and notify all registered listeners
   * @param {string} eventType - Event type (e.g., 'user:created')
   * @param {Object} data - Event data
   * @param {Object} context - Additional context
   */
  async emitEvent(eventType, data = {}, context = {}) {
    try {
      console.log(`📡 Emitting event: ${eventType}`);
      
      // Get event listeners from registry
      const listeners = pluginRegistry.getEventListeners(eventType);
      
      // Add to event history
      this.addToHistory(eventType, data, context);
      
      // Emit to internal listeners (for core system)
      this.emit(eventType, data, context);
      
      // Execute plugin listeners
      for (const listenerInfo of listeners) {
        try {
          await this.executeListener(listenerInfo, eventType, data, context);
        } catch (error) {
          console.error(`❌ Error in plugin listener ${listenerInfo.plugin}:`, error);
          // Continue with other listeners
        }
      }
      
      console.log(`✅ Event completed: ${eventType} (${listeners.length} listeners)`);
      
    } catch (error) {
      console.error(`❌ Error emitting event ${eventType}:`, error);
      throw error;
    }
  }

  /**
   * Execute a plugin event listener
   * @param {Object} listenerInfo - Listener information
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   * @param {Object} context - Event context
   */
  async executeListener(listenerInfo, eventType, data, context) {
    const { plugin: pluginName, listener } = listenerInfo;
    
    try {
      // Create a safe execution context
      const executionContext = {
        eventType,
        data: { ...data }, // Clone data to prevent mutations
        context: { ...context },
        pluginName,
        timestamp: new Date(),
        // Add utility methods
        log: (message) => console.log(`[${pluginName}] ${message}`),
        error: (message) => console.error(`[${pluginName}] ${message}`)
      };
      
      // Execute the listener
      const result = await listener(executionContext);
      
      // Log successful execution
      console.log(`✅ Plugin ${pluginName} processed event ${eventType}`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Plugin ${pluginName} failed to process event ${eventType}:`, error);
      throw error;
    }
  }

  /**
   * Register a hook point
   * @param {string} hookPoint - Hook point name (e.g., 'before:user:create')
   * @param {Function} defaultHandler - Default handler function
   */
  registerHook(hookPoint, defaultHandler = null) {
    if (!this.hooks.has(hookPoint)) {
      this.hooks.set(hookPoint, {
        handlers: [],
        defaultHandler,
        registeredAt: new Date()
      });
      console.log(`🔗 Registered hook point: ${hookPoint}`);
    }
  }

  /**
   * Execute hooks at a specific point
   * @param {string} hookPoint - Hook point name
   * @param {Object} data - Data to pass to hooks
   * @param {Object} context - Additional context
   * @returns {Object} Modified data after all hooks
   */
  async executeHooks(hookPoint, data = {}, context = {}) {
    try {
      console.log(`🔗 Executing hooks: ${hookPoint}`);
      
      // Get hook handlers from registry
      const hooks = pluginRegistry.getHooks(hookPoint);
      let modifiedData = { ...data };
      
      // Execute plugin hooks
      for (const hookInfo of hooks) {
        try {
          const result = await this.executeHook(hookInfo, hookPoint, modifiedData, context);
          if (result !== undefined) {
            modifiedData = result;
          }
        } catch (error) {
          console.error(`❌ Error in plugin hook ${hookInfo.plugin}:`, error);
          // Continue with other hooks
        }
      }
      
      // Execute default handler if exists
      const hookConfig = this.hooks.get(hookPoint);
      if (hookConfig && hookConfig.defaultHandler) {
        try {
          const result = await hookConfig.defaultHandler(modifiedData, context);
          if (result !== undefined) {
            modifiedData = result;
          }
        } catch (error) {
          console.error(`❌ Error in default hook handler:`, error);
        }
      }
      
      console.log(`✅ Hooks completed: ${hookPoint}`);
      return modifiedData;
      
    } catch (error) {
      console.error(`❌ Error executing hooks ${hookPoint}:`, error);
      throw error;
    }
  }

  /**
   * Execute a single hook
   * @param {Object} hookInfo - Hook information
   * @param {string} hookPoint - Hook point name
   * @param {Object} data - Data to process
   * @param {Object} context - Additional context
   */
  async executeHook(hookInfo, hookPoint, data, context) {
    const { plugin: pluginName, hook } = hookInfo;
    
    try {
      // Create a safe execution context
      const executionContext = {
        hookPoint,
        data: { ...data }, // Clone data to prevent mutations
        context: { ...context },
        pluginName,
        timestamp: new Date(),
        // Add utility methods
        log: (message) => console.log(`[${pluginName}] ${message}`),
        error: (message) => console.error(`[${pluginName}] ${message}`),
        // Add data modification helpers
        setData: (key, value) => {
          data[key] = value;
          return data;
        },
        getData: (key) => data[key],
        hasData: (key) => key in data
      };
      
      // Execute the hook
      const result = await hook(executionContext);
      
      console.log(`✅ Plugin ${pluginName} executed hook ${hookPoint}`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Plugin ${pluginName} failed to execute hook ${hookPoint}:`, error);
      throw error;
    }
  }

  /**
   * Register a filter
   * @param {string} filterName - Filter name
   * @param {Function} defaultFilter - Default filter function
   */
  registerFilter(filterName, defaultFilter = null) {
    if (!this.filters.has(filterName)) {
      this.filters.set(filterName, {
        filters: [],
        defaultFilter,
        registeredAt: new Date()
      });
      console.log(`🔗 Registered filter: ${filterName}`);
    }
  }

  /**
   * Apply filters to data
   * @param {string} filterName - Filter name
   * @param {*} data - Data to filter
   * @param {Object} context - Additional context
   * @returns {*} Filtered data
   */
  async applyFilters(filterName, data, context = {}) {
    try {
      console.log(`🔗 Applying filters: ${filterName}`);
      
      let filteredData = data;
      
      // Apply plugin filters
      const filters = pluginRegistry.getHooks(filterName);
      for (const filterInfo of filters) {
        try {
          filteredData = await this.executeFilter(filterInfo, filterName, filteredData, context);
        } catch (error) {
          console.error(`❌ Error in plugin filter ${filterInfo.plugin}:`, error);
          // Continue with other filters
        }
      }
      
      // Apply default filter if exists
      const filterConfig = this.filters.get(filterName);
      if (filterConfig && filterConfig.defaultFilter) {
        try {
          filteredData = await filterConfig.defaultFilter(filteredData, context);
        } catch (error) {
          console.error(`❌ Error in default filter:`, error);
        }
      }
      
      console.log(`✅ Filters completed: ${filterName}`);
      return filteredData;
      
    } catch (error) {
      console.error(`❌ Error applying filters ${filterName}:`, error);
      throw error;
    }
  }

  /**
   * Execute a single filter
   * @param {Object} filterInfo - Filter information
   * @param {string} filterName - Filter name
   * @param {*} data - Data to filter
   * @param {Object} context - Additional context
   */
  async executeFilter(filterInfo, filterName, data, context) {
    const { plugin: pluginName, hook: filter } = filterInfo;
    
    try {
      // Create a safe execution context
      const executionContext = {
        filterName,
        data,
        context: { ...context },
        pluginName,
        timestamp: new Date(),
        // Add utility methods
        log: (message) => console.log(`[${pluginName}] ${message}`),
        error: (message) => console.error(`[${pluginName}] ${message}`)
      };
      
      // Execute the filter
      const result = await filter(executionContext);
      
      console.log(`✅ Plugin ${pluginName} applied filter ${filterName}`);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Plugin ${pluginName} failed to apply filter ${filterName}:`, error);
      throw error;
    }
  }

  /**
   * Add event to history
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   * @param {Object} context - Event context
   */
  addToHistory(eventType, data, context) {
    const eventRecord = {
      eventType,
      data: { ...data },
      context: { ...context },
      timestamp: new Date(),
      id: this.generateEventId()
    };
    
    this.eventHistory.push(eventRecord);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Generate a unique event ID
   * @returns {string} Event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get event history
   * @param {number} limit - Number of events to return
   * @param {string} eventType - Filter by event type
   * @returns {Array} Event history
   */
  getEventHistory(limit = 50, eventType = null) {
    let history = [...this.eventHistory];
    
    // Filter by event type if specified
    if (eventType) {
      history = history.filter(event => event.eventType === eventType);
    }
    
    // Sort by timestamp (newest first)
    history.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit
    return history.slice(0, limit);
  }

  /**
   * Get registered hook points
   * @returns {Array} Array of hook point names
   */
  getHookPoints() {
    return Array.from(this.hooks.keys());
  }

  /**
   * Get registered filters
   * @returns {Array} Array of filter names
   */
  getFilters() {
    return Array.from(this.filters.keys());
  }

  /**
   * Get event system statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    const registryStats = pluginRegistry.getStats();
    
    return {
      ...registryStats,
      eventHistorySize: this.eventHistory.length,
      hookPoints: this.hooks.size,
      filters: this.filters.size,
      maxHistorySize: this.maxHistorySize
    };
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
    console.log('🗑️  Event history cleared');
  }

  /**
   * Predefined core events
   */
  static get CORE_EVENTS() {
    return {
      // User events
      USER_CREATED: 'user:created',
      USER_UPDATED: 'user:updated',
      USER_DELETED: 'user:deleted',
      USER_LOGIN: 'user:login',
      USER_LOGOUT: 'user:logout',
      
      // Course events
      COURSE_CREATED: 'course:created',
      COURSE_UPDATED: 'course:updated',
      COURSE_DELETED: 'course:deleted',
      COURSE_PUBLISHED: 'course:published',
      
      // Enrollment events
      ENROLLMENT_CREATED: 'enrollment:created',
      ENROLLMENT_CANCELLED: 'enrollment:cancelled',
      ENROLLMENT_COMPLETED: 'enrollment:completed',
      
      // Content events
      CONTENT_CREATED: 'content:created',
      CONTENT_UPDATED: 'content:updated',
      CONTENT_DELETED: 'content:deleted',
      CONTENT_PUBLISHED: 'content:published',
      
      // Payment events
      PAYMENT_CREATED: 'payment:created',
      PAYMENT_COMPLETED: 'payment:completed',
      PAYMENT_FAILED: 'payment:failed',
      PAYMENT_REFUNDED: 'payment:refunded',
      
      // System events
      PLUGIN_LOADED: 'plugin:loaded',
      PLUGIN_ENABLED: 'plugin:enabled',
      PLUGIN_DISABLED: 'plugin:disabled',
      PLUGIN_UNLOADED: 'plugin:unloaded'
    };
  }

  /**
   * Predefined core hook points
   */
  static get CORE_HOOKS() {
    return {
      // User hooks
      BEFORE_USER_CREATE: 'before:user:create',
      AFTER_USER_CREATE: 'after:user:create',
      BEFORE_USER_UPDATE: 'before:user:update',
      AFTER_USER_UPDATE: 'after:user:update',
      BEFORE_USER_DELETE: 'before:user:delete',
      AFTER_USER_DELETE: 'after:user:delete',
      
      // Course hooks
      BEFORE_COURSE_CREATE: 'before:course:create',
      AFTER_COURSE_CREATE: 'after:course:create',
      BEFORE_COURSE_UPDATE: 'before:course:update',
      AFTER_COURSE_UPDATE: 'after:course:update',
      BEFORE_COURSE_DELETE: 'before:course:delete',
      AFTER_COURSE_DELETE: 'after:course:delete',
      
      // Content hooks
      BEFORE_CONTENT_SAVE: 'before:content:save',
      AFTER_CONTENT_SAVE: 'after:content:save',
      BEFORE_CONTENT_DELETE: 'before:content:delete',
      AFTER_CONTENT_DELETE: 'after:content:delete',
      
      // Payment hooks
      BEFORE_PAYMENT_PROCESS: 'before:payment:process',
      AFTER_PAYMENT_PROCESS: 'after:payment:process',
      BEFORE_PAYMENT_REFUND: 'before:payment:refund',
      AFTER_PAYMENT_REFUND: 'after:payment:refund'
    };
  }
}

// Create and export a singleton instance
const pluginEventSystem = new PluginEventSystem();

module.exports = pluginEventSystem;
