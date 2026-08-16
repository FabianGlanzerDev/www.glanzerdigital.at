const contactForm = document.querySelector('[data-contact-form]');
const formStatus = document.querySelector('[data-form-status]');
const contactEmail = 'fabsdev@gmx.at';



/**
 * Reads and normalizes the contact form values.
 * @param {HTMLFormElement} form - The contact form.
 * @returns {Object} The normalized contact data.
 */
function getContactData(form) {
  const formData = new FormData(form);
  return {
    name: String(formData.get('name') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    project: String(formData.get('project') || '').trim(),
    message: String(formData.get('message') || '').trim(),
  };
}



/**
 * Creates the mail body for a project request.
 * @param {Object} contactData - The normalized contact data.
 * @returns {string} The formatted mail body.
 */
function buildMailBody(contactData) {
  return [
    `Name: ${contactData.name}`,
    `E-Mail: ${contactData.email}`,
    `Projekt: ${contactData.project}`,
    '',
    'Beschreibung:',
    contactData.message,
  ].join('\n');
}



/**
 * Builds the complete mailto link for a project request.
 * @param {Object} contactData - The normalized contact data.
 * @returns {string} The mailto URL.
 */
function buildMailLink(contactData) {
  const subject = `Projektanfrage: ${contactData.project}`;
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(buildMailBody(contactData));
  return `mailto:${contactEmail}?subject=${encodedSubject}&body=${encodedBody}`;
}



/**
 * Shows a short status message before the mail client opens.
 */
function showMailStatus() {
  if (!formStatus) return;
  formStatus.textContent = 'Das E-Mail-Programm wird geöffnet.';
}



/**
 * Handles the contact form submission without sending data to a server.
 * @param {SubmitEvent} event - The form submit event.
 */
function handleContactSubmit(event) {
  event.preventDefault();
  if (!contactForm || !contactForm.reportValidity()) return;
  const contactData = getContactData(contactForm);
  showMailStatus();
  window.location.href = buildMailLink(contactData);
}



if (contactForm) {
  contactForm.addEventListener('submit', handleContactSubmit);
}
