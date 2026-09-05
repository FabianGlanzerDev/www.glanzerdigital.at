'use strict';

const CONTACT_FORM_CONFIG = window.GlanzerContactConfig;
const contactParams = new URLSearchParams(window.location.search);
const prefillIndustry = String(contactParams.get('industry') || '').trim();
let resultPopupTimer = 0;


/** Translates runtime contact copy to the active language. */
function translateContactText(value) {
  return window.GlanzerI18n?.translate(value) || value;
}


/** Returns all contact-form DOM references. */
function getContactElements() {
  const form = document.querySelector('[data-contact-form]');
  return {
    form,
    status: document.querySelector('[data-form-status]'),
    count: document.querySelector('[data-message-count]'),
    submit: form?.querySelector('button[type="submit"]'),
    label: document.querySelector('[data-submit-label]'),
    whatsappIcon: document.querySelector('[data-submit-icon="whatsapp"]'),
    emailIcon: document.querySelector('[data-submit-icon="email"]'),
    emailField: document.querySelector('[data-email-field]'),
    emailInput: form?.elements.namedItem('email'),
    resultPopup: document.querySelector('[data-contact-result-popup]'),
    resultTitle: document.querySelector('[data-result-title]'),
    resultMessage: document.querySelector('[data-result-message]'),
    resultClose: document.querySelector('.contact-result-popup__close'),
  };
}


/** Returns one trimmed form value. */
function getFormValue(form, name) {
  return String(new FormData(form).get(name) || '').trim();
}


/** Returns the selected contact method. */
function getContactMethod(form) {
  return getFormValue(form, 'contactMethod') || 'whatsapp';
}




/** Returns all values needed to prepare the enquiry. */
function getContactData(form) {
  return {
    name: getFormValue(form, 'name'),
    projectStatus: getFormValue(form, 'projectStatus'),
    timeframe: getFormValue(form, 'timeframe'),
    message: getFormValue(form, 'message'),
    email: getFormValue(form, 'email'),
    website: getFormValue(form, 'website'),
    privacy: getFormValue(form, 'privacy'),
  };
}


/** Returns the error element for one field. */
function getErrorElement(name) {
  return document.querySelector(`[data-error-for="${name}"]`);
}


/** Returns the wrapper for one form field. */
function getFieldContainer(name) {
  return document.querySelector(`[data-field="${name}"]`);
}


/** Sets one visible validation error and its field state. */
function setFieldError(name, message) {
  const error = getErrorElement(name);
  const container = getFieldContainer(name);
  if (error) error.textContent = translateContactText(message);
  if (container) container.dataset.invalid = message ? 'true' : 'false';
}


/** Updates aria-invalid on one native control. */
function setControlState(form, name, invalid) {
  const control = form.elements.namedItem(name);
  if (!control || control instanceof RadioNodeList) return;
  control.setAttribute('aria-invalid', String(invalid));
}


/** Validates the name field. */
function validateName(value) {
  if (!value) return CONTACT_FORM_CONFIG.text.nameMissing;
  return value.length < 2 ? CONTACT_FORM_CONFIG.text.nameShort : '';
}


/** Validates an e-mail address. */
function validateEmail(value) {
  if (!value) return CONTACT_FORM_CONFIG.text.emailMissing;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : CONTACT_FORM_CONFIG.text.emailInvalid;
}


/** Validates the project-description field. */
function validateMessage(value) {
  if (!value) return CONTACT_FORM_CONFIG.text.messageMissing;
  if (value.length < 20) return CONTACT_FORM_CONFIG.text.messageShort;
  return value.length > CONTACT_FORM_CONFIG.maxMessageLength ? `Maximal ${CONTACT_FORM_CONFIG.maxMessageLength} Zeichen möglich.` : '';
}


/** Validates one required field. */
function validateField(name, value) {
  const text = CONTACT_FORM_CONFIG.text;
  if (name === 'name') return validateName(value);
  if (name === 'projectStatus') return value ? '' : text.statusMissing;
  if (name === 'timeframe') return value ? '' : text.timeframeMissing;
  if (name === 'email') return validateEmail(value);
  if (name === 'privacy') return value ? '' : text.privacyMissing;
  return name === 'message' ? validateMessage(value) : '';
}


