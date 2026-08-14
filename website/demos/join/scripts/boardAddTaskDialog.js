let dialogSubtasks = [];

/**
 * Connects the add task buttons.
 */
function initializeAddTaskDialogButtons() {
    document.querySelectorAll("[data-task-column]").forEach((button) => {
        button.addEventListener("click", () => openAddTaskDialog(button.dataset.taskColumn));
    });
}


/**
 * Opens the add task dialog.
 * @param {string} column - The target column.
 */
function openAddTaskDialog(column) {
    if (document.getElementById("addTaskDialog")) return;
    document.body.insertAdjacentHTML("beforeend", getAddTaskDialogTemplate());
    const dialog = document.getElementById("addTaskDialog");
    dialogSubtasks = [];
    dialog.dataset.taskColumn = column;
    prepareAddTaskDialog(dialog);
}


/**
 * Prepares the open dialog.
 *
 * @param {HTMLElement} dialog - The dialog element.
 */
function prepareAddTaskDialog(dialog) {
    renderDialogContacts();
    initializeHorizontalDragScroll(dialog.querySelector(".selected-contacts"));
    initializePriorityKeyboard(dialog.querySelector(".priority-group"));
    initializeDialogDropdowns(dialog);
    initializeDialogSubtasks(dialog);
    initializeDialogActions(dialog);
    initializeDialogDueDateValidation(dialog);
    document.addEventListener("keydown", closeAddTaskDialogOnEscape);
    document.addEventListener("click", closeDialogDropdownsOnOutsideClick);
    activateModal(dialog, dialog.querySelector("#title"));
}


/**
 * Connects the dialog dropdowns.
 * @param {HTMLElement} dialog - The dialog element.
 */
function initializeDialogDropdowns(dialog) {
    initializeDialogDropdownAccessibility(dialog, ["#category"]);
    initializeTaskContactDropdown(dialog, "#assignedTo", renderSelectedDialogContacts);
    dialog.querySelectorAll("[data-category]").forEach((option) => {
        option.addEventListener("click", selectDialogCategory);
    });
}


/**
 * Connects the dialog subtask controls.
 * @param {HTMLElement} dialog - The dialog element.
 */
function initializeDialogSubtasks(dialog) {
    dialog.querySelector(".subtask-check").addEventListener("click", addDialogSubtask);
    dialog.querySelector(".subtask-cancel").addEventListener("click", clearDialogSubtaskInput);
    dialog.querySelector("#subtasks").addEventListener("input", updateDialogSubtaskActions);
    dialog.querySelector("#subtasks").addEventListener("keydown", handleDialogSubtaskKeydown);
    dialog.querySelector(".subtask-list").addEventListener("click", handleDialogSubtaskAction);
}


/**
 * Connects the main dialog actions.
 * @param {HTMLElement} dialog - The dialog element.
 */
function initializeDialogActions(dialog) {
    dialog.querySelector(".add-task-dialog-close").addEventListener("click", closeAddTaskDialog);
    dialog.querySelector(".cancel-task").addEventListener("click", closeAddTaskDialog);
    dialog.querySelector("#addTaskDialogForm").addEventListener("submit", submitBoardTask);
    dialog.addEventListener("pointerup", closeAddTaskDialogOnBackdrop);
    initializeDialogDateInput(dialog);
}


/**
 * Renders all contacts in the dropdown.
 */
function renderDialogContacts() {
    const sortedContacts = Object.entries(boardContacts).sort(compareDialogContactsByName);
    const options = sortedContacts.map(([id, contact]) => {
        return getAddTaskContactOptionTemplate(getDialogContactView(id, contact));
    });
    const input = document.getElementById("assignedTo");
    input.closest(".input-wrapper").querySelector(".dropdown-content").innerHTML = options.join("");
}


/**
 * Compares two contact entries by name.
 * @param {Array} firstEntry - The first contact entry.
 * @param {Array} secondEntry - The second contact entry.
 * @returns {number} The sort order.
 */
function compareDialogContactsByName(firstEntry, secondEntry) {
    return firstEntry[1].name.localeCompare(secondEntry[1].name);
}


