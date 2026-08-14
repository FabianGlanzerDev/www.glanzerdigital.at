let draggedTaskId = null
let currentDropZone = null
let dropIndicatorElement = null


/**
 * Sets up the drag and drop events for the board.
 */
function setupBoardDragAndDrop() {
    const boardColumnsElement = document.querySelector('.board-columns')

    if (!boardColumnsElement) {
        return;
    }

    boardColumnsElement.addEventListener("dragstart", handleDragStart)
    boardColumnsElement.addEventListener("dragover", handleDragOver)
    boardColumnsElement.addEventListener("drop", handleDrop)
    boardColumnsElement.addEventListener("dragend", handleDragEnd)
}


/**
 * Handles the drag start event for a task card.
 * @param {DragEvent} event - The drag event.
 */
function handleDragStart(event) {
    const taskCard = event.target.closest('.task-card');

    if (taskCard) {
        draggedTaskId = taskCard.dataset.taskId;
        taskCard.classList.add('dragging');
    }
}


/**
 * Handles the drag end event for a task card.
 * @param {DragEvent} event - The drag event.
 */
function handleDragEnd(event) {
    const taskCard = event.target.closest(".task-card");
    if (taskCard) taskCard.classList.remove("dragging");
    finishTaskDrag();
}


/** Clears all temporary state created while dragging a task. */
function finishTaskDrag() {
    clearCurrentDropZone();
    removeDropIndicator();
    draggedTaskId = null;
}


/** Removes the visual state from the current task drop zone. */
function clearCurrentDropZone() {
    if (!currentDropZone) return;
    currentDropZone.classList.remove("drag-over");
    currentDropZone = null;
}


/**
 * Gets all task cards in a list, excluding the one currently being dragged.
 * @param {HTMLElement} taskList - The task list element.
 * @returns {Array<HTMLElement>} The task cards.
 */
function getCardsInList(taskList) {
    return [...taskList.querySelectorAll('.task-card:not(.dragging)')];
}


/**
 * Finds the card the dragged task should be inserted before.
 * Task lists lay out as a column (>=1440px) or a horizontally scrolling row (<1440px),
 * so the cursor is compared against the axis that is actually stacking the cards.
 * @param {HTMLElement} taskList - The task list element.
 * @param {number} clientX - The horizontal cursor position.
 * @param {number} clientY - The vertical cursor position.
 * @returns {HTMLElement|null} The card to insert before, or null to insert at the end.
 */
function getDropTargetCard(taskList, clientX, clientY) {
    const isRow = getComputedStyle(taskList).flexDirection === 'row';

    return getCardsInList(taskList).find((card) => {
        const rect = card.getBoundingClientRect();

        return isRow
            ? clientX < rect.left + rect.width / 2
            : clientY < rect.top + rect.height / 2;
    }) || null;
}


/**
 * Gets the index of a card within a task list's cards, excluding the dragged one.
 * @param {HTMLElement} taskList - The task list element.
 * @param {HTMLElement|null} targetCard - The card to find, or null for the end.
 * @returns {number} The insertion index.
 */
function getDropIndex(taskList, targetCard) {
    const cards = getCardsInList(taskList);

    return targetCard ? cards.indexOf(targetCard) : cards.length;
}


/**
 * Gets the reusable drop-indicator placeholder element.
 * @returns {HTMLElement} The drop-indicator element.
 */
function getOrCreateDropIndicator() {
    if (!dropIndicatorElement) {
        dropIndicatorElement = document.createElement("div");
        dropIndicatorElement.className = "drop-indicator";
    }

    return dropIndicatorElement;
}


/**
 * Removes the drop-indicator placeholder from the DOM.
 */
function removeDropIndicator() {
    if (dropIndicatorElement && dropIndicatorElement.parentElement) {
        dropIndicatorElement.remove();
    }
}


/**
 * Updates the drop position while a task is being dragged.
 * @param {DragEvent} event - The dragover event.
 */
function handleDragOver(event) {
    event.preventDefault();
    const taskList = event.target.closest('.task-list');
    updateCurrentDropZone(taskList);
    if (!taskList) {
        removeDropIndicator();
        return;
    }
    positionDropIndicator(taskList, event.clientX, event.clientY);
}


/**
 * Updates the highlighted task drop zone.
 * @param {HTMLElement|null} taskList - The task list below the pointer.
 */
function updateCurrentDropZone(taskList) {
    if (taskList === currentDropZone) return;
    clearCurrentDropZone();
    if (taskList) taskList.classList.add("drag-over");
    currentDropZone = taskList;
}


/**
 * Positions the drop indicator at the current pointer location.
 * @param {HTMLElement} taskList - The active task list.
 * @param {number} clientX - The horizontal pointer position.
 * @param {number} clientY - The vertical pointer position.
 */
function positionDropIndicator(taskList, clientX, clientY) {
    const targetCard = getDropTargetCard(taskList, clientX, clientY);
    taskList.insertBefore(getOrCreateDropIndicator(), targetCard);
}


/**
 * Moves a dragged task to its selected drop location.
 * @param {DragEvent} event - The drop event.
 */
function handleDrop(event) {
    const taskList = event.target.closest('.task-list');
    if (!taskList || !draggedTaskId) return;
    moveDroppedTask(taskList, event.clientX, event.clientY);
    finishTaskDrag();
}


/**
 * Moves the dragged task to its drop position.
 * @param {HTMLElement} taskList - The target task list.
 * @param {number} clientX - The horizontal drop position.
 * @param {number} clientY - The vertical drop position.
 */
function moveDroppedTask(taskList, clientX, clientY) {
    const column = Object.keys(boardColumns).find((key) => boardColumns[key].elementId === taskList.id);
    if (!column) return;
    const targetCard = getDropTargetCard(taskList, clientX, clientY);
    moveTaskToPosition(draggedTaskId, column, getDropIndex(taskList, targetCard));
}


