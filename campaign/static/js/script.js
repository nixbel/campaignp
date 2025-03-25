const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');

// Clear initial error messages if elements exist
if (usernameError) usernameError.textContent = '';
if (passwordError) passwordError.textContent = '';

// Simple device detection function - only detects if mobile or desktop
function detectDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Basic mobile detection with comprehensive regex
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone/i;
    
    // Only detect if mobile or desktop
    return {
        type: mobileRegex.test(userAgent) ? "Mobile" : "Desktop",
        browser: detectBrowser(userAgent)
    };
}

// Separate browser detection function for better accuracy
function detectBrowser(userAgent) {
    let browser = "Unknown";
    let version = "";
    
    // Check Edge first because it also contains Chrome in user agent
    if (userAgent.match(/Edg\/|Edge\//i)) {
        browser = "Edge";
        const match = userAgent.match(/(?:Edge|Edg)\/(\d+(\.\d+)+)/i);
        if (match) version = match[1];
    } 
    // Firefox
    else if (userAgent.match(/Firefox\/(\d+(\.\d+)+)/i)) {
        browser = "Firefox";
        const match = userAgent.match(/Firefox\/(\d+(\.\d+)+)/i);
        if (match) version = match[1];
    } 
    // Opera
    else if (userAgent.match(/OPR\/|Opera\//i)) {
        browser = "Opera";
        const match = userAgent.match(/(?:OPR|Opera)\/(\d+(\.\d+)+)/i);
        if (match) version = match[1];
    } 
    // Chrome
    else if (userAgent.match(/Chrome\/(\d+(\.\d+)+)/i) && !userAgent.match(/Chromium/i)) {
        browser = "Chrome";
        const match = userAgent.match(/Chrome\/(\d+(\.\d+)+)/i);
        if (match) version = match[1];
    } 
    // Safari
    else if (userAgent.match(/Safari/i) && !userAgent.match(/Chrome|Chromium/i)) {
        browser = "Safari";
        const match = userAgent.match(/Version\/(\d+(\.\d+)+)/i);
        if (match) version = match[1];
    } 
    // Internet Explorer
    else if (userAgent.match(/MSIE|Trident/i)) {
        browser = "Internet Explorer";
        const match = userAgent.match(/(?:MSIE |rv:)(\d+(\.\d+)+)/i);
        if (match) version = match[1];
    }
    
    return version ? `${browser} ${version}` : browser;
}

// Simplified data collection - only collect device type (mobile/desktop) and browser
function collectBrowserInfo() {
    // Get only device type and browser
    const deviceInfo = detectDevice();
    
    // Prepare platform information with minimal details
    const platformInfo = {
        deviceType: deviceInfo.type,
        browser_name: deviceInfo.browser,
        language: navigator.language || "Unknown"
    };
    
    // Store minimum information in cookies
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