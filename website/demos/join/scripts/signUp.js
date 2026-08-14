/**
 * Updates a password field icon based on its content and visibility state.
 * @param {string} inputId - The id of the password input.
 * @param {string} iconId - The id of the icon image.
 */
function togglePasswordIcon(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    const toggleButton = icon.closest('button');
    const visible = input.type === 'text';
    const hasPassword = input.value.length > 0;

    toggleButton.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    toggleButton.disabled = !hasPassword;
    if (!hasPassword) return icon.src = '../assets/icons/lock.webp';
    icon.src = visible ? '../assets/icons/visability.webp' : '../assets/icons/visabilityOff.webp';
}


/**
 * Switches a password field between hidden and clear text.
 * @param {string} inputId - The id of the password input.
 * @param {string} iconId - The id of the icon image.
 */
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);

    if (!input.value.length) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    togglePasswordIcon(inputId, iconId);
}


document.getElementById('password').addEventListener('input', () => togglePasswordIcon('password', 'passwordIcon'));
document.getElementById('passwordToggle').addEventListener('click', () => togglePasswordVisibility('password', 'passwordIcon'));

document.getElementById('confirmPassword').addEventListener('input', () => togglePasswordIcon('confirmPassword', 'confirmPasswordIcon'));
document.getElementById('confirmPasswordToggle').addEventListener('click', () => togglePasswordVisibility('confirmPassword', 'confirmPasswordIcon'));


/** Enables the signup button only when every required field is filled. */
function updateSignupButtonState() {
    const requiredFields = ['username', 'email', 'password', 'confirmPassword'];
    const termsCheckbox = document.getElementById('termsCheckbox');
    const signupBtn = document.getElementById('signupBtn');
    const allFieldsFilled = requiredFields.every((id) => {
        return document.getElementById(id).value.trim() !== '';
    });

    signupBtn.disabled = !allFieldsFilled || !termsCheckbox.checked;
}


['username', 'email', 'password', 'confirmPassword'].forEach((id) => {
    document.getElementById(id).addEventListener('input', updateSignupButtonState);
});
document.getElementById('termsCheckbox').addEventListener('change', updateSignupButtonState);
updateSignupButtonState();


/**
 * Shows a validation error on one signup field, in its own message element.
 * @param {HTMLInputElement} input - The invalid input.
 * @param {string} message - The user-facing error message.
 * @param {boolean} [focusInput=true] - Whether to move focus to the input.
 * @returns {boolean} Always false.
 */
function showValidationError(input, message, focusInput = true) {
    input.classList.add('error');
    const messageField = document.getElementById(`${input.id}Error`) || document.getElementById('errorMessage');
    messageField.textContent = message;
    if (focusInput) input.focus();
    return false;
}


/** Clears all signup validation errors. */
function clearSignupErrors() {
    document.querySelectorAll('.signup-input-field input').forEach((input) => {
        input.classList.remove('error');
    });
    document.getElementById('errorMessage').textContent = '';
}


/**
 * Clears the validation error of one signup field.
 * @param {HTMLInputElement} input - The field to clear.
 */
function clearFieldError(input) {
    input.classList.remove('error');
    const messageField = document.getElementById(`${input.id}Error`);
    if (messageField) messageField.textContent = '';
}


/**
 * Gets all fields used by the signup validation.
 * @returns {Object} The signup fields.
 */
function getSignupFields() {
    return {
        name: document.getElementById('username'),
        email: document.getElementById('email'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword'),
        terms: document.getElementById('termsCheckbox')
    };
}


/**
 * Validates all required signup data without browser validation.
 * @returns {boolean} True when the form data is valid.
 */
function validateSignupForm() {
    const fields = getSignupFields();
    clearSignupErrors();
    return validateRequiredSignupFields(fields)
        && validateSignupName(fields.name)
        && validateSignupEmail(fields.email)
        && validateSignupPasswordLength(fields.password)
        && validateSignupPasswordsMatch(fields)
        && validateSignupTerms(fields.terms);
}


/**
 * Validates that every signup field contains a value.
 * @param {Object} fields - The signup fields.
 * @returns {boolean} True when all fields contain a value.
 */
function validateRequiredSignupFields(fields) {
    if (!fields.name.value.trim()) return showValidationError(fields.name, 'Please enter your name.');
    if (!fields.email.value.trim()) return showValidationError(fields.email, 'Please enter your email address.');
    if (!fields.password.value.trim()) return showValidationError(fields.password, 'Please enter a password.');
    if (!fields.confirmPassword.value.trim()) return showValidationError(fields.confirmPassword, 'Please confirm your password.');
    return true;
}


/**
 * Validates the signup name length.
 * @param {HTMLInputElement} name - The name input.
 * @param {boolean} [focusInput=true] - Whether to move focus to the input on error.
 * @returns {boolean} True when the name has at least 3 characters.
 */
function validateSignupName(name, focusInput = true) {
    if (name.value.trim().length >= 3) return true;
    return showValidationError(name, 'Your name needs at least 3 characters.', focusInput);
}


/**
 * Validates the signup email address.
 * @param {HTMLInputElement} email - The email input.
 * @param {boolean} [focusInput=true] - Whether to move focus to the input on error.
 * @returns {boolean} True when the email format is valid.
 */
function validateSignupEmail(email, focusInput = true) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPattern.test(email.value.trim())) return true;
    return showValidationError(email, 'Please enter a valid email address.', focusInput);
}


/**
 * Validates the signup password length.
 * @param {HTMLInputElement} password - The password input.
 * @param {boolean} [focusInput=true] - Whether to move focus to the input on error.
 * @returns {boolean} True when the password has at least 6 characters.
 */
