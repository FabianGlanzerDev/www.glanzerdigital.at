/**
 * Resets the modal text for adding a contact.
 */
function resetAddModalText() {
    modal.classList.remove("edit-mode");
    modalTitle.textContent = "Add contact";
    modalSubtitle.textContent = "Tasks are better with a team!";
    modalSubtitle.style.display = "block";
}


/**
 * Resets the avatar preview for adding a contact.
 */
function resetAddAvatar() {
    contactPlaceholder.classList.remove("edit-mode");
    contactPlaceholder.style.background = "var(--form-input-border)";
    contactAvatarInitials.style.color = "";
    contactAvatarInitials.textContent = "";
}


/**
 * Sets the buttons for the add contact modal.
 */
function setAddButtons() {
    secondaryBtnText.textContent = "Cancel";
    secondaryBtnIcon.style.display = "block";
    submitBtnText.textContent = "Create contact";
}


/**
 * Clears the color options container.
 */
function clearColorOptions() {
    if (colorOptions) {
        colorOptions.innerHTML = "";
    }
}


/**
 * Sets the modal to edit mode.
 * @param {Object} contact - The selected contact.
 */
function setEditMode(contact) {
    modal.classList.add("edit-mode");
    setEditModalText();
    fillContactForm(contact);
    setEditAvatar(contact);
    setEditButtons();
    renderColorOptions();
}


/**
 * Sets the title for the edit contact modal.
 */
function setEditModalText() {
    modalTitle.textContent = "Edit contact";
    modalSubtitle.style.display = "none";
}


/**
 * Fills the contact form with contact data.
 * @param {Object} contact - The selected contact.
 */
function fillContactForm(contact) {
    document.getElementById("contactName").value = contact.name;
    document.getElementById("contactEmail").value = contact.email;
    document.getElementById("contactPhone").value = contact.phone || "";
}


/**
 * Sets the avatar preview for editing a contact.
 * @param {Object} contact - The selected contact.
 */
function setEditAvatar(contact) {
    selectedContactColor = contact.color || contact.contactColor || "var(--profile-orange)";
    contactPlaceholder.classList.add("edit-mode");
    contactPlaceholder.style.background = selectedContactColor;
    contactAvatarInitials.style.color = getUserTextColor(selectedContactColor);
    contactAvatarInitials.textContent = getUserInitials(contact.name);
}


/**
 * Sets the buttons for the edit contact modal.
 */
function setEditButtons() {
    secondaryBtnText.textContent = "Delete";
    secondaryBtnIcon.style.display = "none";
    submitBtnText.textContent = "Save";
}


/**
 * Selects a contact color.
 * @param {string} color - The selected contact color.
 */
function selectContactColor(color) {
    selectedContactColor = color;

    contactPlaceholder.style.background = color;
    contactAvatarInitials.style.color = getUserTextColor(color);

    renderColorOptions();
    closeColorDropdown();
}


/**
 * Gets a random contact color.
 * @returns {string} The random contact color.
 */
function getRandomContactColor() {
    return getRandomProfileColor();
}


/**
 * Renders the contact detail view.
 * @param {Object} contact - The selected contact.
 */
function renderContactDetails(contact) {
    const contactDetails = document.getElementById("contactDetails");
    const contactColor = getContactAvatarColor(contact);
    const contactView = getContactTemplateView(contact, contactColor);

    contactDetails.innerHTML = getContactsHeaderTemplate() + getContactDetailTemplate(contactView);
}


/**
 * Prepares and escapes a contact for HTML templates.
 * @param {Object} contact - The contact data.
 * @param {string} contactColor - The contact avatar color.
 * @returns {Object} The safe contact view data.
 */
function getContactTemplateView(contact, contactColor) {
    return {
        name: escapeHtml(contact.name),
        displayName: escapeHtml(getContactDisplayName(contact)),
        email: escapeHtml(contact.email),
        phone: escapeHtml(contact.phone),
        initials: escapeHtml(getUserInitials(contact.name)),
        color: escapeHtml(contactColor),
        textColor: escapeHtml(getUserTextColor(contactColor))
    };
}


/**
 * Renders all contacts.
 */
