/**
 * Returns the database URL for new tasks.
 * @returns {string} The task database URL.
 */
function getAddTaskUrl() {
    return getScopedDatabaseUrl("tasks");
}


/**
 * Retrieves all selected contact assignments.
 * @returns {Array<Object>} The selected contact references.
 */
function getAssignedContacts() {
    return Array.from(document.querySelectorAll(".contact-checkbox:checked")).map((checkbox) => ({
        id: checkbox.dataset.id,
        type: "contact"
    }));
}


/**
 * Retrieves all subtasks currently shown in the form.
 * @returns {Object} The keyed subtask data.
 */
function getSubtasksData() {
    const subtasks = {};
    subtaskList.querySelectorAll(".subtaskText").forEach((textSpan, index) => {
        const subtaskId = "s" + String(index + 1).padStart(3, "0");
        subtasks[subtaskId] = { title: textSpan.textContent, completed: false };
    });
    return subtasks;
}


/**
 * Collects all values for a new task.
 * @returns {Object} The task data.
 */
function getTaskFormData() {
    const task = {
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        dueDate: dueDateInput.value,
        priority: document.querySelector('input[name="priority"]:checked').value,
        category: categoryInput.value.trim(),
        assignedTo: getAssignedContacts(),
        column: "todo",
        order: Date.now()
    };
    return addSubtasksToTask(task, getSubtasksData());
}


/**
 * Adds subtasks to a task when the form contains any.
 * @param {Object} task - The basic task data.
 * @param {Object} subtasks - The collected subtasks.
 * @returns {Object} The completed task data.
 */
function addSubtasksToTask(task, subtasks) {
    if (Object.keys(subtasks).length) task.subtasks = subtasks;
    return task;
}


/**
 * Saves a new task in the database.
 * @param {Object} task - The task data to save.
 * @returns {Promise<Response>} The successful fetch response.
 */
async function postNewTask(task) {
    const response = await fetch(getAddTaskUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task)
    });
    return ensureSuccessfulResponse(response, "Task could not be saved.");
}
