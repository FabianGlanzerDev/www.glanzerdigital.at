/**
 * @fileoverview Helper functions for the Add Task page: dropdown toggling, contact/subtask DOM builders, and form validation.
 */

/**
 * Toggles the dropdown open/closed for the given wrapper element.
 * @param {HTMLElement} element - The dropdown's wrapper element (e.g. .input-wrapper).
 * @param {Function} [onClose] - Optional callback function to execute when the dropdown is closed.
 */
function dropdownToggle(element, onClose) {
    const dropdown = element.parentElement.querySelector('.dropdown-content');
    const isOpen = element.classList.contains('open') || dropdown.style.display === 'block';
    dropdown.style.display = isOpen ? 'none' : 'block';
    element.classList.toggle('open', !isOpen);
    element.querySelector('input').setAttribute('aria-expanded', String(!isOpen));
    if (isOpen && onClose) onClose();
}


/**
 * Opens the dropdown for the given wrapper element without closing it if already open.
 * Used for the input click so typing a filter query isn't interrupted by re-clicking the field.
 * @param {HTMLElement} element - The dropdown's wrapper element (e.g. .input-wrapper).
 */
function dropdownOpen(element) {
    const dropdown = element.parentElement.querySelector('.dropdown-content');
    if (dropdown.style.display === 'block') return;
    dropdown.style.display = 'block';
    element.classList.add('open');
    element.querySelector('input').setAttribute('aria-expanded', 'true');
}


/**
 * Closes the dropdown when clicking outside of it.
 * @param {HTMLElement} input - The input element associated with the dropdown.
 * @param {Function} [onClose] - Optional callback function to execute when the dropdown is closed.
 */
function closeDropdown(input, onClose) {
    document.addEventListener('click', (event) => {
        const dropdownList = input.closest('.dropdown-list');
        if (!dropdownList.contains(event.target)) {
            dropdownList.querySelector('.dropdown-content').style.display = 'none';
            dropdownList.querySelector('.input-wrapper').classList.remove('open');
            input.setAttribute('aria-expanded', 'false');
            if (onClose) onClose();
        }
    });
}


/**
 * Sets up the dropdown toggle functionality for the specified input element.
 * @param {HTMLElement} input - The input element associated with the dropdown.
 * @param {Function} [onClose] - Optional callback function to execute when the dropdown is closed.
 */
function setupDropdownToggle(input, onClose) {
    const wrapper = input.parentElement;
    const dropdownList = input.closest('.dropdown-list');
    const arrow = wrapper.querySelector('.input-icon');
    const open = () => dropdownOpen(wrapper);
    const toggle = () => dropdownToggle(wrapper, onClose);
    const close = () => closeOneAddTaskDropdown(input, onClose);
    trackDropdownPointerDown(dropdownList);
    initializeKeyboardDropdown(input, toggle, close);
    initializeContactDropdownKeys(dropdownList, close);
    input.addEventListener('click', open);
    connectAddTaskDropdownArrow(arrow, toggle);
    dropdownList.addEventListener('focusout', () => closeDropdownAfterFocusLeaves(dropdownList, close));
}


/** Connects the standalone dropdown arrow with its toggle. */
function connectAddTaskDropdownArrow(arrow, toggle) {
    arrow.addEventListener('click', (event) => {
        event.stopPropagation();
        toggle();
    });
}


/** Closes one dropdown on the standalone Add Task page. */
function closeOneAddTaskDropdown(input, onClose) {
    const dropdownList = input.closest('.dropdown-list');
    const dropdown = dropdownList.querySelector('.dropdown-content');
    if (dropdown.style.display !== 'block') return;
    dropdown.style.display = 'none';
    dropdownList.querySelector('.input-wrapper').classList.remove('open');
    input.setAttribute('aria-expanded', 'false');
    if (onClose) onClose();
}


/**
 * Builds a contact row element for the dropdown list.
 * @param {string} key - The unique identifier for the contact.
 * @param {Object} contact - The contact object containing name and color information.
 * @returns {HTMLElement} The constructed contact row element.
 */
