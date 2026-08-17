let contacts = [];
let currentContactIndex = null;
let modalMode = "add";
let selectedContactColor = "var(--profile-orange)";
const overlay = document.getElementById("addContactOverlay");
const modal = document.querySelector(".add-contact-modal");
const addContactBtn = document.getElementById("addContactBtn");
const mobileAddContactBtn = document.getElementById("mobileAddContactBtn");
const mobileMoreBtn = document.querySelector(".mobile-more-btn");
const mobileBackBtn = document.querySelector(".mobile-back-btn");
const closeContactModal = document.getElementById("closeContactModal");
const cancelContactBtn = document.getElementById("cancelContactBtn");
const addContactForm = document.getElementById("addContactForm");
const contactsPage = document.querySelector(".contacts-page");
const modalTitle = document.getElementById("contactModalTitle");
const modalSubtitle = document.getElementById("contactModalSubtitle");
const contactPlaceholder = document.getElementById("contactPlaceholder");
const contactAvatarInitials = document.getElementById("contactAvatarInitials");
const secondaryBtnText = document.getElementById("secondaryBtnText");
const secondaryBtnIcon = document.getElementById("secondaryBtnIcon");
const submitBtnText = document.getElementById("submitBtnText");
const colorPicker = document.getElementById("colorPicker");
const colorOptions = document.getElementById("colorOptions");
const mobileOptionsMenu = document.getElementById("mobileOptionsMenu");
const mobileEditContactBtn = document.getElementById("mobileEditContactBtn");
const mobileDeleteContactBtn = document.getElementById("mobileDeleteContactBtn");
const contactToast = document.getElementById("contactToast");
const contactDetailsContainer = document.getElementById("contactDetails");
const contactsListContainer = document.getElementById("contactsList");

if (addContactBtn) addContactBtn.addEventListener("click", openAddContactOverlay);
if (mobileAddContactBtn) mobileAddContactBtn.addEventListener("click", openAddContactOverlay);
if (mobileMoreBtn) mobileMoreBtn.addEventListener("click", toggleMobileOptionsMenu);
if (mobileBackBtn) mobileBackBtn.addEventListener("click", closeMobileContactView);
if (closeContactModal) closeContactModal.addEventListener("click", closeAddContactOverlay);
if (cancelContactBtn) cancelContactBtn.addEventListener("click", handleSecondaryButton);
if (addContactForm) addContactForm.addEventListener("submit", handleContactSubmit);
if (contactPlaceholder) contactPlaceholder.addEventListener("click", toggleColorDropdown);
if (contactDetailsContainer) contactDetailsContainer.addEventListener("keydown", handleContactDetailTab);
if (contactsListContainer) contactsListContainer.addEventListener("keydown", handleActiveContactTab);

if (mobileEditContactBtn) {
    mobileEditContactBtn.addEventListener("click", function () {
        closeMobileOptionsMenu();
        openEditContactOverlay();
    });
}

if (mobileDeleteContactBtn) {
    mobileDeleteContactBtn.addEventListener("click", function () {
        closeMobileOptionsMenu();
        deleteContact();
    });
}

if (overlay) {
    overlay.addEventListener("pointerup", function (event) {
        if (event.target === overlay) {
            closeAddContactOverlay();
        }
    });
}

if (modal) {
    modal.addEventListener("click", function (event) {
        closeColorDropdownOnOutsideClick(event);
        event.stopPropagation();
    });
}

document.addEventListener("click", function (event) {
    closeColorDropdownOnOutsideClick(event);

    if (!mobileOptionsMenu || !mobileMoreBtn) return;

    const clickedInsideMenu = mobileOptionsMenu.contains(event.target);
    const clickedMoreButton = mobileMoreBtn.contains(event.target);

    if (!clickedInsideMenu && !clickedMoreButton) {
        closeMobileOptionsMenu();
    }
});


/**
 * Opens the add contact overlay.
 */
function openAddContactOverlay() {
    modalMode = "add";
    closeMobileOptionsMenu();
    closeColorDropdown();
    setAddMode();
    addContactForm.reset();
    addContactForm.classList.remove("submitted");
    overlay.classList.add("active");
    activateModal(overlay, document.getElementById("username"));
}


/**
 * Opens the edit contact overlay.
 */
function openEditContactOverlay() {
    if (currentContactIndex === null) return;

    const contact = contacts[currentContactIndex];

    if (!contact) return;
    modalMode = "edit";
    closeMobileOptionsMenu();
    closeColorDropdown();
    setEditMode(contact);
    overlay.classList.add("active");
    activateModal(overlay, document.getElementById("username"));
}


/**
 * Closes the contact overlay.
 */
function closeAddContactOverlay() {
    deactivateModal(overlay);
    overlay.classList.remove("active");
    closeColorDropdown();
}


/**
 * Closes the active contact modal when Escape is pressed.
 * @param {KeyboardEvent} event - The document keydown event.
 */
