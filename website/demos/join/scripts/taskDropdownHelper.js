/**
 * Adds keyboard controls to a task dropdown.
 * @param {HTMLInputElement} input - The dropdown input.
 * @param {Function} toggleDropdown - Function for toggling the dropdown.
 * @param {Function} closeDropdown - Function for closing the dropdown.
 */
function initializeKeyboardDropdown(input, toggleDropdown, closeDropdown) {
    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("aria-expanded", "false");
    input.addEventListener("keydown", (event) => {
        handleKeyboardDropdown(event, input, toggleDropdown, closeDropdown);
    });
}


/**
 * Handles Enter, Space and Escape on a dropdown input.
 * @param {KeyboardEvent} event - The keyboard event.
 * @param {HTMLInputElement} input - The dropdown input.
 * @param {Function} toggleDropdown - Function for toggling the dropdown.
 * @param {Function} closeDropdown - Function for closing the dropdown.
 */
function handleKeyboardDropdown(event, input, toggleDropdown, closeDropdown) {
    const canToggle = event.key === "Enter" || event.key === " " && input.readOnly;
    const canClose = event.key === "Escape" && input.getAttribute("aria-expanded") === "true";
    if (!canToggle && !canClose) return;
    event.preventDefault();
    if (canClose) event.stopPropagation();
    (canClose ? closeDropdown : toggleDropdown)();
}


/**
 * Closes a dropdown after focus has moved outside of it.
 * @param {HTMLElement} dropdown - The dropdown element.
 * @param {Function} closeDropdown - Function for closing the dropdown.
 */
function closeDropdownAfterFocusLeaves(dropdown, closeDropdown) {
    setTimeout(() => {
        const clickedInside = dropdown.dataset.pointerDownInside === "true";
        delete dropdown.dataset.pointerDownInside;
        if (clickedInside || dropdown.contains(document.activeElement)) return;
        closeDropdown();
    }, 0);
}


/**
 * Tracks pointer use inside a dropdown.
 * @param {HTMLElement} dropdown - The dropdown element.
 */
function trackDropdownPointerDown(dropdown) {
    dropdown.addEventListener("mousedown", () => {
        dropdown.dataset.pointerDownInside = "true";
    });
}


/**
 * Wires keyboard behavior for selected board-dialog dropdown fields.
 * @param {HTMLElement} dialog - The board dialog.
 * @param {Array<string>} inputSelectors - Selectors of dropdown inputs to connect.
 */
function initializeDialogDropdownAccessibility(dialog, inputSelectors) {
    inputSelectors.forEach((selector) => connectDialogDropdownInput(dialog.querySelector(selector)));
    inputSelectors.forEach((selector) => {
        const dropdown = dialog.querySelector(selector).closest(".dropdown-list");
        trackDropdownPointerDown(dropdown);
        dropdown.addEventListener("focusout", () => closeDialogDropdownAfterFocus(dropdown));
        dropdown.addEventListener("keydown", (event) => closeDialogDropdownOnEscape(event, dropdown));
    });
}


/**
 * Connects one dropdown input.
 * @param {HTMLInputElement} input - The dropdown input.
 */
function connectDialogDropdownInput(input) {
    const toggleDropdown = () => toggleDialogDropdown({ currentTarget: input });
    const closeDropdown = () => closeOneDialogDropdown(input.closest(".dropdown-list"));
    const arrow = input.parentElement.querySelector(".input-icon");
    initializeKeyboardDropdown(input, toggleDropdown, closeDropdown);
    input.addEventListener("click", toggleDropdown);
    arrow?.addEventListener("click", toggleDropdown);
}


/**
 * Closes one dropdown.
 * @param {HTMLElement} dropdown - The dropdown element.
 */
function closeOneDialogDropdown(dropdown) {
    dropdown.classList.remove("open");
    dropdown.querySelector("input").setAttribute("aria-expanded", "false");
}


/**
 * Closes a dropdown when focus leaves it.
 * @param {HTMLElement} dropdown - The dropdown element.
 */
function closeDialogDropdownAfterFocus(dropdown) {
    closeDropdownAfterFocusLeaves(dropdown, () => closeOneDialogDropdown(dropdown));
}


/**
 * Closes an open dropdown with Escape.
 * @param {KeyboardEvent} event - The keyboard event.
 * @param {HTMLElement} dropdown - The dropdown element.
 */
function closeDialogDropdownOnEscape(event, dropdown) {
    if (event.key !== "Escape" || !dropdown.classList.contains("open")) return;
    event.preventDefault();
    event.stopPropagation();
    closeOneDialogDropdown(dropdown);
    dropdown.querySelector("input").focus();
}


/**
 * Adds closing keys to a contact dropdown.
 * @param {HTMLElement} dropdown - The contact dropdown.
 * @param {Function} closeDropdown - Function for closing the dropdown.
 */
function initializeContactDropdownKeys(dropdown, closeDropdown) {
    dropdown.addEventListener("keydown", (event) => {
        const confirmsContacts = event.key === "Enter" && event.target.matches(".contact-checkbox");
        if (event.key !== "Escape" && !confirmsContacts) return;
        event.preventDefault();
        event.stopPropagation();
        closeDropdown();
        dropdown.querySelector(".input-wrapper input").focus();
    });
}
