/**
 * Returns the complete edit task dialog.
 * @param {Object} task - Prepared task view data.
 * @returns {string} The dialog HTML.
 */
function getEditTaskDialogTemplate(task) {
    return `
        <div class="task-dialog-backdrop" id="editTaskDialog" role="dialog" aria-modal="true" aria-labelledby="editTaskDialogTitle" tabindex="-1">
            <section class="dialog-creator edit-task-dialog" data-task-id="${task.id}">
                <header class="edit-task-header">
                    <h1 id="editTaskDialogTitle">Edit Task</h1>
                    <button class="edit-task-close" type="button" aria-label="Close dialog">&times;</button>
                </header>
                <div class="edit-task-content">
                    <form class="add-task-form edit-task-form" id="editTaskForm" novalidate>
                        ${getEditTaskFieldsTemplate(task)}
                    </form>
                </div>
                <footer class="edit-task-footer">
                    <button class="edit-task-submit" type="submit" form="editTaskForm">
                        Ok
                        <img src="../assets/icons/check.webp" alt="">
                    </button>
                </footer>
            </section>
        </div>
    `;
}


/**
 * Returns all editable task fields.
 * @param {Object} task - Prepared task view data.
 * @returns {string} The task fields HTML.
 */
function getEditTaskFieldsTemplate(task) {
    return `
        <div class="dialog-field-group">
            <label for="editTaskTitle">Title</label>
            <input id="editTaskTitle" type="text" value="${task.title}" aria-describedby="editTaskTitleError">
            <div class="error-message" id="editTaskTitleError"></div>
        </div>
        <div class="dialog-field-group">
            <label for="editTaskDescription">Description</label>
            <textarea id="editTaskDescription">${task.description}</textarea>
        </div>
        <div class="dialog-field-group">
            <label for="editTaskDueDate">Due date</label>
            <input id="editTaskDueDate" type="date" value="${task.dueDate}" min="${getTodayDateValue()}" aria-describedby="editTaskDueDateError">
            <div class="error-message" id="editTaskDueDateError"></div>
        </div>
        ${getEditTaskPriorityTemplate(task.priorities)}
        ${getEditTaskAssignedTemplate()}
        ${getEditTaskSubtasksTemplate()}
    `;
}


/**
 * Returns the priority selector with the saved priority selected.
 * @param {Array<Object>} priorities - The prepared priority options.
 * @returns {string} The priority selector HTML.
 */
function getEditTaskPriorityTemplate(priorities) {
    return `
        <div class="dialog-field-group">
            <div class="field-label" id="editPriorityLabel">Priority</div>
            <div class="priority-group" role="radiogroup" aria-labelledby="editPriorityLabel">
                ${getEditPriorityOptionTemplate(priorities[0])}
                ${getEditPriorityOptionTemplate(priorities[1])}
                ${getEditPriorityOptionTemplate(priorities[2])}
            </div>
        </div>
    `;
}


/**
 * Returns one priority radio option.
 * @param {Object} priority - The prepared priority option.
 * @returns {string} The priority option HTML.
 */
function getEditPriorityOptionTemplate(priority) {
    return `
        <input type="radio" name="editPriority" id="${priority.id}" value="${priority.value}"${priority.checked}>
        <label for="${priority.id}" tabindex="0" role="radio">
            ${priority.label}
            <img src="../assets/icons/${priority.value}Priority.webp" alt="">
        </label>
    `;
}


/**
 * Returns the assigned contacts field.
 * @returns {string} The assigned contacts HTML.
 */
function getEditTaskAssignedTemplate() {
    return `
        <div class="dropdown-list dialog-field-group edit-assigned">
            <label for="editAssignedTo">Assigned to</label>
            <div class="input-wrapper">
                <input id="editAssignedTo" type="text" placeholder="Select contacts to assign">
                <img class="input-icon" src="../assets/icons/arrowDropdown.webp" alt="">
                <div class="dropdown-content"></div>
            </div>
            <div class="selected-contacts"></div>
        </div>
    `;
}


/**
 * Returns the editable subtasks field.
 * @returns {string} The subtasks HTML.
 */
function getEditTaskSubtasksTemplate() {
    return `
        <div class="dialog-field-group">
            <label for="editSubtasks">Subtasks</label>
            <div class="subtask-input-wrapper">
                <input id="editSubtasks" placeholder="Add new subtasks">
                <div class="subtask-actions">
                    <button class="edit-subtask-cancel" type="button" disabled aria-label="Clear subtask">
                        <img src="../assets/icons/cancel.webp" alt="">
                    </button>
                    <span class="subtask-divider"></span>
                    <button class="edit-subtask-add" type="button" disabled aria-label="Add subtask">
                        <img src="../assets/icons/check.webp" alt="">
                    </button>
                </div>
            </div>
            <ul class="subtask-list edit-subtask-list"></ul>
        </div>
    `;
}