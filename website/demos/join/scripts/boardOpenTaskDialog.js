/** Connects task cards with the task detail dialog. */
function initializeOpenTaskDialog() {
    const boardColumns = document.querySelector(".board-columns");

    boardColumns.addEventListener("click", handleTaskCardClick);
    boardColumns.addEventListener("keydown", handleTaskCardKeydown);
}


/**
 * Opens the task card selected with the pointer.
 * @param {MouseEvent} event - The click event.
 */
function handleTaskCardClick(event) {
    const card = event.target.closest(".task-card");
    if (!card) return;
    openTaskCard(card);
}


/**
 * Opens a focused task card with Enter or Space.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function handleTaskCardKeydown(event) {
    const card = event.target.closest(".task-card");

    if (!card || event.target !== card || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    openTaskCard(card);
}


/**
 * Opens the task represented by a board card.
 * @param {HTMLElement} card - The selected task card.
 */
function openTaskCard(card) {
    const task = boardTasks.find((item) => String(item.id) === card.dataset.taskId);
    if (task) openTaskDialog(task);
}


/**
 * Opens the detail view for one board task.
 * @param {Object} task - The task to display.
 */
function openTaskDialog(task) {
    closeOpenTaskDialog();
    document.body.insertAdjacentHTML("beforeend", getOpenTaskDialogTemplate(getOpenTaskView(task)));
    const backdrop = document.getElementById("openTaskDialog");
    backdrop.querySelector(".open-task-close").addEventListener("click", closeOpenTaskDialog);
    backdrop.querySelector(".open-task-delete").addEventListener("click", deleteOpenTask);
    backdrop.querySelector(".open-task-edit").addEventListener("click", () => openEditTaskDialog(task));
    backdrop.querySelector(".open-task-subtasks").addEventListener("change", changeOpenTaskSubtaskStatus);
    backdrop.addEventListener("pointerup", closeOpenTaskOnBackdrop);
    document.addEventListener("keydown", closeOpenTaskOnEscape);
    activateModal(backdrop, backdrop.querySelector(".open-task-close"));
}


/**
 * Saves a changed subtask checkbox in Firebase and refreshes the task card.
 * @param {Event} event - The checkbox change event.
 * @returns {Promise<void>} Resolves after saving the subtask.
 */
async function changeOpenTaskSubtaskStatus(event) {
    const checkbox = event.target.closest("input[data-subtask-id]");
    const task = checkbox ? getOpenSubtaskTask(checkbox) : null;
    if (!task) return;
    checkbox.disabled = true;
    try {
        await saveOpenSubtaskStatus(task, checkbox);
    } catch (error) {
        handleSubtaskSaveError(checkbox);
    } finally {
        checkbox.disabled = false;
    }
}


/**
 * Restores a checkbox and shows a save error.
 * @param {HTMLInputElement} checkbox - The changed checkbox.
 */
function handleSubtaskSaveError(checkbox) {
    checkbox.checked = !checkbox.checked;
    showBoardMessage("Subtask could not be saved. Please try again.", false);
}


/**
 * Finds the task belonging to a changed subtask checkbox.
 * @param {HTMLInputElement} checkbox - The changed subtask checkbox.
 * @returns {Object|null} The matching task or null.
 */
function getOpenSubtaskTask(checkbox) {
    const taskId = document.querySelector(".dialog-creator").dataset.taskId;
    const task = boardTasks.find((item) => String(item.id) === taskId);
    return task?.subtasks?.[checkbox.dataset.subtaskId] ? task : null;
}


/**
 * Saves and renders a changed subtask state.
 * @param {Object} task - The task containing the subtask.
 * @param {HTMLInputElement} checkbox - The changed subtask checkbox.
 * @returns {Promise<void>} Resolves after the board was refreshed.
 */
async function saveOpenSubtaskStatus(task, checkbox) {
    const subtaskId = checkbox.dataset.subtaskId;
    await updateSubtaskCompletion(task.id, subtaskId, checkbox.checked);
    task.subtasks[subtaskId].completed = checkbox.checked;
    renderBoardTasks(boardTasks, boardContacts);
}


