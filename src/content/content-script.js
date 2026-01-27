/**
 * Content Script for LinkedIn Invite Acceptor
 * Runs on LinkedIn pages and interacts with the DOM to accept invitations
 */

class LinkedInAcceptor {
  constructor() {
    this.logger = new Logger();
    this.isRunning = false;
    this.setupMessageListener();
  }

  /**
   * Setup message listener for commands from background script
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.logger.log('Received message from background:', message);

      if (message.action === 'FIND_BUTTONS') {
        const buttons = this.findAcceptButtons();
        sendResponse({
          success: true,
          buttonCount: buttons.length,
          buttons: buttons.map((btn, idx) => ({
            id: idx,
            ariaLabel: btn.getAttribute('aria-label'),
          })),
        });
      } else if (message.action === 'ACCEPT_INVITE') {
        const result = this.acceptInvitation(message.payload.buttonIndex);
        sendResponse(result);
      } else if (message.action === 'GET_PAGE_STATUS') {
        sendResponse({
          isOnInvitationPage: this.isOnLinkedInInvitationPage(),
          buttonCount: this.findAcceptButtons().length,
        });
      } else if (message.action === 'SCROLL_FOR_MORE') {
        const scrolled = this.scrollToLoadMore();
        sendResponse({ success: scrolled });
      }
    });
  }

  /**
   * Check if we're on the LinkedIn invitation manager page
   * @returns {boolean}
   */
  isOnLinkedInInvitationPage() {
    const url = window.location.href;
    return url.includes('linkedin.com') && url.includes('invitation-manager');
  }

  /**
   * Find all accept buttons on the current page
   * @returns {Array<HTMLElement>} Array of accept buttons
   */
  findAcceptButtons() {
    try {
      // LinkedIn accept buttons have aria-label starting with "Accept"
      const buttons = Array.from(
        document.querySelectorAll('button[aria-label*="Accept"]')
      ).filter((btn) => {
        // Make sure button is visible and clickable
        const style = window.getComputedStyle(btn);
        return style.display !== 'none' && style.visibility !== 'hidden';
      });

      return buttons;
    } catch (e) {
      this.logger.error('Error finding buttons:', e);
      return [];
    }
  }

  /**
   * Accept a specific invitation by button index
   * @param {number} buttonIndex - Index of button to click
   * @returns {Object} Result of acceptance attempt
   */
  acceptInvitation(buttonIndex) {
    try {
      const buttons = this.findAcceptButtons();

      if (buttonIndex >= buttons.length) {
        return {
          success: false,
          error: 'Button index out of range',
        };
      }

      const button = buttons[buttonIndex];

      // Scroll button into view
      button.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Small delay to ensure visibility
      setTimeout(() => {
        button.click();
      }, 100);

      this.logger.log(`Clicked accept button ${buttonIndex}`);

      return {
        success: true,
        timestamp: Date.now(),
        remainingButtons: buttons.length - buttonIndex - 1,
      };
    } catch (e) {
      this.logger.error('Error accepting invitation:', e);
      return {
        success: false,
        error: e.message,
      };
    }
  }

  /**
   * Observe DOM changes for dynamically loaded buttons
   * @param {Function} callback - Called when DOM changes
   */
  observePageChanges(callback) {
    const observer = new MutationObserver((mutations) => {
      // Only trigger callback if changes include new buttons
      const hasButtonChanges = mutations.some((mut) => {
        return (
          mut.addedNodes.length > 0 &&
          Array.from(mut.addedNodes).some(
            (node) =>
              node.nodeType === Node.ELEMENT_NODE &&
              (node.querySelector('button[aria-label*="Accept"]') ||
                node.matches('button[aria-label*="Accept"]'))
          )
        );
      });

      if (hasButtonChanges) {
        callback();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    return observer;
  }

  /**
   * Scroll to bottom to load more invitations (infinite scroll)
   */
  scrollToLoadMore() {
    try {
      const scrollHeight = document.documentElement.scrollHeight;
      window.scrollBy(0, scrollHeight);
      return true;
    } catch (e) {
      this.logger.error('Error scrolling:', e);
      return false;
    }
  }

  /**
   * Reload the page to fetch new invitations
   */
  reloadPage() {
    this.logger.log('Reloading page...');
    window.location.reload();
  }
}

// Initialize content script
const acceptor = new LinkedInAcceptor();
