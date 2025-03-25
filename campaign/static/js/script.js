// Get form and input elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');

// Clear initial error messages if elements exist
if (usernameError) usernameError.textContent = '';
if (passwordError) passwordError.textContent = '';

// Enhanced OS and device detection
function getDeviceInfo(userAgent) {
    let deviceInfo = {
        type: "Unknown",
        brand: "Unknown",
        os: "Unknown",
        osVersion: "Unknown"
    };

    // Mobile Device Detection
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
        deviceInfo.type = "Mobile";
        
        // Mobile Brand Detection
        if (userAgent.match(/iPhone/i)) {
            deviceInfo.brand = "iPhone";
            deviceInfo.os = "iOS";
            const match = userAgent.match(/OS (\d+[._]\d+[._]?\d*)/);
            if (match) deviceInfo.osVersion = match[1].replace(/_/g, '.');
        } else if (userAgent.match(/iPad/i)) {
            deviceInfo.brand = "iPad";
            deviceInfo.os = "iPadOS";
            const match = userAgent.match(/OS (\d+[._]\d+[._]?\d*)/);
            if (match) deviceInfo.osVersion = match[1].replace(/_/g, '.');
        } else if (userAgent.match(/Samsung/i)) {
            deviceInfo.brand = "Samsung";
            deviceInfo.os = "Android";
            const match = userAgent.match(/Android (\d+[._]\d+)/);
            if (match) deviceInfo.osVersion = match[1];
        } else if (userAgent.match(/Huawei/i)) {
            deviceInfo.brand = "Huawei";
            deviceInfo.os = "Android";
            const match = userAgent.match(/Android (\d+[._]\d+)/);
            if (match) deviceInfo.osVersion = match[1];
        } else if (userAgent.match(/Xiaomi|Redmi/i)) {
            deviceInfo.brand = "Xiaomi";
            deviceInfo.os = "Android";
            const match = userAgent.match(/Android (\d+[._]\d+)/);
            if (match) deviceInfo.osVersion = match[1];
        } else if (userAgent.match(/OPPO/i)) {
            deviceInfo.brand = "OPPO";
            deviceInfo.os = "Android";
            const match = userAgent.match(/Android (\d+[._]\d+)/);
            if (match) deviceInfo.osVersion = match[1];
        } else if (userAgent.match(/vivo/i)) {
            deviceInfo.brand = "Vivo";
            deviceInfo.os = "Android";
            const match = userAgent.match(/Android (\d+[._]\d+)/);
            if (match) deviceInfo.osVersion = match[1];
        } else if (userAgent.match(/Android/i)) {
            deviceInfo.brand = "Android Device";
            deviceInfo.os = "Android";
            const match = userAgent.match(/Android (\d+[._]\d+)/);
            if (match) deviceInfo.osVersion = match[1];
        }
    } 
    // Desktop Detection
    else {
        deviceInfo.type = "Desktop";
        
        // OS Detection for Desktop
        if (userAgent.includes("Win")) {
            deviceInfo.os = "Windows";
            if (userAgent.includes("Windows NT 10")) deviceInfo.osVersion = "10";
            else if (userAgent.includes("Windows NT 11")) deviceInfo.osVersion = "11";
            else if (userAgent.includes("Windows NT 6.3")) deviceInfo.osVersion = "8.1";
            else if (userAgent.includes("Windows NT 6.2")) deviceInfo.osVersion = "8";
            else if (userAgent.includes("Windows NT 6.1")) deviceInfo.osVersion = "7";
            else if (userAgent.includes("Windows NT 6.0")) deviceInfo.osVersion = "Vista";
            else if (userAgent.includes("Windows NT 5.1")) deviceInfo.osVersion = "XP";
        } else if (userAgent.includes("Mac")) {
            deviceInfo.os = "macOS";
            const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
            if (match) deviceInfo.osVersion = match[1].replace(/_/g, '.');
        } else if (userAgent.includes("Ubuntu")) {
            deviceInfo.os = "Ubuntu Linux";
            const match = userAgent.match(/Ubuntu[/\s](\d+[._]\d+)/);
            if (match) deviceInfo.osVersion = match[1];
        } else if (userAgent.includes("Fedora")) {
            deviceInfo.os = "Fedora Linux";
            const match = userAgent.match(/Fedora[/\s](\d+)/);
            if (match) deviceInfo.osVersion = match[1];
        } else if (userAgent.includes("Linux")) {
            deviceInfo.os = "Linux";
        } else if (userAgent.includes("CrOS")) {
            deviceInfo.os = "Chrome OS";
            const match = userAgent.match(/CrOS.+?(\d+[._]\d+)/);
            if (match) deviceInfo.osVersion = match[1].replace(/_/g, '.');
        }
    }

    return deviceInfo;
}

