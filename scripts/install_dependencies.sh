#!/bin/bash

echo "Installing NiedProxy dependencies..."

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    if command -v apt-get &> /dev/null; then
        PKG_MANAGER="apt"
    elif command -v yum &> /dev/null; then
        PKG_MANAGER="yum"
    elif command -v pacman &> /dev/null; then
        PKG_MANAGER="pacman"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    PKG_MANAGER="brew"
else
    echo "Unsupported operating system: $OSTYPE"
    exit 1
fi

echo "Detected OS: $OS with package manager: $PKG_MANAGER"

# Install Tor based on package manager
echo "Installing Tor..."
case $PKG_MANAGER in
    "apt")
        sudo apt-get update
        sudo apt-get install -y tor python3-pip nodejs npm
        ;;
    "yum")
        sudo yum update -y
        sudo yum install -y tor python3-pip nodejs npm
        ;;
    "pacman")
        sudo pacman -Sy tor python-pip nodejs npm
        ;;
    "brew")
        brew install tor python3 node
        ;;
    *)
        echo "Please install Tor manually for your system"
        exit 1
        ;;
esac

# Verify installations
echo "Verifying installations..."
if ! command -v tor &> /dev/null; then
    echo "Error: Tor installation failed"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "Error: Python3 installation failed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "Error: Node.js installation failed"
    exit 1
fi

echo "All dependencies installed successfully!"

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install --user requests stem psutil

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Create Tor data directory
mkdir -p ~/.tor

# Set permissions
chmod 700 ~/.tor

# Configure Tor
echo "Configuring Tor..."
sudo tee /etc/tor/torrc << EOF
# NiedProxy Tor Configuration
SocksPort 9050
ControlPort 9051
HashedControlPassword 16:872860B76453A77D60CA2BB8C1A7042072093276A3D701AD684053EC4C
CookieAuthentication 0
ExitNodes {us},{de},{nl},{se},{ch}
StrictNodes 1
NewCircuitPeriod 30
MaxCircuitDirtiness 600
EnforceDistinctSubnets 1
UseEntryGuards 1
EOF

# Restart Tor service
sudo systemctl restart tor
sudo systemctl enable tor

echo "Installation complete!"
echo "Run 'npm run dev' to start NiedProxy on localhost:5050"
