/**
 * Checks if the login inputs are empty.
 * @param {Object} email - The email input.
 * @param {Object} password - The password input.
 * @returns {boolean} True if the input is invalid.
 */
function hasInvalidLoginInput(email, password) {
    const invalid = !email.value.trim() || !password.value.trim();

    email.classList.toggle('error', invalid);
    password.classList.toggle('error', invalid);

    return invalid;
}


/**
 * Loads a user's profile data from the database.
 * @param {string} uid - The Firebase Auth user id.
 * @returns {Promise<Object>} The user entry with id and profile data.
 */
async function getUserProfile(uid) {
    const response = await fetch(getUserDatabaseUrl(uid));
    ensureSuccessfulResponse(response, "User profile could not be loaded.");
    const user = await response.json();

    return { id: uid, user };
}


/**
 * Checks the login data.
 */
async function checkLogin() {
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    if (hasInvalidLoginInput(email, password)) return showLoginError('Check your email and password. Please try again.');
    try {
        completeUserLogin(await authenticateUser(email.value.trim(), password.value.trim()));
    } catch (error) {
        showLoginError('Check your email and password. Please try again.');
    }
}


/**
 * Authenticates a user and loads their profile.
 * @param {string} email - The login email.
 * @param {string} password - The login password.
 * @returns {Promise<Object>} The authenticated user profile.
 */
async function authenticateUser(email, password) {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return getUserProfile(credential.user.uid);
}


/**
 * Finishes the user login.
 * @param {Object} userEntry - The user entry.
 */
function completeUserLogin(userEntry) {
    setActiveUser(userEntry.id, userEntry.user);
    startActiveSession(userEntry.id, "user");
    sessionStorage.setItem('joinShowMobileGreeting', 'true');
    window.location.href = './subpages/summary.html';
}


/**
 * Logs in as guest.
 */
async function loginAsGuest() {
    try {
        setGuestButtonDisabled(true);
        clearError();
        await completeGuestLogin();
    } catch (error) {
        showLoginError('Guest login is currently not available. Please try again.');
    } finally {
        setGuestButtonDisabled(false);
    }
}


/**
 * Disables or enables the guest button.
 * @param {boolean} isDisabled - True if the button is disabled.
 */
function setGuestButtonDisabled(isDisabled) {
    const guestButton = document.querySelector('.guest-btn');

    guestButton.disabled = isDisabled;
}


/**
 * Finishes the guest login.
 */
async function completeGuestLogin() {
    const guestUser = await resetGuestSandbox();

    setActiveUser(guestUserId, guestUser);
    startActiveSession(guestUserId, "guest");
    sessionStorage.setItem('joinShowMobileGreeting', 'true');
    window.location.href = './subpages/summary.html';
}


/**
 * Rebuilds the guest sandbox from the shared example data.
 * @returns {Object} The refreshed guest profile and sandbox data.
 */
async function resetGuestSandbox() {
    const guestUser = await getGuestUser();
    guestUser.contacts = await getGlobalData("contacts");
    guestUser.tasks = await getGlobalData("tasks");
    await saveGuestSandbox(guestUser);
    return guestUser;
}


/**
 * Gets the guest user.
 * @returns {Object} The guest user.
 */
async function getGuestUser() {
    const response = await fetch(getUserDatabaseUrl(guestUserId));
    ensureSuccessfulResponse(response, "Guest profile could not be loaded.");
    const guestUser = await response.json();

    return guestUser || getDefaultGuestUser();
}


/**
 * Gets default guest data.
 * @returns {Object} The default guest user.
 */
function getDefaultGuestUser() {
    return {
        email: 'guest@login.com',
        name: 'Guest',
        password: 'guest123!',
        userColor: 'var(--profile-blue)'
    };
}


/** Loads unmodified example data from a global database path. */
async function getGlobalData(path) {
    const response = await fetch(getDatabaseUrl(path));
    ensureSuccessfulResponse(response, "Example data could not be loaded.");
    const data = await response.json();

    return data || {};
}


/** Saves the refreshed profile and data in the guest sandbox. */
async function saveGuestSandbox(guestUser) {
    const response = await fetch(getUserDatabaseUrl(guestUserId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guestUser)
    });
    ensureSuccessfulResponse(response, "Guest sandbox could not be prepared.");
}


/**
 * Shows a login error.
 * @param {string} message - The error message.
 */
function showLoginError(message) {
    document.getElementById('email').classList.add('error');
    document.getElementById('password').classList.add('error');

    const errorMsg = document.getElementById('errorMessage');

    errorMsg.textContent = message;
    errorMsg.classList.add('show');
}


/**
 * Changes the password icon.
 */
function togglePasswordIcon() {
    const password = document.getElementById('password');
    const icon = document.getElementById('toggleIcon');
    const toggleButton = document.getElementById('togglePasswordButton');
    const visible = password.type === 'text';
    const hasPassword = password.value.length > 0;

    toggleButton.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    toggleButton.disabled = !hasPassword;
    if (!hasPassword) return icon.src = './assets/icons/lock.webp';
    icon.src = visible ? './assets/icons/visability.webp' : './assets/icons/visabilityOff.webp';
}


document.getElementById('password').addEventListener('input', togglePasswordIcon);
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    checkLogin();
});
document.getElementById('togglePasswordButton').addEventListener('click', () => {
    const password = document.getElementById('password');
    if (!password.value.length) return;
    password.type = password.type === 'password' ? 'text' : 'password';
    togglePasswordIcon();
});
document.getElementById('email').addEventListener('focus', clearError);
document.getElementById('password').addEventListener('focus', clearError);
document.querySelector('.guest-btn').addEventListener('click', loginAsGuest);


/**
 * Clears the login error.
 */
function clearError() {
    document.getElementById('email').classList.remove('error');
    document.getElementById('password').classList.remove('error');
    const errorMsg = document.getElementById('errorMessage');
    errorMsg.classList.remove('show');
    errorMsg.textContent = '';
}


const introLayer = document.querySelector('.intro-layer');


/**
 * Finishes the intro and reveals the complete login page.
 */
function finishLoginIntro() {
    document.body.classList.remove('intro-running');
    introLayer?.remove();
}


if (!introLayer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finishLoginIntro();
} else {
    introLayer.addEventListener('animationend', finishLoginIntro, { once: true });
}
