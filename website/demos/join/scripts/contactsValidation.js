/**
 * Initializes custom contact input validation.
 */
function initContactInputValidation() {
    const inputs = document.querySelectorAll("#addContactForm input");

    inputs.forEach((input) => input.addEventListener("input", handleContactInput));
}


/**
 * Sanitizes phone input and refreshes visible validation errors.
 * @param {Event} event - The input event.
 */
function handleContactInput(event) {
    if (event.target.id === "contactPhone") sanitizePhoneInput(event.target);
    if (addContactForm.classList.contains("submitted")) validateContactForm();
}


/**
 * Removes unsupported characters from a phone input.
 * @param {HTMLInputElement} phoneInput - The phone input to sanitize.
 */
function sanitizePhoneInput(phoneInput) {
    phoneInput.value = phoneInput.value.replace(/[^0-9+\s() -]/g, "");
    phoneInput.value = phoneInput.value.replace(/(?!^)\+/g, "");
}


/**
 * Validates all contact fields without browser validation.
 * @returns {boolean} True when every contact field is valid.
 */
function validateContactForm() {
    const nameValid = document.getElementById("contactName").value.trim().length > 0;
    const emailValid = validateContactEmail(document.getElementById("contactEmail").value);
    const phoneValid = validateContactPhone(document.getElementById("contactPhone").value);

    setContactFieldValidity("contactName", nameValid);
    setContactFieldValidity("contactEmail", emailValid);
    setContactFieldValidity("contactPhone", phoneValid);
    return nameValid && emailValid && phoneValid;
}


/**
 * Checks whether an email has a valid basic format.
 * @param {string} email - The email to validate.
 * @returns {boolean} True when the email format is valid.
 */
function validateContactEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}


/**
 * Checks whether a phone number has the accepted format.
 * @param {string} phone - The phone number to validate.
 * @returns {boolean} True when the phone format is valid.
 */
function validateContactPhone(phone) {
    const phonePattern = /^\+?[0-9\s() -]{6,20}$/;

    return phonePattern.test(phone.trim());
}


/**
 * Adds or removes the custom error state of one contact field.
 * @param {string} inputId - The input element id.
 * @param {boolean} isValid - Whether the input value is valid.
 */
function setContactFieldValidity(inputId, isValid) {
    document.getElementById(inputId).classList.toggle("input-error", !isValid);
}


initContactInputValidation();
