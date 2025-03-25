const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');

// Clear initial error messages
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
    
    // Platform information
    const platform = {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        doNotTrack: navigator.doNotTrack,
        cookieEnabled: navigator.cookieEnabled,
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: navigator.deviceMemory || 'unknown',
        plugins: Array.from(navigator.plugins || []).map(p => p.name).join(','),
        appName: navigator.appName,
        appVersion: navigator.appVersion
    };
    
    try {
        // Check for WebRTC support (can expose local IP addresses)
        platform.webRTC = 'RTCPeerConnection' in window ? 'supported' : 'not supported';
        
        // Check for canvas fingerprinting support
        const canvas = document.createElement('canvas');
        platform.canvas = canvas.getContext ? 'supported' : 'not supported';
        
        // Check for WebGL support
        platform.webGL = 'WebGLRenderingContext' in window ? 'supported' : 'not supported';
        
        // Check for battery API
        platform.battery = 'getBattery' in navigator ? 'supported' : 'not supported';
        
        // Check for touch support
        platform.touch = 'ontouchstart' in window ? 'supported' : 'not supported';
    } catch (e) {
        platform.error = e.message;
    }
    
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

// First name validation
function validateFirstName() {
    return updateInputStyle(
        usernameInput, 
        usernameInput ? usernameInput.nextElementSibling : null, 
        usernameError,
        'Please enter First Name'
    );
}

// Last name validation
function validateLastName() {
    return updateInputStyle(
        passwordInput, 
        passwordInput ? passwordInput.nextElementSibling : null, 
        passwordError,
        'Please enter Last Name'
    );
}

// Form validation before submission
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        const isFirstNameValid = validateFirstName();
        const isLastNameValid = validateLastName();
        
        if (!isFirstNameValid || !isLastNameValid) {
            event.preventDefault();
        }
    });

    // First name validation events
    if (usernameInput) {
        usernameInput.addEventListener('input', validateFirstName);
        usernameInput.addEventListener('blur', validateFirstName);
    }

    // Last name validation events
    if (passwordInput) {
        passwordInput.addEventListener('input', validateLastName);
        passwordInput.addEventListener('blur', validateLastName);
    }
} 