function buildContactRow(key, contact) {
    const contactColor = getUserColor(contact.color);
    const contactView = {
        key: escapeHtml(key),
        name: escapeHtml(contact.name),
        displayName: escapeHtml(getContactDisplayName(contact)),
        initials: escapeHtml(getUserInitials(contact.name)),
        color: escapeHtml(contactColor),
        textColor: escapeHtml(getUserTextColor(contactColor))
    };
    const row = document.createElement('label');
    row.innerHTML = getAddTaskContactRowTemplate(contactView);
    return row;
}


/**
 * Builds a subtask text group element with a bullet point and the provided text.
 * @param {string} text - The text for the subtask.
 * @returns {HTMLElement} The constructed subtask text group element.
 */
function buildSubtaskTextGroup(text) {
    const textGroup = document.createElement('div');
    textGroup.className = 'subtask-text-group';
    const bullet = document.createElement('span');
    bullet.className = 'subtask-bullet';
    bullet.textContent = '•';
    const textSpan = document.createElement('span');
    textSpan.className = 'subtaskText';
    textSpan.textContent = text;
    textGroup.append(bullet, textSpan);
    return textGroup;
}


/**
 * Builds a subtask actions element with edit and delete icons.
 * @returns {HTMLElement} The constructed subtask actions element.
 */
function buildSubtaskActions() {
    const actions = document.createElement('div');
    actions.className = 'subtask-item-actions';
    actions.innerHTML = `
        <button class="subtask-edit" type="button" tabindex="0" aria-label="Edit subtask">
            <img src="../assets/icons/edit.webp" alt="">
        </button>
        <button class="subtask-delete" type="button" tabindex="0" aria-label="Delete subtask">
            <img src="../assets/icons/delete.webp" alt="">
        </button>
    `;
    return actions;
}


/**
 * Changes the edit icon to a save icon when entering edit mode for a subtask.
 * @param {HTMLElement} editIcon - The edit icon element to change.
 */
function enterSubtaskEditIcon(editIcon) {
    editIcon.querySelector('img').src = '../assets/icons/check.webp';
    editIcon.setAttribute('aria-label', 'Save subtask');
    editIcon.classList.replace('subtask-edit', 'subtask-save-edit');
    editIcon.parentElement.append(editIcon);
}


/**
 * Changes the save icon back to an edit icon when exiting edit mode for a subtask.
 * @param {HTMLElement} editIcon - The edit icon element to change.
 */
function exitSubtaskEditIcon(editIcon) {
    editIcon.querySelector('img').src = '../assets/icons/edit.webp';
    editIcon.setAttribute('aria-label', 'Edit subtask');
    editIcon.classList.replace('subtask-save-edit', 'subtask-edit');
    editIcon.parentElement.prepend(editIcon);
}


/**
 * Creates an input element for editing a subtask with the current text.
 * @param {string} currentText - The current text of the subtask to edit.
 * @returns {HTMLElement} The constructed input element for editing the subtask.
 */
function createSubtaskEditInput(currentText) {
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'subtask-edit-input';
    editInput.value = currentText;
    return editInput;
}


/**
 * Finalizes the editing of a subtask, replacing the input with the new text and updating the UI.
 * @param {HTMLElement} listItem - The list item element containing the subtask.
 * @param {HTMLElement} editIcon - The edit icon element to revert back to.
 * @param {HTMLElement} editInput - The input element used for editing the subtask.
 * @param {string} currentText - The original text of the subtask before editing.
 * @param {string} newText - The new text entered by the user for the subtask.
 */
function finishSubtaskEdit(listItem, editIcon, editInput, currentText, newText) {
    const newSpan = document.createElement('span');
    newSpan.className = 'subtaskText';
    newSpan.textContent = newText || currentText;
    editInput.replaceWith(newSpan);
    listItem.classList.remove('is-editing');
    exitSubtaskEditIcon(editIcon);
}


/**
 * Wires the necessary events for editing a subtask, including blur and keydown events.
 * @param {HTMLElement} editInput - The input element used for editing the subtask.
 * @param {Function} onDone - The callback function to execute when editing is done.
 */
