const contactForm = document.querySelector('[data-contact-form]');
const formStatus = document.querySelector('[data-form-status]');
const messageCount = document.querySelector('[data-message-count]');
const submitButton = contactForm?.querySelector('button[type="submit"]');
const whatsappNumber = '436767875304';
const maxMessageLength = 1200;
const solutionDialog = document.querySelector('[data-solution-dialog]');
const solutionDialogOpen = document.querySelector('[data-solution-dialog-open]');
const solutionDialogClose = document.querySelector('[data-solution-dialog-close]');
const contactParams = new URLSearchParams(window.location.search);
const prefillIndustry = String(contactParams.get('industry') || '').trim();
const requiredFields = ['name', 'project', 'projectStatus', 'timeframe', 'message', 'privacy'];

const UI_TEXT = {
  de: {
    nameMissing: 'Bitte gib deinen Namen ein.', nameShort: 'Der Name ist zu kurz.',
    projectMissing: 'Bitte wähle eine Projektart aus.', statusMissing: 'Bitte wähle den Projektstand aus.',
    timeframeMissing: 'Bitte wähle einen Zeitraum aus.', messageMissing: 'Bitte beschreibe dein Projekt kurz.',
    messageShort: 'Bitte gib etwas mehr Details an (mindestens 20 Zeichen).',
    messageLong: `Maximal ${maxMessageLength} Zeichen möglich.`, privacyMissing: 'Bitte bestätige die Datenschutzerklärung.',
    invalid: 'Bitte prüfe die markierten Angaben.', opened: 'WhatsApp wurde mit deiner vorbereiteten Nachricht geöffnet.',
    greeting: 'Hallo, ich möchte ein Projekt bei Glanzer Digital anfragen.',
    name: 'Name', project: 'Projektart', industry: 'Branche / Beispiel', status: 'Projektstand', timeframe: 'Zeitraum', description: 'Projektbeschreibung'
  },
  en: {
    nameMissing: 'Please enter your name.', nameShort: 'The name is too short.',
    projectMissing: 'Please select a project type.', statusMissing: 'Please select the project status.',
    timeframeMissing: 'Please select a timeframe.', messageMissing: 'Please briefly describe your project.',
    messageShort: 'Please provide a little more detail (at least 20 characters).',
    messageLong: `A maximum of ${maxMessageLength} characters is allowed.`, privacyMissing: 'Please confirm that you have read the privacy policy.',
    invalid: 'Please check the highlighted information.', opened: 'WhatsApp has been opened with your prepared message.',
    greeting: 'Hello, I would like to enquire about a project with Glanzer Digital.',
    name: 'Name', project: 'Project type', industry: 'Industry / example', status: 'Project status', timeframe: 'Timeframe', description: 'Project description'
  }
};

const PROJECT_VALUE_EN = {
  'Neue Website oder Landingpage': 'New website or landing page',
  'Web-App oder digitales Tool': 'Web app or digital tool',
  'Windows-Anwendung': 'Windows application',
  'Bestehende Website verbessern': 'Improve an existing website',
  'Noch unsicher – Beratung gewünscht': 'Not sure yet – consultation requested'
};


function getLanguage() {
  return document.documentElement.lang === 'en' ? 'en' : 'de';
}


function getText() {
  return UI_TEXT[getLanguage()];
}


function getFormValue(name) {
  const formData = new FormData(contactForm);
  return String(formData.get(name) || '').trim();
}