function renderContacts() {
    const contactsList = document.getElementById("contactsList");
    contactsList.innerHTML = "";

    let currentLetter = "";

    contacts.forEach(function (contact, index) {
        currentLetter = renderContactEntry(contactsList, contact, index, currentLetter);
    });
}


/**
 * Renders one contact entry.
 * @param {Object} contactsList - The contacts list container.
 * @param {Object} contact - The contact data.
 * @param {number} index - The contact index.
 * @param {string} currentLetter - The current letter group.
 * @returns {string} The updated current letter.
 */
function renderContactEntry(contactsList, contact, index, currentLetter) {
    const firstLetter = contact.name.charAt(0).toUpperCase();

    if (firstLetter !== currentLetter) {
        contactsList.innerHTML += getContactGroupTemplate(escapeHtml(firstLetter));
        currentLetter = firstLetter;
    }

    contactsList.innerHTML += getRenderedContactCard(contact, index);
    return currentLetter;
}


/**
 * Gets the rendered contact card.
 * @param {Object} contact - The contact data.
 * @param {number} index - The contact index.
 * @returns {string} The contact card template.
 */
function getRenderedContactCard(contact, index) {
    const activeClass = index === currentContactIndex ? "active" : "";
    const contactColor = getContactAvatarColor(contact);
    const contactView = getContactTemplateView(contact, contactColor);

    return getContactCardTemplate(contactView, index, activeClass);
}


/**
 * Gets the avatar color of a contact.
 * @param {Object} contact - The contact data.
 * @returns {string} The contact avatar color.
 */
function getContactAvatarColor(contact) {
    return contact.color || contact.contactColor || "var(--profile-orange)";
}


/**
 * Renders the contact color options.
 */
function renderColorOptions() {
    if (!colorOptions) return;

    colorOptions.innerHTML = "";

    profileColors.forEach(function (color) {
        colorOptions.innerHTML += getRenderedColorOption(color);
    });
}


/**
 * Gets one rendered color option.
 * @param {string} color - The contact color.
 * @returns {string} The color option template.
 */
function getRenderedColorOption(color) {
    const activeClass = color === selectedContactColor ? "active" : "";

    return getColorOptionTemplate(color, activeClass);
}


/**
 * Renders the empty contact detail view.
 */
function renderEmptyContactDetails() {
    const contactDetails = document.getElementById("contactDetails");

    contactDetails.innerHTML = getContactsHeaderTemplate();
}


/**
 * Sets the modal to add mode.
 */
function setAddMode() {
    resetAddModalText();
    resetAddAvatar();
    setAddButtons();
    selectedContactColor = getRandomContactColor();
    clearColorOptions();
    closeColorDropdown();
}


/**
 * Shows the contact success toast.
 * @param {string} message - The toast message.
 */
function showContactToast(message) {
    if (!contactToast) return;

    contactToast.textContent = message;
    contactToast.classList.add("active");

    setTimeout(function () {
        contactToast.classList.remove("active");
    }, 2000);
}


/**
 * Toggles theüge genau denselben Block **ganz unten** in `contactsHelper.js` ein:

```js
/**
 * Toggles the contact color dropdown.
 * @param {Event} event - The click event.
 */
function toggleColorDropdown(event) {
    event.stopPropagation();

    if (!colorPicker) return;

    colorPicker.classList.toggle("open");
}


/**
 * Closes the color dropdown.
 */
function closeColorDropdown() {
    if (!colorPicker) return;

    colorPicker.classList.remove("open");
}


/**
 * Closes the color dropdown when clicking outside.
 * @param {Event} event - The click event.
 */
function closeColorDropdownOnOutsideClick(event) {
    if (!colorPicker || !contactPlaceholder) return;
    if (colorPicker.contains(event.target)) return;
    if (contactPlaceholder.contains(event.target)) return;

    closeColorDropdown();
}


/**
 * Toggles the mobile options menu.
 * @param {Event} event - The click event.
 */
function toggleMobileOptionsMenu(event) {
    event.stopPropagation();

    if (!mobileOptionsMenu) return;

    mobileOptionsMenu.classList.toggle("active");
}


/**
 * Closes the mobile options menu.
 */
function closeMobileOptionsMenu() {
    if (!mobileOptionsMenu) return;

    mobileOptionsMenu.classList.remove("active");
}

