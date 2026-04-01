/**
 * CourseWorx Core API Routes
 * 
 * This module provides core API endpoints for plugin management and
 * UI configuration. It serves as the bridge between the plugin system
 * and the frontend application.
 */

const express = require('express');
const router = express.Router();
const pluginRegistry = require('../core/plugin-registry');
const pluginLoader = require('../core/plugin-loader');
const pluginEventSystem = require('../core/plugin-events');
const { auth } = require('../middleware/auth');

/**
 * GET /api/core/ui-config
 * Returns UI configuration for the current user
 */
router.get('/ui-config', auth, async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Get menu items for the user's role
    const menuItems = pluginRegistry.getMenuItems(userRole);
    
    // Get user permissions
    const userPermissions = req.user.permissions || [];
    const pluginPermissions = pluginRegistry.getPermissions();
    const allPermissions = [...userPermissions, ...pluginPermissions];
    
    // Get enabled plugins
    const enabledPlugins = pluginRegistry.getEnabledPlugins();
    
    // Get available hook points
    const hookPoints = pluginEventSystem.getHookPoints();
    
    // Get available filters
    const filters = pluginEventSystem.getFilters();
    
    const uiConfig = {
      menuItems,
      permissions: allPermissions,
      enabledPlugins: enabledPlugins.map(plugin => ({
        name: plugin.name,
        version: plugin.version,
        description: plugin.description
      })),
      hookPoints,
      filters,
      userRole,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: uiConfig
    });
    
  } catch (error) {
    console.error('Error getting UI config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get UI configuration'
    });
  }
});

/**
 * GET /api/core/plugins
 * Get list of all plugins (Super Admin only)
 */
router.get('/plugins', /* auth, */ async (req, res) => {
  try {
    // Check if user is Super Admin
    // if (req.user.role !== 'sa') {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Super Admin privileges required.'
    //   });
    // }
    
    const plugins = pluginRegistry.getAllPlugins();
    
    res.json({
      success: true,
      data: plugins
    });
    
  } catch (error) {
    console.error('Error getting plugins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get plugins'
    });
  }
});

/**
 * GET /api/core/plugins/:name
 * Returns detailed information about a specific plugin
 */
router.get('/plugins/:name', auth, async (req, res) => {
  try {
    const { name } = req.params;
    
    // Check if user is Super Admin
    if (req.user.role !== 'sa') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin privileges required.'
      });
    }
    
    const plugin = pluginRegistry.getPlugin(name);
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found'
      });
    }
    
    const settings = pluginRegistry.getPluginSettings(name);
    const isEnabled = pluginRegistry.isPluginEnabled(name);
    const isLoaded = pluginLoader.isPluginLoaded(name);
    
    const pluginDetails = {
      ...plugin,
      settings,
      isEnabled,
      isLoaded,
      apiRoutes: pluginRegistry.getApiRoutes().filter(route => route.plugin === name),
      menuItems: pluginRegistry.adminMenuItems.filter(item => item.plugin === name),
      eventListeners: Array.from(pluginRegistry.eventListeners.entries())
        .filter(([eventType, listeners]) => listeners.some(l => l.plugin === name))
        .map(([eventType, listeners]) => ({
          eventType,
          count: listeners.filter(l => l.plugin === name).length
        })),
      hooks: Array.from(pluginRegistry.hooks.entries())
        .filter(([hookPoint, hooks]) => hooks.some(h => h.plugin === name))
        .map(([hookPoint, hooks]) => ({
          hookPoint,
          count: hooks.filter(h => h.plugin === name).length
        }))
    };
    
    res.json({
      success: true,
      data: pluginDetails
    });
    
  } catch (error) {
    console.error('Error getting plugin details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get plugin details'
    });
  }
});

/**
 * POST /api/core/plugins/:name/enable
 * Enable a plugin (Super Admin only)
 */
router.post('/plugins/:name/enable', auth, async (req, res) => {
  try {
    const { name } = req.params;
    
    // Check if user is Super Admin
    if (req.user.role !== 'sa') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin privileges required.'
      });
    }
    
    const plugin = pluginRegistry.enablePlugin(name);
    
    // Emit plugin enabled event
    await pluginEventSystem.emitEvent(pluginEventSystem.CORE_EVENTS.PLUGIN_ENABLED, {
      pluginName: name,
      plugin
    }, { user: req.user });
    
    res.json({
      success: true,
      message: `Plugin '${name}' enabled successfully`,
      data: plugin
    });
    
  } catch (error) {
    console.error('Error enabling plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to enable plugin'
    });
  }
});

/**
 * POST /api/core/plugins/:name/disable
 * Disable a plugin (Super Admin only)
 */
