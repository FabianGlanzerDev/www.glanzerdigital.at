function getContactsHeaderTemplate() {return `
        <div class="contacts-header">
            <h1>Contacts</h1>
            <div class="header-divider"></div>
            <span>Better with a team</span>
        </div>
    `;}function getContactDetailTemplate(contact) {return `
        <div class="contact-detail-content">
            <div class="contact-detail-top">
                ${getContactDetailAvatarTemplate(contact)}
                ${getContactDetailNameTemplate(contact)}
            </div>
            ${getContactInformationTemplate(contact)}
        </div>
    `;}function getContactDetailAvatarTemplate(contact) {return `
        <div class="contact-detail-avatar" style="background:${contact.color}; color:${contact.textColor}">
            ${contact.initials}
        </div>
    `;}function getContactDetailNameTemplate(contact) {return `
        <div class="contact-detail-name-box">
            <h2 tabindex="-1" title="${contact.name}">${contact.name}</h2>
            ${getContactActionsTemplate()}
        </div>
    `;}function getContactActionsTemplate() {return `
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
    `;}function getContactInformationTemplate(contact) {return `
        <div class="contact-information">
            <h3>Contact Information</h3>
            <h4>Email</h4>
            <a href="mailto:${contact.email}" class="contact-email">${contact.email}</a>
            <h4>Phone</h4>
            <p>${contact.phone}</p>
        </div>
    `;}function getContactGroupTemplate(letter) {return `
        <div class="contact-group">
            <h3>${letter}</h3>
        </div>
    `;}function getContactCardTemplate(contact, index, activeClass) {return `
        <button class="contact-card ${activeClass}" data-contact-index="${index}" onclick="showContact(${index})">
            ${getContactAvatarTemplate(contact)}
            ${getContactInfoTemplate(contact)}
        </button>
    `;}function getContactAvatarTemplate(contact) {return `
        <div class="contact-avatar" style="background:${contact.color}; color:${contact.textColor}">
            ${contact.initials}
        </div>
    `;}function getContactInfoTemplate(contact) {return `
        <div class="contact-info">
            <h4>${contact.displayName}</h4>
            <p class="contact-email-detail">${contact.email}</p>
        </div>
    `;}function getColorOptionTemplate(color, activeClass) {return `
        <button
            type="button"
            class="color-option ${activeClass}"
            style="background:${color}"
            onclick="selectContactColor('${color}')">
        </button>
    `;}
