// Get form and input elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');

// Clear initial error messages if elements exist
if (usernameError) usernameError.textContent = '';
if (passwordError) passwordError.textContent = '';

// Collect device fingerprinting information
function collectBrowserInfo() {
    // Screen information
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    document.cookie = `screen_info=${screenInfo}; path=/`;
    
    // Timezone information
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneOffset = new Date().getTimezoneOffset();
    document.cookie = `timezone=${timezone}_${timezoneOffset}; path=/`;
    
    // Canvas fingerprinting
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200;
        
        // Draw background
        ctx.fillStyle = '#f60';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#069';
        ctx.fillText("PNP-PMS Fingerprint", 2, 15);
        
        // Draw shapes
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f0f";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#0ff";
        ctx.font = "15px Arial";
        ctx.fillText("Canvas FP", 2, 40);
        
        // More complex rendering
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, "red");
        gradient.addColorStop(0.5, "green");
        gradient.addColorStop(1.0, "blue");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 50, canvas.width, 50);
        
        // Add some Unicode characters
        ctx.fillStyle = "#000";
        ctx.font = "12px Verdana";
        ctx.fillText("👮‍♀️👮‍♂️🔑🔒", 10, 120);
        
        // WebGL context if available for more fingerprint data
        let webglFp = 'none';
        try {
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    webglFp = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) + 
                              gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                }
            }
        } catch (e) {
            webglFp = 'error';
        }
        
        // Get the canvas data URL and hash it
        const canvasDataUrl = canvas.toDataURL();
        let canvasHash = '';
        for (let i = 0; i < canvasDataUrl.length; i++) {
            canvasHash = ((canvasHash << 5) - canvasHash) + canvasDataUrl.charCodeAt(i);
            canvasHash = canvasHash & canvasHash; // Convert to 32bit integer
        }
        
        // Store canvas fingerprint
        document.cookie = `canvas_fp=${canvasHash}_${webglFp}; path=/`;
    } catch (e) {
        document.cookie = `canvas_fp=error; path=/`;
    }
    
    // Enhanced platform information
    const platform = {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
    };
    
    // Enhanced OS detection
    const userAgent = navigator.userAgent;
    let osName = "Unknown";
    let osVersion = "Unknown";
    let browserName = "Unknown";
    let browserVersion = "Unknown";

    // OS Detection - More universal approach
    if (navigator.platform.includes("Win")) {
        osName = "Windows";
        if (userAgent.includes("Windows NT 10")) osVersion = "10";
        else if (userAgent.includes("Windows NT 11")) osVersion = "11";
        else if (userAgent.includes("Windows NT 6.3")) osVersion = "8.1";
        else if (userAgent.includes("Windows NT 6.2")) osVersion = "8";
        else if (userAgent.includes("Windows NT 6.1")) osVersion = "7";
        else if (userAgent.includes("Windows NT 6.0")) osVersion = "Vista";
        else if (userAgent.includes("Windows NT 5.1")) osVersion = "XP";
        else osVersion = ""; // Just show "Windows" if version can't be determined
    } else if (userAgent.includes("Mac")) {
        osName = "macOS";
        const macOSMatch = userAgent.match(/Mac OS X (\d+[._]\d+[._]\d+)/);
        if (macOSMatch) {
            osVersion = macOSMatch[1].replace(/_/g, '.');
        }
    } else if (userAgent.includes("Ubuntu")) {
        osName = "Ubuntu";
        const ubuntuMatch = userAgent.match(/Ubuntu[/\s](\d+[._]\d+)/);
        if (ubuntuMatch) {
            osVersion = ubuntuMatch[1];
        }
    } else if (userAgent.includes("Fedora")) {
        osName = "Fedora";
        const fedoraMatch = userAgent.match(/Fedora[/\s](\d+)/);
        if (fedoraMatch) {
            osVersion = fedoraMatch[1];
        }
    } else if (userAgent.includes("Linux")) {
        osName = "Linux";
        // For generic Linux, we don't try to get the version
    } else if (userAgent.includes("Android")) {
        osName = "Android";
        const match = userAgent.match(/Android[\s/](\d+[._]\d+)/);
        if (match) {
            osVersion = match[1].replace(/_/g, '.');
        }
    } else if (userAgent.includes("iPhone") || userAgent.includes("iPad") || userAgent.includes("iPod")) {
        osName = "iOS";
        const match = userAgent.match(/OS (\d+[._]\d+[._]?\d*)/);
        if (match) {
            osVersion = match[1].replace(/_/g, '.');
        }
    } else if (userAgent.includes("CrOS")) {
        osName = "Chrome OS";
        const match = userAgent.match(/CrOS.+?(\d+[._]\d+)/);
        if (match) {
            osVersion = match[1].replace(/_/g, '.');
        }
    }

    // Browser Detection
    if (userAgent.indexOf("Chrome") !== -1 && userAgent.indexOf("Edg") === -1 && userAgent.indexOf("OPR") === -1) {
        browserName = "Chrome";
        const match = userAgent.match(/Chrome\/([0-9.]+)/);
        if (match) browserVersion = match[1];
    } else if (userAgent.indexOf("Firefox") !== -1) {
        browserName = "Firefox";
        const match = userAgent.match(/Firefox\/([0-9.]+)/);
        if (match) browserVersion = match[1];
    } else if (userAgent.indexOf("Edg") !== -1) {
        browserName = "Edge";
        const match = userAgent.match(/Edg\/([0-9.]+)/);
        if (match) browserVersion = match[1];
    } else if (userAgent.indexOf("Safari") !== -1 && userAgent.indexOf("Chrome") === -1) {
        browserName = "Safari";
        const match = userAgent.match(/Safari\/([0-9.]+)/);
        if (match) browserVersion = match[1];
    } else if (userAgent.indexOf("OPR") !== -1) {
        browserName = "Opera";
        const match = userAgent.match(/OPR\/([0-9.]+)/);
        if (match) browserVersion = match[1];
    }

    // If we have both name and version, combine them, otherwise just use the name
    platform.detectedOS = {
        name: osName,
        version: osVersion,
        // This will show just OS name if no version is detected
        fullName: osVersion ? `${osName} ${osVersion}` : osName
    };
    
    platform.detectedBrowser = {
        name: browserName,
        version: browserVersion
    };

    document.cookie = `platform_info=${encodeURIComponent(JSON.stringify(platform))}; path=/`;
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