/**
 * Prepares one contact for the dialog.
 * @param {string} id - The contact id.
 * @param {Object} contact - The contact data.
 * @returns {Object} The contact view data.
 */
function getDialogContactView(id, contact) {
    const color = getUserColor(contact.color);
    const displayName = getContactDisplayName(contact);

    return {
        id: escapeBoardHtml(id),
        name: escapeBoardHtml(displayName),
        initials: escapeBoardHtml(getUserInitials(contact.name)),
        color: escapeBoardHtml(color),
        textColor: escapeBoardHtml(getUserTextColor(color)),
        checked: ""
    };
}


/**
 * Opens or closes one dropdown.
 * @param {MouseEvent} event - The click event.
 */
function toggleDialogDropdown(event) {
    const dropdown = event.currentTarget.closest(".dropdown-list");
    const input = dropdown.querySelector(".input-wrapper input");
    document.querySelectorAll(".dropdown-list.open").forEach((openDropdown) => {
        if (openDropdown !== dropdown) {
            openDropdown.classList.remove("open");
            openDropdown.querySelector("input").setAttribute("aria-expanded", "false");
        }
    });
    dropdown.classList.toggle("open");
    input.setAttribute("aria-expanded", String(dropdown.classList.contains("open")));
}


/**
 * Closes dropdowns after a click outside.
 * @param {MouseEvent} event - The click event.
 */
function closeDialogDropdownsOnOutsideClick(event) {
    if (event.target.closest(".dropdown-list")) return;
    document.querySelectorAll(".dropdown-list.open").forEach((dropdown) => {
        dropdown.classList.remove("open");
        dropdown.querySelector("input").setAttribute("aria-expanded", "false");
    });
}


/**
 * Selects a task category.
 * @param {MouseEvent} event - The click event.
 */
function selectDialogCategory(event) {
    event.preventDefault();
    const input = document.getElementById("category");
    input.value = event.currentTarget.dataset.category;
    input.closest(".dropdown-list").classList.remove("open");
    input.setAttribute("aria-expanded", "false");
    clearDialogFieldError(input, document.getElementById("categoryError"));
}


/**
 * Renders selected contact avatars.
 */
function renderSelectedDialogContacts() {
    const selected = document.querySelectorAll(".contact-checkbox:checked");
    const templates = Array.from(selected).map((checkbox) => {
        const contact = getDialogContactView(checkbox.value, boardContacts[checkbox.value]);
        return getSelectedDialogContactTemplate(contact);
    });
    document.querySelector(".selected-contacts").innerHTML = templates.join("");
}


/**
 * Adds one dialog subtask.
 */
function addDialogSubtask() {
    const input = document.getElementById("subtasks");
    const title = input.value.trim();
    if (!title) return;
    dialogSubtasks.push(title);
    input.value = "";
    updateDialogSubtaskActions();
    renderDialogSubtasks();
    input.focus();
}


/**
 * Clears the subtask input.
 */
function clearDialogSubtaskInput() {
    const input = document.getElementById("subtasks");
    input.value = "";
    updateDialogSubtaskActions();
    input.focus();
}


/**
 * Handles Enter in the subtask input.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function handleDialogSubtaskKeydown(event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addDialogSubtask();
}


/**
 * Renders all dialog subtasks.
 */
function renderDialogSubtasks() {
    const templates = dialogSubtasks.map((title, index) => {
        return getAddTaskSubtaskTemplate({ index, title: escapeBoardHtml(title) });
    });
    document.querySelector(".subtask-list").innerHTML = templates.join("");
}


/**
 * Validates and creates a task.
 * @param {SubmitEvent} event - The submit event.
 */
async function submitBoardTask(event) {
    event.preventDefault();
    if (!validateBoardTaskDialog()) return;
    const button = document.querySelector(".create-task");
    button.disabled = true;
    await saveBoardTask(button);
}


/**
 * Saves a new board task.
 * @param {HTMLButtonElement} button - The create button.
 */
