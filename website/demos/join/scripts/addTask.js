/**
 * @fileoverview Handles the Add Task page:
 * dropdowns, required field validation, subtasks, selected contacts,
 * posting a new task and showing the success toast.
 */

const assignedToInput = document.getElementById("assignedTo");
const categoryInput = document.getElementById("category");
const titleInput = document.getElementById("title");
const titleError = document.getElementById("titleError");
const dueDateInput = document.getElementById("dueDate");
const dueDateError = document.getElementById("dueDateError");
const categoryError = document.getElementById("categoryError");
const descriptionInput = document.getElementById("description");
const subtaskInput = document.getElementById("subtasks");
const subtaskWrapper = subtaskInput.closest(".subtask-input-wrapper");
const subtaskCancel = subtaskWrapper.querySelector(".subtask-cancel");
const subtaskCheck = subtaskWrapper.querySelector(".subtask-check");
const subtaskList = subtaskWrapper.parentElement.querySelector(".subtask-list");
const createTaskButton = document.querySelector(".create-task");
const taskAddedToast = document.querySelector(".task-added-toast");

initializeHorizontalDragScroll(document.querySelector(".selected-contacts"));
initializePriorityKeyboard(document.querySelector(".priority-group"));
initializeAddTaskDueDateValidation();

/**
 * Resets the assigned-to dropdown input and shows all contacts again.
 */
function resetAssignedToDropdown() {
    assignedToInput.value = "";

    assignedToInput
        .closest(".dropdown-list")
        .querySelectorAll(".dropdown-content label")
        .forEach((label) => {
            label.style.display = "";
        });

    renderSelectedContacts();
}


setupDropdownToggle(assignedToInput, resetAssignedToDropdown);
closeDropdown(assignedToInput, resetAssignedToDropdown);


/**
 * Filters contacts inside the assigned-to dropdown.
 */
assignedToInput.addEventListener("input", () => {
    const query = assignedToInput.value.toLowerCase();
    const dropdownContent = assignedToInput
        .closest(".dropdown-list")
        .querySelector(".dropdown-content");

    dropdownContent.style.display = "block";
    assignedToInput.parentElement.classList.add("open");

    dropdownContent.querySelectorAll("label").forEach((label) => {
        const name = label.querySelector("span").textContent.toLowerCase();
        label.style.display = name.startsWith(query) ? "" : "none";
    });
});


setupDropdownToggle(categoryInput);
closeDropdown(categoryInput);

const categoryDropdownContent = categoryInput
    .closest(".dropdown-list")
    .querySelector(".dropdown-content");

categoryDropdownContent.querySelectorAll("a").forEach((option) => {
    option.addEventListener("click", (event) => {
        event.preventDefault();

        categoryInput.value = option.textContent;
        categoryDropdownContent.style.display = "none";

        clearErrorWhenFilled(categoryInput, categoryError);
        updateCreateTaskButtonState();
    });
});


/**
 * Renders the selected contact avatars below the assigned-to field.
 */
function renderSelectedContacts() {
    const selectedContacts = document.querySelector(".selected-contacts");
    selectedContacts.innerHTML = "";
    const checkedBoxes = document.querySelectorAll(".contact-checkbox:checked");
    checkedBoxes.forEach((checkbox) => {
        const avatar = document.createElement("div");
        avatar.className = "contact-avatar";
        avatar.style.background = checkbox.dataset.color;
        avatar.style.color = checkbox.dataset.textColor;
        avatar.textContent = checkbox.dataset.initials;

        selectedContacts.appendChild(avatar);
    });
}


/**
 * Renders the contacts into the assigned-to dropdown.
 *
 * @param {Object} contacts - The contact data from the database.
 */
function renderAssignedToContacts(contacts) {
    const dropdownContent = assignedToInput
        .closest(".dropdown-list")
        .querySelector(".dropdown-content");
    dropdownContent.innerHTML = "";
    for (let key in contacts) {
        dropdownContent.appendChild(buildContactRow(key, contacts[key]));
    }
}


fetch(getScopedDatabaseUrl("contacts"))
    .then((response) => {
        ensureSuccessfulResponse(response, "Contacts could not be loaded.");
        return response.json();
    })
    .then((contacts) => renderAssignedToContacts(contacts));


/**
 * Shows an error message for an input field.
 *
 * @param {HTMLElement} input - The input that should receive the error style.
 * @param {HTMLElement} errorEl - The error element that should show the message.
 */
function showError(input, errorEl) {
    input.classList.add("input-error");
    errorEl.textContent = "This field is required";
}


/**
 * Clears the error message and error style from an input field.
 *
 * @param {HTMLElement} input - The input that should lose the error style.
 * @param {HTMLElement} errorEl - The error element that should be cleared.
 */
function clearError(input, errorEl) {
    input.classList.remove("input-error");
    errorEl.textContent = "";
}


/**
 * Keeps the Create Task button clickable so validation can run on submit.
 */
function updateCreateTaskButtonState() {
    createTaskButton.disabled = false;
}


/**
 * Validates one required field and updates its error message.
 *
 * @param {HTMLInputElement} input - The required input.
 * @param {HTMLElement} errorEl - The matching error element.
 * @returns {boolean} True if the field is filled.
 */
