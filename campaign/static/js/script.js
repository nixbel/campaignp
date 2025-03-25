const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');

// Clear initial error messages if elements exist
if (usernameError) usernameError.textContent = '';
if (passwordError) passwordError.textContent = '';

// Device and browser detection function
function detectDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    let deviceInfo = {
        type: "Unknown",
        brand: "Unknown",
        model: "Unknown",
        os: "Unknown",
        osVersion: "Unknown",
        browser: "Unknown",
        browserVersion: "Unknown"
    };

    // Mobile Detection (using regex patterns for higher accuracy)
    const mobileRegex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i;
    const mobileOrTabletRegex = /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i;

    if (mobileRegex.test(userAgent) || mobileOrTabletRegex.test(userAgent.substr(0,4))) {
        deviceInfo.type = "Mobile";
        
        // Detailed mobile brand detection
        if (userAgent.match(/iPhone/i)) {
            deviceInfo.brand = "Apple";
            deviceInfo.model = "iPhone";
            deviceInfo.os = "iOS";
            // Extract iOS version
            const match = userAgent.match(/OS (\d+[._]\d+[._]?\d*)/);
            if (match) {
                deviceInfo.osVersion = match[1].replace(/_/g, '.');
            }
        } else if (userAgent.match(/iPad/i)) {
            deviceInfo.brand = "Apple";
            deviceInfo.model = "iPad";
            deviceInfo.os = "iPadOS";
            const match = userAgent.match(/OS (\d+[._]\d+[._]?\d*)/);
            if (match) {
                deviceInfo.osVersion = match[1].replace(/_/g, '.');
            }
        } else if (userAgent.match(/Samsung|SM-[A-Z0-9]/i)) {
            deviceInfo.brand = "Samsung";
            deviceInfo.os = "Android";
            // Try to extract Samsung model
            const modelMatch = userAgent.match(/SM-[A-Z0-9]+/i);
            if (modelMatch) {
                deviceInfo.model = modelMatch[0];
            }
        } else if (userAgent.match(/Huawei|HW-|HONOR/i)) {
            deviceInfo.brand = "Huawei";
            deviceInfo.os = "Android";
            // Try to extract Huawei model
            const modelMatch = userAgent.match(/(HUAWEI|HONOR) ([A-Z0-9-]+)/i);
            if (modelMatch && modelMatch[2]) {
                deviceInfo.model = modelMatch[2];
            }
        } else if (userAgent.match(/Xiaomi|Redmi|POCO|Mi /i)) {
            deviceInfo.brand = "Xiaomi";
            deviceInfo.os = "Android";
            // Try to extract Xiaomi model
            const modelMatch = userAgent.match(/(Redmi|POCO|Mi) ([A-Z0-9]+)/i);
            if (modelMatch && modelMatch[2]) {
                deviceInfo.model = `${modelMatch[1]} ${modelMatch[2]}`;
            }
        } else if (userAgent.match(/OPPO|CPH[0-9]/i)) {
            deviceInfo.brand = "OPPO";
            deviceInfo.os = "Android";
            // Try to extract OPPO model
            const modelMatch = userAgent.match(/CPH[0-9]+/i);
            if (modelMatch) {
                deviceInfo.model = modelMatch[0];
            }
        } else if (userAgent.match(/vivo/i)) {
            deviceInfo.brand = "Vivo";
            deviceInfo.os = "Android";
            // Try to extract Vivo model
            const modelMatch = userAgent.match(/vivo ([A-Z0-9]+)/i);
            if (modelMatch && modelMatch[1]) {
                deviceInfo.model = modelMatch[1];
            }
        } else if (userAgent.match(/realme/i)) {
            deviceInfo.brand = "Realme";
            deviceInfo.os = "Android";
            // Try to extract Realme model
            const modelMatch = userAgent.match(/realme ([A-Z0-9]+)/i);
            if (modelMatch && modelMatch[1]) {
                deviceInfo.model = modelMatch[1];
            }
        } else if (userAgent.match(/OnePlus/i)) {
            deviceInfo.brand = "OnePlus";
            deviceInfo.os = "Android";
            // Try to extract OnePlus model
            const modelMatch = userAgent.match(/OnePlus([A-Z0-9]+)/i);
            if (modelMatch && modelMatch[1]) {
                deviceInfo.model = modelMatch[1];
            }
        } else if (userAgent.match(/Android/i)) {
            deviceInfo.brand = "Android";
            deviceInfo.os = "Android";
        }

        // Get Android version
        if (deviceInfo.os === "Android") {
            const match = userAgent.match(/Android (\d+(\.\d+)+)/);
            if (match) {
                deviceInfo.osVersion = match[1];
            }
        }
    } else {
        deviceInfo.type = "Desktop";
        
        // Desktop OS detection
        if (userAgent.match(/Windows/i)) {
            deviceInfo.os = "Windows";
            if (userAgent.match(/Windows NT 10\.0/i)) {
                deviceInfo.osVersion = "10";
                if (userAgent.match(/Win64|x64/i)) {
                    deviceInfo.osVersion += " (64-bit)";
                }
            } else if (userAgent.match(/Windows NT 6\.3/i)) {
                deviceInfo.osVersion = "8.1";
            } else if (userAgent.match(/Windows NT 6\.2/i)) {
                deviceInfo.osVersion = "8";
            } else if (userAgent.match(/Windows NT 6\.1/i)) {
                deviceInfo.osVersion = "7";
            } else if (userAgent.match(/Windows NT 6\.0/i)) {
                deviceInfo.osVersion = "Vista";
            } else if (userAgent.match(/Windows NT 5\.1/i)) {
                deviceInfo.osVersion = "XP";
            } else if (userAgent.match(/Windows NT 5\.0/i)) {
                deviceInfo.osVersion = "2000";
            }
        } else if (userAgent.match(/Macintosh|Mac OS X/i)) {
            deviceInfo.os = "macOS";
            const match = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/i);
            if (match) {
                deviceInfo.osVersion = match[1].replace(/_/g, '.');
            }
        } else if (userAgent.match(/Linux/i)) {
            if (userAgent.match(/Ubuntu/i)) {
                deviceInfo.os = "Ubuntu Linux";
                const match = userAgent.match(/Ubuntu[/\s](\d+\.\d+)/i);
                if (match) {
                    deviceInfo.osVersion = match[1];
                }
            } else if (userAgent.match(/Fedora/i)) {
                deviceInfo.os = "Fedora Linux";
                const match = userAgent.match(/Fedora[/\s](\d+)/i);
                if (match) {
                    deviceInfo.osVersion = match[1];
                }
            } else if (userAgent.match(/Debian/i)) {
                deviceInfo.os = "Debian Linux";
            } else if (userAgent.match(/CentOS/i)) {
                deviceInfo.os = "CentOS Linux";
            } else if (userAgent.match(/SUSE/i)) {
                deviceInfo.os = "SUSE Linux";
            } else {
                deviceInfo.os = "Linux";
            }
        } else if (userAgent.match(/CrOS/i)) {
            deviceInfo.os = "Chrome OS";
        }
    }

    // Browser detection
    if (userAgent.match(/Edge|Edg\//i)) {
        deviceInfo.browser = "Microsoft Edge";
        const match = userAgent.match(/Edge\/(\d+(\.\d+)+)|Edg\/(\d+(\.\d+)+)/i);
        if (match) {
            deviceInfo.browserVersion = match[1] || match[3];
        }
    } else if (userAgent.match(/Firefox\/(\d+(\.\d+)+)/i)) {
        deviceInfo.browser = "Firefox";
        const match = userAgent.match(/Firefox\/(\d+(\.\d+)+)/i);
        if (match) {
            deviceInfo.browserVersion = match[1];
        }
    } else if (userAgent.match(/OPR\/|Opera\//i)) {
        deviceInfo.browser = "Opera";
        const match = userAgent.match(/OPR\/(\d+(\.\d+)+)|Opera\/(\d+(\.\d+)+)/i);
        if (match) {
            deviceInfo.browserVersion = match[1] || match[3];
        }
    } else if (userAgent.match(/Chrome\/(\d+(\.\d+)+)/i) && !userAgent.match(/Chromium/i)) {
        deviceInfo.browser = "Chrome";
        const match = userAgent.match(/Chrome\/(\d+(\.\d+)+)/i);
        if (match) {
            deviceInfo.browserVersion = match[1];
        }
    } else if (userAgent.match(/Safari\/(\d+(\.\d+)+)/i) && !userAgent.match(/Chrome|Chromium/i)) {
        deviceInfo.browser = "Safari";
        const match = userAgent.match(/Version\/(\d+(\.\d+)+)/i);
        if (match) {
            deviceInfo.browserVersion = match[1];
        }
    } else if (userAgent.match(/MSIE|Trident/i)) {
        deviceInfo.browser = "Internet Explorer";
        const match = userAgent.match(/MSIE (\d+(\.\d+)+)/i) || userAgent.match(/rv:(\d+(\.\d+)+)/i);
        if (match) {
            deviceInfo.browserVersion = match[1];
        }
    }

    return deviceInfo;
}

// Collect complete device information
function collectBrowserInfo() {
    // Get device information
    const deviceInfo = detectDevice();
    
    // Screen information
    const screenInfo = `${window.screen.width}x${window.screen.height}`;
    
    // Timezone information
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneOffset = new Date().getTimezoneOffset();
    
    // Prepare platform information
    const platformInfo = {
        deviceType: deviceInfo.type,
        deviceBrand: deviceInfo.brand,
        deviceModel: deviceInfo.model,
        os_name: deviceInfo.os,
        os_version: deviceInfo.osVersion,
        browser_name: deviceInfo.browser,
        browser_version: deviceInfo.browserVersion,
        screen_resolution: screenInfo,
        timezone: timezone,
        timezone_offset: timezoneOffset,
        full_user_agent: navigator.userAgent
    };
    
    // Store in cookies
    document.cookie = `screen_info=${screenInfo}; path=/`;
    document.cookie = `timezone=${timezone}_${timezoneOffset}; path=/`;
    document.cookie = `platform_info=${encodeURIComponent(JSON.stringify(platformInfo))}; path=/`;
    
    return platformInfo;
}

// Call the collection function when the page loads
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

    // Username validation events
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