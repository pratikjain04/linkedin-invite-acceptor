/**
 * Popup Script
 * Handles UI interaction and communication with background service worker
 */

class PopupController {
  constructor() {
    this.logger = new Logger();
    this.setupEventListeners();
    this.loadAndDisplayConfig();
    this.pollStatus();
  }

  /**
   * Setup event listeners for UI elements
   */
  setupEventListeners() {
    document.getElementById('start-btn').addEventListener('click', () => {
      this.startAccepting();
    });

    document.getElementById('stop-btn').addEventListener('click', () => {
      this.stopAccepting();
    });

    document.getElementById('delay-select').addEventListener('change', (e) => {
      this.updateDelayConfig(parseInt(e.target.value));
    });

    document.getElementById('limit-select').addEventListener('change', (e) => {
      this.updateLimitConfig(parseInt(e.target.value));
    });
  }

  /**
   * Load and display current configuration
   */
  async loadAndDisplayConfig() {
    try {
      const config = await ConfigManager.loadConfig();
      document.getElementById('delay-select').value = config.delayInterval;
      document.getElementById('limit-select').value = config.hourlyLimit;
    } catch (e) {
      this.logger.error('Error loading config:', e);
    }
  }

  /**
   * Update delay configuration
   */
  async updateDelayConfig(delay) {
    if (!ConfigManager.isValidDelay(delay)) {
      this.logger.error('Invalid delay:', delay);
      return;
    }

    chrome.runtime.sendMessage(
      {
        action: 'UPDATE_CONFIG',
        payload: { delayInterval: delay },
      },
      (response) => {
        if (response && response.success) {
          this.logger.log('Delay updated to:', delay);
        }
      }
    );
  }

  /**
   * Update hourly limit configuration
   */
  async updateLimitConfig(limit) {
    if (!ConfigManager.isValidHourlyLimit(limit)) {
      this.logger.error('Invalid limit:', limit);
      return;
    }

    chrome.runtime.sendMessage(
      {
        action: 'UPDATE_CONFIG',
        payload: { hourlyLimit: limit },
      },
      (response) => {
        if (response && response.success) {
          this.logger.log('Hourly limit updated to:', limit);
        }
      }
    );
  }

  /**
   * Start accepting invitations
   */
  startAccepting() {
    const delayInterval = parseInt(document.getElementById('delay-select').value);
    const hourlyLimit = parseInt(document.getElementById('limit-select').value);

    chrome.runtime.sendMessage(
      {
        action: 'START_ACCEPTING',
        payload: { delayInterval, hourlyLimit },
      },
      (response) => {
        if (response && response.success) {
          this.logger.log('Accepting started');
          this.updateUIState(true);
        }
      }
    );
  }

  /**
   * Stop accepting invitations
   */
  stopAccepting() {
    chrome.runtime.sendMessage(
      {
        action: 'STOP_ACCEPTING',
      },
      (response) => {
        if (response && response.success) {
          this.logger.log('Accepting stopped');
          this.updateUIState(false);
        }
      }
    );
  }

  /**
   * Poll status from background service worker
   */
  pollStatus() {
    const pollInterval = setInterval(() => {
      chrome.runtime.sendMessage(
        {
          action: 'GET_STATUS',
        },
        (response) => {
          if (response) {
            this.displayStatus(response);
          }
        }
      );
    }, 1000); // Poll every 1 second
  }

  /**
   * Display status from background service worker
   */
  displayStatus(status) {
    // Update total accepted
    document.getElementById('total-accepted').textContent = status.totalAccepted;

    // Update hourly accepted
    document.getElementById('hourly-accepted').textContent = status.hourlyAccepted;

    // Update remaining quota
    const remaining = status.hourlyLimit - status.hourlyAccepted;
    document.getElementById('remaining-quota').textContent = Math.max(0, remaining);

    // Update UI state
    this.updateUIState(status.isRunning);

    // Update status text
    const statusText = document.getElementById('status-text');
    const statusLight = document.getElementById('status-light');

    if (status.isRunning) {
      statusText.textContent = 'Running...';
      statusText.className = 'status-text status-running';
      statusLight.classList.add('active');
    } else {
      statusText.textContent = 'Ready';
      statusText.className = 'status-text status-stopped';
      statusLight.classList.remove('active');
    }
  }

  /**
   * Update UI state based on running status
   */
  updateUIState(isRunning) {
    document.getElementById('start-btn').disabled = isRunning;
    document.getElementById('stop-btn').disabled = !isRunning;
    document.getElementById('delay-select').disabled = isRunning;
    document.getElementById('limit-select').disabled = isRunning;
  }
}

// Initialize popup controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