function collectBrowserInfo() {
    // Screen information
    const screenInfo = `${window.screen.width}x${window.screen.height}`;
    document.cookie = `screen_info=${screenInfo}; path=/`;
    
    // Timezone information
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    document.cookie = `timezone=${timezone}; path=/`;

    const userAgent = navigator.userAgent;
    let deviceInfo = {
        type: "Desktop",
        brand: "Unknown",
        os: "Unknown",
        osVersion: "Unknown",
        browser: "Unknown",
        browserVersion: "Unknown"
    };

    // More accurate mobile detection
    if (/Mobile|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(userAgent)) {
        deviceInfo.type = "Mobile";
        
        // Detailed mobile brand detection
        if (userAgent.includes("iPhone")) {
            deviceInfo.brand = "iPhone";
            deviceInfo.os = "iOS";
            const match = userAgent.match(/iPhone OS (\d+_\d+)/);
            if (match) {
                deviceInfo.osVersion = match[1].replace(/_/g, '.');
            }
        } else if (userAgent.includes("iPad")) {
            deviceInfo.brand = "iPad";
            deviceInfo.os = "iPadOS";
            const match = userAgent.match(/CPU OS (\d+_\d+)/);
            if (match) {
                deviceInfo.osVersion = match[1].replace(/_/g, '.');
            }
        } else if (userAgent.match(/Samsung|SM-[A-Z][0-9]/i)) {
            deviceInfo.brand = "Samsung";
            deviceInfo.os = "Android";
            // Get specific Samsung model
            const modelMatch = userAgent.match(/SM-[A-Z][0-9]\w+/i);
            if (modelMatch) {
                deviceInfo.brand = `Samsung ${modelMatch[0]}`;
            }
        } else if (userAgent.match(/Huawei|HW-|HONOR/i)) {
            deviceInfo.brand = "Huawei";
            deviceInfo.os = "Android";
            // Get specific Huawei model
            const modelMatch = userAgent.match(/(HUAWEI|HONOR)\s+([^;)]+)/i);
            if (modelMatch) {
                deviceInfo.brand = modelMatch[0];
            }
        } else if (userAgent.match(/Xiaomi|Redmi|POCO/i)) {
            deviceInfo.brand = "Xiaomi";
            deviceInfo.os = "Android";
            // Get specific Xiaomi model
            const modelMatch = userAgent.match(/(Redmi|POCO|Mi)\s+([^;)]+)/i);
            if (modelMatch) {
                deviceInfo.brand = `Xiaomi ${modelMatch[0]}`;
            }
        } else if (userAgent.match(/OPPO|CPH[0-9]/i)) {
            deviceInfo.brand = "OPPO";
            deviceInfo.os = "Android";
            // Get specific OPPO model
            const modelMatch = userAgent.match(/OPPO\s+([^;)]+)/i);
            if (modelMatch) {
                deviceInfo.brand = modelMatch[0];
            }
        } else if (userAgent.match(/vivo/i)) {
            deviceInfo.brand = "Vivo";
            deviceInfo.os = "Android";
            // Get specific Vivo model
            const modelMatch = userAgent.match(/vivo\s+([^;)]+)/i);
            if (modelMatch) {
                deviceInfo.brand = modelMatch[0];
            }
        } else if (userAgent.match(/realme/i)) {
            deviceInfo.brand = "Realme";
            deviceInfo.os = "Android";
            // Get specific Realme model
            const modelMatch = userAgent.match(/realme\s+([^;)]+)/i);
            if (modelMatch) {
                deviceInfo.brand = modelMatch[0];
            }
        } else if (userAgent.includes("Android")) {
            deviceInfo.brand = "Android Device";
            deviceInfo.os = "Android";
        }

        // Get precise Android version
        if (deviceInfo.os === "Android") {
            const match = userAgent.match(/Android\s+(\d+(\.\d+)*)/);
            if (match) {
                deviceInfo.osVersion = match[1];
            }
        }
    } else {
        // More accurate desktop OS detection
        if (userAgent.includes("Windows")) {
            deviceInfo.os = "Windows";
            if (userAgent.includes("Windows NT 10.0")) {
                deviceInfo.osVersion = "10";
                if (userAgent.includes("Windows NT 10.0; Win64")) {
                    deviceInfo.osVersion = "10 (64-bit)";
                }
            } else if (userAgent.includes("Windows NT 6.3")) {
                deviceInfo.osVersion = "8.1";
            } else if (userAgent.includes("Windows NT 6.2")) {
                deviceInfo.osVersion = "8";
            } else if (userAgent.includes("Windows NT 6.1")) {
                deviceInfo.osVersion = "7";
            }
        } else if (userAgent.includes("Macintosh")) {
            deviceInfo.os = "macOS";
            const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
            if (match) {
                deviceInfo.osVersion = match[1].replace(/_/g, '.');
            }
        } else if (userAgent.includes("Linux")) {
            if (userAgent.includes("Ubuntu")) {
                deviceInfo.os = "Ubuntu";
                const match = userAgent.match(/Ubuntu[/\s](\d+\.\d+)/);
                if (match) {
                    deviceInfo.osVersion = match[1];
                }
            } else if (userAgent.includes("Fedora")) {
                deviceInfo.os = "Fedora";
                const match = userAgent.match(/Fedora[/\s](\d+)/);
                if (match) {
                    deviceInfo.osVersion = match[1];
                }
            } else if (userAgent.includes("SUSE")) {
                deviceInfo.os = "SUSE Linux";
            } else if (userAgent.includes("Debian")) {
                deviceInfo.os = "Debian";
            } else if (userAgent.includes("Mint")) {
                deviceInfo.os = "Linux Mint";
            } else {
                deviceInfo.os = "Linux";
            }
        }
    }

    // More accurate browser detection
    if (userAgent.includes("Firefox/")) {
        deviceInfo.browser = "Firefox";
        const match = userAgent.match(/Firefox\/([0-9.]+)/);
        if (match) deviceInfo.browserVersion = match[1];
    } else if (userAgent.includes("Edge/") || userAgent.includes("Edg/")) {
        deviceInfo.browser = "Microsoft Edge";
        const match = userAgent.match(/(?:Edge|Edg)\/([0-9.]+)/);
        if (match) deviceInfo.browserVersion = match[1];
    } else if (userAgent.includes("Chrome/") && !userAgent.includes("Chromium")) {
        deviceInfo.browser = "Google Chrome";
        const match = userAgent.match(/Chrome\/([0-9.]+)/);
        if (match) deviceInfo.browserVersion = match[1];
    } else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome")) {
        deviceInfo.browser = "Safari";
        const match = userAgent.match(/Version\/([0-9.]+)/);
        if (match) deviceInfo.browserVersion = match[1];
    } else if (userAgent.includes("OPR/") || userAgent.includes("Opera/")) {
        deviceInfo.browser = "Opera";
        const match = userAgent.match(/(?:OPR|Opera)\/([0-9.]+)/);
        if (match) deviceInfo.browserVersion = match[1];
    }

    // Store all the information
    const platformInfo = {
        deviceType: deviceInfo.type,
        deviceBrand: deviceInfo.brand,
        os_name: deviceInfo.os,
        os_version: deviceInfo.osVersion,
        browser_name: deviceInfo.browser,
        browser_version: deviceInfo.browserVersion,
        screen_resolution: screenInfo,
        timezone: timezone,
        full_user_agent: userAgent
    };

    // Store the information in a cookie
    document.cookie = `platform_info=${encodeURIComponent(JSON.stringify(platformInfo))}; path=/`;
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', collectBrowserInfo);