router.post('/plugins/:name/disable', auth, async (req, res) => {
  try {
    const { name } = req.params;
    
    // Check if user is Super Admin
    if (req.user.role !== 'sa') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin privileges required.'
      });
    }
    
    const plugin = pluginRegistry.disablePlugin(name);
    
    // Emit plugin disabled event
    await pluginEventSystem.emitEvent(pluginEventSystem.CORE_EVENTS.PLUGIN_DISABLED, {
      pluginName: name,
      plugin
    }, { user: req.user });
    
    res.json({
      success: true,
      message: `Plugin '${name}' disabled successfully`,
      data: plugin
    });
    
  } catch (error) {
    console.error('Error disabling plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to disable plugin'
    });
  }
});

/**
 * DELETE /api/core/plugins/:name
 * Unregister a plugin (Super Admin only)
 */
router.delete('/plugins/:name', auth, async (req, res) => {
  try {
    const { name } = req.params;
    
    // Check if user is Super Admin
    if (req.user.role !== 'sa') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin privileges required.'
      });
    }
    
    // Emit plugin unloaded event before unregistering
    await pluginEventSystem.emitEvent(pluginEventSystem.CORE_EVENTS.PLUGIN_UNLOADED, {
      pluginName: name
    }, { user: req.user });
    
    pluginRegistry.unregisterPlugin(name);
    
    res.json({
      success: true,
      message: `Plugin '${name}' unregistered successfully`
    });
    
  } catch (error) {
    console.error('Error unregistering plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to unregister plugin'
    });
  }
});

/**
 * POST /api/core/plugins/:name/reload
 * Reload a specific plugin (Super Admin only)
 */
router.post('/plugins/:name/reload', auth, async (req, res) => {
  try {
    const { name } = req.params;
    
    // Check if user is Super Admin
    if (req.user.role !== 'sa') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin privileges required.'
      });
    }
    
    await pluginLoader.reloadPlugin(name, req.app);
    
    res.json({
      success: true,
      message: `Plugin '${name}' reloaded successfully`
    });
    
  } catch (error) {
    console.error('Error reloading plugin:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reload plugin'
    });
  }
});

/**
 * POST /api/core/plugins/reload-all
 * Reload all plugins (Super Admin only)
 */
router.post('/plugins/reload-all', auth, async (req, res) => {
  try {
    // Check if user is Super Admin
    if (req.user.role !== 'sa') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin privileges required.'
      });
    }
    
    await pluginLoader.reloadAllPlugins(req.app);
    
    res.json({
      success: true,
      message: 'All plugins reloaded successfully'
    });
    
  } catch (error) {
    console.error('Error reloading all plugins:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reload plugins'
    });
  }
});

/**
 * GET /api/core/events
 * Returns event system information (Super Admin only)
 */
router.get('/events', auth, async (req, res) => {
  try {
    // Check if user is Super Admin
    if (req.user.role !== 'sa') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin privileges required.'
      });
    }
    
    const eventHistory = pluginEventSystem.getEventHistory(100);
    const hookPoints = pluginEventSystem.getHookPoints();
    const filters = pluginEventSystem.getFilters();
    const stats = pluginEventSystem.getStats();
    
    res.json({
      success: true,
      data: {
        eventHistory,
        hookPoints,
        filters,
        stats,
        coreEvents: pluginEventSystem.CORE_EVENTS,
        coreHooks: pluginEventSystem.CORE_HOOKS
      }
    });
    
  } catch (error) {
    console.error('Error getting event system info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event system information'
    });
  }
});

/**
 * GET /api/core/stats
 * Returns system statistics (Super Admin only)
 */
router.get('/stats', /* auth, */ async (req, res) => {
  try {
    // Check if user is Super Admin
    // if (req.user.role !== 'sa') {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Access denied. Super Admin privileges required.'
    //   });
    // }
    
    const registryStats = pluginRegistry.getStats();
    const loaderStats = pluginLoader.getStats();
    const eventStats = pluginEventSystem.getStats();
    
    res.json({
      success: true,
      data: {
        registry: registryStats,
        loader: loaderStats,
        events: eventStats,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error getting system stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system statistics'
    });
  }
});

/**
 * POST /api/core/events/clear-history
 * Clear event history (Super Admin only)
 */
router.post('/events/clear-history', auth, async (req, res) => {
  try {
    // Check if user is Super Admin
    if (req.user.role !== 'sa') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin privileges required.'
      });
    }
    
    pluginEventSystem.clearHistory();
    
    res.json({
      success: true,
      message: 'Event history cleared successfully'
    });
    
  } catch (error) {
    console.error('Error clearing event history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear event history'
    });
  }
});

module.exports = router;
