const contactForm = document.querySelector('[data-contact-form]');
const formStatus = document.querySelector('[data-form-status]');
const messageCount = document.querySelector('[data-message-count]');
const whatsappNumber = '436767875304';
const maxMessageLength = 1200;
const solutionDialog = document.querySelector('[data-solution-dialog]');
const solutionDialogOpen = document.querySelector('[data-solution-dialog-open]');
const solutionDialogClose = document.querySelector('[data-solution-dialog-close]');



function getFormValue(name) {
  const formData = new FormData(contactForm);
  return String(formData.get(name) || '').trim();
}



function getContactData() {
  return {
    name: getFormValue('name'), project: getFormValue('project'),
    projectStatus: getFormValue('projectStatus'), timeframe: getFormValue('timeframe'),
    message: getFormValue('message'),
  };
}



function getErrorElement(name) {
  return document.querySelector(`[data-error-for="${name}"]`);
}



function getFieldContainer(name) {
  return document.querySelector(`[data-field="${name}"]`);
}



function setFieldError(name, message) {
  const error = getErrorElement(name);
  const container = getFieldContainer(name);
  if (error) error.textContent = message;
  if (container) container.dataset.invalid = message ? 'true' : 'false';
}



function setControlState(name, invalid) {
  const control = contactForm.elements.namedItem(name);
  if (!control || control instanceof RadioNodeList) return;
  control.setAttribute('aria-invalid', String(invalid));
}



function validateName(value) {
  if (!value) return 'Bitte gib deinen Namen ein.';
  if (value.length < 2) return 'Der Name ist zu kurz.';
  return '';
}



function validateRequired(value, message) {
  return value ? '' : message;
}



function validateMessage(value) {
  if (!value) return 'Bitte beschreibe dein Projekt kurz.';
  if (value.length < 20) return 'Bitte gib etwas mehr Details an (mindestens 20 Zeichen).';
  if (value.length > maxMessageLength) return `Maximal ${maxMessageLength} Zeichen möglich.`;
  return '';
}



function validateField(name, value) {
  if (name === 'name') return validateName(value);
  if (name === 'project') return validateRequired(value, 'Bitte wähle eine Projektart aus.');
  if (name === 'projectStatus') return validateRequired(value, 'Bitte wähle den Projektstand aus.');
  if (name === 'timeframe') return validateRequired(value, 'Bitte wähle einen Zeitraum aus.');
  return name === 'message' ? validateMessage(value) : '';
}



function updateFieldValidation(name) {
  const value = getFormValue(name);
  const error = validateField(name, value);
  setFieldError(name, error);
  setControlState(name, Boolean(error));
  return !error;
}



function validateForm() {
  const fields = ['name', 'project', 'projectStatus', 'timeframe', 'message'];
  return fields.map(updateFieldValidation).every(Boolean);
}



function buildWhatsAppMessage(data) {
  return [
    'Hallo, ich möchte ein Projekt bei Glanzer Digital anfragen.', '',
    `Name: ${data.name}`, `Projektart: ${data.project}`,
    `Projektstand: ${data.projectStatus}`, `Zeitraum: ${data.timeframe}`,
    '', 'Projektbeschreibung:', data.message,
  ].join('\n');
}



function buildWhatsAppLink(data) {
  const message = encodeURIComponent(buildWhatsAppMessage(data));
  return `https://wa.me/${whatsappNumber}?text=${message}`;
}



function showStatus(message, state = '') {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.dataset.state = state;
}



function focusFirstInvalidField() {
  const invalid = contactForm.querySelector('[aria-invalid="true"], [data-invalid="true"] input');
  if (invalid instanceof HTMLElement) invalid.focus();
}



function handleContactSubmit(event) {
  event.preventDefault();
  if (!validateForm()) return showInvalidFormStatus();
  showStatus('WhatsApp wird mit deiner vorbereiteten Nachricht geöffnet.', 'success');
  window.open(buildWhatsAppLink(getContactData()), '_blank', 'noopener,noreferrer');
}



function showInvalidFormStatus() {
  showStatus('Bitte prüfe die markierten Angaben.', 'error');
  focusFirstInvalidField();
}



function updateMessageCounter() {
  const message = getFormValue('message');
  if (messageCount) messageCount.textContent = String(message.length);
}



function handleFieldInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
  if (target.name === 'message') updateMessageCounter();
  if (target.name) updateFieldValidation(target.name);
}



function openSolutionDialog() {
  if (!(solutionDialog instanceof HTMLDialogElement)) return;
  solutionDialog.showModal();
}



function closeSolutionDialog() {
  if (!(solutionDialog instanceof HTMLDialogElement)) return;
  solutionDialog.close();
}



function handleSolutionDialogClick(event) {
  if (event.target === solutionDialog) closeSolutionDialog();
}



function initializeSolutionDialog() {
  solutionDialogOpen?.addEventListener('click', openSolutionDialog);
  solutionDialogClose?.addEventListener('click', closeSolutionDialog);
  solutionDialog?.addEventListener('click', handleSolutionDialogClick);
}


function initializeContactForm() {
  if (!contactForm) return;
  contactForm.addEventListener('submit', handleContactSubmit);
  contactForm.addEventListener('input', handleFieldInput);
  contactForm.addEventListener('change', handleFieldInput);
  updateMessageCounter();
}



initializeContactForm();
initializeSolutionDialog();