function getContactData() {
  return {
    name: getFormValue('name'), project: getFormValue('project'),
    projectStatus: getFormValue('projectStatus'), timeframe: getFormValue('timeframe'),
    message: getFormValue('message'), privacy: getFormValue('privacy')
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
  const text = getText();
  if (!value) return text.nameMissing;
  return value.length < 2 ? text.nameShort : '';
}


function validateMessage(value) {
  const text = getText();
  if (!value) return text.messageMissing;
  if (value.length < 20) return text.messageShort;
  return value.length > maxMessageLength ? text.messageLong : '';
}


function validateField(name, value) {
  const text = getText();
  if (name === 'name') return validateName(value);
  if (name === 'project') return value ? '' : text.projectMissing;
  if (name === 'projectStatus') return value ? '' : text.statusMissing;
  if (name === 'timeframe') return value ? '' : text.timeframeMissing;
  if (name === 'privacy') return value ? '' : text.privacyMissing;
  return name === 'message' ? validateMessage(value) : '';
}


function updateFieldValidation(name) {
  const error = validateField(name, getFormValue(name));
  setFieldError(name, error);
  setControlState(name, Boolean(error));
  return !error;
}


function isFormValid() {
  return requiredFields.every((name) => !validateField(name, getFormValue(name)));
}


function updateSubmitState() {
  if (!(submitButton instanceof HTMLButtonElement)) return;
  const valid = isFormValid();
  submitButton.disabled = !valid;
  submitButton.setAttribute('aria-disabled', String(!valid));
}


function validateForm() {
  return requiredFields.map(updateFieldValidation).every(Boolean);
}


function translateProjectValue(value) {
  if (getLanguage() !== 'en') return value;
  return PROJECT_VALUE_EN[value] || value;
}


function buildWhatsAppMessage(data) {
  const text = getText();
  const details = [`${text.name}: ${data.name}`, `${text.project}: ${translateProjectValue(data.project)}`];
  if (prefillIndustry) details.push(`${text.industry}: ${prefillIndustry}`);
  details.push(`${text.status}: ${data.projectStatus}`, `${text.timeframe}: ${data.timeframe}`);
  return [text.greeting, '', ...details, '', `${text.description}:`, data.message].join('\n');
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


function showInvalidFormStatus() {
  showStatus(getText().invalid, 'error');
  focusFirstInvalidField();
}


function handleContactSubmit(event) {
  event.preventDefault();
  if (!validateForm()) return showInvalidFormStatus();
  showStatus(getText().opened, 'success');
  window.GlanzerAnalytics?.track('contact_click', 'WhatsApp-Formular');
  window.open(buildWhatsAppLink(getContactData()), '_blank', 'noopener,noreferrer');
}


function updateMessageCounter() {
  const message = getFormValue('message');
  if (messageCount) messageCount.textContent = String(message.length);
}


function handleFieldActivity(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
  if (target.name === 'message') updateMessageCounter();
  updateSubmitState();
}


function handleFieldBlur(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
  if (target.name) updateFieldValidation(target.name);
}


function openSolutionDialog() {
  if (solutionDialog instanceof HTMLDialogElement) solutionDialog.showModal();
}


function closeSolutionDialog() {
  if (solutionDialog instanceof HTMLDialogElement) solutionDialog.close();
}


function handleSolutionDialogClick(event) {
  if (event.target === solutionDialog) closeSolutionDialog();
}


function initializeSolutionDialog() {
  solutionDialogOpen?.addEventListener('click', openSolutionDialog);
  solutionDialogClose?.addEventListener('click', closeSolutionDialog);
  solutionDialog?.addEventListener('click', handleSolutionDialogClick);
}


function selectProjectFromUrl() {
  const requestedProject = String(contactParams.get('project') || '').trim();
  const projectControls = contactForm?.querySelectorAll('input[name="project"]');
  if (!requestedProject || !projectControls) return;
  projectControls.forEach((control) => {
    if (control instanceof HTMLInputElement) control.checked = control.value === requestedProject;
  });
}


function initializeContactPrefill() {
  if (!contactForm) return;
  selectProjectFromUrl();
  updateSubmitState();
}


function handleLanguageChange() {
  requiredFields.forEach((name) => {
    if (getErrorElement(name)?.textContent) updateFieldValidation(name);
  });
  updateSubmitState();
}


function initializeContactForm() {
  if (!contactForm) return;
  contactForm.addEventListener('submit', handleContactSubmit);
  contactForm.addEventListener('input', handleFieldActivity);
  contactForm.addEventListener('change', handleFieldActivity);
  contactForm.addEventListener('focusout', handleFieldBlur);
  updateMessageCounter();
  updateSubmitState();
}


initializeContactForm();
initializeContactPrefill();
initializeSolutionDialog();
window.addEventListener('gd:languagechange', handleLanguageChange);
