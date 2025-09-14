/**
 * CourseWorx Plugin Validator
 * 
 * This module handles validation of plugin packages, including
 * package.json validation, security checks, and dependency validation.
 */

const path = require('path');
const fs = require('fs').promises;

class PluginValidator {
  constructor() {
    // Required fields for package.json
    this.requiredFields = ['name', 'version', 'description', 'main'];
    
    // Required fields for courseworx section
    this.requiredCourseworxFields = ['minVersion'];
    
    // Allowed permission patterns
    this.allowedPermissionPatterns = [
      /^read:/,
      /^write:/,
      /^delete:/,
      /^admin:/,
      /^plugin:/
    ];
    
    // Forbidden patterns in code (basic security check)
    this.forbiddenPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /process\.env/,
      /require\s*\(\s*['"]\.\./,
      /__dirname/,
      /__filename/
    ];
    
    // Maximum file sizes
    this.maxFileSizes = {
      'package.json': 1024 * 10, // 10KB
      'index.js': 1024 * 100,    // 100KB
      '*.js': 1024 * 50          // 50KB for other JS files
    };
  }

  /**
   * Validate a plugin's package.json
   * @param {Object} packageJson - The package.json object
   * @returns {Object} Validation result
   */
  validatePackageJson(packageJson) {
    const errors = [];
    const warnings = [];

    // Check required fields
    for (const field of this.requiredFields) {
      if (!packageJson[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check courseworx section
    if (!packageJson.courseworx) {
      errors.push('Missing courseworx configuration section');
    } else {
      // Validate courseworx fields
      for (const field of this.requiredCourseworxFields) {
        if (!packageJson.courseworx[field]) {
          errors.push(`Missing required courseworx field: ${field}`);
        }
      }

      // Validate minVersion format
      if (packageJson.courseworx.minVersion) {
        if (!this.isValidVersion(packageJson.courseworx.minVersion)) {
          errors.push('Invalid minVersion format. Use semantic versioning (e.g., "1.9.0")');
        }
      }

      // Validate permissions
      if (packageJson.courseworx.permissions) {
        const permissionErrors = this.validatePermissions(packageJson.courseworx.permissions);
        errors.push(...permissionErrors);
      }

      // Validate settings
      if (packageJson.courseworx.settings) {
        const settingErrors = this.validateSettings(packageJson.courseworx.settings);
        errors.push(...settingErrors);
      }
    }

    // Check for suspicious patterns in description
    if (packageJson.description && this.containsSuspiciousContent(packageJson.description)) {
      warnings.push('Description contains potentially suspicious content');
    }

    // Check version format
    if (packageJson.version && !this.isValidVersion(packageJson.version)) {
      errors.push('Invalid version format. Use semantic versioning (e.g., "1.0.0")');
    }

    // Check for required dependencies
    if (packageJson.courseworx?.dependencies) {
      const dependencyErrors = this.validateDependencies(packageJson.courseworx.dependencies);
      errors.push(...dependencyErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate plugin permissions
   * @param {Array} permissions - Array of permission strings
   * @returns {Array} Array of error messages
   */
  validatePermissions(permissions) {
    const errors = [];

    if (!Array.isArray(permissions)) {
      errors.push('Permissions must be an array');
      return errors;
    }

    for (const permission of permissions) {
      if (typeof permission !== 'string') {
        errors.push('Each permission must be a string');
        continue;
      }

      // Check if permission matches allowed patterns
      const isAllowed = this.allowedPermissionPatterns.some(pattern => pattern.test(permission));
      if (!isAllowed) {
        errors.push(`Invalid permission format: ${permission}. Must start with read:, write:, delete:, admin:, or plugin:`);
      }

      // Check for potentially dangerous permissions
      if (permission.includes('system:') || permission.includes('root:')) {
        errors.push(`Dangerous permission detected: ${permission}`);
      }
    }

    return errors;
  }

  /**
   * Validate plugin settings configuration
   * @param {Object} settings - Settings configuration object
   * @returns {Array} Array of error messages
   */
  validateSettings(settings) {
    const errors = [];

    if (typeof settings !== 'object' || settings === null) {
      errors.push('Settings must be an object');
      return errors;
    }

    for (const [key, setting] of Object.entries(settings)) {
      if (typeof setting !== 'object' || setting === null) {
        errors.push(`Setting ${key} must be an object`);
        continue;
      }

      // Check required fields for each setting
      if (!setting.type) {
        errors.push(`Setting ${key} must have a type`);
      }

      if (!['string', 'number', 'boolean', 'select'].includes(setting.type)) {
        errors.push(`Setting ${key} has invalid type: ${setting.type}`);
      }

      // Validate default value
      if (setting.default !== undefined) {
        const defaultValueType = typeof setting.default;
        if (setting.type === 'string' && defaultValueType !== 'string') {
          errors.push(`Setting ${key} default value must be a string`);
        } else if (setting.type === 'number' && defaultValueType !== 'number') {
          errors.push(`Setting ${key} default value must be a number`);
        } else if (setting.type === 'boolean' && defaultValueType !== 'boolean') {
          errors.push(`Setting ${key} default value must be a boolean`);
        }
      }

      // Validate options for select type
      if (setting.type === 'select' && (!Array.isArray(setting.options) || setting.options.length === 0)) {
        errors.push(`Setting ${key} of type 'select' must have options array`);
      }
    }

    return errors;
  }

  /**
   * Validate plugin dependencies
   * @param {Array} dependencies - Array of dependency strings
   * @returns {Array} Array of error messages
   */
  validateDependencies(dependencies) {
    const errors = [];

    if (!Array.isArray(dependencies)) {
      errors.push('Dependencies must be an array');
      return errors;
    }

    for (const dependency of dependencies) {
      if (typeof dependency !== 'string') {
        errors.push('Each dependency must be a string');
        continue;
      }

      // Check for forbidden dependencies
      const forbiddenDeps = ['fs', 'path', 'child_process', 'process', 'os', 'crypto'];
      if (forbiddenDeps.includes(dependency)) {
        errors.push(`Forbidden dependency: ${dependency}`);
      }

      // Check for relative path dependencies
      if (dependency.startsWith('./') || dependency.startsWith('../')) {
        errors.push(`Relative path dependencies are not allowed: ${dependency}`);
      }
    }

    return errors;
  }

  /**
   * Validate a version string
   * @param {string} version - Version string
   * @returns {boolean} True if valid
   */
  isValidVersion(version) {
    const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    return semverPattern.test(version);
  }

  /**
   * Check if content contains suspicious patterns
   * @param {string} content - Content to check
   * @returns {boolean} True if suspicious content found
   */
  containsSuspiciousContent(content) {
    const suspiciousPatterns = [
      /<script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /alert\s*\(/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Validate plugin files for security
   * @param {string} pluginPath - Path to plugin directory
   * @returns {Object} Security validation result
   */
  async validatePluginFiles(pluginPath) {
    const errors = [];
    const warnings = [];

    try {
      const files = await this.getPluginFiles(pluginPath);
      
      for (const file of files) {
        const filePath = path.join(pluginPath, file);
        const fileStat = await fs.stat(filePath);
        
        // Check file size
        const sizeErrors = this.validateFileSize(file, fileStat.size);
        errors.push(...sizeErrors);
        
        // Check file content for suspicious patterns
        if (file.endsWith('.js')) {
          const contentErrors = await this.validateFileContent(filePath);
          errors.push(...contentErrors);
        }
      }
      
    } catch (error) {
      errors.push(`Error reading plugin files: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get list of plugin files
   * @param {string} pluginPath - Path to plugin directory
   * @returns {Array} Array of file paths
   */
  async getPluginFiles(pluginPath) {
    const files = [];
    
    async function scanDirectory(dir, baseDir = '') {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(baseDir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and hidden directories
          if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
            await scanDirectory(fullPath, relativePath);
          }
        } else {
          // Only include certain file types
          if (['.js', '.json', '.md', '.txt'].includes(path.extname(entry.name))) {
            files.push(relativePath);
          }
        }
      }
    }
    
    await scanDirectory(pluginPath);
    return files;
  }

  /**
   * Validate file size
   * @param {string} filename - File name
   * @param {number} size - File size in bytes
   * @returns {Array} Array of error messages
   */
  validateFileSize(filename, size) {
    const errors = [];
    
    if (filename === 'package.json' && size > this.maxFileSizes['package.json']) {
      errors.push(`package.json file too large: ${size} bytes (max: ${this.maxFileSizes['package.json']})`);
    } else if (filename === 'index.js' && size > this.maxFileSizes['index.js']) {
      errors.push(`index.js file too large: ${size} bytes (max: ${this.maxFileSizes['index.js']})`);
    } else if (filename.endsWith('.js') && size > this.maxFileSizes['*.js']) {
      errors.push(`${filename} file too large: ${size} bytes (max: ${this.maxFileSizes['*.js']})`);
    }
    
    return errors;
  }

  /**
   * Validate file content for suspicious patterns
   * @param {string} filePath - Path to file
   * @returns {Array} Array of error messages
   */
  async validateFileContent(filePath) {
    const errors = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      for (const pattern of this.forbiddenPatterns) {
        if (pattern.test(content)) {
          const patternName = pattern.source.replace(/[\\^$.*+?()[\]{}|]/g, '');
          errors.push(`Forbidden pattern found in ${path.basename(filePath)}: ${patternName}`);
        }
      }
      
      // Check for suspicious imports
      const importMatches = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
      if (importMatches) {
        for (const match of importMatches) {
          const moduleName = match.match(/['"]([^'"]+)['"]/)[1];
          if (moduleName.startsWith('..') || moduleName.startsWith('./')) {
            errors.push(`Relative import found in ${path.basename(filePath)}: ${moduleName}`);
          }
        }
      }
      
    } catch (error) {
      errors.push(`Error reading file ${path.basename(filePath)}: ${error.message}`);
    }
    
    return errors;
  }

  /**
   * Comprehensive plugin validation
   * @param {string} pluginPath - Path to plugin directory
   * @param {Object} packageJson - Plugin package.json
   * @returns {Object} Complete validation result
   */
  async validatePlugin(pluginPath, packageJson) {
    const packageValidation = this.validatePackageJson(packageJson);
    const fileValidation = await this.validatePluginFiles(pluginPath);
    
    const allErrors = [
      ...packageValidation.errors,
      ...fileValidation.errors
    ];
    
    const allWarnings = [
      ...packageValidation.warnings,
      ...fileValidation.warnings
    ];
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      packageValidation,
      fileValidation
    };
  }
}

// Create and export a singleton instance
const pluginValidator = new PluginValidator();

module.exports = pluginValidator;
