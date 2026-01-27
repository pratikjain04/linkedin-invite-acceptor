# LinkedIn Invite Acceptor

A Chrome extension for automating LinkedIn invitation acceptance with smart rate limiting to prevent bot detection.

## Features

- **Configurable Delay**: Set delays between accepts (500ms - 5 seconds)
- **Hourly Limits**: Control max accepts per hour (10-100)
- **Smart Rate Limiting**: Built-in anti-bot detection mechanisms
- **Real-time Monitoring**: Track progress in popup UI
- **No Data Collection**: All settings stored locally, fully private

## Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store page](#) (link will be available after publishing)
2. Click "Add to Chrome"
3. Confirm permissions

### Manual Installation (Development)
1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `linkedin-invite-acceptor` folder
6. Grant permissions when prompted

## Usage

1. Navigate to LinkedIn invitation manager
2. Open the extension popup (click icon in top-right)
3. Configure your preferred delay and hourly limit
4. Click "Start Accepting"
5. Monitor progress in real-time
6. Click "Stop" to halt at any time

## Configuration Options

### Delay Between Accepts
- 500 milliseconds (fastest)
- 1 second (default)
- 2 seconds
- 3 seconds
- 4 seconds
- 5 seconds (safest)

### Hourly Limits
- 10, 20, 30, 40, 50 (default), 60, 70, 80, 90, 100 requests/hour

## How It Works

The extension uses a sophisticated rate limiting system:

1. **Enforces configurable delays** between each acceptance
2. **Adds ±10% variance** to delays to appear more human-like
3. **Tracks hourly limits** with a rolling window
4. **Pauses when limits are reached** until the hour resets
5. **Reloads pages automatically** to fetch new invitations

## Architecture

```
linkedin-invite-acceptor/
├── manifest.json              # Extension configuration
├── src/
│   ├── popup/                 # User interface
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── background/            # Service worker (orchestration)
│   │   └── background.js
│   ├── content/               # DOM interaction
│   │   └── content-script.js
│   ├── utils/                 # Shared utilities
│   │   ├── logger.js
│   │   ├── config-manager.js
│   │   └── rate-limiter.js
│   └── assets/
│       ├── icon-16.png
│       ├── icon-48.png
│       └── icon-128.png
└── docs/
    ├── ARCHITECTURE.md        # System design
    └── DEPLOYMENT.md          # Deployment guide
```

## Documentation

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Complete technical architecture and design
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Detailed guide for deploying to Chrome Web Store

## Security & Privacy

✅ **No data collection** - All settings stored locally in your browser
✅ **No external requests** - Extension communicates only with LinkedIn
✅ **No tracking** - No analytics or telemetry
✅ **Open source** - Full transparency of what the extension does

## Important Notice

⚠️ **LinkedIn's Terms of Service**: Automated tools may violate LinkedIn's terms of service. Use at your own risk. We recommend:
- Starting with conservative settings (longer delays, lower hourly limits)
- Monitoring your account for any warnings
- Taking breaks between sessions
- Using this responsibly

## Troubleshooting

### Extension not working?
1. Ensure you're on the LinkedIn invitation manager page
2. Check the browser console (F12) for errors
3. Try reloading the extension (toggle in `chrome://extensions/`)

### Buttons not being found?
LinkedIn's UI can change. If the extension stops finding accept buttons:
1. Make sure you're on the correct page
2. Refresh the page
3. Wait a moment for the page to fully load

### Rate limiting issues?
The extension enforces rate limits strictly:
- If hourly limit is reached, it will wait until the hour resets
- No way to bypass limits intentionally (for your safety!)

## Development

### Building
```bash
# Extension is ready to use - just load unpacked in Chrome
# No build step required
```

### Testing
1. Load unpacked in Chrome (see Installation section)
2. Test locally with dummy configuration
3. Check browser console (F12) for debug messages

### Contributing
Contributions welcome! Please:
1. Follow existing code style
2. Add comments for complex logic
3. Test thoroughly before submitting
4. Update documentation as needed

## Version History

### v1.0.1 (Initial Release)
- Core functionality for accepting invitations
- Configurable rate limiting
- Beautiful, responsive UI
- Real-time status monitoring

## Future Enhancements

Planned for future versions:
- Analytics dashboard
- Scheduling (run at specific times)
- Whitelist/blacklist of users
- Custom auto-messages after accepting
- Multi-account support
- Export reports

## Support

For issues, questions, or suggestions:
1. Check the [troubleshooting](#troubleshooting) section
2. Review [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for technical details
3. Open an issue on GitHub

## License

MIT License - Feel free to use, modify, and distribute.

---

**Disclaimer**: This extension is provided as-is. Users assume all responsibility for compliance with LinkedIn's terms of service and any account consequences. Always test carefully before wide-scale use.

**Last Updated**: January 2026  
**Version**: 1.0.1
