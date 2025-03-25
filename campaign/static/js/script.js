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

    // Better mobile detection with comprehensive regex
    const isMobile = {
        Android: function() { return /Android/i.test(userAgent); },
        BlackBerry: function() { return /BlackBerry|BB10/i.test(userAgent); },
        iOS: function() { return /iPhone|iPad|iPod/i.test(userAgent); },
        Opera: function() { return /Opera Mini|Opera Mobi/i.test(userAgent); },
        Windows: function() { return /IEMobile|Windows Phone/i.test(userAgent); },
        any: function() { 
            return (isMobile.Android() || isMobile.BlackBerry() || 
                    isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
        }
    };

    // Determine device type - mobile or desktop
    if (isMobile.any()) {
        deviceInfo.type = "Mobile";
        
        // Mobile OS and brand detection
        if (isMobile.iOS()) {
            deviceInfo.os = "iOS";
            if (userAgent.match(/iPhone/i)) {
                deviceInfo.brand = "Apple";
                deviceInfo.model = "iPhone";
                // Get iOS version
                const match = userAgent.match(/OS (\d+[._]\d+[._]?\d*)/i);
                if (match) {
                    deviceInfo.osVersion = match[1].replace(/_/g, '.');
                }
            } else if (userAgent.match(/iPad/i)) {
                deviceInfo.brand = "Apple";
                deviceInfo.model = "iPad";
                deviceInfo.os = "iPadOS";
                const match = userAgent.match(/OS (\d+[._]\d+[._]?\d*)/i);
                if (match) {
                    deviceInfo.osVersion = match[1].replace(/_/g, '.');
                }
            } else if (userAgent.match(/iPod/i)) {
                deviceInfo.brand = "Apple";
                deviceInfo.model = "iPod";
            }
        } else if (isMobile.Android()) {
            deviceInfo.os = "Android";
            
            // Android brand detection
            if (userAgent.match(/samsung|SM-[A-Z0-9]/i)) {
                deviceInfo.brand = "Samsung";
                // Try to extract Samsung model
                const modelMatch = userAgent.match(/SM-[A-Z0-9]+/i);
                if (modelMatch) {
                    deviceInfo.model = modelMatch[0];
                }
            } else if (userAgent.match(/huawei|honor|hwr/i)) {
                deviceInfo.brand = "Huawei";
                // Try to extract Huawei model
                const modelMatch = userAgent.match(/(HUAWEI|HONOR)\s+([A-Za-z0-9\-]+)/i);
                if (modelMatch && modelMatch[2]) {
                    deviceInfo.model = modelMatch[2];
                }
            } else if (userAgent.match(/xiaomi|redmi|poco|mi\s/i)) {
                deviceInfo.brand = "Xiaomi";
                // Try to extract Xiaomi model
                const modelMatch = userAgent.match(/(Redmi|POCO|Mi)\s+([A-Za-z0-9]+)/i);
                if (modelMatch && modelMatch[1] && modelMatch[2]) {
                    deviceInfo.model = `${modelMatch[1]} ${modelMatch[2]}`;
                }
            } else if (userAgent.match(/oppo|cph[0-9]|pch[0-9]/i)) {
                deviceInfo.brand = "OPPO";
                // Try to extract OPPO model
                const modelMatch = userAgent.match(/CPH[0-9]+|PCH[0-9]+/i);
                if (modelMatch) {
                    deviceInfo.model = modelMatch[0];
                }
            } else if (userAgent.match(/vivo/i)) {
                deviceInfo.brand = "Vivo";
                // Try to extract Vivo model
                const modelMatch = userAgent.match(/vivo\s+([A-Za-z0-9]+)/i);
                if (modelMatch && modelMatch[1]) {
                    deviceInfo.model = modelMatch[1];
                }
            } else if (userAgent.match(/realme/i)) {
                deviceInfo.brand = "Realme";
                // Try to extract Realme model
                const modelMatch = userAgent.match(/realme\s+([A-Za-z0-9]+)/i);
                if (modelMatch && modelMatch[1]) {
                    deviceInfo.model = modelMatch[1];
                }
            } else if (userAgent.match(/oneplus/i)) {
                deviceInfo.brand = "OnePlus";
                // Try to extract OnePlus model
                const modelMatch = userAgent.match(/oneplus\s*([A-Za-z0-9]+)/i);
                if (modelMatch && modelMatch[1]) {
                    deviceInfo.model = modelMatch[1];
                }
            } else if (userAgent.match(/nokia/i)) {
                deviceInfo.brand = "Nokia";
            } else if (userAgent.match(/motorola|moto/i)) {
                deviceInfo.brand = "Motorola";
                // Try to extract Motorola model
                const modelMatch = userAgent.match(/moto\s+([a-z0-9]+)/i);
                if (modelMatch && modelMatch[1]) {
                    deviceInfo.model = `Moto ${modelMatch[1]}`;
                }
            } else if (userAgent.match(/lg-|lge-|lge\/]/i)) {
                deviceInfo.brand = "LG";
            } else if (userAgent.match(/sony|xperia/i)) {
                deviceInfo.brand = "Sony";
            } else {
                deviceInfo.brand = "Android";
            }
            
            // Get Android version
            const androidVersionMatch = userAgent.match(/Android\s+(\d+(\.\d+)+)/i);
            if (androidVersionMatch) {
                deviceInfo.osVersion = androidVersionMatch[1];
            }
        } else if (isMobile.BlackBerry()) {
            deviceInfo.brand = "BlackBerry";
            deviceInfo.os = "BlackBerry OS";
        } else if (isMobile.Windows()) {
            deviceInfo.os = "Windows Phone";
            const match = userAgent.match(/Windows Phone (\d+\.\d+)/i);
            if (match) {
                deviceInfo.osVersion = match[1];
            }
        }
    } else {
        // Desktop detection
        deviceInfo.type = "Desktop";
        
        // Desktop OS detection
        if (userAgent.match(/Windows/i)) {
            deviceInfo.os = "Windows";
            if (userAgent.match(/Windows NT 10\.0/i)) {
                deviceInfo.osVersion = "10";
                if (userAgent.match(/Win64|x64|WOW64/i)) {
                    deviceInfo.osVersion += " (64-bit)";
                }
            } else if (userAgent.match(/Windows NT 11\.0/i)) {
                deviceInfo.osVersion = "11";
                if (userAgent.match(/Win64|x64|WOW64/i)) {
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
            } else if (userAgent.match(/Windows NT 5\.1/i) || userAgent.match(/Windows XP/i)) {
                deviceInfo.osVersion = "XP";
            }
        } else if (userAgent.match(/Macintosh|Mac OS X/i)) {
            deviceInfo.os = "macOS";
            // macOS version detection
            const macOSMatch = userAgent.match(/Mac OS X (\d+[._]\d+[._]?\d*)/i);
            if (macOSMatch) {
                deviceInfo.osVersion = macOSMatch[1].replace(/_/g, '.');
            } else {
                // Newer macOS versions
                const macVersionMatch = userAgent.match(/Version\/(\d+\.\d+)/i);
                if (macVersionMatch) {
                    deviceInfo.osVersion = macVersionMatch[1];
                }
            }
        } else if (userAgent.match(/Linux/i)) {
            // Linux distribution detection
            if (userAgent.match(/Ubuntu/i)) {
                deviceInfo.os = "Ubuntu";
                const match = userAgent.match(/Ubuntu[/\s](\d+\.\d+)/i);
                if (match) {
                    deviceInfo.osVersion = match[1];
                }
            } else if (userAgent.match(/Fedora/i)) {
                deviceInfo.os = "Fedora";
                const match = userAgent.match(/Fedora[/\s](\d+)/i);
                if (match) {
                    deviceInfo.osVersion = match[1];
                }
            } else if (userAgent.match(/Debian/i)) {
                deviceInfo.os = "Debian";
            } else if (userAgent.match(/CentOS/i)) {
                deviceInfo.os = "CentOS";
            } else if (userAgent.match(/SUSE/i)) {
                deviceInfo.os = "SUSE";
            } else if (userAgent.match(/Mint/i)) {
                deviceInfo.os = "Linux Mint";
            } else {
                deviceInfo.os = "Linux";
            }
        } else if (userAgent.match(/CrOS/i)) {
            deviceInfo.os = "Chrome OS";
            const match = userAgent.match(/CrOS\s+\w+\s+(\d+\.\d+\.\d+)/i);
            if (match) {
                deviceInfo.osVersion = match[1];
            }
        } else if (userAgent.match(/FreeBSD/i)) {
            deviceInfo.os = "FreeBSD";
        }
    }

    // Accurate browser detection
    // Check Edge first because it also contains Chrome in user agent
    if (userAgent.match(/Edg\/|Edge\//i)) {
        deviceInfo.browser = "Microsoft Edge";
        const edgeMatch = userAgent.match(/(?:Edge|Edg)\/(\d+(\.\d+)+)/i);
        if (edgeMatch) {
            deviceInfo.browserVersion = edgeMatch[1];
        }
    } else if (userAgent.match(/Firefox\/(\d+(\.\d+)+)/i)) {
        deviceInfo.browser = "Firefox";
        const firefoxMatch = userAgent.match(/Firefox\/(\d+(\.\d+)+)/i);
        if (firefoxMatch) {
            deviceInfo.browserVersion = firefoxMatch[1];
        }
    } else if (userAgent.match(/OPR\/|Opera\//i)) {
        deviceInfo.browser = "Opera";
        const operaMatch = userAgent.match(/(?:OPR|Opera)\/(\d+(\.\d+)+)/i);
        if (operaMatch) {
            deviceInfo.browserVersion = operaMatch[1];
        }
    } else if (userAgent.match(/Chrome\/(\d+(\.\d+)+)/i) && !userAgent.match(/Chromium/i)) {
        deviceInfo.browser = "Chrome";
        const chromeMatch = userAgent.match(/Chrome\/(\d+(\.\d+)+)/i);
        if (chromeMatch) {
            deviceInfo.browserVersion = chromeMatch[1];
        }
    } else if (userAgent.match(/Safari/i) && !userAgent.match(/Chrome|Chromium/i)) {
        deviceInfo.browser = "Safari";
        const safariMatch = userAgent.match(/Version\/(\d+(\.\d+)+)/i);
        if (safariMatch) {
            deviceInfo.browserVersion = safariMatch[1];
        }
    } else if (userAgent.match(/MSIE|Trident/i)) {
        deviceInfo.browser = "Internet Explorer";
        const ieMatch = userAgent.match(/(?:MSIE |rv:)(\d+(\.\d+)+)/i);
        if (ieMatch) {
            deviceInfo.browserVersion = ieMatch[1];
        }
    } else if (userAgent.match(/Chromium/i)) {
        deviceInfo.browser = "Chromium";
        const chromiumMatch = userAgent.match(/Chromium\/(\d+(\.\d+)+)/i);
        if (chromiumMatch) {
            deviceInfo.browserVersion = chromiumMatch[1];
        }
    }

    return deviceInfo;
}

// Collect complete device information
function collectBrowserInfo() {
    // Get device information
    const deviceInfo = detectDevice();
    
    // More accurate screen information including pixel depth
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    
    // Detailed timezone information
    let timezone = "Unknown";
    let timezoneOffset = 0;
    
    try {
        // Get timezone name using Intl API
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";
        
        // Get timezone offset in minutes and convert to hours format (+/-HH:MM)
        timezoneOffset = new Date().getTimezoneOffset();
        const offsetHours = Math.abs(Math.floor(timezoneOffset / 60));
        const offsetMinutes = Math.abs(timezoneOffset % 60);
        const offsetSign = timezoneOffset > 0 ? '-' : '+';
        const formattedOffset = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
        
        // Combine timezone name and offset
        timezone = `${timezone} (UTC${formattedOffset})`;
    } catch (e) {
        console.error("Error getting timezone information:", e);
    }
    
    // Prepare platform information with all collected details
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
        full_user_agent: navigator.userAgent,
        
        // Additional information that might be useful
        language: navigator.language || navigator.userLanguage || "Unknown",
        platform: navigator.platform || "Unknown",
        cookiesEnabled: navigator.cookieEnabled ? "Yes" : "No",
        doNotTrack: navigator.doNotTrack ? "Enabled" : "Disabled",
        connection: (navigator.connection && navigator.connection.effectiveType) ? 
                    navigator.connection.effectiveType : "Unknown"
    };
    
    // Store information in cookies
    document.cookie = `screen_info=${screenInfo}; path=/; SameSite=Lax`;
    document.cookie = `timezone=${encodeURIComponent(timezone)}; path=/; SameSite=Lax`;
    document.cookie = `platform_info=${encodeURIComponent(JSON.stringify(platformInfo))}; path=/; SameSite=Lax`;
    
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