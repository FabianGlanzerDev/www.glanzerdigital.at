let editTaskSubtasks = [];


/**
 * Opens the edit view for one board task.
 * @param {Object} task - The task to edit.
 */
function openEditTaskDialog(task) {
    closeOpenTaskDialog(false);
    const view = getEditTaskView(task);
    document.body.insertAdjacentHTML("beforeend", getEditTaskDialogTemplate(view));
    editTaskSubtasks = Object.entries(task.subtasks || {}).map(([id, subtask]) => ({ id, ...subtask }));
    const dialog = document.getElementById("editTaskDialog");
    renderEditTaskContacts(task.assignedTo);
    renderEditTaskSubtasks();
    initializeEditTaskDialog(dialog);
    activateModal(dialog, dialog.querySelector("#editTaskTitle"));
}


/**
 * Prepares task data for the edit dialog.
 * @param {Object} task - The task data.
 * @returns {Object} The data for the dialog.
 */
function getEditTaskView(task) {
    const priority = getTaskPriority(task.priority);
    return {
        id: escapeBoardHtml(task.id),
        title: escapeBoardHtml(task.title || ""),
        description: escapeBoardHtml(task.description || ""),
        dueDate: escapeBoardHtml(task.dueDate || ""),
        priorities: getEditPriorityViews(priority)
    };
}


/**
 * Prepares all priority options for the edit template.
 * @param {string} selected - The currently selected priority.
 * @returns {Array<Object>} The prepared priority options.
 */
function getEditPriorityViews(selected) {
    return [
        { id: "editUrgent", value: "urgent", label: "Urgent", checked: selected === "urgent" ? " checked" : "" },
        { id: "editMedium", value: "medium", label: "Medium", checked: selected === "medium" ? " checked" : "" },
        { id: "editLow", value: "low", label: "Low", checked: selected === "low" ? " checked" : "" }
    ];
}


/**
 * Renders contact options and preselects current assignments.
 * @param {Array<Object>} assignments - The saved task assignments.
 */
function renderEditTaskContacts(assignments = []) {
    const options = Object.entries(boardContacts).sort(compareDialogContactsByName).map(([id, contact]) => {
        const contactView = getDialogContactView(id, contact);
        contactView.checked = isEditContactAssigned(assignments, id) ? " checked" : "";
        return getAddTaskContactOptionTemplate(contactView);
    });
    document.querySelector("#editAssignedTo").closest(".input-wrapper")
        .querySelector(".dropdown-content").innerHTML = options.join("");
    renderSelectedEditContacts();
}


/**
 * Checks whether one contact is assigned to the edited task.
 * @param {Array<Object>} assignments - The saved task assignments.
 * @param {string} contactId - The contact id.
 * @returns {boolean} True when the contact is assigned.
 */
function isEditContactAssigned(assignments, contactId) {
    return assignments.some((assignment) => String(assignment.id) === String(contactId));
}


/** Renders avatars for all currently selected contacts. */
function renderSelectedEditContacts() {
    const dialog = document.getElementById("editTaskDialog");
    const avatars = [...dialog.querySelectorAll(".contact-checkbox:checked")].map((box) => {
        return getSelectedDialogContactTemplate(getDialogContactView(box.value, boardContacts[box.value]));
    });
    dialog.querySelector(".selected-contacts").innerHTML = avatars.join("");
}


/**
 * Connects all edit dialog controls.
 * @param {HTMLElement} dialog - The edit dialog backdrop.
 */
function initializeEditTaskDialog(dialog) {
    initializePriorityKeyboard(dialog.querySelector(".priority-group"));
    initializeTaskContactDropdown(dialog, "#editAssignedTo", renderSelectedEditContacts);
    initializeHorizontalDragScroll(dialog.querySelector(".selected-contacts"));
    initializeEditDueDateValidation(dialog);
    dialog.querySelector(".edit-task-close").addEventListener("click", closeEditTaskDialog);
    dialog.querySelector("#editTaskForm").addEventListener("submit", submitEditTask);
    initializeEditSubtaskControls(dialog);
    dialog.addEventListener("pointerup", closeEditTaskOnBackdrop);
    document.addEventListener("keydown", closeEditTaskOnEscape);
    document.addEventListener("click", closeEditDropdownOnOutsideClick);
}


/**
 * Initializes the edit due date validation.
 * @param {HTMLElement} dialog - The edit dialog backdrop.
 */
function initializeEditDueDateValidation(dialog) {
    const input = dialog.querySelector("#editTaskDueDate");

    input.min = getTodayDateValue();
    input.addEventListener("input", () => validateEditTaskDialog(dialog));
    input.addEventListener("change", () => validateEditTaskDialog(dialog));
}


