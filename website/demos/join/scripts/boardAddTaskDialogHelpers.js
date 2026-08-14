/**
 * Gets the required dialog fields.
 * @returns {Array} The required fields.
 */
function getRequiredDialogFields() {
    return [
        getDialogField("title", "titleError"),
        getDialogField("dueDate", "dueDateError"),
        getDialogField("category", "categoryError")
    ];
}


/**
 * Gets one field and its error element.
 * @param {string} inputId - The input id.
 * @param {string} errorId - The error id.
 * @returns {Object} The field data.
 */
function getDialogField(inputId, errorId) {
    return {
        input: document.getElementById(inputId),
        error: document.getElementById(errorId)
    };
}


/**
 * Sets one field validity state.
 * @param {HTMLInputElement} input - The input.
 * @param {HTMLElement} error - The error element.
 */
function setDialogFieldValidity(input, error) {
    const isValid = isValidDialogField(input);
    input.classList.toggle("input-error", !isValid);
    error.textContent = getDialogErrorText(input, isValid);
}


/**
 * Checks one required dialog field.
 * @param {HTMLInputElement} input - The input.
 * @returns {boolean} True when the field is valid.
 */
function isValidDialogField(input) {
    if (input.id === "dueDate" && input.type === "date") return Boolean(input.value);
    if (input.id === "dueDate") return isValidDialogDate(input.value);
    return Boolean(input.value.trim());
}


/**
 * Gets the error text for one field.
 * @param {HTMLInputElement} input - The input.
 * @param {boolean} isValid - The field state.
 * @returns {string} The error text.
 */
function getDialogErrorText(input, isValid) {
    if (isValid) return "";
    if (input.id === "dueDate" && input.value) return "Use dd/mm/yyyy";
    return "This field is required";
}


/**
 * Checks the visible date format.
 * @param {string} value - The visible date.
 * @returns {boolean} True when the date is valid.
 */
function isValidDialogDate(value) {
    const parts = value.split("/");
    if (parts.length !== 3) return false;
    const [day, month, year] = parts.map(Number);
    const date = new Date(year, month - 1, day);
    return day > 0 && month > 0 && year > 999
        && date.getDate() === day && date.getMonth() === month - 1;
}


/**
 * Converts dd/mm/yyyy to yyyy-mm-dd.
 * @param {string} value - The visible date.
 * @returns {string} The database date.
 */
function formatDialogDate(value) {
    if (value.includes("-")) return value;
    const [day, month, year] = value.split("/");
    return `${year}-${month}-${day}`;
}


/**
 * Connects the dialog date input.
 * @param {HTMLElement} dialog - The dialog element.
 */
function initializeDialogDateInput(dialog) {
    const input = dialog.querySelector("#dueDate");
    input.addEventListener("focus", showDialogDatePicker);
    input.addEventListener("blur", resetEmptyDialogDate);
}


/**
 * Shows the browser date picker.
 * @param {FocusEvent} event - The focus event.
 */
function showDialogDatePicker(event) {
    event.currentTarget.type = "date";
}


/**
 * Restores the placeholder when no date was selected.
 * @param {FocusEvent} event - The blur event.
 */
function resetEmptyDialogDate(event) {
    if (!event.currentTarget.value) event.currentTarget.type = "text";
}


/**
 * Clears one field error.
 * @param {HTMLInputElement} input - The input.
 * @param {HTMLElement} error - The error element.
 */
function clearDialogFieldError(input, error) {
    input.classList.remove("input-error");
    error.textContent = "";
}


/** Enables input actions only while the subtask input contains text. */
function updateDialogSubtaskActions() {
    const input = document.getElementById("subtasks");
    const hasContent = input.value.trim() !== "";
    const actions = input.closest(".subtask-input-wrapper").querySelectorAll(".subtask-actions button");
    actions.forEach((button) => { button.disabled = !hasContent; });
}


/**
 * Runs the selected action for one dialog subtask.
 * @param {MouseEvent} event - The delegated click event.
 */
