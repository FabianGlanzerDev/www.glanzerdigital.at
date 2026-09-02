'use strict';

const CONTACT_CONFIG = window.GlanzerContactConfig;


/** Translates generated enquiry copy to the active language. */
function translateDeliveryText(value) {
  return window.GlanzerI18n?.translate(value) || value;
}


/** Builds the shared enquiry text for WhatsApp and e-mail. */
function buildMessageBody(data, industry = '') {
  const t = translateDeliveryText;
  const details = [
    `Name: ${data.name}`, `${t('Projektstand:')} ${t(data.projectStatus)}`,
    `${t('Zeitraum:')} ${t(data.timeframe)}`,
  ];
  if (industry) details.splice(1, 0, `${t('Branche / Beispiel:')} ${t(industry)}`);
  return [t(CONTACT_CONFIG.text.greeting), '', ...details, '', t('Projektbeschreibung:'), data.message].join('\n');
}


/** Builds the prefilled WhatsApp URL. */
function buildWhatsAppLink(data, industry = '') {
  const body = encodeURIComponent(buildMessageBody(data, industry));
  return `https://wa.me/${CONTACT_CONFIG.whatsappNumber}?text=${body}`;
}


/** Builds an e-mail subject for one project enquiry. */
function buildEmailSubject(data) {
  return `${translateDeliveryText('Website-Anfrage von')} ${data.name}`;
}


/** Encodes the shared webmail parameters once. */
function getEncodedMailValues(data, industry = '') {
  return {
    to: encodeURIComponent(CONTACT_CONFIG.contactEmail),
    subject: encodeURIComponent(buildEmailSubject(data)),
    body: encodeURIComponent(buildMessageBody(data, industry)),
  };
}


/** Returns whether the current browser is running on a mobile/touch device. */
function isMobileMailContext() {
  const mobileAgent = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const touchTablet = navigator.maxTouchPoints > 1 && window.innerWidth <= 1024;
  return mobileAgent || touchTablet;
}


/** Builds a mailto URL for the installed mail application. */
function buildMailtoUrl(data, industry = '') {
  const subject = encodeURIComponent(buildEmailSubject(data));
  const body = encodeURIComponent(buildMessageBody(data, industry));
  return `mailto:${CONTACT_CONFIG.contactEmail}?subject=${subject}&body=${body}`;
}


/** Opens the installed/default mail app with the prepared enquiry. */
function openMailApp(data, industry = '') {
  window.location.href = buildMailtoUrl(data, industry);
  window.GlanzerAnalytics?.track('contact_click', 'E-Mail-App');
  return { ok: true, message: CONTACT_CONFIG.text.mailAppOpened };
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



/** Delivers the e-mail enquiry according to the selected provider. */
async function deliverEmail(provider, data, industry = '') {
  if (isMobileMailContext() || provider === 'mailapp') return openMailApp(data, industry);
  return { ok: true, message: openWebmail(provider, data, industry) };
}


window.GlanzerContactDelivery = {
  deliverEmail,
  isMobileMailContext,
  openWhatsApp,
};