/**
 * Sets up the mobile task move events.
 */
function setupMobileTaskMoveEvents() {
    const boardColumnsElement = document.querySelector(".board-columns");

    if (!boardColumnsElement) {
        return;
    }

    boardColumnsElement.addEventListener("click", handleMobileTaskMoveClick);
    document.addEventListener("click", closeMobileMoveMenu);
}


/**
 * Handles clicks for the mobile task move menu.
 * @param {MouseEvent} event - The click event.
 */
function handleMobileTaskMoveClick(event) {
    const moveOption = event.target.closest(".mobile-move-option");
    const moveButton = event.target.closest(".mobile-move-task-btn");

    if (moveOption) {
        return handleMobileMoveOptionClick(event, moveOption);
    }

    if (moveButton) {
        return handleMobileMoveButtonClick(event, moveButton);
    }
}


/**
 * Handles the mobile move button click.
 * @param {MouseEvent} event - The click event.
 * @param {HTMLElement} moveButton - The clicked move button.
 */
function handleMobileMoveButtonClick(event, moveButton) {
    event.stopImmediatePropagation();

    toggleMobileMoveMenu(moveButton);
}


/**
 * Handles the mobile move option click.
 * @param {MouseEvent} event - The click event.
 * @param {HTMLElement} moveOption - The clicked move option.
 */
function handleMobileMoveOptionClick(event, moveOption) {
    event.stopImmediatePropagation();

    moveTaskMobile(moveOption.dataset.taskId, moveOption.dataset.column);
}


/**
 * Toggles the mobile move menu on a task card.
 * @param {HTMLElement} moveButton - The clicked move button.
 */
function toggleMobileMoveMenu(moveButton) {
    const taskCard = moveButton.closest(".task-card");
    const isOpen = taskCard.querySelector(".mobile-move-menu");
    const taskId = moveButton.dataset.taskId;
    const currentColumn = moveButton.dataset.column;

    closeMobileMoveMenu();

    if (!isOpen) {
        taskCard.appendChild(createMobileMoveMenu(taskId, currentColumn));
    }
}


/**
 * Creates the mobile move menu.
 * @param {string} taskId - The task id.
 * @param {string} currentColumn - The current task column.
 * @returns {HTMLElement} The created menu element.
 */
function createMobileMoveMenu(taskId, currentColumn) {
    const menu = document.createElement("div");
    const options = Object.entries(boardColumns)
        .filter(([column]) => column !== currentColumn)
        .map(([column, data]) => getMobileMoveOptionTemplate(taskId, column, data.label))
        .join("");

    menu.className = "mobile-move-menu";
    menu.innerHTML = getMobileMoveMenuTemplate(options);

    return menu;
}


/**
 * Moves a task to another column and appends it to the end (used by the mobile move menu).
 * @param {string} taskId - The task id.
 * @param {string} column - The new column.
 */
async function moveTaskMobile(taskId, column) {
    if (!boardColumns[column]) {
        return;
    }

    const endIndex = getSortedColumnTasks(column).filter((task) => task.id !== taskId).length;

    await moveTaskToPosition(taskId, column, endIndex);
}


/**
 * Moves a task to a specific position within a column, shifting the other tasks.
 * @param {string} taskId - The task id.
 * @param {string} targetColumn - The target column.
 * @param {number} targetIndex - The insertion index within the target column.
 */
async function moveTaskToPosition(taskId, targetColumn, targetIndex) {
    if (!boardColumns[targetColumn]) return;
    const task = boardTasks.find((task) => task.id === taskId);
    if (!task) return;
    task.column = targetColumn;
    const targetTasks = getReorderedColumnTasks(task, targetColumn, targetIndex);
    await persistColumnOrder(targetColumn, targetTasks, taskId);
    renderBoardTasks(boardTasks, boardContacts);
    showBoardStatusMessage(`Task moved to ${boardColumns[targetColumn].label}.`);
}


/**
 * Inserts a task at its new position and refreshes all order values.
 * @param {Object} task - The moved task.
 * @param {string} column - The target column.
 * @param {number} targetIndex - The target position.
 * @returns {Array<Object>} The reordered column tasks.
 */
function getReorderedColumnTasks(task, column, targetIndex) {
    const tasks = getSortedColumnTasks(column).filter((entry) => entry.id !== task.id);
    tasks.splice(targetIndex, 0, task);
    tasks.forEach((entry, index) => { entry.order = index; });
    return tasks;
}


/**
 * Gets the tasks of one column, sorted by their order.
 * @param {string} column - The column.
 * @returns {Array} The sorted column tasks.
 */
function getSortedColumnTasks(column) {
    return boardTasks
        .filter((task) => task.column === column)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}


/**
 * Persists the order of a column's tasks and the moved task's column in one request.
 * @param {string} column - The target column.
 * @param {Array} tasks - The target column tasks in their new order.
 * @param {string} movedTaskId - The id of the moved task.
 */
async function persistColumnOrder(column, tasks, movedTaskId) {
    const updates = {};

    tasks.forEach((task) => { updates[`${task.id}/order`] = task.order; });
    updates[`${movedTaskId}/column`] = column;

    const response = await fetch(getTasksUrl(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
    });
    ensureSuccessfulResponse(response, "Task position could not be saved.");
}


/**
 * Closes the open mobile move menu.
 */
function closeMobileMoveMenu() {
    const openMenu = document.querySelector(".mobile-move-menu");

    if (openMenu) {
        openMenu.remove();
    }
}


setupBoardDragAndDrop();
setupMobileTaskMoveEvents();
