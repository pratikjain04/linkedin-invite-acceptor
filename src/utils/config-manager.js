/**
 * Configuration Manager
 * Handles persisting and retrieving user settings from Chrome storage
 */

class ConfigManager {
  // Valid configuration options
  static VALID_DELAYS = [500, 1000, 2000, 3000, 4000, 5000];
  static VALID_HOURLY_LIMITS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  // Default configuration
  static DEFAULTS = {
    delayInterval: 500,
    hourlyLimit: 50,
    sessionStartTime: null,
    isRunning: false,
    totalAccepted: 0,
    hourlyAccepted: 0,
    lastResetTime: Date.now(),
  };

  /**
   * Load configuration from Chrome storage
   * @returns {Promise<Object>} Configuration object
   */
  static async loadConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.DEFAULTS, (data) => {
        resolve(data);
      });
    });
  }

  /**
   * Save configuration to Chrome storage
   * @param {Object} config - Configuration object
   * @returns {Promise<void>}
   */
  static async saveConfig(config) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(config, () => {
        resolve();
      });
    });
  }

  /**
   * Update a single configuration value
   * @param {string} key - Configuration key
   * @param {*} value - New value
   * @returns {Promise<void>}
   */
  static async updateConfig(key, value) {
    const config = await this.loadConfig();
    config[key] = value;
    await this.saveConfig(config);
  }

  /**
   * Validate delay interval
   * @param {number} delay - Delay in milliseconds
   * @returns {boolean} True if valid
   */
  static isValidDelay(delay) {
    return this.VALID_DELAYS.includes(delay);
  }

  /**
   * Validate hourly limit
   * @param {number} limit - Hourly limit
   * @returns {boolean} True if valid
   */
  static isValidHourlyLimit(limit) {
    return this.VALID_HOURLY_LIMITS.includes(limit);
  }

  /**
   * Validate entire configuration
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  static validateConfig(config) {
    const errors = [];

    if (config.delayInterval !== undefined && !this.isValidDelay(config.delayInterval)) {
      errors.push(
        `Invalid delay interval. Must be one of: ${this.VALID_DELAYS.join(', ')} ms`
      );
    }

    if (config.hourlyLimit !== undefined && !this.isValidHourlyLimit(config.hourlyLimit)) {
      errors.push(
        `Invalid hourly limit. Must be one of: ${this.VALID_HOURLY_LIMITS.join(', ')}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Reset configuration to defaults
   * @returns {Promise<void>}
   */
  static async resetToDefaults() {
    const defaults = { ...this.DEFAULTS };
    defaults.lastResetTime = Date.now();
    await this.saveConfig(defaults);
  }

  /**
   * Clear all user data (for uninstall)
   * @returns {Promise<void>}
   */
  static async clearAll() {
    return new Promise((resolve) => {
      chrome.storage.sync.clear(() => {
        resolve();
      });
    });
  }
}
