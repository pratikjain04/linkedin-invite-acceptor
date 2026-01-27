/**
 * Background Service Worker for LinkedIn Invite Acceptor
 * Orchestrates the entire automation process
 */

// Simple logger fallback if Logger class is not available
const logger = {
  log: (...args) => console.log('[LinkedIn Invite Acceptor]', ...args),
  error: (...args) => console.error('[LinkedIn Invite Acceptor]', ...args),
  warn: (...args) => console.warn('[LinkedIn Invite Acceptor]', ...args),
  debug: (...args) => console.debug('[LinkedIn Invite Acceptor]', ...args),
};

// Fallback ConfigManager
const ConfigManager = {
  DEFAULTS: {
    delayInterval: 500,
    hourlyLimit: 50,
    totalAccepted: 0,
    hourlyAccepted: 0,
    isRunning: false,
    sessionStartTime: null,
  },
  VALID_DELAYS: [500, 1000, 2000, 3000, 4000, 5000],
  VALID_HOURLY_LIMITS: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  
  async loadConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (items) => {
        resolve({ ...this.DEFAULTS, ...items });
      });
    });
  },
  
  async saveConfig(config) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(config, () => resolve());
    });
  },
  
  async updateConfig(key, value) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: value }, () => resolve());
    });
  },
  
  isValidDelay(delay) {
    return this.VALID_DELAYS.includes(delay);
  },
  
  isValidHourlyLimit(limit) {
    return this.VALID_HOURLY_LIMITS.includes(limit);
  },
  
  clearAll() {
    chrome.storage.sync.clear();
  },
};

// Fallback RateLimiter
const RateLimiter = class {
  constructor(delayInterval, hourlyLimit) {
    this.delayInterval = delayInterval;
    this.hourlyLimit = hourlyLimit;
    this.acceptTimes = [];
    this.lastAcceptTime = 0;
  }

  canAccept() {
    const now = Date.now();
    const timeSinceLastAccept = now - this.lastAcceptTime;
    
    // Check per-request delay
    if (timeSinceLastAccept < this.delayInterval) {
      return {
        ready: false,
        delay: this.delayInterval - timeSinceLastAccept,
        reason: `Waiting ${this.delayInterval - timeSinceLastAccept}ms before next accept`,
      };
    }

    // Check hourly limit
    const oneHourAgo = now - 3600000;
    const acceptsThisHour = this.acceptTimes.filter(t => t > oneHourAgo).length;

    if (acceptsThisHour >= this.hourlyLimit) {
      const oldestAccept = Math.min(...this.acceptTimes.filter(t => t > oneHourAgo));
      const timeUntilReset = oldestAccept + 3600000 - now;
      return {
        ready: false,
        delay: timeUntilReset,
        reason: `Hourly limit reached (${acceptsThisHour}/${this.hourlyLimit})`,
      };
    }

    return { ready: true, delay: 0, reason: 'Ready to accept' };
  }

  recordAccept() {
    this.lastAcceptTime = Date.now();
    this.acceptTimes.push(Date.now());
  }

  setDelayInterval(delay) {
    this.delayInterval = delay;
  }

  setHourlyLimit(limit) {
    this.hourlyLimit = limit;
  }

  getStats() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    const acceptsThisHour = this.acceptTimes.filter(t => t > oneHourAgo).length;
    
    return {
      acceptedThisHour: acceptsThisHour,
      remainingQuota: Math.max(0, this.hourlyLimit - acceptsThisHour),
      hourlyLimit: this.hourlyLimit,
      delayInterval: this.delayInterval,
    };
  }

  resetStats() {
    this.acceptTimes = [];
    this.lastAcceptTime = 0;
  }
};

class BackgroundController {
  constructor() {
    this.logger = logger;
    this.rateLimiter = null;
    this.isRunning = false;
    this.sessionStartTime = null;
    this.config = null;
    this.setupMessageListener();
    this.setupOnUninstall();
    this.logger.log('Background service worker initialized');
  }