/**
 * Connects all edit subtask controls.
 * @param {HTMLElement} dialog - The edit dialog backdrop.
 */
function initializeEditSubtaskControls(dialog) {
    dialog.querySelector("#editSubtasks").addEventListener("input", updateEditSubtaskActions);
    dialog.querySelector("#editSubtasks").addEventListener("keydown", handleEditSubtaskKeydown);
    dialog.querySelector(".edit-subtask-add").addEventListener("click", addEditSubtask);
    dialog.querySelector(".edit-subtask-cancel").addEventListener("click", clearEditSubtaskInput);
    dialog.querySelector(".edit-subtask-list").addEventListener("click", handleEditSubtaskListClick);
}


/** Renders all editable subtasks. */
function renderEditTaskSubtasks() {
    const html = editTaskSubtasks.map((subtask, index) => getAddTaskSubtaskTemplate({
        index, title: escapeBoardHtml(subtask.title)
    }));
    document.querySelector(".edit-subtask-list").innerHTML = html.join("");
}


/** Enables subtask input actions when the input contains text. */
function updateEditSubtaskActions() {
    const input = document.getElementById("editSubtasks");
    const disabled = !input.value.trim();
    input.closest(".subtask-input-wrapper").querySelectorAll("button").forEach((button) => button.disabled = disabled);
}


/** Adds the entered subtask to the edit dialog. */
function addEditSubtask() {
    const input = document.getElementById("editSubtasks");
    const title = input.value.trim();
    if (!title) return;
    editTaskSubtasks.push({ id: createEditSubtaskId(), title, completed: false });
    clearEditSubtaskInput();
    renderEditTaskSubtasks();
}


/**
 * Creates an unused subtask id.
 * @returns {string} The new subtask id.
 */
function createEditSubtaskId() {
    let number = editTaskSubtasks.length + 1;
    while (editTaskSubtasks.some((item) => item.id === `s${String(number).padStart(3, "0")}`)) number++;
    return `s${String(number).padStart(3, "0")}`;
}


/** Clears and focuses the subtask input. */
function clearEditSubtaskInput() {
    const input = document.getElementById("editSubtasks");
    input.value = "";
    updateEditSubtaskActions();
    input.focus();
}


/**
 * Adds a subtask when Enter is pressed.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function handleEditSubtaskKeydown(event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addEditSubtask();
}


/**
 * Handles edit and delete actions for subtasks.
 * @param {MouseEvent} event - The click event.
 */
function handleEditSubtaskListClick(event) {
    const item = event.target.closest("li");
    if (!item) return;
    const index = Number(item.dataset.subtaskIndex);
    if (event.target.closest(".delete-dialog-subtask")) return deleteEditSubtask(index);
    if (event.target.closest(".edit-dialog-subtask")) return startEditSubtask(item, index);
    if (event.target.closest(".save-edit-subtask")) saveEditSubtask(item, index);
}


/**
 * Deletes one subtask from the edit dialog.
 * @param {number} index - The subtask index.
 */
function deleteEditSubtask(index) {
    editTaskSubtasks.splice(index, 1);
    renderEditTaskSubtasks();
}


/**
 * Replaces one subtask label with an edit input.
 * @param {HTMLElement} item - The subtask list item.
 * @param {number} index - The subtask index.
 */
function startEditSubtask(item, index) {
    const input = createEditSubtaskInput(index);
    replaceEditSubtaskControls(item, input);
    item.classList.add("is-editing");
    input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") saveEditSubtask(item, index);
        if (event.key === "Escape") renderEditTaskSubtasks();
    });
    input.focus();
    input.select();
}


/**
 * Creates the input used to edit one subtask.
 * @param {number} index - The subtask index.
 * @returns {HTMLInputElement} The prepared edit input.
 */
function createEditSubtaskInput(index) {
    const input = document.createElement("input");
    input.className = "dialog-subtask-edit-input";
    input.value = editTaskSubtasks[index].title;
    return input;
}


/**
 * Replaces one subtask's text and edit button controls.
 * @param {HTMLElement} item - The subtask list item.
 * @param {HTMLInputElement} input - The prepared edit input.
 */
function replaceEditSubtaskControls(item, input) {
    item.querySelector(".dialog-subtask-text").replaceWith(input);
    const button = item.querySelector(".edit-dialog-subtask");
    button.className = "save-edit-subtask";
    button.setAttribute("aria-label", "Save subtask");
    button.querySelector("img").src = "../assets/icons/check.webp";
}