function closeContactModalOnEscape(event) {
    if (event.key === "Escape" && overlay.classList.contains("active")) {
        closeAddContactOverlay();
    }
}


document.addEventListener("keydown", closeContactModalOnEscape);


/**
 * Loads and renders all contacts.
 */
async function loadContacts() {
    const data = await getContactsData();
    contacts = createContactsArray(data);
    sortContactsByName();
    renderContacts();
    renderInitialContactDetails();
}


/**
 * Gets the contacts data.
 * @returns {Promise<Object|null>} The contacts data.
 */
async function getContactsData() {
    const response = await fetch(getContactsUrl());
    ensureSuccessfulResponse(response, "Contacts could not be loaded.");

    return await response.json();
}


/**
 * Returns the contacts database URL.
 * @param {string} contactId - The optional contact id.
 * @returns {string} The contacts database URL.
 */
function getContactsUrl(contactId = "") {
    const path = contactId ? "/" + contactId : "";
    return getScopedDatabaseUrl("contacts" + path);
}


/**
 * Converts the contacts object to an array.
 * @param {Object|null} data - The contacts data.
 * @returns {Array} The contacts array.
 */
function createContactsArray(data) {
    if (!data) return [];

    return Object.entries(data).map(function ([id, contact]) {
        return { id: id, ...contact };
    });
}


/**
 * Sorts contacts by name.
 */
function sortContactsByName() {
    contacts.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
}


/**
 * Renders the empty detail view if no contact is selected.
 */
function renderInitialContactDetails() {
    if (currentContactIndex === null) {
        renderEmptyContactDetails();
    }
}


/**
 * Shows the selected contact.
 * @param {number} index - The contact index.
 */
function showContact(index) {
    const contact = contacts[index];

    if (!contact) return;

    currentContactIndex = index;
    renderContacts();
    renderContactDetails(contact);
    document.querySelector(".contact-detail-name-box h2").focus({ preventScroll: true });
    openMobileContactDetails();
}


/**
 * Connects the selected contact with its desktop detail actions in tab order.
 * @param {KeyboardEvent} event - The keyboard event inside the contact details.
 */
function handleContactDetailTab(event) {
    if (event.key !== "Tab" || isTouchNavigationLayout()) return;

    if (event.shiftKey && event.target.closest(".edit-contact-btn")) {
        event.preventDefault();
        focusContactCard(currentContactIndex);
        return;
    }

    if (!event.shiftKey && event.target.closest(".contact-email")) {
        focusNextContactCard(event);
    }
}


/** Moves forward from the active contact card into its detail actions. */
function handleActiveContactTab(event) {
    if (event.key !== "Tab" || event.shiftKey || isTouchNavigationLayout()) return;
    if (!event.target.matches(".contact-card.active")) return;
    const editButton = contactDetailsContainer.querySelector(".edit-contact-btn");
    if (!editButton) return;
    event.preventDefault();
    editButton.focus();
}


/** Focuses one rendered contact card. */
function focusContactCard(index) {
    document.querySelector(`.contact-card[data-contact-index="${index}"]`)?.focus();
}


/** Moves focus from the selected contact's last detail link to the next contact. */
function focusNextContactCard(event) {
    const nextCard = document.querySelector(`.contact-card[data-contact-index="${currentContactIndex + 1}"]`);
    if (!nextCard) return;
    event.preventDefault();
    nextCard.focus();
}


/**
 * Opens the mobile contact detail view.
 */
function openMobileContactDetails() {
    if (isTouchNavigationLayout()) {
        contactsPage.classList.add("mobile-detail-open");
    }
}


/**
 * Checks whether the touch/tablet navigation layout is active.
 * A 1024 px laptop with a mouse therefore keeps the desktop layout.
 * @returns {boolean} True for the coarse-pointer layout.
 */
function isTouchNavigationLayout() {
    return window.matchMedia(
        "(max-width: 1024px) and (hover: none) and (pointer: coarse)"
    ).matches;
}


/**
 * Closes the mobile contact detail view.
 */
function closeMobileContactView() {
    contactsPage.classList.remove("mobile-detail-open");
    closeMobileOptionsMenu();
    closeColorDropdown();
}


/**
 * Handles the contact form submit.
 * @param {Event} event - The submit event.
 */
function handleContactSubmit(event) {
    event.preventDefault();
    addContactForm.classList.add("submitted");

    if (!validateContactForm()) return;

    if (modalMode === "edit") {
        saveContact();
        return;
    }

    createContact();
}


/**
 * Closes all contact interfaces.
 */
function closeContactInterfaces() {
    closeMobileOptionsMenu();
    closeAddContactOverlay();
    closeMobileContactView();
    closeColorDropdown();
}


/**
 * Handles the secondary modal button.
 */
function handleSecondaryButton() {
    if (modalMode === "edit") {
        deleteContact();
        return;
    }

    closeAddContactOverlay();
}


loadContacts();
