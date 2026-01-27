# Quick Start Guide - LinkedIn Invite Acceptor

## Installation (Development Mode)

### Prerequisites
- Google Chrome or Chromium browser
- Basic understanding of Chrome extensions

### Step 1: Load the Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **"Load unpacked"** button
4. Navigate to your project folder: `/Users/pratik/Projects/linkedin-invite-acceptor`
5. Click **"Select"**

You should see the extension appear in your extensions list!

### Step 2: Verify Installation
1. Click the extension icon in the Chrome toolbar (top-right)
2. You should see the popup with:
   - "LinkedIn Invite Acceptor" title
   - Status indicator
   - Configuration dropdowns
   - Start/Stop buttons

### Step 3: Test the Extension
1. Navigate to https://www.linkedin.com/mynetwork/invitation-manager/
2. Open the extension popup (click its icon)
3. Verify you see stats and configuration options
4. Try adjusting the dropdown values (they should save)

## How to Use

### Basic Workflow
1. Navigate to LinkedIn invitation manager page
2. Click the extension icon to open popup
3. Adjust settings if needed:
   - **Delay Between Accepts**: Default is 1 second (safe option)
   - **Hourly Limit**: Default is 50 requests/hour
4. Click **"Start Accepting"** button
5. Watch real-time progress:
   - Total accepted counter
   - This hour counter
   - Remaining quota
   - Status indicator (Running/Ready)
6. Click **"Stop"** to halt at any time

### Configuration Tips

**For Safety (Recommended for First Run)**
- Delay: 3-5 seconds
- Hourly limit: 30-50
- Run for short periods (10-20 minutes)
- Monitor your LinkedIn account

**For Efficiency (After Verifying No Bot Detection)**
- Delay: 500ms - 1 second
- Hourly limit: 80-100
- Can run longer sessions
- Still safe with rate limiting

**Conservative (If You're Concerned)**
- Delay: 5 seconds
- Hourly limit: 20
- Run briefly several times per day
- Maximum stealth

## Troubleshooting

### "Extension Not Found" Error
**Problem**: Clicking the extension icon doesn't open anything
**Solution**: 
- Check that the extension is enabled in `chrome://extensions/`
- Try reloading the extension (toggle on/off)
- Ensure you're using a Chromium-based browser (Chrome, Edge, Brave)

### "No Buttons Found" Message
**Problem**: Extension says it can't find accept buttons
**Solution**:
1. Verify you're on the correct page:
   - URL should be: `linkedin.com/mynetwork/invitation-manager`
2. Refresh the page (Cmd+R or Ctrl+R)
3. Wait 3-5 seconds for the page to fully load
4. Try clicking "Start" again

### Settings Not Saving
**Problem**: When you close and reopen popup, settings are reset
**Solution**:
1. Check that Chrome storage is working:
   - Go to `chrome://extensions/`
   - Find LinkedIn Invite Acceptor
   - Click "Details"
   - Verify under "Host permissions" that linkedin.com is listed
2. Try reloading the extension

### Extension Stops Running
**Problem**: Automation starts but stops after a few clicks
**Possible Causes & Solutions**:
- **Hourly limit reached**: Wait 1 hour for counter to reset, then restart
- **You're not on the invitation page**: Navigate back to invitation-manager URL
- **Page changed dynamically**: Extension will automatically reload page
- **Browser restarted**: The background script stops. Restart by clicking "Start" again

## Understanding Rate Limiting

The extension uses TWO layers of protection:

### Layer 1: Per-Request Delay
- Minimum time between each accept
- Prevents rapid-fire clicking that looks like a bot
- Adds ±10% randomness for human-like behavior
- Example: 1 second delay = 900ms-1100ms actual delays

### Layer 2: Hourly Quota
- Maximum number of accepts per hour
- Once reached, extension automatically pauses
- Resumes accepting after 1 hour window resets
- Example: 50/hour limit = can accept max 50, then must wait

### How They Work Together
```
Hour 1 (00:00-01:00):
- Accept #1 at 00:00 → wait 1 second
- Accept #2 at 00:01 → wait 1 second
- Accept #50 at 00:49 → HOURLY LIMIT REACHED ⏸
- Extension pauses until 01:00

Hour 2 (01:00-02:00):
- Counter resets at 01:00
- Resume accepting normally
```

## Testing Checklist

Use this before running on your real LinkedIn account:

- [ ] Extension loads without errors (check console: F12)
- [ ] Popup displays correctly with all buttons
- [ ] Can adjust dropdown values
- [ ] Settings persist after closing/reopening popup
- [ ] Can click "Start" without errors
- [ ] Extension finds accept buttons on LinkedIn
- [ ] Buttons are being clicked (slowly, with delays)
- [ ] Status updates in real-time
- [ ] Can click "Stop" to halt
- [ ] Counter increments correctly

## Advanced: Checking Logs

To see detailed extension logs (for debugging):

1. Open Chrome DevTools (F12)
2. Go to "Application" tab → "Service Workers"
3. Click the LinkedIn Invite Acceptor background service worker
4. Go to the "Console" tab in the new window
5. You should see detailed logs of what the extension is doing

## Safety Recommendations

1. **Start small**: Begin with conservative settings on a test account
2. **Monitor account**: Watch for any warnings from LinkedIn
3. **Take breaks**: Don't run continuously for hours
4. **Test before scaling**: Verify no bot flags before accepting 1000+ invites
5. **Use proper delays**: Longer delays are always safer
6. **Have an off switch**: Always be ready to click "Stop"

## Common Questions

### Q: Will this get my account banned?
**A**: Unknown. We've implemented rate limiting to reduce risk, but automated tools violate LinkedIn's ToS. Use at your own risk. Start conservative.

### Q: Can I run multiple accounts?
**A**: Currently no. The extension works on one browser instance at a time. You could run separate browser windows for different accounts.

### Q: How many can I safely accept per day?
**A**: Start with 50-100 per hour, max 200-300 per day. Monitor for warnings.

### Q: What if LinkedIn detects the bot?
**A**: LinkedIn may:
- Ask you to verify your identity
- Temporarily limit invitations
- In extreme cases, restrict your account
Always have a way to contact LinkedIn support.

## Need Help?

1. Check the [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for technical details
2. Review [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for publishing info
3. Check browser console (F12 → Console tab) for error messages
4. Review source code comments in the files

---

**Next Steps**:
1. Load extension in Chrome
2. Navigate to LinkedIn invitation manager
3. Test with safe settings (3-5 sec delay, 30/hour limit)
4. Monitor your LinkedIn account for any warnings
5. If everything looks good, adjust settings as needed

**Ready to deploy?** See [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

Version: 1.0.1  
Last Updated: January 2026
