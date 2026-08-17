/**
 * Initializes a searchable contacts dropdown in a board dialog.
 * @param {HTMLElement} dialog - The containing board dialog.
 * @param {string} inputSelector - The contact input selector.
 * @param {Function} renderSelected - Function for rendering selected contacts.
 */
function initializeTaskContactDropdown(dialog, inputSelector, renderSelected) {
    const input = dialog.querySelector(inputSelector);
    const dropdown = input.closest(".dropdown-list");
    const toggle = () => toggleDialogDropdown({ currentTarget: input });
    const close = () => closeTaskContactDropdown(dropdown);
    const arrow = input.parentElement.querySelector(".input-icon");
    initializeKeyboardDropdown(input, toggle, close);
    connectTaskContactDropdown(input, arrow, dropdown, toggle);
    initializeTaskContactDropdownKeys(dropdown, close);
    connectTaskContactCheckboxes(dropdown, renderSelected);
}


/** Connects pointer and filter events of a task contact dropdown. */
function connectTaskContactDropdown(input, arrow, dropdown, toggle) {
    input.addEventListener("click", () => openTaskContactDropdown(dropdown));
    arrow?.addEventListener("click", (event) => {
        event.stopPropagation();
        toggle();
    });
    input.addEventListener("input", filterTaskContacts);
}


/** Connects all contact checkboxes with the selected-contact renderer. */
function connectTaskContactCheckboxes(dropdown, renderSelected) {
    dropdown.querySelectorAll(".contact-checkbox").forEach((box) => {
        box.addEventListener("change", renderSelected);
    });
}


/**
 * Initializes focus and keyboard handling for a contact dropdown.
 * @param {HTMLElement} dropdown - The assigned contacts dropdown.
 * @param {Function} close - Function for closing the dropdown.
 */
function initializeTaskContactDropdownKeys(dropdown, close) {
    trackDropdownPointerDown(dropdown);
    dropdown.addEventListener("focusout", () => closeDropdownAfterFocusLeaves(dropdown, close));
    initializeContactDropdownKeys(dropdown, close);
}


/**
 * Opens a contact dropdown.
 * @param {HTMLElement} dropdown - The assigned contacts dropdown.
 */
function openTaskContactDropdown(dropdown) {
    dropdown.classList.add("open");
    dropdown.querySelector("input").setAttribute("aria-expanded", "true");
}


/**
 * Filters contact options by the entered name.
 * @param {Event} event - The assigned contacts input event.
 */
function filterTaskContacts(event) {
    const query = event.currentTarget.value.trim().toLowerCase();
    const dropdown = event.currentTarget.closest(".dropdown-list");
    openTaskContactDropdown(dropdown);
    dropdown.querySelectorAll(".contact-option").forEach((option) => {
        const name = option.querySelector("span:nth-child(2)").textContent.toLowerCase();
        option.style.display = name.startsWith(query) ? "" : "none";
    });
}


/**
 * Closes a contact dropdown and resets its filter.
 * @param {HTMLElement} dropdown - The assigned contacts dropdown.
 */
function closeTaskContactDropdown(dropdown) {
    closeOneDialogDropdown(dropdown);
    dropdown.querySelector("input").value = "";
    dropdown.querySelectorAll(".contact-option").forEach((option) => option.style.display = "");
}


/**
 * Closes the edit contact dropdown after an outside click.
 * @param {MouseEvent} event - The document click event.
 */
function closeEditDropdownOnOutsideClick(event) {
    const dropdown = document.querySelector("#editTaskDialog .edit-assigned");
    if (!dropdown || dropdown.contains(event.target)) return;
    closeTaskContactDropdown(dropdown);
}