/**
 * Saves the edited title of one subtask.
 * @param {HTMLElement} item - The subtask list item.
 * @param {number} index - The subtask index.
 */
function saveEditSubtask(item, index) {
    const title = item.querySelector(".dialog-subtask-edit-input")?.value.trim();
    if (!title) return;
    editTaskSubtasks[index].title = title;
    renderEditTaskSubtasks();
}


/**
 * Validates and saves all edited fields.
 * @param {SubmitEvent} event - The form submission event.
 * @returns {Promise<void>} Resolves after the task was saved.
 */
async function submitEditTask(event) {
    event.preventDefault();
    const dialog = document.getElementById("editTaskDialog");
    if (!validateEditTaskDialog(dialog)) return;
    const button = dialog.querySelector(".edit-task-submit");
    button.disabled = true;
    try {
        await saveEditedTask(dialog);
    } catch (error) {
        showBoardMessage("Task could not be saved. Please try again.", false);
        button.disabled = false;
    }
}


/**
 * Saves the edited task and refreshes the board.
 * @param {HTMLElement} dialog - The edit dialog backdrop.
 * @returns {Promise<void>} Resolves after saving the task.
 */
async function saveEditedTask(dialog) {
    const id = dialog.querySelector(".edit-task-dialog").dataset.taskId;
    const data = getEditTaskData(dialog);
    await updateTask(id, data);
    const task = boardTasks.find((item) => String(item.id) === id);
    Object.assign(task, data);
    renderBoardTasks(boardTasks, boardContacts);
    closeEditTaskDialog();
}


/**
 * Validates the required edit dialog fields.
 * @param {HTMLElement} dialog - The edit dialog backdrop.
 * @returns {boolean} True when every required field is valid.
 */
function validateEditTaskDialog(dialog) {
    const titleInput = dialog.querySelector("#editTaskTitle");
    const dateInput = dialog.querySelector("#editTaskDueDate");
    const titleError = dialog.querySelector("#editTaskTitleError");
    const dateError = dialog.querySelector("#editTaskDueDateError");
    const titleMessage = titleInput.value.trim() ? "" : "This field is required";
    const dateMessage = getEditDueDateErrorMessage(dateInput);
    titleInput.classList.toggle("input-error", Boolean(titleMessage));
    dateInput.classList.toggle("input-error", Boolean(dateMessage));
    titleError.textContent = titleMessage;
    dateError.textContent = dateMessage;
    return !titleMessage && !dateMessage;
}


/**
 * Returns the edit due date error message.
 * @param {HTMLInputElement} input - The due date input.
 * @returns {string} The error message.
 */
function getEditDueDateErrorMessage(input) {
    if (!input.value.trim()) return "This field is required";

    return input.value < input.min ? "Please enter a current or future date" : "";
}


/**
 * Collects the edited task values.
 * @param {HTMLElement} dialog - The edit dialog backdrop.
 * @returns {Object} The task data to save.
 */
function getEditTaskData(dialog) {
    const subtasks = {};
    editTaskSubtasks.forEach((item) => subtasks[item.id] = { title: item.title, completed: Boolean(item.completed) });
    return {
        title: dialog.querySelector("#editTaskTitle").value.trim(),
        description: dialog.querySelector("#editTaskDescription").value.trim(),
        dueDate: dialog.querySelector("#editTaskDueDate").value,
        priority: dialog.querySelector("input[name='editPriority']:checked").value,
        assignedTo: getDialogAssignments(dialog),
        subtasks
    };
}


/**
 * Closes the edit dialog when its backdrop is selected.
 * @param {MouseEvent} event - The click event.
 */
function closeEditTaskOnBackdrop(event) {
    closeBoardDialogOnBackdrop(event, closeEditTaskDialog);
}


/**
 * Closes the edit dialog when Escape is pressed.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function closeEditTaskOnEscape(event) {
    closeBoardDialogOnEscape(event, closeEditTaskDialog);
}


/** Removes the edit dialog and its document listeners. */
function closeEditTaskDialog() {
    const dialog = document.getElementById("editTaskDialog");
    deactivateModal(dialog);
    removeBoardDialog("editTaskDialog");
    document.removeEventListener("keydown", closeEditTaskOnEscape);
    document.removeEventListener("click", closeEditDropdownOnOutsideClick);
}


/**
 * Returns today's date as an input date value.
 * @returns {string} Today's date in yyyy-mm-dd format.
 */
function getTodayDateValue() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${today.getFullYear()}-${month}-${day}`;
}