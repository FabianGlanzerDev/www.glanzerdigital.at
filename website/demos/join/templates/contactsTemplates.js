/**
 * Returns the contacts header template.
 * @returns {string} The contacts header HTML.
 */
function getContactsHeaderTemplate() {
    return `
        <div class="contacts-header">
            <h1>Contacts</h1>
            <div class="header-divider"></div>
            <span>Better with a team</span>
        </div>
    `;
}


/**
 * Returns the contact detail template.
 * @param {Object} contact - Prepared and escaped contact view data.
 * @returns {string} The contact detail HTML.
 */
function getContactDetailTemplate(contact) {
    return `
        <div class="contact-detail-content">
            <div class="contact-detail-top">
                ${getContactDetailAvatarTemplate(contact)}
                ${getContactDetailNameTemplate(contact)}
            </div>
            ${getContactInformationTemplate(contact)}
        </div>
    `;
}


/**
 * Returns the avatar template for the contact detail view.
 * @param {Object} contact - Prepared and escaped contact view data.
 * @returns {string} The contact detail avatar HTML.
 */
function getContactDetailAvatarTemplate(contact) {
    return `
        <div class="contact-detail-avatar" style="background:${contact.color}; color:${contact.textColor}">
            ${contact.initials}
        </div>
    `;
}


/**
 * Returns the contact name section template.
 * @param {Object} contact - The selected contact.
 * @returns {string} The contact name HTML.
 */
function getContactDetailNameTemplate(contact) {
    return `
        <div class="contact-detail-name-box">
            <h2 tabindex="-1" title="${contact.name}">${contact.name}</h2>
            ${getContactActionsTemplate()}
        </div>
    `;
}


/**
 * Returns the edit and delete button template.
 * @returns {string} The contact actions HTML.
 */
function getContactActionsTemplate() {
    return `
        <div class="contact-actions">
            <button class="contact-action-btn edit-contact-btn" type="button" onclick="openEditContactOverlay()">
                <img src="../assets/icons/edit.webp" alt="Edit">
                <span>Edit</span>
            </button>

            <button class="contact-action-btn delete-contact-btn" type="button" onclick="deleteContact()">
                <img src="../assets/icons/delete.webp" alt="Delete">
                <span>Delete</span>
            </button>
        </div>
    `;
}


/**
 * Returns the contact information template.
 * @param {Object} contact - The selected contact.
 * @returns {string} The contact information HTML.
 */
function getContactInformationTemplate(contact) {
    return `
        <div class="contact-information">
            <h3>Contact Information</h3>
            <h4>Email</h4>
            <a href="mailto:${contact.email}" class="contact-email">${contact.email}</a>
            <h4>Phone</h4>
            <p>${contact.phone}</p>
        </div>
    `;
}


/**
 * Returns the contact group template.
 * @param {string} letter - The contact group letter.
 * @returns {string} The contact group HTML.
 */
function getContactGroupTemplate(letter) {
    return `
        <div class="contact-group">
            <h3>${letter}</h3>
        </div>
    `;
}


/**
 * Returns one contact card template.
 * @param {Object} contact - Prepared and escaped contact view data.
 * @param {number} index - The contact index.
 * @param {string} activeClass - The active contact class.
 * @returns {string} The contact card HTML.
 */
function getContactCardTemplate(contact, index, activeClass) {
    return `
        <button class="contact-card ${activeClass}" data-contact-index="${index}" onclick="showContact(${index})">
            ${getContactAvatarTemplate(contact)}
            ${getContactInfoTemplate(contact)}
        </button>
    `;
}


/**
 * Returns the contact avatar template.
 * @param {Object} contact - Prepared and escaped contact view data.
 * @returns {string} The contact avatar HTML.
 */
function getContactAvatarTemplate(contact) {
    return `
        <div class="contact-avatar" style="background:${contact.color}; color:${contact.textColor}">
            ${contact.initials}
        </div>
    `;
}


/**
 * Returns the contact info template.
 * @param {Object} contact - The contact data.
 * @returns {string} The contact info HTML.
 */
function getContactInfoTemplate(contact) {
    return `
        <div class="contact-info">
            <h4>${contact.displayName}</h4>
            <p class="contact-email-detail">${contact.email}</p>
        </div>
    `;
}


/**
 * Returns one color option template.
 * @param {string} color - The contact color.
 * @param {string} activeClass - The active color class.
 * @returns {string} The color option HTML.
 */
function getColorOptionTemplate(color, activeClass) {
    return `
        <button
            type="button"
            class="color-option ${activeClass}"
            style="background:${color}"
            onclick="selectContactColor('${color}')">
        </button>
    `;
}