function validateSignupPasswordLength(password, focusInput = true) {
    if (password.value.trim().length >= 6) return true;
    return showValidationError(password, 'Your password needs at least 6 characters.', focusInput);
}


/**
 * Validates that the password confirmation matches the password.
 * @param {Object} fields - The signup fields.
 * @param {boolean} [focusInput=true] - Whether to move focus to the input on error.
 * @returns {boolean} True when both passwords match.
 */
function validateSignupPasswordsMatch(fields, focusInput = true) {
    if (fields.password.value === fields.confirmPassword.value) return true;
    return showValidationError(fields.confirmPassword, 'Your passwords do not match.', focusInput);
}


/**
 * Validates the privacy policy checkbox.
 * @param {HTMLInputElement} terms - The privacy policy checkbox.
 * @returns {boolean} True when the checkbox is selected.
 */
function validateSignupTerms(terms) {
    if (terms.checked) return true;
    return showValidationError(terms, 'Please accept the privacy policy.');
}


/**
 * Validates one signup field on blur, without stealing focus.
 * @param {string} fieldId - The id of the field to validate.
 * @param {(input: HTMLInputElement) => boolean} validateFn - The validation function for the field.
 */
function validateFieldOnBlur(fieldId, validateFn) {
    const input = document.getElementById(fieldId);
    if (!input.value.trim()) return;
    validateFn(input);
}


document.getElementById('username').addEventListener('blur', () => {
    validateFieldOnBlur('username', (input) => validateSignupName(input, false));
});

document.getElementById('email').addEventListener('blur', () => {
    validateFieldOnBlur('email', (input) => validateSignupEmail(input, false));
});

document.getElementById('password').addEventListener('blur', () => {
    validateFieldOnBlur('password', (input) => validateSignupPasswordLength(input, false));
});

document.getElementById('confirmPassword').addEventListener('blur', () => {
    validateFieldOnBlur('confirmPassword', () => validateSignupPasswordsMatch(getSignupFields(), false));
});


document.getElementById('signupForm').addEventListener('submit', (event) => {
    event.preventDefault();
    handleSignup();
});


document.querySelectorAll('.signup-input-field input').forEach((input) => {
    input.addEventListener('input', () => clearFieldError(input));
});


/**
 * Handles the signup form submission.
 * Creates a new user in Firebase Auth and the database.
 */
async function handleSignup() {
    if (!validateSignupForm()) return;
    const signupBtn = document.getElementById('signupBtn');
    signupBtn.disabled = true;
    await createSignupAccount(signupBtn);
}


/**
 * Creates the Firebase account and handles its UI state.
 * @param {HTMLButtonElement} signupBtn - The signup button.
 */
async function createSignupAccount(signupBtn) {
    try {
        const userCredential = await registerFirebaseUser();
        await saveSignupData(userCredential.user.uid);
        showSignupToast();
    } catch (error) {
        showSignupError(getSignupErrorMessage(error));
    } finally {
        updateSignupButtonState();
    }
}


/**
 * Creates the Firebase authentication user.
 * @returns {Promise<Object>} The Firebase user credential.
 */
function registerFirebaseUser() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    return createUserWithEmailAndPassword(firebaseAuth, email, password);
}


/**
 * Saves the new user and matching contact.
 * @param {string} uid - The Firebase user id.
 * @returns {Promise<Array>} The save requests.
 */
function saveSignupData(uid) {
    const newUser = createNewUser(uid, getSignupFormData());
    const newContact = createNewContact(getNewContact());
    return Promise.all([newUser, newContact]);
}


/**
 * Reads the signup form fields into a new user object.
 * @returns {Object} The new user data.
 */
function getSignupFormData() {
    return {
        name: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        userColor: getRandomProfileColor()
    };
}


/**
 * Generates a new contact object from the signup form fields.
 * @returns {Object} The new contact data.
 */
function getNewContact() {
    return {
        name: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        color: getRandomProfileColor(),
        phone: ""
    }
}


/**
 * Translates a Firebase Auth error into a user-facing message.
 * @param {Object} error - The Firebase Auth error.
 * @returns {string} The message to display.
 */
function getSignupErrorMessage(error) {
    if (error.code === 'auth/email-already-in-use') {
        return 'An account with this email already exists.';
    }

    return 'Signup is currently not available. Please try again.';
}


/**
 * Creates a new user in the database.
 * @param {string} uid - The Firebase Auth user id.
 * @param {Object} user - The new user data.
 * @returns {Promise} The fetch promise.
 */
async function createNewUser(uid, user) {
    const response = await fetch(getUserDatabaseUrl(uid), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    });
    return ensureSuccessfulResponse(response, 'User profile could not be created.');
}


/**
 * Creates a new contact in the database.
 * @param {Object} contact - The new contact data.
 * @returns {Promise} The fetch promise.
 */
async function createNewContact(contact) {
    const response = await fetch(getDatabaseUrl('contacts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
    });
    return ensureSuccessfulResponse(response, 'Contact could not be created.');
}


/**
 * Shows a signup error message.
 * @param {string} message - The error message.
 */
function showSignupError(message) {
    document.getElementById('errorMessage').textContent = message;
}


/**
 * Shows the signup success toast and redirects to the login page.
 */
function showSignupToast() {
    const toast = document.querySelector('.signup-toast');

    if (!toast) return;
    toast.textContent = 'You signed up successfully';
    toast.classList.add('show');

    setTimeout(() => {
        window.location.href = '../index.html';
    }, 2000);
}
