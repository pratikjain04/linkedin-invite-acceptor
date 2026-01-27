# LinkedIn Invite Acceptor Chrome Plugin - Architecture Document

## Overview

A Chrome extension that automates accepting LinkedIn connection invitations with intelligent rate limiting to avoid bot detection. The plugin provides a user-friendly interface for configuring delay intervals and hourly acceptance limits.

## Project Goals

1. **Safety First**: Implement smart rate limiting to prevent bot flagging
2. **User Control**: Allow configuration of delay intervals and hourly limits via UI
3. **Simplicity**: Easy installation and one-click operation
4. **Reliability**: Robust error handling and status tracking

---

## System Architecture

### 1. Plugin Structure

```
linkedin-invite-acceptor/
├── manifest.json                 # Chrome extension manifest
├── src/
│   ├── popup/
│   │   ├── popup.html           # UI for configuration & controls
│   │   ├── popup.css            # Styling for popup
│   │   └── popup.js             # Popup logic & event handlers
│   ├── background/
│   │   └── background.js        # Background service worker (persistent)
│   ├── content/
│   │   └── content-script.js    # DOM interaction on LinkedIn pages
│   ├── utils/
│   │   ├── rate-limiter.js      # Rate limiting logic
│   │   ├── config-manager.js    # Configuration persistence
│   │   └── logger.js            # Logging utility
│   └── assets/
│       └── icon.png             # Plugin icon
├── docs/
│   ├── ARCHITECTURE.md          # This file
│   └── DEPLOYMENT.md            # Deployment guide
└── package.json
```

### 2. Core Components

#### 2.1 Manifest (manifest.json)
- **Version**: Chrome Extension Manifest V3
- **Permissions**: 
  - `activeTab`: Access current tab
  - `scripting`: Inject content scripts
  - `storage`: Store user settings
  - `host_permissions`: linkedin.com
- **Icons**: 16x16, 48x48, 128x128 variants

#### 2.2 Background Service Worker (background.js)
**Responsibility**: Orchestrate the entire automation process
- Maintains global state (total accepted, hourly counter, timestamps)
- Manages rate limiter instance
- Listens for messages from popup and content script
- Controls the accept loop execution
- Handles hour boundary resets

**Key Functions**:
- `startAcceptLoop()`: Begin accepting invitations
- `stopAcceptLoop()`: Stop automation
- `resetHourlyCounter()`: Reset counters when hour passes
- `messageHandler()`: Handle inter-component communication

#### 2.3 Content Script (content-script.js)
**Responsibility**: Interact with LinkedIn DOM
- Finds accept buttons on invitation page
- Clicks buttons when instructed
- Reports back DOM state to background worker
- Handles page navigation

**Key Functions**:
- `getAcceptButtons()`: Query all unaccepted invitations
- `acceptInvitation(buttonElement)`: Click accept button
- `observePageChanges()`: Monitor DOM mutations

#### 2.4 Popup UI (popup.html/js)
**Responsibility**: User configuration and monitoring interface
- Displays current session statistics
- Provides dropdown selectors for:
  - Delay interval (500ms, 1s, 2s, 3s, 4s, 5s)
  - Hourly limit (10, 20, 30, ..., 100)
- Start/Stop buttons
- Live status updates
- Session timer and progress indicators

#### 2.5 Rate Limiter (rate-limiter.js)
**Responsibility**: Enforce rate limiting rules
- Tracks accepts per hour (rolling window)
- Enforces minimum delay between accepts
- Calculates wait time when limits are reached
- Prevents configuration of invalid values

**Key Classes**:
- `RateLimiter`: Manages delay and hourly constraints

#### 2.6 Config Manager (config-manager.js)
**Responsibility**: Persist user settings
- Load/save settings to Chrome storage
- Validate configuration values
- Provide default values
- Handle migration of old configs

---

## Configuration Settings

### User-Configurable Parameters

#### 1. Delay Between Accepts
- **Default**: 500 ms
- **Options**: 500ms, 1000ms, 2000ms, 3000ms, 4000ms, 5000ms
- **Storage Key**: `delayInterval`
- **Validation**: Enum-based, no free-form input

#### 2. Hourly Accept Limit
- **Default**: 50 requests/hour
- **Options**: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
- **Storage Key**: `hourlyLimit`
- **Validation**: Enum-based, multiples of 10

### Storage Structure

**Chrome Storage (Sync)**:
```json
{
  "delayInterval": 500,          // milliseconds
  "hourlyLimit": 50,             // requests per hour
  "sessionStartTime": 1234567890,
  "isRunning": false,
  "totalAccepted": 0,
  "hourlyAccepted": 0
}
```

---

## Rate Limiting Strategy

### Dual-Layer Protection

#### Layer 1: Inter-Request Delay
- Minimum delay between successive accepts
- User-configurable: 500ms to 5 seconds
- Randomization: ±10% variance (optional, for stealth)

#### Layer 2: Hourly Limit
- Maximum 100 requests per hour (configurable)
- Rolling hour window
- When limit reached, pause until hour completes

### Implementation Logic

