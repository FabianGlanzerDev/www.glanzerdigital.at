/**
 * Creates a new contact.
 */
async function createContact() {
    const newContact = getContactFormData();

    await postNewContact(newContact);
    addContactForm.reset();
    closeAddContactOverlay();
    await loadContacts();
    showContactToast("Contact successfully created");
}


/**
 * Gets the contact form data.
 * @returns {Object} The contact form data.
 */
function getContactFormData() {
    return {
        name: document.getElementById("contactName").value.trim(),
        email: document.getElementById("contactEmail").value.trim(),
        phone: document.getElementById("contactPhone").value.trim(),
        color: selectedContactColor || getRandomContactColor()
    };
}


/**
 * Saves a new contact.
 * @param {Object} contact - The new contact data.
 * @returns {Promise<Response>} The post request.
 */
async function postNewContact(contact) {
    const response = await fetch(getContactsUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact)
    });
    return ensureSuccessfulResponse(response, "Contact could not be created.");
}


/**
 * Saves the edited contact.
 */
async function saveContact() {
    const contact = contacts[currentContactIndex];
    if (!contact) return;
    const updatedContact = getUpdatedContactData(contact);
    await patchContact(contact.id, updatedContact);
    await updateActiveUserAfterContactEdit(contact, updatedContact);
    await loadContacts();
    currentContactIndex = getContactIndexById(contact.id);
    renderSavedContact();
    closeAddContactOverlay();
}


/**
 * Gets the updated contact data.
 * @param {Object} contact - The selected contact.
 * @returns {Object} The updated contact data.
 */
function getUpdatedContactData(contact) {
    return {
        name: document.getElementById("contactName").value.trim(),
        email: document.getElementById("contactEmail").value.trim(),
        phone: document.getElementById("contactPhone").value.trim(),
        color: selectedContactColor || contact.color || getRandomContactColor(),
        contactColor: null
    };
}


/**
 * Updates a contact in the database.
 * @param {string} contactId - The contact id.
 * @param {Object} updatedContact - The updated contact data.
 * @returns {Promise<Response>} The patch request.
 */
async function patchContact(contactId, updatedContact) {
    const response = await fetch(getContactsUrl(contactId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedContact)
    });
    return ensureSuccessfulResponse(response, "Contact could not be updated.");
}


/**
 * Gets the index of a contact by id.
 * @param {string} contactId - The contact id.
 * @returns {number} The contact index.
 */
function getContactIndexById(contactId) {
    return contacts.findIndex(function (contact) {
        return contact.id === contactId;
    });
}


/**
 * Renders the saved contact.
 */
function renderSavedContact() {
    if (currentContactIndex === -1) return;

    renderContacts();
    renderContactDetails(contacts[currentContactIndex]);
}


/**
 * Deletes the selected contact.
 */
async function deleteContact() {
    const contact = contacts[currentContactIndex];

    if (!contact) return;

    await deleteContactFromFirebase(contact.id);
    await removeContactFromAssignedTasks(contact.id);
    currentContactIndex = null;
    closeContactInterfaces();
    await loadContacts();
    renderEmptyContactDetails();
}


/**
 * Deletes a contact from the database.
 * @param {string} contactId - The contact id.
 * @returns {Promise<Response>} The delete request.
 */
async function deleteContactFromFirebase(contactId) {
    const response = await fetch(getContactsUrl(contactId), {
        method: "DELETE"
    });
    return ensureSuccessfulResponse(response, "Contact could not be deleted.");
}


/**
 * Removes a contact from assigned tasks.
 * @param {string} contactId - The contact id.
 */
async function removeContactFromAssignedTasks(contactId) {
    const tasks = await getContactTasks();
    const updates = getTaskAssignmentUpdates(tasks, contactId);

    await Promise.all(updates.map(updateTaskAssignments));
}


/**
 * Gets the task entries.
 * @returns {Promise<Array>} The task entries.
 */
async function getContactTasks() {
    const tasks = await getTasksData();

    return Object.entries(tasks);
}


/**
 * Gets updates for assigned tasks.
 * @param {Array} tasks - The task entries.
 * @param {string} contactId - The contact id.
 * @returns {Array} The task updates.
 */
function getTaskAssignmentUpdates(tasks, contactId) {
    return tasks
        .map(([taskId, task]) => getTaskAssignmentUpdate(taskId, task, contactId))
        .filter(Boolean);
}


/**
 * Gets one task assignment update.
 * @param {string} taskId - The task id.
 * @param {Object} task - The task data.
 * @param {string} contactId - The contact id.
 * @returns {Object|null} The task update or null.
 */
function getTaskAssignmentUpdate(taskId, task, contactId) {
    const assignedTo = getAssignmentsWithoutContact(task, contactId);

    if (assignedTo.length === (task.assignedTo || []).length) return null;

    return { taskId, assignedTo };
}


/**
 * Removes a contact from a task assignment list.
 * @param {Object} task - The task data.
 * @param {string} contactId - The contact id.
 * @returns {Array} The filtered assignments.
 */
function getAssignmentsWithoutContact(task, contactId) {
    return (task.assignedTo || []).filter(function (assignedUser) {
        return assignedUser.id !== contactId || assignedUser.type !== "contact";
    });
}


/**
 * Updates the assigned contacts of a task.
 * @param {Object} update - The task update data.
 * @returns {Promise<Response>} The update request.
 */
async function updateTaskAssignments(update) {
    const response = await fetch(getTasksUrl(update.taskId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: update.assignedTo })
    });
    return ensureSuccessfulResponse(response, "Task assignments could not be updated.");
}
