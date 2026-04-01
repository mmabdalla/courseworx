/**
 * CourseWorx Plugin Registry
 * 
 * This module manages the global plugin registry that stores all plugin
 * metadata, routes, menu items, and event listeners. It serves as the
 * central hub for plugin management and discovery.
 */

class PluginRegistry {
  constructor() {
    // Initialize the registry with empty collections
    this.plugins = new Map(); // Plugin metadata by name
    this.apiRoutes = new Map(); // API routes by plugin name
    this.adminMenuItems = []; // Menu items for admin dashboard
    this.eventListeners = new Map(); // Event listeners by event type
    this.hooks = new Map(); // Hook functions by hook point
    this.permissions = new Set(); // Custom permissions
    this.settings = new Map(); // Plugin settings by plugin name
    this.enabledPlugins = new Set(); // Set of enabled plugin names
  }

  /**
   * Register a new plugin
   * @param {string} name - Plugin name
   * @param {Object} metadata - Plugin metadata from package.json
   * @param {Object} config - Plugin configuration
   */
  registerPlugin(name, metadata, config = {}) {
    if (this.plugins.has(name)) {
      throw new Error(`Plugin '${name}' is already registered`);
    }

    const pluginInfo = {
      name,
      metadata,
      config,
      registeredAt: new Date(),
      enabled: false,
      version: metadata.version || '1.0.0',
      description: metadata.description || '',
      author: metadata.author || 'Unknown',
      license: metadata.license || 'MIT'
    };

    this.plugins.set(name, pluginInfo);
    console.log(`✓ Plugin registered: ${name} v${pluginInfo.version}`);
    
    return pluginInfo;
  }

  /**
   * Enable a plugin
   * @param {string} name - Plugin name
   */
  enablePlugin(name) {
    if (!this.plugins.has(name)) {
      throw new Error(`Plugin '${name}' is not registered`);
    }

    const plugin = this.plugins.get(name);
    plugin.enabled = true;
    this.enabledPlugins.add(name);
    
    console.log(`✓ Plugin enabled: ${name}`);
    return plugin;
  }

  /**
   * Disable a plugin
   * @param {string} name - Plugin name
   */
  disablePlugin(name) {
    if (!this.plugins.has(name)) {
      throw new Error(`Plugin '${name}' is not registered`);
    }

    const plugin = this.plugins.get(name);
    plugin.enabled = false;
    this.enabledPlugins.delete(name);
    
    console.log(`✓ Plugin disabled: ${name}`);
    return plugin;
  }

  /**
   * Unregister a plugin
   * @param {string} name - Plugin name
   */
  unregisterPlugin(name) {
    if (!this.plugins.has(name)) {
      throw new Error(`Plugin '${name}' is not registered`);
    }

    // Remove all plugin-related data
    this.plugins.delete(name);
    this.apiRoutes.delete(name);
    this.enabledPlugins.delete(name);
    this.settings.delete(name);

    // Remove menu items for this plugin
    this.adminMenuItems = this.adminMenuItems.filter(item => item.plugin !== name);

    // Remove event listeners for this plugin
    for (const [eventType, listeners] of this.eventListeners) {
      this.eventListeners.set(eventType, listeners.filter(listener => listener.plugin !== name));
    }

    // Remove hooks for this plugin
    for (const [hookPoint, hooks] of this.hooks) {
      this.hooks.set(hookPoint, hooks.filter(hook => hook.plugin !== name));
    }

    console.log(`✓ Plugin unregistered: ${name}`);
  }

