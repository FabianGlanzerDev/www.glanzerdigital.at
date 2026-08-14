/**
 * Connects due date validation events in the add task dialog.
 *
 * @param {HTMLElement} dialog - The dialog element.
 */
function initializeDialogDueDateValidation(dialog) {
    const input = dialog.querySelector("#dueDate");

    activateDialogDueDateInput(input);

    input.addEventListener("focus", () => activateDialogDueDateInput(input));
    input.addEventListener("change", validateDialogDueDateField);
    input.addEventListener("blur", validateDialogDueDateOnBlur);
}


/**
 * Activates the date input and sets today's date as minimum.
 *
 * @param {HTMLInputElement} input - The due date input.
 */
function activateDialogDueDateInput(input) {
    input.type = "date";
    input.min = getTodayDateString();
    input.setAttribute("min", getTodayDateString());
}


/**
 * Validates the due date after leaving the input.
 */
function validateDialogDueDateOnBlur() {
    const input = document.getElementById("dueDate");

    if (!input.value.trim()) {
        return;
    }

    validateDialogDueDateField();
}


/**
 * Validates the dialog due date field.
 *
 * @returns {boolean} True if the due date is valid.
 */
function validateDialogDueDateField() {
    const input = document.getElementById("dueDate");

    if (!input.value.trim()) {
        return showDialogDueDateError("This field is required");
    }

    if (input.value < getTodayDateString()) {
        return showDialogDueDateError("Please enter a current or future date");
    }

    clearDialogFieldError(input, document.getElementById("dueDateError"));
    return true;
}


/**
 * Shows the due date error message.
 *
 * @param {string} message - The error message.
 * @returns {boolean} Always false.
 */
function showDialogDueDateError(message) {
    const input = document.getElementById("dueDate");
    const error = document.getElementById("dueDateError");

    input.classList.add("input-error");
    error.textContent = message;

    return false;
}


/**
 * Returns today's local date as yyyy-mm-dd.
 *
 * @returns {string} Today's local date.
 */
function getTodayDateString() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${today.getFullYear()}-${month}-${day}`;
}