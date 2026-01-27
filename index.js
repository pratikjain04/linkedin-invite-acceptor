const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Settings
  const HOURLY_LIMIT = 100;
  const MIN_DELAY = 500;
  const MAX_DELAY = 2000;

  await page.goto('https://www.linkedin.com/login');
  console.log("Please log in manually...");

  // Wait for you to get to the invitations page
  await page.waitForNavigation({ timeout: 0 });
  await page.goto('https://www.linkedin.com/mynetwork/invitation-manager/');

  let totalAccepted = 0;
  let hourlyAccepted = 0;
  let startTime = Date.now();

  async function processRequests() {
    while (true) {
      // Check if an hour has passed to reset the hourly counter
      if (Date.now() - startTime > 3600000) {
        console.log("New hour started. Resetting hourly limit.");
        hourlyAccepted = 0;
        startTime = Date.now();
      }

      // If limit reached, wait until the hour is up
      if (hourlyAccepted >= HOURLY_LIMIT) {
        const remainingTime = 3600000 - (Date.now() - startTime);
        console.log(`Limit reached. Sleeping for ${Math.round(remainingTime / 60000)} minutes...`);
        await new Promise(r => setTimeout(r, remainingTime));
        continue; 
      }

      const buttons = await page.$$('button[aria-label^="Accept"]');
      
      if (buttons.length === 0) {
        console.log("No more buttons found. Refreshing page...");
        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 5000)); // Wait for load
        continue;
      }

      for (const button of buttons) {
        if (hourlyAccepted >= HOURLY_LIMIT) break;

        try {
          await button.click();
          totalAccepted++;
          hourlyAccepted++;
          console.log(`Accepted: ${totalAccepted} (This hour: ${hourlyAccepted}/${HOURLY_LIMIT})`);

          // Your requested delay
          const delay = Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1) + MIN_DELAY);
          await new Promise(r => setTimeout(r, delay));
        } catch (e) {
          // If a button disappears or page shifts
          continue;
        }
      }
    }
  }

  await processRequests();
})();