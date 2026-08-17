const BASE_URL = "https://join-94aa0-default-rtdb.europe-west1.firebasedatabase.app/";
const activeUserStorageKey = "joinActiveUser";
const activeSessionStorageKey = "joinActiveSession";
const guestUserId = "guest";
const profileColors = [
    "var(--profile-orange)",
    "var(--profile-pink)",
    "var(--profile-violet)",
    "var(--profile-purple)",
    "var(--profile-cyan)",
    "var(--profile-turquoise)",
    "var(--profile-salmon)",
    "var(--profile-peach)",
    "var(--profile-magenta)",
    "var(--profile-gold)",
    "var(--profile-blue)",
    "var(--profile-lime)",
    "var(--profile-yellow)",
    "var(--profile-red)",
    "var(--profile-amber)"
];
const brightProfileColors = [
    "var(--profile-yellow)",
    "var(--profile-lime)",
    "var(--profile-gold)",
    "var(--profile-cyan)",
    "var(--profile-turquoise)",
    "var(--profile-peach)",
    "var(--profile-amber)"
];


/**
 * Gets the database url.
 * @param {string} path - The path to the database.
 * @returns {string} The database url.
 */
function getDatabaseUrl(path) {
    let normalizedPath = path || "";

    if (normalizedPath.startsWith("/")) {
        normalizedPath = normalizedPath.slice(1);
    }

    if (normalizedPath.endsWith(".json")) {
        normalizedPath = normalizedPath.slice(0, -5);
    }

    return BASE_URL + normalizedPath + ".json";
}


/**
 * Gets the database url for one user.
 * @param {string} userId - The user id.
 * @param {string} path - The path for this user.
 * @returns {string} The user database url.
 */
function getUserDatabaseUrl(userId, path = "") {
    const cleanPath = path ? "/" + path.replace(/^\/+/, "") : "";

    return getDatabaseUrl("users/" + userId + cleanPath);
}


/**
 * Gets the current user id.
 * @returns {string} The current user id.
 */
function getCurrentUserId() {
    return getActiveUserId();
}


/**
 * Gets a shared data URL or the isolated guest sandbox URL.
 * @param {string} path - The tasks or contacts path.
 * @returns {string} The scoped database URL.
 */
function getScopedDatabaseUrl(path) {
    const currentUserId = getCurrentUserId();

    if (!currentUserId) {
        throw new Error("Authentication is required.");
    }

    if (currentUserId === guestUserId) {
        return getUserDatabaseUrl(guestUserId, path);
    }

    return getDatabaseUrl(path);
}


/**
 * Saves the active user in local storage.
 * @param {string} userId - The user id.
 * @param {Object} user - The user data.
 */
function setActiveUser(userId, user) {
    const activeUser = {
        id: userId,
        name: user.name || userId,
        email: user.email || "",
        userColor: user.userColor || "blue"
    };

    localStorage.setItem(activeUserStorageKey, JSON.stringify(activeUser));
}


/**
 * Starts the browser session after a successful login.
 * @param {string} userId - The authenticated user id.
 * @param {string} loginType - The regular or guest login type.
 */
function startActiveSession(userId, loginType) {
    const activeSession = {
        userId,
        loginType
    };

    sessionStorage.setItem(activeSessionStorageKey, JSON.stringify(activeSession));
}


/**
 * Checks whether the stored user belongs to a login from this browser session.
 * @param {Object} activeUser - The stored active user.
 * @returns {boolean} True if the user has an active login session.
 */
function hasValidActiveSession(activeUser) {
    const storedSession = sessionStorage.getItem(activeSessionStorageKey);

    if (!activeUser || !storedSession) return false;

    try {
        const activeSession = JSON.parse(storedSession);
        const hasValidLoginType = activeSession.loginType === "user" || activeSession.loginType === "guest";
        const hasMatchingUser = activeSession.userId === activeUser.id;
        const hasMatchingGuestType = (activeUser.id === guestUserId) === (activeSession.loginType === "guest");

        return hasValidLoginType && hasMatchingUser && hasMatchingGuestType;
    } catch (error) {
        sessionStorage.removeItem(activeSessionStorageKey);
        return false;
    }
}


/**
 * Gets the active user from local storage.
 * @returns {Object} The active user.
 */