function wireSubtaskEditEvents(editInput, onDone) {
    editInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            onDone(editInput.value.trim());
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            onDone('');
        }
    });
}


/**
 * Starts editing one subtask.
 * @param {HTMLElement} listItem - The subtask list item.
 */
function editSubtask(listItem) {
    const textSpan = listItem.querySelector('.subtaskText');
    if (!textSpan) return;
    const currentText = textSpan.textContent;
    const editIcon = listItem.querySelector('.subtask-edit');
    const editInput = prepareSubtaskEdit(listItem, textSpan, editIcon, currentText);
    wireActiveSubtaskEdit(listItem, editIcon, editInput, currentText);
}


/**
 * Creates and displays the active subtask edit field.
 * @param {HTMLElement} listItem - The subtask list item.
 * @param {HTMLElement} textSpan - The current subtask text.
 * @param {HTMLElement} editIcon - The edit action.
 * @param {string} currentText - The current title.
 * @returns {HTMLInputElement} The edit field.
 */
function prepareSubtaskEdit(listItem, textSpan, editIcon, currentText) {
    const editInput = createSubtaskEditInput(currentText);
    listItem.classList.add('is-editing');
    enterSubtaskEditIcon(editIcon);
    textSpan.replaceWith(editInput);
    editInput.focus();
    editInput.select();
    return editInput;
}


/**
 * Connects save and availability handling for an active edit.
 * @param {HTMLElement} listItem - The subtask list item.
 * @param {HTMLElement} editIcon - The save action.
 * @param {HTMLInputElement} editInput - The edit field.
 * @param {string} currentText - The original title.
 */
function wireActiveSubtaskEdit(listItem, editIcon, editInput, currentText) {
    const stop = (text) => finishSubtaskEdit(listItem, editIcon, editInput, currentText, text);
    wireSubtaskEditEvents(editInput, stop);
    listItem._saveEdit = () => stop(editInput.value.trim());
    editInput.addEventListener('input', () => {
        editIcon.disabled = editInput.value.trim() === '';
    });
}


/**
 * Restores focus close to the action whose subtask was removed.
 * @param {number} itemIndex - The former position of the removed subtask.
 * @param {string} selector - The action that should regain focus.
 */
function focusSubtaskAction(itemIndex, selector) {
    const items = subtaskList.querySelectorAll("li");
    if (!items.length) return subtaskInput.focus();
    const targetIndex = Math.min(itemIndex, items.length - 1);
    items[targetIndex].querySelector(selector)?.focus();
}


/**
 * Shows the success toast and redirects to the board.
 */
function showTaskAddedToast() {
    taskAddedToast.classList.add("show");

    setTimeout(() => {
        window.location.href = "board.html";
    }, 2000);
}


/**
 * Clears the task form and resets all dynamic UI elements.
 */
function clearForm() {
    clearTaskInputs();
    clearTaskErrors();
    resetTaskSelections();
    subtaskList.innerHTML = "";
    updateCreateTaskButtonState();
}


/**
 * Clears all basic task input values.
 */
function clearTaskInputs() {
    titleInput.value = "";
    descriptionInput.value = "";
    dueDateInput.value = "";
    dueDateInput.type = "text";
    assignedToInput.value = "";
    categoryInput.value = "";
    resetSubtaskInput();
}


/** Resets the subtask input and removes its actions from the tab order. */
function resetSubtaskInput() {
    subtaskInput.value = "";
    subtaskWrapper.classList.remove("is-writing");
    subtaskCancel.disabled = true;
    subtaskCheck.disabled = true;
}


/**
 * Clears all required-field error messages.
 */
function clearTaskErrors() {
    clearError(titleInput, titleError);
    clearError(dueDateInput, dueDateError);
    clearError(categoryInput, categoryError);
}


/**
 * Resets assigned contacts and the selected priority.
 */
function resetTaskSelections() {
    document.querySelectorAll(".contact-checkbox:checked").forEach((checkbox) => {
        checkbox.checked = false;
    });
    renderSelectedContacts();
    document.getElementById("medium").checked = true;
    updatePriorityAriaState(document.querySelector(".priority-group"));
}
