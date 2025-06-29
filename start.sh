#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting NiedProxy v2.0...${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root is not recommended for security reasons."
    echo "Consider running as a regular user."
    echo ""
fi

# Check dependencies
echo -e "${BLUE}Checking dependencies...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    echo "Install Node.js from: https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node --version)
    print_status "Node.js: $NODE_VERSION"
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed"
    echo "Install Python 3 from: https://python.org/"
    exit 1
else
    PYTHON_VERSION=$(python3 --version)
    print_status "Python: $PYTHON_VERSION"
fi

# Check Tor
if ! command -v tor &> /dev/null; then
    print_error "Tor is not installed"
    echo "Install with:"
    echo "  Ubuntu/Debian: sudo apt-get install tor"
    echo "  macOS: brew install tor"
    echo "  Or run: npm run install-deps"
    exit 1
else
    TOR_VERSION=$(tor --version | head -n1)
    print_status "Tor: $TOR_VERSION"
fi

echo ""

# Check if npm dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing npm dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install npm dependencies"
        exit 1
    fi
    print_status "npm dependencies installed"
else
    print_status "npm dependencies found"
fi

# Check Python dependencies
echo -e "${BLUE}Checking Python dependencies...${NC}"
python3 -c "import requests, stem, psutil" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing Python dependencies..."
    pip3 install --user requests stem psutil
    if [ $? -ne 0 ]; then
        print_error "Failed to install Python dependencies"
        echo "Try: sudo pip3 install requests stem psutil"
        exit 1
    fi
    print_status "Python dependencies installed"
else
    print_status "Python dependencies found"
fi

# Create necessary directories
echo -e "${BLUE}Setting up directories...${NC}"
mkdir -p ~/.tor
chmod 700 ~/.tor
print_status "Tor directory configured"

# Make scripts executable
chmod +x scripts/tor_manager.py 2>/dev/null
chmod +x scripts/install_dependencies.sh 2>/dev/null

# Check if port 5050 is available
if lsof -Pi :5050 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 5050 is already in use"
    echo "Stop the process using port 5050 or choose a different port"
    echo "Current process: $(lsof -Pi :5050 -sTCP:LISTEN)"
    echo ""
fi

echo ""
echo -e "${GREEN}All checks passed!${NC}"
echo ""
echo -e "${BLUE}NiedProxy Information:${NC}"
echo "  • Dashboard URL: http://localhost:5050"
echo "  • Access: Localhost only (secure)"
echo "  • Tor Integration: Real Tor network"
echo "  • Features: IP rotation, security monitoring, traffic analysis"
echo ""
echo -e "${YELLOW}Security Notice:${NC}"
echo "  • Dashboard is only accessible from localhost"
echo "  • Use responsibly and comply with local laws"
echo "  • For educational and legitimate privacy purposes only"
echo ""
echo -e "${BLUE}Starting NiedProxy dashboard...${NC}"
echo "Press Ctrl+C to stop"
echo ""

# Start the application
npm run dev