/** Revalidates one form field and updates its UI. */
function updateFieldValidation(form, name) {
  const error = validateField(name, getFormValue(form, name));
  setFieldError(name, error);
  setControlState(form, name, Boolean(error));
  return !error;
}


/** Returns the required fields for the active delivery method. */
function getRequiredFields(form) {
  const fields = [...CONTACT_FORM_CONFIG.requiredFields];
  if (getContactMethod(form) === 'email') fields.push('email');
  return fields;
}


/** Returns whether all required fields are valid. */
function isFormValid(form) {
  return getRequiredFields(form).every((name) => {
    return !validateField(name, getFormValue(form, name));
  });
}


/** Enables or disables the submit button. */
function updateSubmitState(elements) {
  if (!(elements.submit instanceof HTMLButtonElement)) return;
  const valid = isFormValid(elements.form);
  elements.submit.disabled = !valid;
  elements.submit.setAttribute('aria-disabled', String(!valid));
}


/** Validates all required fields at submit time. */
function validateForm(form) {
  return getRequiredFields(form).map((name) => {
    return updateFieldValidation(form, name);
  }).every(Boolean);
}


/** Updates the visible message character counter. */
function updateMessageCounter(elements) {
  const message = getFormValue(elements.form, 'message');
  if (elements.count) elements.count.textContent = String(message.length);
}


/** Shows a status message below the form. */
function showStatus(elements, message, state = '') {
  if (!elements.status) return;
  elements.status.textContent = translateContactText(message);
  elements.status.dataset.state = state;
}


/** Hides the e-mail result popup and restores focus. */
function closeResultPopup(elements) {
  if (!elements.resultPopup) return;
  window.clearTimeout(resultPopupTimer);
  elements.resultPopup.hidden = true;
  delete elements.resultPopup.dataset.state;
  if (elements.submit instanceof HTMLButtonElement) elements.submit.focus();
}


/** Shows a success or error popup for direct e-mail delivery. */
function showResultPopup(elements, message, state) {
  if (!elements.resultPopup) return showStatus(elements, message, state);
  window.clearTimeout(resultPopupTimer);
  elements.resultPopup.dataset.state = state;
  if (elements.resultTitle) {
    const title = state === 'success' ? 'Anfrage erfolgreich gesendet' : 'Anfrage konnte nicht gesendet werden';
    elements.resultTitle.textContent = translateContactText(title);
  }
  if (elements.resultMessage) elements.resultMessage.textContent = translateContactText(message);
  elements.resultPopup.hidden = false;
  elements.resultClose?.focus();
  if (state === 'success') {
    resultPopupTimer = window.setTimeout(() => closeResultPopup(elements), 5200);
  }
}


/** Focuses the first invalid field after failed submit. */
function focusFirstInvalidField(form) {
  const invalid = form.querySelector('[aria-invalid="true"], [data-invalid="true"] input');
  if (invalid instanceof HTMLElement) invalid.focus();
}


/** Returns the submit-button label for the active delivery method. */
function getSubmitLabel(form) {
  if (getContactMethod(form) === 'whatsapp') return translateContactText('Anfrage in WhatsApp öffnen');
  return translateContactText('Anfrage per E-Mail senden');
}


/** Updates button copy, icon and the e-mail address field. */
function updateDeliveryPresentation(elements) {
  const emailMode = getContactMethod(elements.form) === 'email';
  if (elements.label) elements.label.textContent = getSubmitLabel(elements.form);
  if (elements.whatsappIcon) elements.whatsappIcon.hidden = emailMode;
  if (elements.emailIcon) elements.emailIcon.hidden = !emailMode;
  if (elements.emailField) elements.emailField.hidden = !emailMode;
  if (elements.emailInput instanceof HTMLInputElement) elements.emailInput.required = emailMode;
  if (!emailMode) clearEmailValidation(elements.form);
}