// Input Field Validation and Styling
function updateInputStyle(input, icon, errorElement, errorMessage) {
    if (!input || !errorElement) return false;
    
    const value = input.value.trim();
    
    if (value !== '') {
        input.classList.add('valid');
        input.classList.remove('invalid');
        if (icon) {
            icon.classList.add('valid');
            icon.classList.remove('invalid');
        }
        errorElement.textContent = '';
        return true;
    } else {
        input.classList.remove('valid');
        input.classList.add('invalid');
        if (icon) {
            icon.classList.remove('valid');
            icon.classList.add('invalid');
        }
        errorElement.textContent = errorMessage;
        return false;
    }
}

// Determine which page we're on
const isIdentityPage = window.location.pathname === '/' || window.location.pathname === '/identity';
const isLoginPage = window.location.pathname === '/login';

// First name / username validation based on current page
function validateUsername() {
    if (isIdentityPage) {
        return updateInputStyle(
            usernameInput, 
            usernameInput ? usernameInput.nextElementSibling : null, 
            usernameError,
            'Please enter First Name'
        );
    } else {
        return updateInputStyle(
            usernameInput, 
            usernameInput ? usernameInput.nextElementSibling : null, 
            usernameError,
            'Please enter Username'
        );
    }
}

// Last name / password validation based on current page
function validatePassword() {
    if (isIdentityPage) {
        return updateInputStyle(
            passwordInput, 
            passwordInput ? passwordInput.nextElementSibling : null, 
            passwordError,
            'Please enter Last Name'
        );
    } else {
        return updateInputStyle(
            passwordInput, 
            passwordInput ? passwordInput.nextElementSibling : null, 
            passwordError,
            'Please enter Password'
        );
    }
}

// Form validation before submission
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        const isUsernameValid = validateUsername();
        const isPasswordValid = validatePassword();
        
        if (!isUsernameValid || !isPasswordValid) {
            event.preventDefault();
        }
    });

    // Input validation events
    if (usernameInput) {
        usernameInput.addEventListener('input', validateUsername);
        usernameInput.addEventListener('blur', validateUsername);
    }

    // Password validation events
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePassword);
        passwordInput.addEventListener('blur', validatePassword);
    }
} 