'use strict';

const CONSENT_STORAGE_KEY = 'gd-consent';
const CONSENT_VERSION = 2;
let consentBanner = null;


/** Returns the stored statistics-consent choice. */
function getConsentChoice() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) || 'null');
    if (saved?.version !== CONSENT_VERSION) return null;
    return ['accepted', 'rejected'].includes(saved.analytics) ? saved.analytics : null;
  } catch {
    return null;
  }
}


/** Returns whether analytics consent is active. */
function hasAnalyticsConsent() {
  return getConsentChoice() === 'accepted';
}


/** Stores one analytics-consent choice in localStorage. */
function storeConsentChoice(choice) {
  const value = { version: CONSENT_VERSION, analytics: choice, updatedAt: new Date().toISOString() };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
}


/** Returns the privacy-policy URL for the current environment. */
function getPrivacyUrl() {
  if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) return '/datenschutz';
  const rootPath = document.body.dataset.root || '.';
  return `${rootPath}/subpages/datenschutz.html`;
}


/** Renders the consent markup from the shared template. */
function renderConsentBanner() {
  if (!consentBanner) return;
  const template = window.GlanzerTemplateLibrary?.consent;
  const renderer = window.GlanzerTemplateRenderer;
  if (!template || !renderer) throw new Error('Consent-Template fehlt.');
  consentBanner.innerHTML = renderer.fill(template, { PRIVACY_URL: getPrivacyUrl() });
  window.GlanzerI18n?.refresh();
}


/** Hides the consent banner. */
function hideConsentBanner() {
  if (consentBanner) consentBanner.hidden = true;
}


/** Opens the consent banner and optionally focuses the reject button. */
function showConsentBanner(focus = true) {
  if (!consentBanner) return;
  renderConsentBanner();
  consentBanner.hidden = false;
  if (focus) consentBanner.querySelector('[data-consent-action="reject"]')?.focus();
}


/** Applies a consent choice and synchronizes analytics. */
function applyConsentChoice(choice) {
  storeConsentChoice(choice);
  if (choice === 'accepted') window.GlanzerAnalytics?.initialize();
  else window.GlanzerAnalytics?.stop();
  hideConsentBanner();
}


/** Handles clicks on the consent decision buttons. */
function handleConsentClick(event) {
  const button = event.target instanceof Element ? event.target.closest('[data-consent-action]') : null;
  if (!(button instanceof HTMLButtonElement)) return;
  const choice = button.dataset.consentAction === 'accept' ? 'accepted' : 'rejected';
  applyConsentChoice(choice);
}


/** Initializes the consent controls and opens the banner when needed. */
function initializeConsent() {
  consentBanner = document.querySelector('[data-consent-banner]');
  if (!consentBanner) return;
  consentBanner.addEventListener('click', handleConsentClick);
  document.querySelector('[data-consent-settings]')?.addEventListener('click', () => showConsentBanner());
  if (!getConsentChoice()) showConsentBanner(false);
}


window.GlanzerConsent = {
  hasAnalyticsConsent,
  initialize: initializeConsent,
  open: () => showConsentBanner(),
};
