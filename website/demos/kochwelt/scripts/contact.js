const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xpwvjwjg';



/**
 * Reads normalized contact form values.
 * @param {HTMLFormElement} form - Contact form.
 * @returns {{name:string,email:string,message:string,data:FormData}} Contact data.
 */
function getContactData(form) {
  const data = new FormData(form);
  return {
    name: String(data.get('name') || '').trim(),
    email: String(data.get('email') || '').trim(),
    message: String(data.get('message') || '').trim(),
    data,
  };
}



/**
 * Checks whether all required contact fields are filled.
 * @param {Object} contactData - Contact form data.
 * @returns {boolean} Whether required fields are present.
 */
function hasRequiredContactData(contactData) {
  return Boolean(contactData.name && contactData.email && contactData.message);
}



/**
 * Checks whether an email address uses a basic valid format.
 * @param {string} email - Email address.
 * @returns {boolean} Whether the format is valid.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}



/**
 * Submits the contact payload to Formspree.
 * @param {FormData} data - Form payload.
 * @returns {Promise<Response>} Formspree response.
 */
function submitContactForm(data) {
  return fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    body: data,
    headers: { Accept: 'application/json' },
  });
}



/**
 * Handles the Formspree response.
 * @param {Response} response - Formspree response.
 */
function handleContactResponse(response) {
  if (response.ok) window.location.href = './send-mail.html';
  else alert('Es gab ein Problem beim Senden deiner Nachricht.');
}



/**
 * Handles failed Formspree requests.
 * @param {Error} error - Request error.
 */
function handleContactError(error) {
  console.error(error);
  alert(`Ein Fehler ist aufgetreten: ${error}`);
}



/**
 * Validates and submits the Kochwelt contact form.
 * @param {SubmitEvent} event - Form submit event.
 */
function sendMail(event) {
  event.preventDefault();
  const contactData = getContactData(event.target);
  if (!hasRequiredContactData(contactData)) return alert('Bitte fülle alle Felder aus, bevor du die Nachricht sendest.');
  if (!isValidEmail(contactData.email)) return alert('Bitte gib eine gültige E-Mail-Adresse ein.');
  submitContactForm(contactData.data).then(handleContactResponse).catch(handleContactError);
}
