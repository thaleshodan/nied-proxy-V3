# NiedProxy v3.0

Localhost-Based I2P Router Clone with Tor Integration Using Python and React

## Features

- **Real Tor Integration**: Direct integration with Tor network
- **Localhost Only Access**: Secure access restricted to localhost:5050
- **IP Rotation**: Automatic and manual IP rotation
- **Security Monitoring**: Real-time threat detection and security scoring
- **Network Visualization**: Visual representation of proxy routes
- **Advanced Terminal**: Full command-line interface
- **Traffic Analysis**: Real-time network traffic monitoring

## Requirements

- Linux/macOS/Win system
- Python 3.7+
- Node.js 18+
- Tor package

## Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone <repository-url>
   cd niedproxy
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm run install-deps
   \`\`\`

3. **Install Python dependencies:**
   \`\`\`bash
   pip3 install requests stem psutil
   \`\`\`

4. **Build the application:**
   \`\`\`bash
   npm run build
   \`\`\`

## Usage

1. **Start the dashboard:**
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Access the dashboard:**
   Open your browser and navigate to `http://localhost:5050`

3. **Start Tor service:**
   Click the "START TOR" button in the dashboard header

4. **Monitor your connection:**
   View real-time IP, location, and security metrics

## Security Features

- **Localhost Only**: Dashboard only accessible from localhost
- **Tor Integration**: Real Tor network connection
- **IP Rotation**: Automatic identity changes
- **Threat Detection**: Real-time security monitoring
- **Traffic Encryption**: AES-256 encryption
- **DNS Leak Protection**: Prevents DNS leaks
- **Fingerprint Protection**: Browser fingerprint randomization

## API Endpoints

- `GET /api/tor/status` - Get Tor status
- `POST /api/tor/start` - Start Tor service
- `POST /api/tor/stop` - Stop Tor service
- `POST /api/tor/rotate` - Rotate IP address
- `GET /api/tor/test` - Test connection

## Terminal Commands

- `help` - Show available commands
- `status` - Show current proxy status
- `rotate` - Rotate to new IP address
- `start` - Start Tor service
- `stop` - Stop Tor service
- `test` - Test connection
- `scan` - Scan for vulnerabilities
- `trace [domain]` - Trace route to domain
- `ping [host]` - Ping host through proxy
- `clear` - Clear terminal
- `exit` - Close terminal

## Configuration

The Tor configuration is automatically managed by the application. Default settings:

- SOCKS Port: 9050
- Control Port: 9051
- Exit Nodes: US, DE, NL, SE, CH
- Circuit Period: 30 seconds
- Max Circuit Age: 10 minutes

## Troubleshooting

1. **Tor won't start:**
   - Check if Tor is installed: `tor --version`
   - Ensure ports 9050 and 9051 are available
   - Check system logs for errors

2. **Dashboard not accessible:**
   - Ensure you're accessing from localhost
   - Check if port 5050 is available
   - Verify firewall settings

3. **IP rotation fails:**
   - Ensure Tor is running
   - Check Tor logs for circuit issues
   - Try restarting Tor service

## Security Notice

This tool is for educational and legitimate privacy purposes only. Users are responsible for complying with all applicable laws and regulations in their jurisdiction.

## License

MIT License - see LICENSE file for details
\`\`\`

