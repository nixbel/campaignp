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
    
    // Get device information
    const deviceInfo = getDeviceInfo(navigator.userAgent);
    
    // Enhanced platform information
    const platform = {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        deviceType: deviceInfo.type,
        deviceBrand: deviceInfo.brand,
        detectedOS: {
            name: deviceInfo.os,
            version: deviceInfo.osVersion,
            fullName: deviceInfo.osVersion ? `${deviceInfo.os} ${deviceInfo.osVersion}` : deviceInfo.os
        }
    };

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