#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("Checking NiedProxy dependencies...\n")

const checks = [
  {
    name: "Node.js",
    command: "node --version",
    minVersion: "18.0.0",
    required: true,
  },
  {
    name: "Python 3",
    command: "python3 --version",
    minVersion: "3.7.0",
    required: true,
  },
  {
    name: "Tor",
    command: "tor --version",
    required: true,
  },
  {
    name: "pip3",
    command: "pip3 --version",
    required: true,
  },
]

const pythonPackages = ["requests", "stem", "psutil"]

let allGood = true

// Check system dependencies
for (const check of checks) {
  try {
    const output = execSync(check.command, { encoding: "utf8", stdio: "pipe" })
    console.log(`[OK] ${check.name}: ${output.trim().split("\n")[0]}`)
  } catch (error) {
    console.log(`[ERROR] ${check.name}: Not found`)
    if (check.required) {
      allGood = false
    }
  }
}

// Check Python packages
console.log("\nChecking Python packages...")
for (const pkg of pythonPackages) {
  try {
    execSync(`python3 -c "import ${pkg}"`, { stdio: "pipe" })
    console.log(`[OK] ${pkg}: Installed`)
  } catch (error) {
    console.log(`[ERROR] ${pkg}: Not installed`)
    allGood = false
  }
}

// Check if Tor config directory exists
console.log("\nChecking directories...")
const torDir = path.join(process.env.HOME, ".tor")
if (fs.existsSync(torDir)) {
  console.log(`[OK] Tor directory: ${torDir}`)
} else {
  console.log(`[INFO] Tor directory: Will be created on first run`)
}

// Check if scripts are executable
console.log("\nChecking scripts...")
const scriptsToCheck = ["scripts/tor_manager.py", "scripts/install_dependencies.sh", "start.sh"]

for (const script of scriptsToCheck) {
  if (fs.existsSync(script)) {
    try {
      fs.accessSync(script, fs.constants.F_OK)
      console.log(`[OK] ${script}: Found`)
    } catch (error) {
      console.log(`[ERROR] ${script}: Not accessible`)
    }
  } else {
    console.log(`[ERROR] ${script}: Not found`)
  }
}

console.log("\n" + "=".repeat(50))

if (allGood) {
  console.log("All dependencies are satisfied!")
  console.log("You can start NiedProxy with: npm run dev")
} else {
  console.log("Some dependencies are missing.")
  console.log("Run: npm run install-deps")
  console.log("Or manually install missing components.")
}

console.log("\nFor help, see README.md")
