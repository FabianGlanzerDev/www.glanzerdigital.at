const pagesWithHelpLink = ["summary", "add-task", "board", "contacts"];
const legalPages = ["privacy-policy", "legal-notice"];

/**
 * Gets the current page.
 * @returns {string} The current page.
 */
function getCurrentPage() {
    return document.body.dataset.page;
}

/**
 * Checks if the legal layout should be shown.
 * @param {string} currentPage - The current page.
 * @returns {boolean} True if it is a legal page and no user is logged in.
 */
function shouldShowNotLoggedInLegalLayout(currentPage) {
    return legalPages.includes(currentPage) && !getActiveUser();
}


/**
 * Checks if a page is protected.
 * @param {string} currentPage - The current page.
 * @returns {boolean} True if the page is protected.
 */
function isProtectedPage(currentPage) {
    return !legalPages.includes(currentPage);
}


/**
 * Redirects the user if he is not logged in.
 * @param {string} currentPage - The current page.
 * @returns {boolean} True if the user was redirected.
 */
function redirectLoggedOutUser(currentPage) {
    if (isProtectedPage(currentPage) && !getActiveUser()) {
        window.location.replace("../index.html");
        return true;
    }

    return false;
}


/**
 * Gets the active class for a page.
 * @param {string} currentPage - The current page.
 * @param {string} page - The page to check.
 * @returns {string} The active class.
 */
function getActiveClass(currentPage, page) {
    return currentPage === page ? "active" : "";
}


/**
 * Gets all active page classes.
 * @param {string} currentPage - The current page.
 * @returns {Object} The active page classes.
 */
function getActivePage(currentPage) {
    return {
        summary: getActiveClass(currentPage, "summary"),
        addTask: getActiveClass(currentPage, "add-task"),
        board: getActiveClass(currentPage, "board"),
        contacts: getActiveClass(currentPage, "contacts"),
        privacyPolicy: getActiveClass(currentPage, "privacy-policy"),
        legalNotice: getActiveClass(currentPage, "legal-notice"),
    };
}


/**
 * Gets the topbar template.
 * @param {string} currentPage - The current page.
 * @param {boolean} isNotLoggedInLegalLayout - True if legal layout is used.
 * @returns {string} The topbar html.
 */
function getRenderedTopbarTemplate(currentPage, isNotLoggedInLegalLayout) {
    if (isNotLoggedInLegalLayout) {
        return getNotLoggedInLegalTopbarTemplate();
    }

    const helpLink = pagesWithHelpLink.includes(currentPage) ? getHelpLinkTemplate() : "";
    const accountAvatar = getAccountAvatar();

    return getTopbarTemplate(helpLink, accountAvatar);
}


/**
 * Gets the account avatar data.
 * @returns {Object} The account avatar.
 */
function getAccountAvatar() {
    const activeUser = getActiveUser();

    return {
        initials: getUserInitials(activeUser?.name)
    };
}


/**
 * Renders the mobile nav.
 * @param {Object} activePage - The active page classes.
 * @param {boolean} isNotLoggedInLegalLayout - True if legal layout is used.
 */
function renderMobileNav(activePage, isNotLoggedInLegalLayout) {
    const existingMobileNav = document.getElementById("mobileNav");
    if (isNotLoggedInLegalLayout) {
        updateNotLoggedInLegalMobileNav(existingMobileNav, activePage);
        return;
    }
    updateMobileNav(existingMobileNav, activePage);
}


/**
 * Updates the mobile nav.
 * @param {Object} existingMobileNav - The mobile nav.
 * @param {Object} activePage - The active page classes.
 */
function updateMobileNav(existingMobileNav, activePage) {
    const mobileNav = existingMobileNav || document.createElement("nav");
    mobileNav.id = "mobileNav";
    mobileNav.className = "mobile-nav";
    mobileNav.setAttribute("aria-label", "Mobile navigation");
    mobileNav.innerHTML = getMobileNavTemplate(activePage);

    if (!existingMobileNav) {
        document.body.appendChild(mobileNav);
    }
}


/**
 * Updates the mobile legal nav for logged out users.
 * @param {Object} existingMobileNav - The mobile nav.
 * @param {Object} activePage - The active page classes.
 */
function updateNotLoggedInLegalMobileNav(existingMobileNav, activePage) {
    const mobileNav = existingMobileNav || document.createElement("nav");
    mobileNav.id = "mobileNav";
    mobileNav.className = "mobile-nav not-logged-in-mobile-nav";
    mobileNav.setAttribute("aria-label", "Mobile legal navigation");
    mobileNav.innerHTML = getNotLoggedInLegalMobileNavTemplate(activePage);

    if (!existingMobileNav) {
        document.body.appendChild(mobileNav);
    }
}