```
function acceptNext():
  1. Check if hourlyCounter >= hourlyLimit
     → If yes: Calculate sleep time, wait, reset counter
  2. Get next accept button
     → If none: Reload page, wait 5s, retry
  3. Click button
  4. Increment counters (total, hourly)
  5. Sleep for configuredDelay ± randomization
  6. Repeat
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Popup UI                              │
│  (Start/Stop, Config Dropdowns, Status Display)             │
└────────────────────┬────────────────────────────────────────┘
                     │ chrome.runtime.sendMessage()
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Background Service Worker                  │
│  - Maintains global state                                   │
│  - Orchestrates accept loop                                 │
│  - Enforces rate limiting                                   │
└────────────────────┬────────────────────────────────────────┘
                     │ chrome.tabs.sendMessage()
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     Content Script                          │
│  - Finds accept buttons in DOM                              │
│  - Clicks buttons when instructed                           │
│  - Reports status back                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Message Protocol

### Popup → Background
```javascript
{
  action: 'START_ACCEPTING',
  payload: { delayInterval, hourlyLimit }
}

{
  action: 'STOP_ACCEPTING'
}

{
  action: 'GET_STATUS'
}
```

### Background → Content Script
```javascript
{
  action: 'ACCEPT_NEXT',
  payload: { delayInterval }
}

{
  action: 'RELOAD_PAGE'
}
```

### Content Script → Background
```javascript
{
  type: 'ACCEPT_SUCCESS',
  payload: { timestamp }
}

{
  type: 'ACCEPT_FAILED',
  payload: { error }
}

{
  type: 'NO_BUTTONS_FOUND'
}
```

---

## Security & Safety Considerations

### Bot Detection Prevention

1. **Randomized Delays**: Add ±10% variance to configured delay
2. **Smart Hourly Limiting**: Never exceed configured limit per hour
3. **Page Reload Strategy**: Reload page after each batch to appear human-like
4. **Error Handling**: Gracefully handle network errors and page changes
5. **Session Management**: Track session duration and provide warnings for long runs

### Privacy & Data

- No data sent to external servers
- All configuration stored locally in Chrome storage
- No tracking or analytics
- No persistent logs (optional debug mode only)

---

## Error Handling

### Scenarios

| Scenario | Handling |
|----------|----------|
| Accept button disappears | Catch error, continue to next |
| No buttons found | Reload page, wait 5s, retry |
| Network timeout | Retry with exponential backoff |
| Hour boundary reached | Reset counter, continue |
| User navigates away | Pause, wait for return to invitation page |
| Extension disabled | Stop cleanly, report to user |

---

## User Experience Flow

### Initial Setup
1. User installs extension
2. Opens popup
3. Sees default config (500ms delay, 50/hour limit)
4. Optional: Adjusts dropdowns to desired values
5. Navigates to LinkedIn invitation manager
6. Clicks "Start Accepting"

### During Operation
1. Status shows "Running..." with live counters
2. Displays: Total accepted, This hour count, Remaining quota
3. Shows current delay and hourly limit
4. Provides "Stop" button for manual halt

### Completion
1. When all invitations accepted, shows "Complete!"
2. Displays session summary (total accepted, duration)
3. Offers option to reset and run again

---

## Browser Compatibility

- **Primary**: Chrome 88+
- **Secondary**: Edge 88+, Brave 1.30+
- **Not Compatible**: Firefox (different extension API)

---

## Performance Considerations

- Minimal memory footprint (< 5MB)
- Background script runs only when active
- Content script injected only on LinkedIn domains
- Efficient DOM querying (use CSS selectors)
- Throttled status updates to popup (max 1/second)

---

## Testing Strategy

### Unit Tests
- Rate limiter logic (delay calculations, hour resets)
- Config manager (validation, storage)

### Integration Tests
- Message passing between components
- UI interactions and state updates

### Manual Testing
- Accept invitations on test LinkedIn account
- Verify rate limiting enforcement
- Test configuration persistence
- Verify UI updates in real-time

---

## Deployment & Distribution

See `DEPLOYMENT.md` for detailed instructions on:
- Building the extension
- Creating a Chrome Web Store developer account
- Uploading as private/unlisted extension
- Managing versions and updates

---

## Future Enhancements

1. **Analytics Dashboard**: View accept patterns and trends
2. **Scheduling**: Automate at specific times (e.g., once daily)
3. **Whitelist/Blacklist**: Accept/decline specific users
4. **Custom Messages**: Auto-send personalized messages after accepting
5. **Multi-account Support**: Switch between accounts
6. **Export Reports**: CSV export of accepted connections

---

## Troubleshooting

### Issue: Plugin not finding accept buttons
**Solution**: Ensure you're on the invitation manager page. Some pages load buttons dynamically; refresh and retry.

### Issue: Accepts suddenly stop
**Solution**: Check hourly limit hasn't been reached. Restart after hour boundary.

### Issue: Settings not persisting
**Solution**: Ensure Chrome sync is enabled or check storage permissions in manifest.

---

## Support & Contact

For issues or feature requests, open an issue on the GitHub repository.

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Author**: Pratik Jain
