/**
 * Returns the add task dialog template.
 * @returns {string} The add task dialog HTML.
 */
function getAddTaskDialogTemplate() {
    return `
        <div class="add-task-dialog-backdrop" id="addTaskDialog" role="dialog" aria-modal="true" aria-labelledby="addTaskDialogTitle" tabindex="-1">
            <section class="add-task-dialog">
                ${getAddTaskDialogHeaderTemplate()}
                <form class="add-task-form" id="addTaskDialogForm">${getAddTaskDialogLeftFieldsTemplate()}
                    <div class="horizontal-divider"></div>
                    ${getAddTaskDialogRightFieldsTemplate()}
                </form>
                <p class="mobile-required-notice"><span class="required-marker">*</span>This field is required</p>
                ${getAddTaskDialogFooterTemplate()}
            </section>
        </div>
    `;
}


/**
 * Returns the add task dialog header.
 * @returns {string} The header HTML.
 */
function getAddTaskDialogHeaderTemplate() {
    return `
        <button class="add-task-dialog-close" type="button" aria-label="Close dialog">&times;</button>
        <h1 id="addTaskDialogTitle">Add Task</h1>
    `;
}


/**
 * Returns the add task dialog footer.
 * @returns {string} The footer HTML.
 */
function getAddTaskDialogFooterTemplate() {
    return `
        <footer class="add-task-dialog-footer">
            <p><span class="required-marker">*</span>This field is required</p>
            <div class="footer-buttons">
                <button class="cancel-task" type="button">Cancel <img src="../assets/icons/cancel.webp" alt=""></button>
                <button class="create-task" type="submit" form="addTaskDialogForm">Create Task <img src="../assets/icons/check.webp" alt=""></button>
            </div>
        </footer>
    `;
}


/**
 * Returns the left form fields of the add task dialog.
 * @returns {string} The form fields HTML.
 */
function getAddTaskDialogLeftFieldsTemplate() {
    return `
        <div class="add-task-fields-left">
            <div class="dialog-field-group"><label for="title">Title<span class="required-marker">*</span></label>
                <input id="title" type="text" placeholder="Enter a title"><div class="error-message" id="titleError"></div></div>
            <div class="dialog-field-group"><label for="description">Description</label>
                <textarea id="description" placeholder="Enter a Description"></textarea></div>
            <div class="dialog-field-group"><label for="dueDate">Due date<span class="required-marker">*</span></label>
                <input id="dueDate" type="text" inputmode="numeric" maxlength="10" placeholder="dd/mm/yyyy">
                <div class="error-message" id="dueDateError"></div></div>
        </div>
    `;
}


/**
 * Returns the right form fields of the add task dialog.
 * @returns {string} The form fields HTML.
 */
function getAddTaskDialogRightFieldsTemplate() {
    return `
        <div class="add-task-fields-right">
            ${getAddTaskPriorityTemplate()}
            ${getAddTaskAssignedTemplate()}
            ${getAddTaskCategoryTemplate()}
            ${getAddTaskSubtaskInputTemplate()}
        </div>
    `;
}


/**
 * Returns the priority fields.
 * @returns {string} The priority HTML.
 */
function getAddTaskPriorityTemplate() {
    return `
        <div class="dialog-field-group"><div class="field-label" id="dialogPriorityLabel">Priority</div><div class="priority-group" role="radiogroup" aria-labelledby="dialogPriorityLabel">
            <input type="radio" name="priority" id="urgent" value="urgent"><label for="urgent" tabindex="0" role="radio">Urgent <img src="../assets/icons/urgentPriority.webp" alt=""></label>
            <input type="radio" name="priority" id="medium" value="medium" checked><label for="medium" tabindex="0" role="radio">Medium <img src="../assets/icons/mediumPriority.webp" alt=""></label>
            <input type="radio" name="priority" id="low" value="low"><label for="low" tabindex="0" role="radio">Low <img src="../assets/icons/lowPriority.webp" alt=""></label>
        </div></div>
    `;
}


