/**
 * Returns the database URL for all tasks or one task.
 * @param {string} taskId - The optional Firebase task id.
 * @returns {string} The task database URL.
 */
function getTasksUrl(taskId = "") {
    const taskPath = taskId ? `tasks/${taskId}` : "tasks";
    return getScopedDatabaseUrl(taskPath);
}


/**
 * Loads the task data.
 * @returns {Promise<Object>} The loaded tasks.
 */
async function getTasksData() {
    const response = await fetch(getTasksUrl());
    ensureSuccessfulResponse(response, "Tasks could not be loaded.");
    return await response.json() || {};
}


/**
 * Loads all tasks and keeps their Firebase ids.
 * @returns {Promise<Array>} The task list.
 */
async function getTasks() {
    const tasks = await getTasksData();

    return Object.entries(tasks).map(([id, task]) => ({ id, ...task }));
}


/**
 * Creates a task and returns it with its generated Firebase id.
 * @param {Object} task - The task to create.
 * @returns {Promise<Object>} The created task including its id.
 */
async function createTask(task) {
    const response = await fetch(getTasksUrl(), {
        method: "POST",
        body: JSON.stringify(task)
    });
    ensureSuccessfulResponse(response, "Task could not be created.");
    const result = await response.json();
    task.id = result.name;
    return task;
}


/**
 * Updates the completion state of one subtask.
 * @param {string} taskId - The Firebase task id.
 * @param {string} subtaskId - The subtask id.
 * @param {boolean} completed - The new completion state.
 * @returns {Promise<void>} Resolves after the completion state was saved.
 */
async function updateSubtaskCompletion(taskId, subtaskId, completed) {
    const url = getTasksUrl(`${taskId}/subtasks/${subtaskId}/completed`);
    const response = await fetch(url, {
        method: "PUT",
        body: JSON.stringify(completed)
    });

    ensureSuccessfulResponse(response, "Subtask status could not be updated.");
}


/**
 * Updates the editable fields of one task.
 * @param {string} taskId - The Firebase task id.
 * @param {Object} task - The task fields to update.
 * @returns {Promise<void>} Resolves after the update was saved.
 */
async function updateTask(taskId, task) {
    const response = await fetch(getTasksUrl(taskId), {
        method: "PATCH",
        body: JSON.stringify(task)
    });
    ensureSuccessfulResponse(response, "Task could not be updated.");
}
