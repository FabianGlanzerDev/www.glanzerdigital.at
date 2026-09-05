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
    `Name: ${data.name}`,
    `${t('Projektstand:')} ${t(data.projectStatus)}`,
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


/** Opens WhatsApp with the prepared enquiry. */
function openWhatsApp(data, industry = '') {
  window.open(buildWhatsAppLink(data, industry), '_blank', 'noopener,noreferrer');
  window.GlanzerAnalytics?.track('contact_click', 'WhatsApp-Formular');
  return CONTACT_CONFIG.text.whatsappOpened;
}


/** Returns the JSON request payload for direct e-mail delivery. */
function buildEmailPayload(data, industry = '') {
  return { ...data, industry };
}


/** Sends one e-mail enquiry to the server endpoint. */
async function requestEmailDelivery(data, industry = '') {
  const response = await fetch(CONTACT_CONFIG.emailEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildEmailPayload(data, industry)),
  });
  return response.ok;
}


/** Delivers the e-mail enquiry directly through the website server. */
async function deliverEmail(data, industry = '') {
  try {
    const ok = await requestEmailDelivery(data, industry);
    if (ok) window.GlanzerAnalytics?.track('contact_submit', 'E-Mail-Formular');
    return { ok, message: ok ? CONTACT_CONFIG.text.emailSent : CONTACT_CONFIG.text.emailFailed };
  } catch {
    return { ok: false, message: CONTACT_CONFIG.text.emailFailed };
  }
}


window.GlanzerContactDelivery = {
  deliverEmail,
  openWhatsApp,
};
