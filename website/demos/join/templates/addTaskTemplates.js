/**
 * Returns the selectable contact content for the standalone Add Task page.
 * @param {Object} contact - Prepared and escaped contact view data.
 * @returns {string} The contact row HTML.
 */
function getAddTaskContactRowTemplate(contact) {
    return `
        <div class="contact-info-wrapper">
            <div class="contact-avatar" style="background:${contact.color}; color:${contact.textColor}">${contact.initials}</div>
            <span title="${contact.displayName}">${contact.displayName}</span>
        </div>
        <span class="custom-checkbox-wrapper">
            <input type="checkbox" class="contact-checkbox" data-id="${contact.key}" data-name="${contact.name}" data-initials="${contact.initials}" data-color="${contact.color}" data-text-color="${contact.textColor}">
            <span class="custom-checkbox" aria-hidden="true"></span>
        </span>`;
}
