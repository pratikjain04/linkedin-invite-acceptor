/**
 * Logger utility for debugging and logging events
 * Provides consistent logging throughout the extension
 */

class Logger {
  constructor(debugMode = false) {
    this.debugMode = debugMode;
    this.prefix = '[LinkedIn Invite Acceptor]';
  }

  log(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `${this.prefix} [${timestamp}]`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  error(message, error = null) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `${this.prefix} [${timestamp}] ERROR`;
    
    if (error) {
      console.error(`${prefix} ${message}`, error);
    } else {
      console.error(`${prefix} ${message}`);
    }
  }

  warn(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `${this.prefix} [${timestamp}] WARN`;
    
    if (data) {
      console.warn(`${prefix} ${message}`, data);
    } else {
      console.warn(`${prefix} ${message}`);
    }
  }

  debug(message, data = null) {
    if (!this.debugMode) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `${this.prefix} [${timestamp}] DEBUG`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
}

// Export for use in different contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Logger;
}
