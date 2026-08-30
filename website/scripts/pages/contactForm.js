'use strict';

const CONTACT_FORM_CONFIG = window.GlanzerContactConfig;
const contactParams = new URLSearchParams(window.location.search);
const prefillIndustry = String(contactParams.get('industry') || '').trim();


/** Returns all contact-form DOM references. */
function getContactElements() {
  const form = document.querySelector('[data-contact-form]');
  return {
    form,
    status: document.querySelector('[data-form-status]'),
    count: document.querySelector('[data-message-count]'),
    submit: form?.querySelector('button[type="submit"]'),
    provider: document.querySelector('[data-email-provider]'),
    label: document.querySelector('[data-submit-label]'),
    whatsappIcon: document.querySelector('[data-submit-icon="whatsapp"]'),
    emailIcon: document.querySelector('[data-submit-icon="email"]'),
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


/** Returns the selected e-mail provider. */
function getEmailProvider(form) {
  return getFormValue(form, 'emailProvider') || 'gmail';
}


/** Returns all values needed to prepare the enquiry. */
function getContactData(form) {
  return {
    name: getFormValue(form, 'name'),
    project: getFormValue(form, 'project'),
    projectStatus: getFormValue(form, 'projectStatus'),
    timeframe: getFormValue(form, 'timeframe'),
    message: getFormValue(form, 'message'),
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
  if (error) error.textContent = message;
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
  if (name === 'project') return value ? '' : text.projectMissing;
  if (name === 'projectStatus') return value ? '' : text.statusMissing;
  if (name === 'timeframe') return value ? '' : text.timeframeMissing;
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


/** Returns whether all required fields are valid. */
function isFormValid(form) {
  return CONTACT_FORM_CONFIG.requiredFields.every((name) => {
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
  return CONTACT_FORM_CONFIG.requiredFields.map((name) => {
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
  elements.status.textContent = message;
  elements.status.dataset.state = state;
}


/** Focuses the first invalid field after failed submit. */
function focusFirstInvalidField(form) {
  const invalid = form.querySelector('[aria-invalid="true"], [data-invalid="true"] input');
  if (invalid instanceof HTMLElement) invalid.focus();
}


/** Returns the submit-button label for the active delivery method. */
function getSubmitLabel(form) {
  if (getContactMethod(form) === 'whatsapp') return 'Anfrage in WhatsApp öffnen';
  const labels = { gmail: 'E-Mail in Gmail öffnen', outlook: 'E-Mail in Outlook öffnen', gmx: 'E-Mail-Daten kopieren & GMX öffnen' };
  return labels[getEmailProvider(form)] || 'E-Mail-Daten kopieren';
}


/** Updates provider visibility, button copy and delivery icon. */
function updateDeliveryPresentation(elements) {
  const emailMode = getContactMethod(elements.form) === 'email';
  if (elements.provider) elements.provider.hidden = !emailMode;
  if (elements.label) elements.label.textContent = getSubmitLabel(elements.form);
  if (elements.whatsappIcon) elements.whatsappIcon.hidden = emailMode;
  if (elements.emailIcon) elements.emailIcon.hidden = !emailMode;
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
  if (['contactMethod', 'emailProvider'].includes(target.name)) updateDeliveryPresentation(elements);
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
  if (!CONTACT_FORM_CONFIG.requiredFields.includes(target.name)) return;
  updateFieldValidation(elements.form, target.name);
}


/** Submits the enquiry through the selected delivery method. */
async function submitContactRequest(elements) {
  const data = getContactData(elements.form);
  if (getContactMethod(elements.form) === 'whatsapp') return submitWhatsApp(elements, data);
  const result = await window.GlanzerContactDelivery.deliverEmail(getEmailProvider(elements.form), data, prefillIndustry);
  showStatus(elements, result.message, result.ok ? 'success' : 'error');
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


/** Opens the project-type explanation dialog. */
function openSolutionDialog() {
  const dialog = document.querySelector('[data-solution-dialog]');
  if (dialog instanceof HTMLDialogElement) dialog.showModal();
}


/** Closes the project-type explanation dialog. */
function closeSolutionDialog() {
  const dialog = document.querySelector('[data-solution-dialog]');
  if (dialog instanceof HTMLDialogElement) dialog.close();
}


/** Closes the explanation dialog when its backdrop is clicked. */
function handleDialogBackdrop(event) {
  if (event.target === document.querySelector('[data-solution-dialog]')) closeSolutionDialog();
}


/** Registers project-type dialog interactions. */
function initializeSolutionDialog() {
  document.querySelector('[data-solution-dialog-open]')?.addEventListener('click', openSolutionDialog);
  document.querySelector('[data-solution-dialog-close]')?.addEventListener('click', closeSolutionDialog);
  document.querySelector('[data-solution-dialog]')?.addEventListener('click', handleDialogBackdrop);
}


/** Selects a project type supplied through the contact URL. */
function selectProjectFromUrl(form) {
  const requestedProject = String(contactParams.get('project') || '').trim();
  if (!requestedProject) return;
  form.querySelectorAll('input[name="project"]').forEach((control) => {
    control.checked = control.value === requestedProject;
  });
}


/** Registers all form event listeners. */
function registerContactEvents(elements) {
  elements.form.addEventListener('submit', (event) => handleSubmit(event, elements));
  elements.form.addEventListener('input', (event) => handleFieldActivity(event, elements));
  elements.form.addEventListener('change', (event) => handleFieldActivity(event, elements));
  elements.form.addEventListener('focusout', (event) => handleFieldBlur(event, elements));
}


/** Initializes the complete contact-form experience. */
function initializeContactForm() {
  const elements = getContactElements();
  if (!elements.form) return;
  selectProjectFromUrl(elements.form);
  registerContactEvents(elements);
  initializeSolutionDialog();
  updateMessageCounter(elements);
  updateDeliveryPresentation(elements);
  updateSubmitState(elements);
}


window.GlanzerContactForm = { initialize: initializeContactForm };
