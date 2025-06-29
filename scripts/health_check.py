#!/usr/bin/env python3
"""
NiedProxy Health Check
Verify system health and Tor connectivity
"""

import subprocess
import requests
import json
import time
import socket
import sys
from datetime import datetime

def check_port(host, port, timeout=5):
    """Check if a port is open"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except:
        return False

def check_tor_process():
    """Check if Tor process is running"""
    try:
        result = subprocess.run(['pgrep', 'tor'], capture_output=True, text=True)
        return len(result.stdout.strip()) > 0
    except:
        return False

def check_tor_connectivity():
    """Check Tor connectivity"""
    try:
        proxies = {
            'http': 'socks5h://127.0.0.1:9050',
            'https': 'socks5h://127.0.0.1:9050'
        }
        
        response = requests.get(
            'https://check.torproject.org/api/ip',
            proxies=proxies,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                'connected': True,
                'is_tor': data.get('IsTor', False),
                'ip': data.get('IP'),
                'response_time': response.elapsed.total_seconds()
            }
        else:
            return {'connected': False, 'error': f'HTTP {response.status_code}'}
            
    except Exception as e:
        return {'connected': False, 'error': str(e)}

def check_dns_leak():
    """Check for DNS leaks"""
    try:
        proxies = {
            'http': 'socks5h://127.0.0.1:9050',
            'https': 'socks5h://127.0.0.1:9050'
        }
        
        # Test DNS resolution through Tor
        response = requests.get(
            'https://httpbin.org/ip',
            proxies=proxies,
            timeout=10
        )
        
        if response.status_code == 200:
            tor_ip = response.json()['origin']
            
            # Test direct connection
            direct_response = requests.get('https://httpbin.org/ip', timeout=10)
            if direct_response.status_code == 200:
                direct_ip = direct_response.json()['origin']
                
                return {
                    'leak_detected': tor_ip == direct_ip,
                    'tor_ip': tor_ip,
                    'direct_ip': direct_ip
                }
        
        return {'leak_detected': False, 'error': 'Could not test'}
        
    except Exception as e:
        return {'leak_detected': False, 'error': str(e)}

def main():
    """Run health check"""
    print("NiedProxy Health Check")
    print("=" * 40)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()
    
    health_status = {
        'timestamp': datetime.now().isoformat(),
        'overall_health': 'healthy',
        'checks': {}
    }
    
    # Check Tor process
    print("Checking Tor process...")
    tor_running = check_tor_process()
    health_status['checks']['tor_process'] = tor_running
    
    if tor_running:
        print("[OK] Tor process is running")
    else:
        print("[ERROR] Tor process is not running")
        health_status['overall_health'] = 'unhealthy'
    
    # Check ports
    print("\nChecking ports...")
    socks_port = check_port('127.0.0.1', 9050)
    control_port = check_port('127.0.0.1', 9051)
    
    health_status['checks']['socks_port'] = socks_port
    health_status['checks']['control_port'] = control_port
    
    if socks_port:
        print("[OK] SOCKS port (9050) is open")
    else:
        print("[ERROR] SOCKS port (9050) is not accessible")
        health_status['overall_health'] = 'unhealthy'
    
    if control_port:
        print("[OK] Control port (9051) is open")
    else:
        print("[ERROR] Control port (9051) is not accessible")
        health_status['overall_health'] = 'degraded'
    
    # Check Tor connectivity
    if socks_port:
        print("\nChecking Tor connectivity...")
        connectivity = check_tor_connectivity()
        health_status['checks']['connectivity'] = connectivity
        
        if connectivity['connected']:
            if connectivity['is_tor']:
                print(f"[OK] Connected through Tor network")
                print(f"   IP: {connectivity['ip']}")
                print(f"   Response time: {connectivity['response_time']:.2f}s")
            else:
                print(f"[WARNING] Connected but not using Tor")
                print(f"   IP: {connectivity['ip']}")
                health_status['overall_health'] = 'degraded'
        else:
            print(f"[ERROR] Tor connectivity failed: {connectivity['error']}")
            health_status['overall_health'] = 'unhealthy'
    
    # Check DNS leaks
    if socks_port:
        print("\nChecking for DNS leaks...")
        dns_check = check_dns_leak()
        health_status['checks']['dns_leak'] = dns_check
        
        if 'error' not in dns_check:
            if dns_check['leak_detected']:
                print("[ERROR] DNS leak detected!")
                print(f"   Tor IP: {dns_check['tor_ip']}")
                print(f"   Direct IP: {dns_check['direct_ip']}")
                health_status['overall_health'] = 'unhealthy'
            else:
                print("[OK] No DNS leaks detected")
                print(f"   Tor IP: {dns_check['tor_ip']}")
                print(f"   Direct IP: {dns_check['direct_ip']}")
        else:
            print(f"[WARNING] Could not test DNS leaks: {dns_check['error']}")
    
    # Summary
    print("\n" + "=" * 40)
    print(f"Overall Health: {health_status['overall_health'].upper()}")
    
    if len(sys.argv) > 1 and sys.argv[1] == '--json':
        print(json.dumps(health_status, indent=2))
    
    # Exit with appropriate code
    if health_status['overall_health'] == 'healthy':
        sys.exit(0)
    elif health_status['overall_health'] == 'degraded':
        sys.exit(1)
    else:
        sys.exit(2)

if __name__ == "__main__":
    main()