  /**
   * Setup message listener for popup and content script communication
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.logger.log('Background received message:', message);

      if (message.action === 'START_ACCEPTING') {
        this.startAccepting(message.payload);
        sendResponse({ success: true, message: 'Accepting started' });
      } else if (message.action === 'STOP_ACCEPTING') {
        this.stopAccepting();
        sendResponse({ success: true, message: 'Accepting stopped' });
      } else if (message.action === 'GET_STATUS') {
        const status = this.getStatus();
        sendResponse(status);
      } else if (message.action === 'UPDATE_CONFIG') {
        this.updateConfig(message.payload);
        sendResponse({ success: true });
      }

      return true; // Keep channel open for async responses
    });
  }

  /**
   * Setup cleanup on uninstall
   */
  setupOnUninstall() {
    chrome.runtime.setUninstallURL('https://linkedin.com', () => {
      // Clean up data on uninstall
      ConfigManager.clearAll();
    });
  }

  /**
   * Load configuration from storage
   */
  async loadConfig() {
    try {
      this.config = await ConfigManager.loadConfig();
      this.logger.log('Configuration loaded:', this.config);
      return this.config;
    } catch (e) {
      this.logger.error('Error loading config:', e);
      // Use defaults if error
      this.config = ConfigManager.DEFAULTS;
      return this.config;
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(payload) {
    // Ensure config is loaded
    if (!this.config) {
      await this.loadConfig();
    }

    if (payload.delayInterval !== undefined) {
      if (!ConfigManager.isValidDelay(payload.delayInterval)) {
        this.logger.warn('Invalid delay interval:', payload.delayInterval);
        return;
      }
      this.config.delayInterval = payload.delayInterval;
      if (this.rateLimiter) {
        this.rateLimiter.setDelayInterval(payload.delayInterval);
      }
    }

    if (payload.hourlyLimit !== undefined) {
      if (!ConfigManager.isValidHourlyLimit(payload.hourlyLimit)) {
        this.logger.warn('Invalid hourly limit:', payload.hourlyLimit);
        return;
      }
      this.config.hourlyLimit = payload.hourlyLimit;
      if (this.rateLimiter) {
        this.rateLimiter.setHourlyLimit(payload.hourlyLimit);
      }
    }

    await ConfigManager.saveConfig(this.config);
    this.logger.log('Configuration updated:', this.config);
  }

  /**
   * Start the accepting process
   */
  async startAccepting(payload) {
    if (this.isRunning) {
      this.logger.warn('Already running');
      return;
    }

    await this.loadConfig();

    // Update config with payload if provided
    if (payload) {
      await this.updateConfig(payload);
    }

    this.isRunning = true;
    this.sessionStartTime = Date.now();
    this.rateLimiter = new RateLimiter(
      this.config.delayInterval,
      this.config.hourlyLimit
    );

    // Update config in storage
    this.config.isRunning = true;
    this.config.sessionStartTime = this.sessionStartTime;
    await ConfigManager.saveConfig(this.config);

    this.logger.log('Starting acceptance loop with config:', this.config);
    this.acceptLoop();
  }

  /**
   * Stop the accepting process
   */
  async stopAccepting() {
    this.isRunning = false;
    this.logger.log('Stopping acceptance loop');

    // Update config in storage
    this.config.isRunning = false;
    await ConfigManager.saveConfig(this.config);
  }

  /**
   * Main accept loop
   */
  async acceptLoop() {
    while (this.isRunning) {
      try {
        // Get current tab
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (tabs.length === 0) {
          this.logger.warn('No active tab found');
          await this.sleep(2000);
          continue;
        }

        const activeTab = tabs[0];

        // Check if on LinkedIn invitation page
        const pageStatus = await this.getPageStatus(activeTab.id);

        if (!pageStatus.isOnInvitationPage) {
          this.logger.warn('Not on LinkedIn invitation page');
          await this.sleep(2000);
          continue;
        }

        if (pageStatus.buttonCount === 0) {
          this.logger.log('No accept buttons found. Attempting to scroll for more...');
          // Try to scroll to load more items first
          const scrolled = await this.scrollPageForMore(activeTab.id);
          if (scrolled) {
            this.logger.log('Scrolled to load more items. Waiting for content...');
            await this.sleep(3000);
            continue;
          } else {
            // If scroll didn't work, reload page
            this.logger.log('Scroll unsuccessful. Reloading page...');
            await chrome.tabs.reload(activeTab.id);
            await this.sleep(5000);
            continue;
          }
        }

        // Check rate limiting
        const canAccept = this.rateLimiter.canAccept();

        if (!canAccept.ready) {
          this.logger.log(canAccept.reason);

          // If hourly limit reached, wait for reset
          if (!canAccept.ready && canAccept.delay > 3600000) {
            const waitMinutes = Math.ceil(canAccept.delay / 60000);
            this.logger.log(
              `Hourly limit reached. Waiting ${waitMinutes} minutes...`
            );
            await this.sleep(canAccept.delay + 1000);
            // Reset hourly counter
            this.rateLimiter.resetStats();
            continue;
          } else {
            // Wait for delay
            await this.sleep(canAccept.delay);
            continue;
          }
        }

        // Accept invitation
        const result = await this.acceptInvitation(activeTab.id);

        if (result.success) {
          this.rateLimiter.recordAccept();
          this.config.totalAccepted++;
          this.config.hourlyAccepted++;
          await ConfigManager.updateConfig('totalAccepted', this.config.totalAccepted);
          await ConfigManager.updateConfig('hourlyAccepted', this.config.hourlyAccepted);

          this.logger.log(
            `Accepted invitation. Total: ${this.config.totalAccepted}, This hour: ${this.config.hourlyAccepted}`
          );

          // Wait for configured delay
          const delayTime = this.config.delayInterval;
          const variance = Math.random() * (delayTime * 0.1) - (delayTime * 0.05);
          await this.sleep(delayTime + variance);
        } else {
          this.logger.warn('Failed to accept invitation:', result.error);
          await this.sleep(2000);
        }

        // Broadcast status update to popup
        this.broadcastStatus();
      } catch (e) {
        this.logger.error('Error in accept loop:', e);
        await this.sleep(2000);
      }
    }

    this.logger.log('Accept loop stopped');
  }

  /**
   * Accept a single invitation
   */
  async acceptInvitation(tabId) {
    try {
      const buttons = await this.getAcceptButtons(tabId);

      if (buttons.buttonCount === 0) {
        return { success: false, error: 'No buttons found' };
      }

      // Accept the first button
      const result = await chrome.tabs.sendMessage(tabId, {
        action: 'ACCEPT_INVITE',
        payload: { buttonIndex: 0 },
      });

      return result;
    } catch (e) {
      this.logger.error('Error accepting invitation:', e);
      return { success: false, error: e.message };
    }
  }

  /**
   * Get accept buttons from current tab
   */
  async getAcceptButtons(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'FIND_BUTTONS',
      });
      return response;
    } catch (e) {
      this.logger.error('Error getting buttons:', e);
      return { success: false, buttonCount: 0, buttons: [] };
    }
  }

  /**
   * Get page status from current tab
   */
  async getPageStatus(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'GET_PAGE_STATUS',
      });
      return response;
    } catch (e) {
      this.logger.error('Error getting page status:', e);
      return {
        isOnInvitationPage: false,
        buttonCount: 0,
      };
    }
  }

  /**
   * Scroll the page to trigger infinite scroll loading
   */
  async scrollPageForMore(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'SCROLL_FOR_MORE',
      });
      return response.success;
    } catch (e) {
      this.logger.error('Error scrolling page:', e);
      return false;
    }
  }

  /**
   * Get current session status
   */
  getStatus() {
    const stats = this.rateLimiter ? this.rateLimiter.getStats() : {};

    return {
      isRunning: this.isRunning,
      sessionStartTime: this.sessionStartTime,
      totalAccepted: this.config ? this.config.totalAccepted : 0,
      hourlyAccepted: this.config ? this.config.hourlyAccepted : 0,
      delayInterval: this.config ? this.config.delayInterval : 500,
      hourlyLimit: this.config ? this.config.hourlyLimit : 50,
      stats: stats,
    };
  }

  /**
   * Broadcast status to popup
   */
  broadcastStatus() {
    const status = this.getStatus();
    chrome.runtime.sendMessage(
      {
        action: 'STATUS_UPDATE',
        payload: status,
      },
      () => {
        // Ignore errors (popup might not be open)
      }
    );
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Initialize background controller
const controller = new BackgroundController();
