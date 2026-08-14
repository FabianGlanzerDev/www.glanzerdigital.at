const boardColumns = {
    todo: { elementId: "toDoTasks", label: "To do" },
    inprogress: { elementId: "inProgressTasks", label: "In progress" },
    awaitfeedback: { elementId: "awaitFeedbackTasks", label: "Await feedback" },
    done: { elementId: "doneTasks", label: "Done" }
};

let boardTasks = [];
let boardContacts = {};

/**
 * Starts the task search.
 */
function initializeTaskSearch() {
    const searchInput = document.getElementById("taskSearch");

    searchInput.addEventListener("input", filterTasks);
}


/**
 * Filters tasks by title and description.
 */
function filterTasks() {
    const searchText = document.getElementById("taskSearch").value.toLowerCase();
    const filteredTasks = boardTasks.filter((task) => {
        const title = (task.title || "").toLowerCase();
        const description = (task.description || "").toLowerCase();

        return title.includes(searchText) || description.includes(searchText);
    });

    renderBoardTasks(filteredTasks, boardContacts);
}


/**
 * Loads and renders all board data.
 */
async function initializeBoard() {
    try {
        boardTasks = await getTasks();
        boardContacts = await getBoardContacts();
        renderBoardTasks(boardTasks, boardContacts);
        initializeBoardCardDragScroll();
    } catch (error) {
        showBoardStatusMessage("Board data could not be loaded.");
        renderBoardTasks([], {});
        initializeBoardCardDragScroll();
    }
}


/**
 * Enables mouse dragging for horizontally arranged task-card rows.
 */
function initializeBoardCardDragScroll() {
    document.querySelectorAll(".task-list").forEach(initializeHorizontalDragScroll);
}


/**
 * Loads the contacts for the active board.
 * @returns {Promise<Object>} The contacts.
 */
async function getBoardContacts() {
    const response = await fetch(getScopedDatabaseUrl("contacts"));
    ensureSuccessfulResponse(response, "Contacts could not be loaded.");

    return await response.json() || {};
}


/**
 * Renders all task columns.
 * @param {Array} tasks - The board tasks.
 * @param {Object} contacts - The board contacts.
 */
function renderBoardTasks(tasks, contacts) {
    Object.entries(boardColumns).forEach(([name, column]) => {
        const element = document.getElementById(column.elementId);
        const columnTasks = tasks
            .filter((task) => task.column === name)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        element.innerHTML = getBoardColumnContent(columnTasks, contacts, column.label);
    });
}


/**
 * Gets the content of one task column.
 * @param {Array} tasks - The column tasks.
 * @param {Object} contacts - The board contacts.
 * @param {string} label - The column label.
 * @returns {string} The column HTML.
 */
function getBoardColumnContent(tasks, contacts, label) {
    if (!tasks.length) {
        return getEmptyTaskColumnTemplate(label);
    }

    return tasks.map((task) => renderTaskCard(task, contacts)).join("");
}


/**
 * Renders one task card.
 * @param {Object} task - The task data.
 * @param {Object} contacts - The board contacts.
 * @returns {string} The task card HTML.
 */
function renderTaskCard(task, contacts) {
    const taskView = getTaskViewData(task);
    const progress = getTaskProgress(task.subtasks);
    const users = getTaskUsers(task.assignedTo, contacts);

    return getTaskCardTemplate(taskView, progress, users);
}


/**
 * Prepares one task for its template.
 * @param {Object} task - The task data.
 * @returns {Object} The task view data.
 */
function getTaskViewData(task) {
    const priority = getTaskPriority(task.priority);

    return {
        id: escapeBoardHtml(task.id),
        column: escapeBoardHtml(task.column),
        title: escapeBoardHtml(task.title),
        description: escapeBoardHtml(task.description || ""),
        category: escapeBoardHtml(task.category),
        categoryClass: getTaskCategoryClass(task.category),
        priority,
        priorityIcon: `${priority}Priority.webp`
    };
}


/**
 * Gets a valid task priority.
 * @param {string} priority - The saved priority.
 * @returns {string} The valid priority.
 */
function getTaskPriority(priority) {
    const priorities = ["urgent", "medium", "low"];

    return priorities.includes(priority) ? priority : "medium";
}


/**
 * Gets the task category class.
 * @param {string} category - The task category.
 * @returns {string} The category class.
 */
function getTaskCategoryClass(category) {
    return category === "User Story" ? "user-story" : "technical-task";
}


/**
 * Creates the subtask progress HTML.
 * @param {Object} subtasks - The task subtasks.
 * @returns {string} The progress HTML.
 */
function getTaskProgress(subtasks) {
    const list = Object.values(subtasks || {});

    if (!list.length) {
        return "";
    }

    const completed = list.filter((subtask) => subtask.completed).length;
    const progress = Math.round((completed / list.length) * 100);

    return getTaskProgressTemplate(completed, list.length, progress);
}


/**
 * Creates all assigned contact avatars.
 * @param {Array} assignments - The assignments.
 * @param {Object} contacts - The contacts.
 * @returns {string} The avatar HTML.
 */
function getTaskUsers(assignments = [], contacts = {}) {
    const assignedContacts = assignments.map((item) => contacts[item.id]).filter(Boolean);
    const visibleContacts = assignedContacts.slice(0, 5);
    const remainingContacts = assignedContacts.length - visibleContacts.length;
    const avatars = visibleContacts.map((contact) => getTaskUser(contact)).join("");

    return avatars + (remainingContacts ? getTaskUserOverflowTemplate(remainingContacts) : "");
}


/**
 * Creates one assigned contact avatar.
 * @param {Object} contact - The assigned contact.
 * @returns {string} The avatar HTML.
 */
function getTaskUser(contact) {
    if (!contact) {
        return "";
    }

    const color = getUserColor(contact.color);
    const contactView = {
        color: escapeBoardHtml(color),
        textColor: escapeBoardHtml(getUserTextColor(color)),
        initials: escapeBoardHtml(getUserInitials(contact.name))
    };

    return getTaskUserTemplate(contactView);
}


/**
 * Shows a board status message for screen readers.
 * @param {string} message - The status message.
 */
function showBoardStatusMessage(message) {
    const statusMessage = document.getElementById("boardStatusMessage");

    if (!statusMessage) {
        return;
    }

    statusMessage.textContent = message;

    setTimeout(() => {
        statusMessage.textContent = "";
    }, 2000);
}


/**
 * Escapes a value for a board template.
 * @param {*} value - The value to escape.
 * @returns {string} The escaped value.
 */
function escapeBoardHtml(value) {
    return escapeHtml(value);
}


initializeTaskSearch();
initializeBoard();