function handleDialogSubtaskAction(event) {
    const item = event.target.closest("li");
    if (!item) return;
    if (event.target.closest(".delete-dialog-subtask")) return deleteDialogSubtask(item);
    if (event.target.closest(".edit-dialog-subtask")) return startDialogSubtaskEdit(item);
    if (event.target.closest(".save-dialog-subtask")) saveDialogSubtaskEdit(item);
}


/**
 * Deletes one dialog subtask.
 * @param {HTMLElement} item - The subtask list item.
 */
function deleteDialogSubtask(item) {
    const itemIndex = Number(item.dataset.subtaskIndex);
    dialogSubtasks.splice(itemIndex, 1);
    renderDialogSubtasks();
    focusDialogSubtaskAction(itemIndex, ".delete-dialog-subtask");
}


/** Restores focus near the subtask action that triggered a list redraw. */
function focusDialogSubtaskAction(itemIndex, selector) {
    const items = document.querySelectorAll(".subtask-list li");
    if (!items.length) return document.getElementById("subtasks").focus();
    const targetIndex = Math.min(itemIndex, items.length - 1);
    items[targetIndex].querySelector(selector)?.focus();
}


/**
 * Replaces one saved subtask label with an editable input.
 * @param {HTMLElement} item - The subtask list item.
 */
function startDialogSubtaskEdit(item) {
    if (item.classList.contains("is-editing")) return;
    const input = createDialogSubtaskEditInput(item);
    const editButton = prepareDialogSubtaskSaveButton(item);
    wireDialogSubtaskEdit(input, editButton, item);
    input.focus();
    input.select();
}


/**
 * Creates the dialog subtask edit field.
 * @param {HTMLElement} item - The subtask list item.
 * @returns {HTMLInputElement} The edit field.
 */
function createDialogSubtaskEditInput(item) {
    const input = document.createElement("input");
    input.className = "dialog-subtask-edit-input";
    input.value = dialogSubtasks[Number(item.dataset.subtaskIndex)];
    item.querySelector(".dialog-subtask-text").replaceWith(input);
    item.classList.add("is-editing");
    return input;
}


/**
 * Converts the edit action into a save action.
 * @param {HTMLElement} item - The subtask list item.
 * @returns {HTMLButtonElement} The save action.
 */
function prepareDialogSubtaskSaveButton(item) {
    const button = item.querySelector(".edit-dialog-subtask");
    button.className = "save-dialog-subtask";
    button.setAttribute("aria-label", "Save subtask");
    button.querySelector("img").src = "../assets/icons/check.webp";
    button.parentElement.append(button);
    return button;
}


/**
 * Connects the active dialog subtask edit controls.
 * @param {HTMLInputElement} input - The edit field.
 * @param {HTMLButtonElement} button - The save action.
 * @param {HTMLElement} item - The subtask list item.
 */
function wireDialogSubtaskEdit(input, button, item) {
    input.addEventListener("input", () => { button.disabled = input.value.trim() === ""; });
    input.addEventListener("keydown", (event) => handleDialogSubtaskEditKeydown(event, item));
}


/**
 * Saves the edited title and redraws the dialog subtask list.
 * @param {HTMLElement} item - The subtask list item.
 */
function saveDialogSubtaskEdit(item) {
    const input = item.querySelector(".dialog-subtask-edit-input");
    const title = input && input.value.trim();
    if (!title) return;
    const itemIndex = Number(item.dataset.subtaskIndex);
    dialogSubtasks[itemIndex] = title;
    renderDialogSubtasks();
    focusDialogSubtaskAction(itemIndex, ".edit-dialog-subtask");
}


/**
 * Handles save and cancel keys in a subtask edit field.
 * @param {KeyboardEvent} event - The keyboard event.
 * @param {HTMLElement} item - The subtask list item.
 */
function handleDialogSubtaskEditKeydown(event, item) {
    if (event.key === "Enter") {
        event.preventDefault();
        saveDialogSubtaskEdit(item);
    }
    if (event.key === "Escape") {
        event.stopPropagation();
        const itemIndex = Number(item.dataset.subtaskIndex);
        renderDialogSubtasks();
        focusDialogSubtaskAction(itemIndex, ".edit-dialog-subtask");
    }
}