function validateRequiredField(input, errorEl) {
    if (input.value.trim()) {
        clearError(input, errorEl);
        return true;
    }

    showError(input, errorEl);
    return false;
}


/**
 * Validates all required Add Task fields.
 *
 * @returns {HTMLInputElement|null} The first invalid input or null.
 */
function validateRequiredFields() {
    let firstInvalidInput = null;

    if (!validateRequiredField(titleInput, titleError)) {
        firstInvalidInput = titleInput;
    }

    if (!validateDueDateField() && !firstInvalidInput) {
        firstInvalidInput = dueDateInput;
    }

    if (!validateRequiredField(categoryInput, categoryError) && !firstInvalidInput) {
        firstInvalidInput = categoryInput;
    }

    return firstInvalidInput;
}


/**
 * Clears an error as soon as the matching field contains text.
 *
 * @param {HTMLInputElement} input - The input to check.
 * @param {HTMLElement} errorEl - The matching error element.
 */
function clearErrorWhenFilled(input, errorEl) {
    if (input.value.trim()) {
        clearError(input, errorEl);
    }
}


titleInput.addEventListener("input", () => {
    clearErrorWhenFilled(titleInput, titleError);
});


dueDateInput.addEventListener("focus", () => {
    dueDateInput.type = "date";
});


dueDateInput.addEventListener("blur", () => {
    if (!dueDateInput.value) {
        dueDateInput.type = "text";
    }
});


categoryInput.addEventListener("input", () => {
    clearErrorWhenFilled(categoryInput, categoryError);
});


categoryInput.addEventListener("change", () => {
    clearErrorWhenFilled(categoryInput, categoryError);
});


subtaskInput.addEventListener("input", () => {
    const hasContent = subtaskInput.value.trim() !== "";
    subtaskWrapper.classList.toggle("is-writing", hasContent);
    subtaskCancel.disabled = !hasContent;
    subtaskCheck.disabled = !hasContent;
});


subtaskCancel.addEventListener("click", () => {
    resetSubtaskInput();
    subtaskInput.focus();
});


/**
 * Adds a new subtask to the subtask list.
 */
function addSubtask() {
    const subtaskText = subtaskInput.value.trim();

    if (!subtaskText) return;

    const listItem = document.createElement("li");
    const row = document.createElement("div");
    row.className = "subtask-row";
    row.append(buildSubtaskTextGroup(subtaskText), buildSubtaskActions());
    listItem.append(row);
    subtaskList.appendChild(listItem);
    resetSubtaskInput();
    subtaskInput.focus();
}


subtaskCheck.addEventListener("click", addSubtask);
subtaskInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        addSubtask();
    }
});


subtaskList.addEventListener("dblclick", (event) => {
    if (event.target.closest(".subtask-edit-input")) return;

    const listItem = event.target.closest("li");

    if (!listItem) return;
    editSubtask(listItem);
});


subtaskList.addEventListener("mousedown", (event) => {
    if (event.target.closest(".subtask-item-actions")) {
        event.preventDefault();
    }
});


subtaskList.addEventListener("click", handleSubtaskListClick);


/**
 * Runs the selected action for a subtask list item.
 * @param {MouseEvent} event - The delegated click event.
 */
function handleSubtaskListClick(event) {
    const listItem = event.target.closest("li");
    if (!listItem) return;
    if (event.target.closest(".subtask-edit")) return editSubtask(listItem);
    if (event.target.closest(".subtask-delete")) return deleteSubtaskListItem(listItem);
    if (event.target.closest(".subtask-save-edit")) saveSubtaskListItem(listItem);
}


/**
 * Removes one subtask and restores a nearby action focus.
 * @param {HTMLElement} listItem - The subtask list item to remove.
 */
function deleteSubtaskListItem(listItem) {
    const itemIndex = Array.from(subtaskList.children).indexOf(listItem);
    listItem.remove();
    focusSubtaskAction(itemIndex, ".subtask-delete");
}


/**
 * Saves one edited subtask and restores its edit action focus.
 * @param {HTMLElement} listItem - The edited subtask list item.
 */
function saveSubtaskListItem(listItem) {
    listItem._saveEdit();
    listItem.querySelector(".subtask-edit")?.focus();
}


updateCreateTaskButtonState();
createTaskButton.addEventListener("click", handleCreateTask);


/**
 * Validates and creates a new task.
 * @param {MouseEvent} event - The create button click event.
 */
async function handleCreateTask(event) {
    event.preventDefault();
    const firstInvalidInput = validateRequiredFields();
    if (firstInvalidInput) {
        firstInvalidInput.focus();
        return;
    }
    await saveNewTask();
}


/** Saves a new task and updates the page state. */
async function saveNewTask() {
    createTaskButton.disabled = true;
    try {
        await postNewTask(getTaskFormData());
        clearForm();
        showTaskAddedToast();
    } catch (error) {
        showTaskSaveError();
        createTaskButton.disabled = false;
    }
}


/** Shows a user-facing message if a task could not be saved. */
function showTaskSaveError() {
    taskAddedToast.textContent = "Task could not be saved. Please try again.";
    taskAddedToast.classList.add("show");
    setTimeout(() => taskAddedToast.classList.remove("show"), 2500);
}