/** Clears e-mail validation when WhatsApp is selected. */
function clearEmailValidation(form) {
  setFieldError('email', '');
  setControlState(form, 'email', false);
}


/** Returns whether an edited field should be revalidated immediately. */
function shouldRevalidateField(event, target) {
  if (!target.name) return false;
  if (getFieldContainer(target.name)?.dataset.invalid === 'true') return true;
  return event.type === 'change' && isChoiceControl(target);
}


/** Returns whether a control validates naturally on change. */
function isChoiceControl(target) {
  return target instanceof HTMLSelectElement || target.type === 'radio' || target.type === 'checkbox';
}


/** Handles input and change events inside the form. */
function handleFieldActivity(event, elements) {
  const target = event.target;
  if (!isFormControl(target)) return;
  if (target.name === 'message') updateMessageCounter(elements);
  if (target.name === 'contactMethod') updateDeliveryPresentation(elements);
  if (shouldRevalidateField(event, target)) updateFieldValidation(elements.form, target.name);
  updateSubmitState(elements);
}


/** Returns whether an event target is a supported form control. */
function isFormControl(target) {
  return target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
}


/** Validates one required field when it loses focus. */
function handleFieldBlur(event, elements) {
  const target = event.target;
  if (!isFormControl(target)) return;
  if (!getRequiredFields(elements.form).includes(target.name)) return;
  updateFieldValidation(elements.form, target.name);
}


/** Sets the direct e-mail submit loading state. */
function setSubmitLoading(elements, loading) {
  if (!(elements.submit instanceof HTMLButtonElement)) return;
  elements.submit.dataset.loading = String(loading);
  elements.submit.disabled = loading;
  if (loading && elements.label) elements.label.textContent = translateContactText('Anfrage wird gesendet …');
}


/** Submits the enquiry through the selected delivery method. */
async function submitContactRequest(elements) {
  const data = getContactData(elements.form);
  if (getContactMethod(elements.form) === 'whatsapp') return submitWhatsApp(elements, data);
  setSubmitLoading(elements, true);
  const result = await window.GlanzerContactDelivery.deliverEmail(data, prefillIndustry);
  showStatus(elements, '', '');
  showResultPopup(elements, result.message, result.ok ? 'success' : 'error');
  setSubmitLoading(elements, false);
  updateDeliveryPresentation(elements);
  updateSubmitState(elements);
}


/** Opens the prepared WhatsApp enquiry. */
function submitWhatsApp(elements, data) {
  const message = window.GlanzerContactDelivery.openWhatsApp(data, prefillIndustry);
  showStatus(elements, message, 'success');
}


/** Handles the form submit event. */
async function handleSubmit(event, elements) {
  event.preventDefault();
  if (validateForm(elements.form)) return submitContactRequest(elements);
  showStatus(elements, CONTACT_FORM_CONFIG.text.invalid, 'error');
  focusFirstInvalidField(elements.form);
}


/** Closes the result popup from buttons, backdrop or Escape. */
function registerResultPopupEvents(elements) {
  if (!elements.resultPopup) return;
  elements.resultPopup.querySelectorAll('[data-result-close]').forEach((control) => {
    control.addEventListener('click', () => closeResultPopup(elements));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || elements.resultPopup.hidden) return;
    closeResultPopup(elements);
  });
}


/** Registers all form event listeners. */
function registerContactEvents(elements) {
  elements.form.addEventListener('submit', (event) => handleSubmit(event, elements));
  elements.form.addEventListener('input', (event) => handleFieldActivity(event, elements));
  elements.form.addEventListener('change', (event) => handleFieldActivity(event, elements));
  elements.form.addEventListener('focusout', (event) => handleFieldBlur(event, elements));
  registerResultPopupEvents(elements);
}


/** Initializes the complete contact-form experience. */
function initializeContactForm() {
  const elements = getContactElements();
  if (!elements.form) return;
  registerContactEvents(elements);
  updateMessageCounter(elements);
  updateDeliveryPresentation(elements);
  updateSubmitState(elements);
}


window.GlanzerContactForm = { initialize: initializeContactForm };
