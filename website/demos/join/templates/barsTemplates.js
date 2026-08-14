/**
 * Gets the sidebar template.
 * @param {Object} activePage - The active page classes.
 * @returns {string} The sidebar html.
 */
function getSidebarTemplate(activePage) {
    return `
        <div class="logo">
            <img src="../assets/icons/joinLogoLight.webp" alt="Join Logo">
        </div>

        <nav class="menu">
            <a class="${activePage.summary}" href="./summary.html">
                <img class="icons-sidebar" src="../assets/icons/summary.webp" alt="Summary Icon">
                <span>Summary</span>
            </a>
            <a class="${activePage.addTask}" href="./addTask.html">
                <img class="icons-sidebar" src="../assets/icons/addTask.webp" alt="Add Task Icon">
                <span>Add Task</span>
            </a>
            <a class="${activePage.board}" href="./board.html">
                <img class="icons-sidebar" src="../assets/icons/board.webp" alt="Board Icon">
                <span>Board</span>
            </a>
            <a class="${activePage.contacts}" href="./contacts.html">
                <img class="icons-sidebar" src="../assets/icons/contacts.webp" alt="Contacts Icon">
                <span>Contacts</span>
            </a>
        </nav>

        <div class="legal-links">
            <a class="${activePage.privacyPolicy}" href="./privacyPolicy.html">Privacy Policy</a>
            <a class="${activePage.legalNotice}" href="./legalNotice.html">Legal Notice</a>
        </div>
    `;
}


/**
 * Gets the legal sidebar template.
 * @param {Object} activePage - The active page classes.
 * @returns {string} The sidebar html.
 */
function getNotLoggedInLegalSidebarTemplate(activePage) {
    return `
        <div class="logo">
            <img src="../assets/icons/joinLogoLight.webp" alt="Join Logo">
        </div>

        <nav class="menu not-logged-in-menu">
            <a class="login-link" href="../index.html">
                <img src="../assets/icons/login.webp" alt="Login Icon">
                <span>Log In</span>
            </a>
        </nav>

        <div class="legal-links">
            <a class="${activePage.privacyPolicy}" href="./privacyPolicy.html">Privacy Policy</a>
            <a class="${activePage.legalNotice}" href="./legalNotice.html">Legal Notice</a>
        </div>
    `;
}


/**
 * Gets the mobile nav template.
 * @param {Object} activePage - The active page classes.
 * @returns {string} The mobile nav html.
 */
function getMobileNavTemplate(activePage) {
    return `
        <a class="${activePage.summary}" href="./summary.html" aria-label="Summary">
            <img src="../assets/icons/summary.webp" alt="">
            <span>Summary</span>
        </a>
        <a class="${activePage.addTask}" href="./addTask.html" aria-label="Add Task">
            <img src="../assets/icons/addTask.webp" alt="">
            <span>Add Task</span>
        </a>
        <a class="${activePage.board}" href="./board.html" aria-label="Board">
            <img src="../assets/icons/board.webp" alt="">
            <span>Board</span>
        </a>
        <a class="${activePage.contacts}" href="./contacts.html" aria-label="Contacts">
            <img src="../assets/icons/contacts.webp" alt="">
            <span>Contacts</span>
        </a>
    `;
}


/**
 * Gets the logged out legal mobile nav template.
 * @param {Object} activePage - The active page classes.
 * @returns {string} The mobile nav html.
 */
function getNotLoggedInLegalMobileNavTemplate(activePage) {
    return `
        <a class="login-link" href="../index.html" aria-label="Log In">
            <img src="../assets/icons/login.webp" alt="">
            <span>Log In</span>
        </a>
        <a class="${activePage.privacyPolicy}" href="./privacyPolicy.html" aria-label="Privacy Policy">
            <span>Privacy Policy</span>
        </a>
        <a class="${activePage.legalNotice}" href="./legalNotice.html" aria-label="Legal Notice">
            <span>Legal Notice</span>
        </a>
    `;
}


/**
 * Gets the help link template.
 * @returns {string} The help link html.
 */
function getHelpLinkTemplate() {
    return `
        <a class="help-link mobile-hide" href="./help.html">
            <img src="../assets/icons/help.webp" alt="Help Icon">
        </a>
    `;
}


/**
 * Gets the topbar template.
 * @param {string} helpLink - The help link.
 * @param {Object} accountAvatar - The account avatar.
 * @returns {string} The topbar html.
 */
function getTopbarTemplate(helpLink, accountAvatar) {
    return `
        <div class="topbar-left">
            <p class="mobile-hide">Kanban Project Management Tool</p>
            <img class="topbar-logo desktop-hide" src="../assets/icons/joinLogoDark.webp" alt="Join Logo">
        </div>
        <div class="topbar-right">
            ${helpLink}
            <div class="account-menu-wrapper">
                <button class="account-avatar" type="button" aria-label="Open account menu" aria-expanded="false" aria-controls="accountMenu">
                    ${accountAvatar.initials}
                </button>
                <nav id="accountMenu" class="account-menu" aria-label="Account menu">
                    <a class="account-menu-help desktop-hide" href="./help.html">Help</a>
                    <a href="./legalNotice.html">Legal Notice</a>
                    <a href="./privacyPolicy.html">Privacy Policy</a>
                    <a id="logoutLink" href="../index.html">Log out</a>
                </nav>
            </div>
        </div>
    `;
}


/**
 * Gets the legal topbar template.
 * @returns {string} The topbar html.
 */
function getNotLoggedInLegalTopbarTemplate() {
    return `
        <div class="topbar-left">
            <p class="mobile-hide">Kanban Project Management Tool</p>
            <img class="topbar-logo desktop-hide" src="../assets/icons/joinLogoDark.webp" alt="Join Logo">
        </div>
    `;
}