async function saveBoardTask(button) {
    try {
        const task = await createTask(getBoardTaskDialogData());
        boardTasks.push(task);
        renderBoardTasks(boardTasks, boardContacts);
        closeAddTaskDialog();
        showTaskAddedMessage();
    } catch (error) {
        showBoardMessage("Task could not be saved. Please try again.", false);
        button.disabled = false;
    }
}


/**
 * Validates the required dialog fields.
 * @returns {boolean} True when all fields are valid.
 */
function validateBoardTaskDialog() {
    const fields = getRequiredDialogFields();
    fields.forEach((field) => setDialogFieldValidity(field.input, field.error));
    return fields.every((field) => isValidDialogField(field.input));
}


/**
 * Collects the task form data.
 * @returns {Object} The new task data.
 */
function getBoardTaskDialogData() {
    const dialog = document.getElementById("addTaskDialog");
    const task = getBasicDialogTaskData(dialog);
    task.assignedTo = getDialogAssignments(dialog);
    task.column = dialog.dataset.taskColumn;
    task.order = Date.now();
    if (dialogSubtasks.length) task.subtasks = getDialogSubtasksData();
    return task;
}


/**
 * Gets the basic dialog task data.
 * @param {HTMLElement} dialog - The dialog element.
 * @returns {Object} The basic task data.
 */
function getBasicDialogTaskData(dialog) {
    return {
        title: dialog.querySelector("#title").value.trim(),
        description: dialog.querySelector("#description").value.trim(),
        dueDate: formatDialogDate(dialog.querySelector("#dueDate").value),
        priority: dialog.querySelector("input[name='priority']:checked").value,
        category: dialog.querySelector("#category").value
    };
}


/**
 * Gets all selected assignments.
 * @param {HTMLElement} dialog - The dialog element.
 * @returns {Array} The assignments.
 */
function getDialogAssignments(dialog) {
    const checked = dialog.querySelectorAll(".contact-checkbox:checked");
    return Array.from(checked).map((box) => ({ id: box.value, type: "contact" }));
}


/**
 * Converts the dialog subtasks.
 * @returns {Object} The subtasks.
 */
function getDialogSubtasksData() {
    const subtasks = {};
    dialogSubtasks.forEach((title, index) => {
        const id = `s${String(index + 1).padStart(3, "0")}`;
        subtasks[id] = { title, completed: false };
    });
    return subtasks;
}


/**
 * Shows the task added message.
 */
function showTaskAddedMessage() {
    showBoardMessage("Task added to board");
}


/**
 * Shows a temporary status message on the board.
 * @param {string} message - The message text.
 * @param {boolean} showIcon - Whether the board icon is shown.
 */
function showBoardMessage(message, showIcon = true) {
    removeTaskAddedMessage();
    const icon = showIcon ? '<img src="../assets/icons/board.webp" alt="">' : "";
    document.body.insertAdjacentHTML("beforeend", getTaskAddedMessageTemplate(escapeHtml(message), icon));
    setTimeout(removeTaskAddedMessage, 2500);
}


/**
 * Removes the task added message.
 */
function removeTaskAddedMessage() {
    const message = document.getElementById("taskAddedMessage");
    if (message) message.remove();
}


/**
 * Closes the dialog from its backdrop.
 * @param {MouseEvent} event - The click event.
 */
function closeAddTaskDialogOnBackdrop(event) {
    closeBoardDialogOnBackdrop(event, closeAddTaskDialog);
}


/**
 * Closes the dialog with Escape.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function closeAddTaskDialogOnEscape(event) {
    closeBoardDialogOnEscape(event, closeAddTaskDialog);
}


/**
 * Removes the add task dialog.
 */
function closeAddTaskDialog() {
    const dialog = document.getElementById("addTaskDialog");
    deactivateModal(dialog);
    removeBoardDialog("addTaskDialog");
    document.removeEventListener("keydown", closeAddTaskDialogOnEscape);
    document.removeEventListener("click", closeDialogDropdownsOnOutsideClick);
}


initializeAddTaskDialogButtons();