/**
 * Prepares task data for the detail dialog.
 * @param {Object} task - The task data.
 * @returns {Object} The data for the dialog.
 */
function getOpenTaskView(task) {
    const priority = getTaskPriority(task.priority);
    return {
        id: escapeBoardHtml(task.id), title: escapeBoardHtml(task.title),
        description: escapeBoardHtml(task.description || ""),
        category: escapeBoardHtml(task.category), categoryClass: getTaskCategoryClass(task.category),
        dueDate: getOpenTaskDate(task.dueDate), priorityLabel: priority[0].toUpperCase() + priority.slice(1),
        priorityIcon: `${priority}Priority.webp`, contacts: getOpenTaskContacts(task.assignedTo),
        subtasks: getOpenTaskSubtasks(task.subtasks)
    };
}


/**
 * Converts a stored task date into its visible format.
 * @param {string} value - The stored date value.
 * @returns {string} The formatted and escaped date.
 */
function getOpenTaskDate(value) {
    if (!value) return "";
    const parts = value.split("-");
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : escapeBoardHtml(value);
}


/**
 * Returns the assigned contacts for the detail dialog.
 * @param {Array<Object>} assignments - The saved task assignments.
 * @returns {string} The assigned contacts HTML.
 */
function getOpenTaskContacts(assignments = []) {
    return assignments.map(getOpenTaskContact).join("");
}


/**
 * Returns one assigned contact for the detail dialog.
 * @param {Object} assignment - The saved contact assignment.
 * @returns {string} The contact HTML or an empty string.
 */
function getOpenTaskContact(assignment) {
    const contact = boardContacts[assignment.id];
    if (!contact) return "";
    const color = getUserColor(contact.color);
    return getOpenTaskContactTemplate({
        name: escapeBoardHtml(getContactDisplayName(contact)),
        initials: escapeBoardHtml(getUserInitials(contact.name)),
        color: escapeBoardHtml(color),
        textColor: escapeBoardHtml(getUserTextColor(color))
    });
}


/**
 * Returns all subtasks for the detail dialog.
 * @param {Object} subtasks - The saved subtasks.
 * @returns {string} The subtasks HTML.
 */
function getOpenTaskSubtasks(subtasks = {}) {
    return Object.entries(subtasks).map(([id, subtask]) => getOpenTaskSubtaskTemplate({
        id: escapeBoardHtml(id), title: escapeBoardHtml(subtask.title), completed: Boolean(subtask.completed)
    })).join("");
}


/**
 * Closes the detail dialog when its backdrop is selected.
 * @param {MouseEvent} event - The click event.
 */
function closeOpenTaskOnBackdrop(event) {
    closeBoardDialogOnBackdrop(event, closeOpenTaskDialog);
}


/**
 * Closes the detail dialog when Escape is pressed.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function closeOpenTaskOnEscape(event) {
    closeBoardDialogOnEscape(event, closeOpenTaskDialog);
}


/**
 * Removes the detail dialog and restores focus when needed.
 * @param {boolean} restoreFocus - Whether focus should be restored.
 */
function closeOpenTaskDialog(restoreFocus = true) {
    const dialog = document.getElementById("openTaskDialog");
    deactivateModal(dialog, restoreFocus);
    removeBoardDialog("openTaskDialog");
    document.removeEventListener("keydown", closeOpenTaskOnEscape);
}


/**
 * Deletes the currently open task and refreshes the board.
 * @returns {Promise<void>} Resolves after the task was deleted.
 */
async function deleteOpenTask() {
    const id = document.querySelector(".dialog-creator").dataset.taskId;
    const response = await fetch(getTasksUrl(id), { method: "DELETE" });
    ensureSuccessfulResponse(response, "Task could not be deleted.");
    boardTasks = boardTasks.filter((task) => String(task.id) !== id);
    renderBoardTasks(boardTasks, boardContacts);
    closeOpenTaskDialog();
}


initializeOpenTaskDialog();
