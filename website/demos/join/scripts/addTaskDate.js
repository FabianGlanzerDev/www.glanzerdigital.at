/**
 * Connects due date validation events on the Add Task page.
 */
function initializeAddTaskDueDateValidation() {
    const input = document.getElementById("dueDate");

    input.addEventListener("focus", () => activateAddTaskDueDateInput(input));
    input.addEventListener("click", () => activateAddTaskDueDateInput(input));
    input.addEventListener("input", validateDueDateField);
    input.addEventListener("change", validateDueDateField);
    input.addEventListener("blur", validateAddTaskDueDateOnBlur);
}


/**
 * Activates the date input and sets today's date as minimum.
 *
 * @param {HTMLInputElement} input - The due date input.
 */
function activateAddTaskDueDateInput(input) {
    input.type = "date";
    input.min = getTodayDateString();
    input.setAttribute("min", getTodayDateString());
}


/**
 * Validates the due date after leaving the input.
 */
function validateAddTaskDueDateOnBlur() {
    const input = document.getElementById("dueDate");

    if (!input.value.trim()) {
        return;
    }

    validateDueDateField();
}


/**
 * Validates the due date field.
 *
 * @returns {boolean} True if the due date is valid.
 */
function validateDueDateField() {
    const input = document.getElementById("dueDate");

    if (!input.value.trim()) {
        return showDueDateError("This field is required");
    }

    if (input.value < getTodayDateString()) {
        return showDueDateError("Please enter a current or future date");
    }

    clearDueDateError();
    return true;
}


/**
 * Shows the due date error message.
 *
 * @param {string} message - The error message.
 * @returns {boolean} Always false.
 */
function showDueDateError(message) {
    const input = document.getElementById("dueDate");
    const error = document.getElementById("dueDateError");

    input.classList.add("input-error");
    error.textContent = message;

    return false;
}


/**
 * Clears the due date error message.
 */
function clearDueDateError() {
    const input = document.getElementById("dueDate");
    const error = document.getElementById("dueDateError");

    input.classList.remove("input-error");
    error.textContent = "";
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