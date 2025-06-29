#!/usr/bin/env python3
"""
NiedProxy Tor Manager
Real Tor integration and proxy management
"""

import subprocess
import requests
import json
import time
import socket
import threading
from stem import Signal
from stem.control import Controller
import stem.process
import os
import sys
from datetime import datetime
import psutil

# Add at the top after imports
def check_dependencies():
    """Check if all required dependencies are installed"""
    try:
        import requests
        import stem
        import psutil
        return True
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Install with: pip3 install requests stem psutil")
        return False

if not check_dependencies():
    sys.exit(1)

class TorManager:
    def __init__(self):
        self.tor_process = None
        self.controller = None
        self.socks_port = 9050
        self.control_port = 9051
        self.control_password = "niedproxy123"
        self.is_running = False
        self.current_ip = None
        self.circuit_info = []
        
    def start_tor(self):
        """Start Tor process"""
        try:
            print("Checking if Tor is already running...")
        
            # Check if Tor is already running on our ports
            for proc in psutil.process_iter(['pid', 'name', 'connections']):
                if 'tor' in proc.info['name'].lower():
                    try:
                        connections = proc.info['connections']
                        for conn in connections:
                            if conn.laddr.port in [self.socks_port, self.control_port]:
                                print(f"Tor already running on port {conn.laddr.port}, stopping...")
                                proc.terminate()
                                time.sleep(2)
                                if proc.is_running():
                                    proc.kill()
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
        
            print("Starting new Tor process...")
            
            # Kill any existing Tor processes
            self.stop_tor()
            
            # Start Tor with custom configuration
            tor_config = {
                'SocksPort': str(self.socks_port),
                'ControlPort': str(self.control_port),
                'HashedControlPassword': self._hash_password(self.control_password),
                'ExitNodes': '{us},{de},{nl},{se},{ch}',
                'StrictNodes': '1',
                'NewCircuitPeriod': '30',
                'MaxCircuitDirtiness': '600',
                'EnforceDistinctSubnets': '1',
                'UseEntryGuards': '1'
            }
            
            self.tor_process = stem.process.launch_tor_with_config(
                config=tor_config,
                init_msg_handler=self._tor_init_handler
            )
            
            # Connect to Tor controller
            self.controller = Controller.from_port(port=self.control_port)
            self.controller.authenticate(password=self.control_password)
            
            self.is_running = True
            print("Tor started successfully!")
            
            # Get initial IP
            self.get_current_ip()
            
            return True
            
        except Exception as e:
            print(f"Error starting Tor: {e}")
            return False
    
    def stop_tor(self):
        """Stop Tor process"""
        try:
            # Kill Tor processes
            for proc in psutil.process_iter(['pid', 'name']):
                if 'tor' in proc.info['name'].lower():
                    proc.kill()
            
            if self.controller:
                self.controller.close()
                self.controller = None
                
            if self.tor_process:
                self.tor_process.terminate()
                self.tor_process = None
                
            self.is_running = False
            print("Tor stopped successfully!")
            return True
            
        except Exception as e:
            print(f"Error stopping Tor: {e}")
            return False
    
    def new_identity(self):
        """Request new Tor identity (new IP)"""
        try:
            if not self.controller:
                return False
                
            print("Requesting new Tor identity...")
            self.controller.signal(Signal.NEWNYM)
            
            # Wait for new circuit
            time.sleep(5)
            
            # Get new IP
            old_ip = self.current_ip
            self.get_current_ip()
            
            if self.current_ip != old_ip:
                print(f"IP changed from {old_ip} to {self.current_ip}")
                return True
            else:
                print("IP change failed or same IP assigned")
                return False
                
        except Exception as e:
            print(f"Error requesting new identity: {e}")
            return False
    
    def get_current_ip(self):
        """Get current external IP through Tor"""
        try:
            proxies = {
                'http': f'socks5h://127.0.0.1:{self.socks_port}',
                'https': f'socks5h://127.0.0.1:{self.socks_port}'
            }
            
            response = requests.get(
                'https://httpbin.org/ip',
                proxies=proxies,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.current_ip = data['origin']
                return self.current_ip
            else:
                return None
                
        except Exception as e:
            print(f"Error getting current IP: {e}")
            return None
    
    def get_geolocation(self, ip=None):
        """Get geolocation for IP"""
        try:
            target_ip = ip or self.current_ip
            if not target_ip:
                return None
                
            proxies = {
                'http': f'socks5h://127.0.0.1:{self.socks_port}',
                'https': f'socks5h://127.0.0.1:{self.socks_port}'
            }
            
            response = requests.get(
                f'http://ip-api.com/json/{target_ip}',
                proxies=proxies,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
                
        except Exception as e:
            print(f"Error getting geolocation: {e}")
            return None
    
    def get_circuit_info(self):
        """Get current Tor circuit information"""
        try:
            if not self.controller:
                return []
                
            circuits = []
            for circuit in self.controller.get_circuits():
                if circuit.status == 'BUILT':
                    circuit_info = {
                        'id': circuit.id,
                        'status': circuit.status,
                        'path': [],
                        'purpose': circuit.purpose
                    }
                    
                    for relay in circuit.path:
                        relay_info = {
                            'fingerprint': relay[0],
                            'nickname': relay[1] if len(relay) > 1 else 'Unknown',
                            'country': 'Unknown'
                        }
                        circuit_info['path'].append(relay_info)
                    
                    circuits.append(circuit_info)
            
            self.circuit_info = circuits
            return circuits
            
        except Exception as e:
            print(f"Error getting circuit info: {e}")
            return []
    
    def test_connection(self):
        """Test Tor connection"""
        try:
            proxies = {
                'http': f'socks5h://127.0.0.1:{self.socks_port}',
                'https': f'socks5h://127.0.0.1:{self.socks_port}'
            }
            
            start_time = time.time()
            response = requests.get(
                'https://check.torproject.org/api/ip',
                proxies=proxies,
                timeout=10
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'is_tor': data.get('IsTor', False),
                    'ip': data.get('IP'),
                    'response_time': response_time
                }
            else:
                return {'success': False, 'error': 'Connection failed'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_status(self):
        """Get comprehensive Tor status"""
        status = {
            'is_running': self.is_running,
            'current_ip': self.current_ip,
            'socks_port': self.socks_port,
            'control_port': self.control_port,
            'circuits': len(self.circuit_info),
            'timestamp': datetime.now().isoformat()
        }
        
        if self.is_running:
            # Test connection
            test_result = self.test_connection()
            status.update(test_result)
            
            # Get geolocation
            geo = self.get_geolocation()
            if geo:
                status['geolocation'] = {
                    'country': geo.get('country', 'Unknown'),
                    'region': geo.get('regionName', 'Unknown'),
                    'city': geo.get('city', 'Unknown'),
                    'org': geo.get('org', 'Unknown'),
                    'timezone': geo.get('timezone', 'Unknown')
                }
        
        return status
    
    def _hash_password(self, password):
        """Hash password for Tor control"""
        try:
            # Try using tor command first
            result = subprocess.run(
                ['tor', '--hash-password', password],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                hash_line = result.stdout.strip().split('\n')[-1]
                if hash_line.startswith('16:'):
                    return hash_line
        
            # Fallback to stem library
            from stem.util import tor_tools
            return tor_tools.get_hash_password(password)
        except Exception as e:
            print(f"Warning: Could not hash password: {e}")
            # Use a pre-computed hash for 'niedproxy123'
            return "16:872860B76453A77D60CA2BB8C1A7042072093276A3D701AD684053EC4C"
    
    def _tor_init_handler(self, line):
        """Handle Tor initialization messages"""
        if "Bootstrapped 100%" in line:
            print("Tor bootstrap complete!")

# CLI interface
if __name__ == "__main__":
    tor_manager = TorManager()
    
    if len(sys.argv) < 2:
        print("Usage: python tor_manager.py [start|stop|status|newip|test]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "start":
        success = tor_manager.start_tor()
        print(json.dumps({"success": success}))
        
    elif command == "stop":
        success = tor_manager.stop_tor()
        print(json.dumps({"success": success}))
        
    elif command == "status":
        status = tor_manager.get_status()
        print(json.dumps(status, indent=2))
        
    elif command == "newip":
        success = tor_manager.new_identity()
        if success:
            status = tor_manager.get_status()
            print(json.dumps(status, indent=2))
        else:
            print(json.dumps({"success": False, "error": "Failed to get new IP"}))
            
    elif command == "test":
        result = tor_manager.test_connection()
        print(json.dumps(result, indent=2))
        
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