/**
 * Returns the assigned contacts field.
 * @returns {string} The assigned contacts HTML.
 */
function getAddTaskAssignedTemplate() {
    return `
        <div class="dropdown-list dialog-field-group"><label for="assignedTo" class="assigned-to">Assigned to</label>
            <div class="input-wrapper"><input class="assigned-to" id="assignedTo" type="text" placeholder="Select contacts to assign">
                <img class="input-icon" src="../assets/icons/arrowDropdown.webp" alt="">
                <div class="dropdown-content"></div></div>
            <div class="selected-contacts"></div>
        </div>
    `;
}


/**
 * Returns the category field.
 * @returns {string} The category HTML.
 */
function getAddTaskCategoryTemplate() {
    return `
        <div class="dropdown-list dialog-field-group"><label for="category">Category<span class="required-marker">*</span></label>
            <div class="input-wrapper"><input id="category" placeholder="Select task category" readonly>
                <img class="input-icon" src="../assets/icons/arrowDropdown.webp" alt="">
                <div class="dropdown-content"><a href="#" data-category="Technical Task">Technical Task</a><a href="#" data-category="User Story">User Story</a></div>
            </div><div class="error-message" id="categoryError"></div>
        </div>
    `;
}


/**
 * Returns the subtask input.
 * @returns {string} The subtask input HTML.
 */
function getAddTaskSubtaskInputTemplate() {
    return `
        <div class="dialog-field-group"><label for="subtasks">Subtasks</label><div class="subtask-input-wrapper">
            <input id="subtasks" placeholder="Add new subtasks"><div class="subtask-actions">
                <button class="subtask-cancel" type="button" tabindex="0" aria-label="Clear subtask" disabled>
                    <img src="../assets/icons/cancel.webp" alt="">
                </button><span class="subtask-divider"></span>
                <button class="subtask-check" type="button" tabindex="0" aria-label="Add subtask" disabled>
                    <img src="../assets/icons/check.webp" alt="">
                </button>
            </div></div><ul class="subtask-list"></ul></div>
    `;
}


/**
 * Returns one contact option for the add task dialog.
 * @param {Object} contact - The prepared contact view data.
 * @returns {string} The contact option HTML.
 */
function getAddTaskContactOptionTemplate(contact) {
    return `
        <label class="contact-option">
            <span class="dialog-contact-avatar" style="background:${contact.color};color:${contact.textColor}">${contact.initials}</span>
            <span title="${contact.name}">${contact.name}</span>
            <span class="custom-checkbox-wrapper">
                <input class="contact-checkbox" type="checkbox" value="${contact.id}"${contact.checked}>
                <span class="custom-checkbox" aria-hidden="true"></span>
            </span>
        </label>
    `;
}


/**
 * Returns one selected contact avatar.
 * @param {Object} contact - The prepared contact view data.
 * @returns {string} The selected contact HTML.
 */
function getSelectedDialogContactTemplate(contact) {
    return `<span class="dialog-contact-avatar" style="background:${contact.color};color:${contact.textColor}">${contact.initials}</span>`;
}


/**
 * Returns one subtask in the add task dialog.
 * @param {Object} subtask - The prepared subtask view data.
 * @returns {string} The subtask HTML.
 */
function getAddTaskSubtaskTemplate(subtask) {
    return `
        <li data-subtask-index="${subtask.index}">
            <span class="dialog-subtask-text">&bull; ${subtask.title}</span>
            <div class="dialog-subtask-item-actions">
                <button class="edit-dialog-subtask" type="button" tabindex="0" aria-label="Edit subtask"><img src="../assets/icons/edit.webp" alt=""></button>
                <button class="delete-dialog-subtask" type="button" tabindex="0" aria-label="Delete subtask"><img src="../assets/icons/delete.webp" alt=""></button>
            </div>
        </li>
    `;
}


