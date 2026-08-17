/**
 * Returns the task detail dialog.
 * @param {Object} task - Prepared task view data.
 * @returns {string} The dialog HTML.
 */
function getOpenTaskDialogTemplate(task) {
    return `
        <div class="task-dialog-backdrop" id="openTaskDialog" role="dialog" aria-modal="true" aria-labelledby="openTaskTitle" tabindex="-1">
            <section class="dialog-creator" data-task-id="${task.id}">
                <header class="open-task-header">
                    <span class="open-task-category ${task.categoryClass}">${task.category}</span>
                    <button class="open-task-close" type="button" aria-label="Close dialog">&times;</button>
                </header>
                <div class="open-task-content">
                    <h1 id="openTaskTitle">${task.title}</h1>
                    <p class="open-task-description">${task.description}</p>
                    <div class="open-task-row open-task-due-date"><span>Due date:</span><span>${task.dueDate}</span></div>
                    <div class="open-task-row"><span>Priority:</span><span class="open-task-priority">${task.priorityLabel}
                        <img src="../assets/icons/${task.priorityIcon}" alt=""></span></div>
                    <div class="open-task-section"><span>Assigned To:</span><div class="open-task-contacts">${task.contacts}</div></div>
                    <div class="open-task-section"><span>Subtasks</span><div class="open-task-subtasks">${task.subtasks}</div></div>
                </div>
                <footer class="open-task-actions">
                    <button class="open-task-delete" type="button"><img src="../assets/icons/delete.webp" alt="">Delete</button>
                    <span class="open-task-action-divider"></span>
                    <button class="open-task-edit" type="button"><img src="../assets/icons/edit.webp" alt="">Edit</button>
                </footer>
            </section>
        </div>`;
}


/**
 * Returns the assigned-contact entry for the task detail dialog.
 * @param {Object} contact - Prepared contact view data.
 * @returns {string} The assigned-contact HTML.
 */
function getOpenTaskContactTemplate(contact) {
    return `<div class="open-task-contact"><span class="dialog-contact-avatar" style="background:${contact.color};color:${contact.textColor}">${contact.initials}</span><span>${contact.name}</span></div>`;
}


/**
 * Returns one selectable subtask entry for the task detail dialog.
 * @param {Object} subtask - The subtask data.
 * @returns {string} The subtask HTML.
 */
function getOpenTaskSubtaskTemplate(subtask) {
    return `<label class="open-task-subtask"><span class="custom-checkbox-wrapper">
        <input type="checkbox" data-subtask-id="${subtask.id}" ${subtask.completed ? "checked" : ""}>
        <span class="custom-checkbox" aria-hidden="true"></span>
        </span><span>${subtask.title}</span></label>`;
}