/**
 * Closes the account menu.
 */
function closeAccountMenu() {
    const accountMenuWrapper = document.querySelector(".account-menu-wrapper");
    const accountAvatar = document.querySelector(".account-avatar");

    accountMenuWrapper?.classList.remove("open");
    accountAvatar?.setAttribute("aria-expanded", "false");
}


/**
 * Opens or closes the account menu.
 */
function toggleAccountMenu() {
    const accountMenuWrapper = document.querySelector(".account-menu-wrapper");
    const accountAvatar = document.querySelector(".account-avatar");

    if (!accountMenuWrapper || !accountAvatar) {
        return;
    }

    const isOpen = accountMenuWrapper.classList.toggle("open");
    accountAvatar.setAttribute("aria-expanded", String(isOpen));
}


/**
 * Starts the account menu.
 */
function initAccountMenu() {
    const accountMenuWrapper = document.querySelector(".account-menu-wrapper");
    const accountAvatar = document.querySelector(".account-avatar");
    if (!accountMenuWrapper || !accountAvatar) {
        return;
    }
    addAccountMenuEvents(accountMenuWrapper, accountAvatar);
    addLogoutEvent();
}


/**
 * Adds the account menu events.
 * @param {Object} accountMenuWrapper - The account menu wrapper.
 * @param {Object} accountAvatar - The account avatar.
 */
function addAccountMenuEvents(accountMenuWrapper, accountAvatar) {
    accountAvatar.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleAccountMenu();
    });
    document.addEventListener("click", (event) => closeMenuOnOutsideClick(event, accountMenuWrapper));
    document.addEventListener("keydown", closeMenuOnEscape);
}


/**
 * Closes the menu after a click outside.
 * @param {Object} event - The click event.
 * @param {Object} accountMenuWrapper - The account menu wrapper.
 */
function closeMenuOnOutsideClick(event, accountMenuWrapper) {
    if (!accountMenuWrapper.contains(event.target)) {
        closeAccountMenu();
    }
}


/**
 * Closes the menu with escape.
 * @param {Object} event - The key event.
 */
function closeMenuOnEscape(event) {
    if (event.key === "Escape") {
        closeAccountMenu();
    }
}


/**
 * Adds the logout event.
 */
function addLogoutEvent() {
    const logoutLink = document.getElementById("logoutLink");
    if (!logoutLink) return;
    logoutLink.addEventListener("click", handleLogout);
}


/**
 * Signs the active user out and returns to the login page.
 * @param {Event} event - The logout click event.
 */
async function handleLogout(event) {
    event.preventDefault();
    try {
        await signOutFirebaseUser();
    } finally {
        clearActiveUser();
        window.location.replace("../index.html");
    }
}


/** Signs out the Firebase user if Firebase Auth is available. */
async function signOutFirebaseUser() {
    if (!window.firebaseAuth || !window.signOut) return;
    await window.signOut(window.firebaseAuth);
}


/**
 * Gets the sidebar template.
 * @param {Object} activePage - The active page classes.
 * @param {boolean} isNotLoggedInLegalLayout - True if legal layout is used.
 * @returns {string} The sidebar html.
 */
function getSidebarTemplateByLayout(activePage, isNotLoggedInLegalLayout) {
    return isNotLoggedInLegalLayout
        ? getNotLoggedInLegalSidebarTemplate(activePage)
        : getSidebarTemplate(activePage);
}


/**
 * Renders the sidebar and topbar.
 */
function renderBars() {
    const currentPage = getCurrentPage();
    if (redirectLoggedOutUser(currentPage)) return;
    const sidebar = document.getElementById("sidebar");
    const topbar = document.getElementById("topbar");
    const isNotLoggedInLegalLayout = shouldShowNotLoggedInLegalLayout(currentPage);
    const activePage = getActivePage(currentPage);

    document.body.classList.toggle("not-logged-in-legal-layout", isNotLoggedInLegalLayout);
    sidebar.innerHTML = getSidebarTemplateByLayout(activePage, isNotLoggedInLegalLayout);
    topbar.innerHTML = getRenderedTopbarTemplate(currentPage, isNotLoggedInLegalLayout);
    renderMobileNav(activePage, isNotLoggedInLegalLayout);
    initAccountMenu();
}


renderBars();

window.addEventListener("pageshow", function () {
    redirectLoggedOutUser(getCurrentPage());
});
