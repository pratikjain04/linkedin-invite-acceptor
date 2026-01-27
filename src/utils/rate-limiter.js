/**
 * Rate Limiter
 * Enforces rate limiting constraints on LinkedIn invite acceptance
 */

class RateLimiter {
  constructor(delayInterval = 500, hourlyLimit = 50) {
    this.delayInterval = delayInterval; // ms between accepts
    this.hourlyLimit = hourlyLimit; // max accepts per hour
    this.acceptTimes = []; // array of accept timestamps
    this.lastAcceptTime = 0;
  }

  /**
   * Set the delay interval
   * @param {number} delay - Delay in milliseconds
   */
  setDelayInterval(delay) {
    this.delayInterval = delay;
  }

  /**
   * Set the hourly limit
   * @param {number} limit - Maximum accepts per hour
   */
  setHourlyLimit(limit) {
    this.hourlyLimit = limit;
  }

  /**
   * Calculate delay until next accept is allowed
   * @returns {number} Delay in milliseconds (0 if can accept immediately)
   */
  calculateDelay() {
    const now = Date.now();
    const timeSinceLastAccept = now - this.lastAcceptTime;
    const delayNeeded = this.delayInterval - timeSinceLastAccept;

    if (delayNeeded > 0) {
      return delayNeeded + this.getRandomVariance();
    }

    return 0;
  }

  /**
   * Check if hourly limit has been reached
   * @returns {Object} { limitReached: boolean, timeUntilReset: number }
   */
  checkHourlyLimit() {
    const now = Date.now();
    const oneHourAgo = now - 3600000; // 1 hour in milliseconds

    // Remove accepts older than 1 hour
    this.acceptTimes = this.acceptTimes.filter((time) => time > oneHourAgo);

    const limitReached = this.acceptTimes.length >= this.hourlyLimit;

    let timeUntilReset = 0;
    if (limitReached && this.acceptTimes.length > 0) {
      const oldestAccept = this.acceptTimes[0];
      timeUntilReset = 3600000 - (now - oldestAccept);
    }

    return {
      limitReached,
      timeUntilReset,
      currentCount: this.acceptTimes.length,
    };
  }

  /**
   * Record an acceptance
   * @returns {void}
   */
  recordAccept() {
    const now = Date.now();
    this.acceptTimes.push(now);
    this.lastAcceptTime = now;
  }

  /**
   * Get random variance for delay (±10%)
   * @returns {number} Random variance in milliseconds
   */
  getRandomVariance() {
    const variance = this.delayInterval * 0.1; // 10% variance
    return Math.random() * variance - variance / 2; // -5% to +5%
  }

  /**
   * Wait for the required delay before next accept
   * @returns {Promise<void>}
   */
  async waitForDelay() {
    const delay = this.calculateDelay();
    if (delay > 0) {
      return new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  /**
   * Wait until hourly limit resets
   * @returns {Promise<void>}
   */
  async waitForHourlyReset() {
    const { limitReached, timeUntilReset } = this.checkHourlyLimit();
    if (limitReached && timeUntilReset > 0) {
      return new Promise((resolve) => setTimeout(resolve, timeUntilReset + 1000)); // +1s buffer
    }
  }

  /**
   * Check if ready to accept (delay and hourly constraints)
   * @returns {Object} { ready: boolean, delay: number, reason: string }
   */
  canAccept() {
    const delayNeeded = this.calculateDelay();
    const { limitReached, timeUntilReset } = this.checkHourlyLimit();

    if (limitReached) {
      return {
        ready: false,
        delay: timeUntilReset,
        reason: `Hourly limit reached. Reset in ${Math.ceil(timeUntilReset / 1000)}s`,
      };
    }

    if (delayNeeded > 0) {
      return {
        ready: false,
        delay: delayNeeded,
        reason: `Waiting for delay. ${Math.ceil(delayNeeded)}ms remaining`,
      };
    }

    return {
      ready: true,
      delay: 0,
      reason: 'Ready to accept',
    };
  }

  /**
   * Get current stats
   * @returns {Object} Current statistics
   */
  getStats() {
    const { currentCount } = this.checkHourlyLimit();
    return {
      delayInterval: this.delayInterval,
      hourlyLimit: this.hourlyLimit,
      acceptedThisHour: currentCount,
      remainingQuota: this.hourlyLimit - currentCount,
      lastAcceptTime: this.lastAcceptTime,
      totalAccepts: this.acceptTimes.length,
    };
  }

  /**
   * Reset stats for a new session
   * @returns {void}
   */
  resetStats() {
    this.acceptTimes = [];
    this.lastAcceptTime = 0;
  }
}
