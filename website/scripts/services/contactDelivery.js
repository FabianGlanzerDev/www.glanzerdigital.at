'use strict';

const CONTACT_CONFIG = window.GlanzerContactConfig;


/** Builds the shared enquiry text for WhatsApp and e-mail. */
function buildMessageBody(data, industry = '') {
  const details = [
    `Name: ${data.name}`,
    `Projektart: ${data.project}`,
    `Projektstand: ${data.projectStatus}`,
    `Zeitraum: ${data.timeframe}`,
  ];
  if (industry) details.splice(2, 0, `Branche / Beispiel: ${industry}`);
  return [CONTACT_CONFIG.text.greeting, '', ...details, '', 'Projektbeschreibung:', data.message].join('\n');
}


/** Builds the prefilled WhatsApp URL. */
function buildWhatsAppLink(data, industry = '') {
  const body = encodeURIComponent(buildMessageBody(data, industry));
  return `https://wa.me/${CONTACT_CONFIG.whatsappNumber}?text=${body}`;
}


/** Builds an e-mail subject for one project enquiry. */
function buildEmailSubject(data) {
  return `Website-Anfrage von ${data.name}`;
}


/** Encodes the shared webmail parameters once. */
function getEncodedMailValues(data, industry = '') {
  return {
    to: encodeURIComponent(CONTACT_CONFIG.contactEmail),
    subject: encodeURIComponent(buildEmailSubject(data)),
    body: encodeURIComponent(buildMessageBody(data, industry)),
  };
}


/** Builds a Gmail or Outlook compose URL. */
function buildWebmailComposeUrl(provider, data, industry = '') {
  const mail = getEncodedMailValues(data, industry);
  if (provider === 'outlook') return buildOutlookUrl(mail);
  return buildGmailUrl(mail);
}


/** Builds the Gmail compose URL. */
function buildGmailUrl(mail) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${mail.to}&su=${mail.subject}&body=${mail.body}`;
}


/** Builds the Outlook compose URL. */
function buildOutlookUrl(mail) {
  return `https://outlook.office.com/mail/deeplink/compose?to=${mail.to}&subject=${mail.subject}&body=${mail.body}`;
}


/** Builds text that can be pasted into GMX or another mail client. */
function buildCopyableEmail(data, industry = '') {
  return [
    `An: ${CONTACT_CONFIG.contactEmail}`,
    `Betreff: ${buildEmailSubject(data)}`,
    '', buildMessageBody(data, industry),
  ].join('\n');
}


/** Copies text to the clipboard using the modern API or a fallback. */
async function copyTextToClipboard(value) {
  try {
    await navigator.clipboard.writeText(String(value || ''));
    return true;
  } catch {
    return copyTextWithFallback(value);
  }
}


/** Copies text with a temporary textarea for older browsers. */
function copyTextWithFallback(value) {
  const textarea = createClipboardTextarea(value);
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  return copied;
}


/** Creates the hidden textarea used by the clipboard fallback. */
function createClipboardTextarea(value) {
  const textarea = document.createElement('textarea');
  textarea.value = String(value || '');
  textarea.setAttribute('readonly', '');
  textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  return textarea;
}


/** Opens WhatsApp with the prepared enquiry. */
function openWhatsApp(data, industry = '') {
  window.open(buildWhatsAppLink(data, industry), '_blank', 'noopener,noreferrer');
  window.GlanzerAnalytics?.track('contact_click', 'WhatsApp-Formular');
  return CONTACT_CONFIG.text.whatsappOpened;
}


/** Opens Gmail or Outlook with the prepared enquiry. */
function openWebmail(provider, data, industry = '') {
  const url = buildWebmailComposeUrl(provider, data, industry);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.GlanzerAnalytics?.track('contact_click', `E-Mail-${provider}`);
  return CONTACT_CONFIG.text.webmailOpened;
}


/** Copies the prepared e-mail and opens GMX. */
async function openGmx(data, industry = '') {
  const copied = await copyTextToClipboard(buildCopyableEmail(data, industry));
  if (!copied) return { ok: false, message: CONTACT_CONFIG.text.copyFailed };
  window.open('https://www.gmx.net/mail/', '_blank', 'noopener,noreferrer');
  return { ok: true, message: CONTACT_CONFIG.text.gmxOpened };
}


/** Copies prepared e-mail data for another provider. */
async function copyOtherEmail(data, industry = '') {
  const copied = await copyTextToClipboard(buildCopyableEmail(data, industry));
  const message = copied ? CONTACT_CONFIG.text.copied : CONTACT_CONFIG.text.copyFailed;
  return { ok: copied, message };
}


/** Delivers the e-mail enquiry according to the selected provider. */
async function deliverEmail(provider, data, industry = '') {
  if (provider === 'gmx') return openGmx(data, industry);
  if (provider === 'other') return copyOtherEmail(data, industry);
  return { ok: true, message: openWebmail(provider, data, industry) };
}


window.GlanzerContactDelivery = {
  deliverEmail,
  openWhatsApp,
};