/**
 * Returns a board status message.
 * @param {string} message - The message text.
 * @param {string} icon - The optional board icon HTML.
 * @returns {string} The message HTML.
 */
function getTaskAddedMessageTemplate(message, icon) {
    return `
        <div class="task-added-message" id="taskAddedMessage">
            <span>${message}</span>
            ${icon}
        </div>
    `;
}


/**
 * Returns one task card.
 * @param {Object} task - The prepared task view data.
 * @param {string} progressTemplate - The optional progress HTML.
 * @param {string} usersTemplate - The assigned users HTML.
 * @returns {string} The task card HTML.
 */
function getTaskCardTemplate(task, progressTemplate, usersTemplate) {
    return `
        <div class="task-card" draggable="true" data-task-id="${task.id}" tabindex="0" role="button"
            aria-label="Open task: ${task.title}">
            <div class="task-card-top">
                <span class="task-category ${task.categoryClass}">${task.category}</span>

                <button
                    class="mobile-move-task-btn"
                    type="button"
                    data-task-id="${task.id}"
                    data-column="${task.column}"
                    aria-label="Move task"
                    aria-haspopup="menu"
                    aria-expanded="false"
                >
                    <img src="../assets/icons/swapHoriz.webp" alt="" aria-hidden="true">
                </button>
            </div>

            <h3>${task.title}</h3>
            <p>${task.description}</p>
            ${progressTemplate}
            <div class="task-footer">
                <div class="task-users">${usersTemplate}</div>
                <img class="priority-icon" src="../assets/icons/${task.priorityIcon}" alt="${task.priority} priority">
            </div>
        </div>
    `;
}


/**
 * Returns the mobile move menu template.
 * @param {string} options - The prepared move option HTML.
 * @returns {string} The menu HTML.
 */
function getMobileMoveMenuTemplate(options) {
    return `
        <div class="mobile-move-title">Move to</div>
        ${options}
    `;
}


/**
 * Returns one mobile move option.
 * @param {string} taskId - The task id.
 * @param {string} column - The target column.
 * @param {string} label - The visible column label.
 * @returns {string} The option HTML.
 */
function getMobileMoveOptionTemplate(taskId, column, label) {
    return `
        <button class="mobile-move-option" type="button" data-task-id="${taskId}" data-column="${column}">
            <span class="mobile-move-arrow" aria-hidden="true">↕</span>
            <span>${label}</span>
        </button>
    `;
}


/**
 * Returns the subtask progress or an empty string.
 * @param {number} completed - Number of completed subtasks.
 * @param {number} total - Total number of subtasks.
 * @param {number} progress - Completed percentage.
 * @returns {string} The task progress HTML.
 */
function getTaskProgressTemplate(completed, total, progress) {
    return `
        <div class="task-progress">
            <span class="progress-bar" style="--task-progress:${progress}%"><span></span></span>
            <span>${completed}/${total} Subtasks</span>
        </div>
    `;
}


/**
 * Returns one assigned contact avatar.
 * @param {Object} contact - The prepared contact view data.
 * @returns {string} The contact avatar HTML.
 */
function getTaskUserTemplate(contact) {
    return `<span class="avatar" style="background:${contact.color};color:${contact.textColor}">${contact.initials}</span>`;
}


/**
 * Returns the number of assigned contacts hidden on the task card.
 * @param {number} count - Number of hidden contacts.
 * @returns {string} The overflow indicator HTML.
 */
function getTaskUserOverflowTemplate(count) {
    return `<span class="avatar avatar-overflow" aria-label="${count} more assigned contacts">+${count}</span>`;
}


/**
 * Returns a placeholder for one empty board column.
 * @param {string} label - The visible column label.
 * @returns {string} The placeholder HTML.
 */
function getEmptyTaskColumnTemplate(label) {
    return `<div class="task-placeholder"><span>No tasks ${label}</span></div>`;
}