  /**
   * Register API routes for a plugin
   * @param {string} pluginName - Plugin name
   * @param {string} routePath - Route path (e.g., '/api/financial')
   * @param {Object} router - Express router
   */
  registerApiRoutes(pluginName, routePath, router) {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin '${pluginName}' is not registered`);
    }

    this.apiRoutes.set(pluginName, {
      path: routePath,
      router,
      plugin: pluginName,
      registeredAt: new Date()
    });

    console.log(`✓ API routes registered for ${pluginName}: ${routePath}`);
  }

  /**
   * Register admin menu items for a plugin
   * @param {string} pluginName - Plugin name
   * @param {Array} menuItems - Array of menu item objects
   */
  registerMenuItems(pluginName, menuItems) {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin '${pluginName}' is not registered`);
    }

    // Add plugin reference to each menu item
    const itemsWithPlugin = menuItems.map(item => ({
      ...item,
      plugin: pluginName,
      registeredAt: new Date()
    }));

    this.adminMenuItems.push(...itemsWithPlugin);
    console.log(`✓ Menu items registered for ${pluginName}: ${menuItems.length} items`);
  }

  /**
   * Register event listeners for a plugin
   * @param {string} pluginName - Plugin name
   * @param {string} eventType - Event type (e.g., 'user:created')
   * @param {Function} listener - Event listener function
   */
  registerEventListener(pluginName, eventType, listener) {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin '${pluginName}' is not registered`);
    }

    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }

    const listeners = this.eventListeners.get(eventType);
    listeners.push({
      plugin: pluginName,
      listener,
      registeredAt: new Date()
    });

    console.log(`✓ Event listener registered for ${pluginName}: ${eventType}`);
  }

  /**
   * Register hooks for a plugin
   * @param {string} pluginName - Plugin name
   * @param {string} hookPoint - Hook point (e.g., 'before:user:create')
   * @param {Function} hook - Hook function
   */
  registerHook(pluginName, hookPoint, hook) {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin '${pluginName}' is not registered`);
    }

    if (!this.hooks.has(hookPoint)) {
      this.hooks.set(hookPoint, []);
    }

    const hooks = this.hooks.get(hookPoint);
    hooks.push({
      plugin: pluginName,
      hook,
      registeredAt: new Date()
    });

    console.log(`✓ Hook registered for ${pluginName}: ${hookPoint}`);
  }

  /**
   * Register custom permissions for a plugin
   * @param {string} pluginName - Plugin name
   * @param {Array} permissions - Array of permission strings
   */
  registerPermissions(pluginName, permissions) {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin '${pluginName}' is not registered`);
    }

    permissions.forEach(permission => {
      this.permissions.add(permission);
    });

    console.log(`✓ Permissions registered for ${pluginName}: ${permissions.length} permissions`);
  }

  /**
   * Set plugin settings
   * @param {string} pluginName - Plugin name
   * @param {Object} settings - Plugin settings
   */
  setPluginSettings(pluginName, settings) {
    if (!this.plugins.has(pluginName)) {
      throw new Error(`Plugin '${pluginName}' is not registered`);
    }

    this.settings.set(pluginName, {
      ...settings,
      updatedAt: new Date()
    });
  }

  /**
   * Get plugin settings
   * @param {string} pluginName - Plugin name
   */
  getPluginSettings(pluginName) {
    return this.settings.get(pluginName) || {};
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get enabled plugins only
   */
  getEnabledPlugins() {
    return Array.from(this.plugins.values()).filter(plugin => plugin.enabled);
  }

  /**
   * Get plugin by name
   * @param {string} name - Plugin name
   */
  getPlugin(name) {
    return this.plugins.get(name);
  }

  /**
   * Get API routes for enabled plugins
   */
  getApiRoutes() {
    const routes = [];
    for (const [pluginName, routeInfo] of this.apiRoutes) {
      if (this.enabledPlugins.has(pluginName)) {
        routes.push(routeInfo);
      }
    }
    return routes;
  }

  /**
   * Get admin menu items for a specific user role
   * @param {string} userRole - User role (sa, trainer, trainee)
   */
  getMenuItems(userRole) {
    return this.adminMenuItems.filter(item => {
      // Only return items for enabled plugins
      if (!this.enabledPlugins.has(item.plugin)) {
        return false;
      }
      
      // Filter by user role
      if (item.section && item.section !== userRole) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Get event listeners for a specific event type
   * @param {string} eventType - Event type
   */
  getEventListeners(eventType) {
    const listeners = this.eventListeners.get(eventType) || [];
    // Only return listeners for enabled plugins
    return listeners.filter(listener => this.enabledPlugins.has(listener.plugin));
  }

  /**
   * Get hooks for a specific hook point
   * @param {string} hookPoint - Hook point
   */
  getHooks(hookPoint) {
    const hooks = this.hooks.get(hookPoint) || [];
    // Only return hooks for enabled plugins
    return hooks.filter(hook => this.enabledPlugins.has(hook.plugin));
  }

  /**
   * Get all custom permissions
   */
  getPermissions() {
    return Array.from(this.permissions);
  }

  /**
   * Check if a plugin is enabled
   * @param {string} name - Plugin name
   */
  isPluginEnabled(name) {
    return this.enabledPlugins.has(name);
  }

  /**
   * Get registry statistics
   */
  getStats() {
    return {
      totalPlugins: this.plugins.size,
      enabledPlugins: this.enabledPlugins.size,
      apiRoutes: this.apiRoutes.size,
      menuItems: this.adminMenuItems.length,
      eventTypes: this.eventListeners.size,
      hookPoints: this.hooks.size,
      permissions: this.permissions.size
    };
  }

  /**
   * Clear the entire registry (for testing)
   */
  clear() {
    this.plugins.clear();
    this.apiRoutes.clear();
    this.adminMenuItems.length = 0;
    this.eventListeners.clear();
    this.hooks.clear();
    this.permissions.clear();
    this.settings.clear();
    this.enabledPlugins.clear();
  }
}

// Create and export a singleton instance
const pluginRegistry = new PluginRegistry();

module.exports = pluginRegistry;
