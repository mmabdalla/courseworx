/**
 * CourseWorx Plugin Loader
 * 
 * This module is responsible for discovering, validating, and loading
 * plugins from the plugins directory. It handles plugin lifecycle
 * management and integration with the Express application.
 */

const fs = require('fs').promises;
const path = require('path');
const pluginRegistry = require('./plugin-registry');
const pluginValidator = require('./plugin-validator');

class PluginLoader {
  constructor() {
    this.pluginsDir = path.join(__dirname, '..', 'plugins');
    this.loadedPlugins = new Map();
    this.loadErrors = new Map();
  }

  /**
   * Initialize the plugin system
   * @param {Object} app - Express application instance
   */
  async initialize(app) {
    console.log('🔌 Initializing plugin system...');
    
    try {
      // Ensure plugins directory exists
      await this.ensurePluginsDirectory();
      
      // Load all plugins
      await this.loadAllPlugins(app);
      
      // Register API routes for enabled plugins
      this.registerApiRoutes(app);
      
      console.log(`✅ Plugin system initialized. Loaded ${this.loadedPlugins.size} plugins.`);
      
      // Log any load errors
      if (this.loadErrors.size > 0) {
        console.warn('⚠️  Some plugins failed to load:');
        for (const [pluginName, error] of this.loadErrors) {
          console.warn(`  - ${pluginName}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize plugin system:', error);
      throw error;
    }
  }

  /**
   * Ensure the plugins directory exists
   */
  async ensurePluginsDirectory() {
    try {
      await fs.access(this.pluginsDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(this.pluginsDir, { recursive: true });
      console.log(`📁 Created plugins directory: ${this.pluginsDir}`);
    }
  }

  /**
   * Load all plugins from the plugins directory
   * @param {Object} app - Express application instance
   */
  async loadAllPlugins(app) {
    try {
      const pluginFolders = await fs.readdir(this.pluginsDir);
      
      for (const folder of pluginFolders) {
        const pluginPath = path.join(this.pluginsDir, folder);
        const pluginStat = await fs.stat(pluginPath);
        
        if (pluginStat.isDirectory()) {
          await this.loadPlugin(folder, pluginPath, app);
        }
      }
    } catch (error) {
      console.error('❌ Error reading plugins directory:', error);
      throw error;
    }
  }

  /**
   * Load a single plugin
   * @param {string} pluginName - Plugin folder name
   * @param {string} pluginPath - Full path to plugin directory
   * @param {Object} app - Express application instance
   */
  async loadPlugin(pluginName, pluginPath, app) {
    try {
      console.log(`📦 Loading plugin: ${pluginName}`);
      
      // Check if plugin has required files
      const packageJsonPath = path.join(pluginPath, 'package.json');
      const indexJsPath = path.join(pluginPath, 'index.js');
      
      // Check if package.json exists
      try {
        await fs.access(packageJsonPath);
      } catch (error) {
        throw new Error('Missing package.json file');
      }
      
      // Check if index.js exists
      try {
        await fs.access(indexJsPath);
      } catch (error) {
        throw new Error('Missing index.js file');
      }
      
      // Load and validate package.json
      const packageJson = require(packageJsonPath);
      const validationResult = pluginValidator.validatePackageJson(packageJson);
      
      if (!validationResult.isValid) {
        throw new Error(`Package.json validation failed: ${validationResult.errors.join(', ')}`);
      }
      
      // Load the plugin module
      const pluginModule = require(pluginPath);
      
      if (typeof pluginModule.register !== 'function') {
        throw new Error('Plugin must export a register function');
      }
      
      // Register the plugin in the registry
      const pluginInfo = pluginRegistry.registerPlugin(pluginName, packageJson);
      
      // Call the plugin's register function
      const registerContext = {
        app,
        registry: pluginRegistry,
        pluginName,
        pluginPath,
        packageJson
      };
      
      await pluginModule.register(registerContext);
      
      // Enable the plugin by default (unless specified otherwise)
      if (packageJson.courseworx?.autoEnable !== false) {
        pluginRegistry.enablePlugin(pluginName);
      }
      
      // Store the loaded plugin info
      this.loadedPlugins.set(pluginName, {
        path: pluginPath,
        module: pluginModule,
        info: pluginInfo,
        loadedAt: new Date()
      });
      
      console.log(`✅ Plugin loaded successfully: ${pluginName} v${packageJson.version}`);
      
    } catch (error) {
      console.error(`❌ Failed to load plugin ${pluginName}:`, error.message);
      this.loadErrors.set(pluginName, error);
      
      // Don't throw here, continue loading other plugins
    }
  }

  /**
   * Register API routes for enabled plugins
   * @param {Object} app - Express application instance
   */
  registerApiRoutes(app) {
    const apiRoutes = pluginRegistry.getApiRoutes();
    console.log(`🔗 Found ${apiRoutes.length} API routes to register:`, apiRoutes.map(r => r.path));
    
    for (const routeInfo of apiRoutes) {
      try {
        console.log(`🔗 Registering API routes: ${routeInfo.path} for plugin: ${routeInfo.plugin}`);
        app.use(routeInfo.path, routeInfo.router);
        console.log(`✅ Successfully registered API routes: ${routeInfo.path}`);
      } catch (error) {
        console.error(`❌ Failed to register API routes for ${routeInfo.plugin}:`, error);
      }
    }
  }

  /**
   * Reload a specific plugin
   * @param {string} pluginName - Plugin name
   * @param {Object} app - Express application instance
   */
  async reloadPlugin(pluginName, app) {
    try {
      console.log(`🔄 Reloading plugin: ${pluginName}`);
      
      // Unregister the plugin from registry
      if (pluginRegistry.getPlugin(pluginName)) {
        pluginRegistry.unregisterPlugin(pluginName);
      }
      
      // Remove from loaded plugins
      this.loadedPlugins.delete(pluginName);
      this.loadErrors.delete(pluginName);
      
      // Reload the plugin
      const pluginPath = path.join(this.pluginsDir, pluginName);
      await this.loadPlugin(pluginName, pluginPath, app);
      
      console.log(`✅ Plugin reloaded: ${pluginName}`);
      
    } catch (error) {
      console.error(`❌ Failed to reload plugin ${pluginName}:`, error);
      throw error;
    }
  }

  /**
   * Reload all plugins
   * @param {Object} app - Express application instance
   */
  async reloadAllPlugins(app) {
    console.log('🔄 Reloading all plugins...');
    
    // Clear the registry
    pluginRegistry.clear();
    
    // Clear loaded plugins
    this.loadedPlugins.clear();
    this.loadErrors.clear();
    
    // Reload all plugins
    await this.loadAllPlugins(app);
    
    // Re-register API routes
    this.registerApiRoutes(app);
    
    console.log(`✅ All plugins reloaded. Loaded ${this.loadedPlugins.size} plugins.`);
  }

  /**
   * Get information about loaded plugins
   */
  getLoadedPlugins() {
    return Array.from(this.loadedPlugins.values()).map(plugin => ({
      name: plugin.info.name,
      version: plugin.info.version,
      description: plugin.info.description,
      author: plugin.info.author,
      enabled: plugin.info.enabled,
      loadedAt: plugin.loadedAt,
      path: plugin.path
    }));
  }

  /**
   * Get plugin load errors
   */
  getLoadErrors() {
    return Array.from(this.loadErrors.entries()).map(([name, error]) => ({
      name,
      error: error.message,
      stack: error.stack
    }));
  }

  /**
   * Check if a plugin is loaded
   * @param {string} pluginName - Plugin name
   */
  isPluginLoaded(pluginName) {
    return this.loadedPlugins.has(pluginName);
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    const registryStats = pluginRegistry.getStats();
    
    return {
      ...registryStats,
      loadedPlugins: this.loadedPlugins.size,
      loadErrors: this.loadErrors.size,
      pluginsDirectory: this.pluginsDir
    };
  }

  /**
   * Validate a plugin without loading it
   * @param {string} pluginPath - Path to plugin directory
   */
  async validatePlugin(pluginPath) {
    try {
      const packageJsonPath = path.join(pluginPath, 'package.json');
      const indexJsPath = path.join(pluginPath, 'index.js');
      
      // Check required files
      await fs.access(packageJsonPath);
      await fs.access(indexJsPath);
      
      // Load and validate package.json
      const packageJson = require(packageJsonPath);
      const validationResult = pluginValidator.validatePackageJson(packageJson);
      
      // Check if register function exists
      const pluginModule = require(pluginPath);
      const hasRegisterFunction = typeof pluginModule.register === 'function';
      
      return {
        isValid: validationResult.isValid && hasRegisterFunction,
        errors: [
          ...validationResult.errors,
          ...(hasRegisterFunction ? [] : ['Missing register function'])
        ],
        warnings: validationResult.warnings,
        metadata: packageJson
      };
      
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        warnings: [],
        metadata: null
      };
    }
  }
}

// Create and export a singleton instance
const pluginLoader = new PluginLoader();

module.exports = pluginLoader;
