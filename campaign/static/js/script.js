const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');

// Clear initial error messages
usernameError.textContent = '';
passwordError.textContent = '';

// Input Field Validation and Styling
function updateInputStyle(input, icon, errorElement, errorMessage) {
    const value = input.value.trim();
    
    if (value !== '') {
        input.classList.add('valid');
        input.classList.remove('invalid');
        icon.classList.add('valid');
        icon.classList.remove('invalid');
        errorElement.textContent = '';
        return true;
    } else {
        input.classList.remove('valid');
        input.classList.add('invalid');
        icon.classList.remove('valid');
        icon.classList.add('invalid');
        errorElement.textContent = errorMessage;
        return false;
    }
}

// Username validation
function validateUsername() {
    return updateInputStyle(
        usernameInput, 
        usernameInput.nextElementSibling, 
        usernameError,
        'Please enter Username'
    );
}

// Password validation
function validatePassword() {
    return updateInputStyle(
        passwordInput, 
        passwordInput.nextElementSibling, 
        passwordError,
        'Please enter Password'
    );
}

// Form validation before submission
loginForm.addEventListener('submit', function(event) {
    const isUsernameValid = validateUsername();
    const isPasswordValid = validatePassword();
    
    if (!isUsernameValid || !isPasswordValid) {
        event.preventDefault();
    }
});

// Username validation events
usernameInput.addEventListener('input', validateUsername);
usernameInput.addEventListener('blur', validateUsername);

// Password validation events
passwordInput.addEventListener('input', validatePassword);
passwordInput.addEventListener('blur', validatePassword); 