function getActiveUser() {
    const activeUser = localStorage.getItem(activeUserStorageKey);

    if (!activeUser) return null;

    try {
        const parsedUser = JSON.parse(activeUser);

        return hasValidActiveSession(parsedUser) ? parsedUser : null;
    } catch (error) {
        clearActiveUser();
        return null;
    }
}


/**
 * Removes the active user from local storage.
 */
function clearActiveUser() {
    localStorage.removeItem(activeUserStorageKey);
    sessionStorage.removeItem(activeSessionStorageKey);
}


/**
 * Gets the active user id.
 * @returns {string} The active user id.
 */
function getActiveUserId() {
    const activeUser = getActiveUser();

    return activeUser ? activeUser.id : null;
}


/**
 * Normalizes a value for safe text comparisons.
 *
 * @param {string} value - The value to normalize.
 * @returns {string} The normalized value.
 */
function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}


/**
 * Escapes a value before inserting it into an HTML template.
 * @param {*} value - The value to escape.
 * @returns {string} The escaped HTML text.
 */
function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/**
 * Throws a readable error when a network response was unsuccessful.
 * @param {Response} response - The response to validate.
 * @param {string} message - The error message to use.
 * @returns {Response} The successful response.
 */
function ensureSuccessfulResponse(response, message) {
    if (!response.ok) throw new Error(message);

    return response;
}


/**
 * Checks if a contact belongs to the currently logged in user.
 *
 * @param {Object} contact - The contact to check.
 * @returns {boolean} True if the contact is the current user.
 */
function isCurrentUserContact(contact) {
    const activeUser = getActiveUser();

    if (!activeUser || !contact) return false;
    if (!activeUser.email || !contact.email) return false;

    return normalizeText(contact.email) === normalizeText(activeUser.email);
}


/**
 * Gets the contact name and adds "(You)" for the current user.
 *
 * @param {Object} contact - The contact data.
 * @returns {string} The contact display name.
 */
function getContactDisplayName(contact) {
    if (!contact) return "";

    if (isCurrentUserContact(contact)) {
        return `${contact.name} (You)`;
    }

    return contact.name;
}


/**
 * Updates the active user if their own contact was edited.
 *
 * @param {Object} oldContact - The contact before editing.
 * @param {Object} updatedContact - The edited contact.
 * @returns {Promise<void>}
 */
async function updateActiveUserAfterContactEdit(oldContact, updatedContact) {
    const activeUser = getActiveUser();

    if (!activeUser || !isCurrentUserContact(oldContact)) return;

    const updatedUser = { ...activeUser, name: updatedContact.name || activeUser.name, email: updatedContact.email || activeUser.email, userColor: updatedContact.color || activeUser.userColor };
    const userData = { name: updatedUser.name, email: updatedUser.email, userColor: updatedUser.userColor };

    const response = await fetch(getUserDatabaseUrl(activeUser.id), { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(userData) });
    ensureSuccessfulResponse(response, "User profile could not be updated.");
    setActiveUser(activeUser.id, updatedUser);
}


/**
 * Gets the initials from a user name.
 * @param {string} name - The user name.
 * @returns {string} The initials.
 */
function getUserInitials(name) {
    return (name || "Guest")
        .trim()
        .split(" ")
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}


/**
 * Gets the color for a user.
 * @param {string} userColor - The saved user color.
 * @returns {string} The css color.
 */
function getUserColor(userColor) {
    if (!userColor) return "var(--profile-blue)";
    if (userColor.startsWith("var(") || userColor.startsWith("#") || userColor.startsWith("rgb")) return userColor;

    return `var(--profile-${userColor})`;
}


/**
 * Gets a random profile color.
 * @returns {string} A random profile color.
 */
function getRandomProfileColor() {
    const randomIndex = Math.floor(Math.random() * profileColors.length);

    return profileColors[randomIndex];
}


/**
 * Gets the text color for a profile color.
 * @param {string} userColor - The profile color.
 * @returns {string} The text color.
 */
function getUserTextColor(userColor) {
    const avatarColor = getUserColor(userColor);

    return brightProfileColors.includes(avatarColor) ? "var(--text-primary)" : "var(--text-white)";
}
