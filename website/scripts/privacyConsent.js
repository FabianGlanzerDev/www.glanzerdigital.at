'use strict';

const CONSENT_STORAGE_KEY = 'gd-consent';
const CONSENT_VERSION = 2;
let consentBanner = null;
let consentTemplate = '';


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


/** Loads the shared consent markup once. */
async function loadConsentTemplate() {
  if (consentTemplate) return consentTemplate;
  const rootPath = document.body.dataset.root || '.';
  consentTemplate = await window.GlanzerTemplates.loadTemplate(rootPath, 'consent');
  return consentTemplate;
}


/** Renders the consent markup from the shared HTML template. */
async function renderConsentBanner() {
  if (!consentBanner) return;
  const template = await loadConsentTemplate();
  consentBanner.innerHTML = window.GlanzerTemplates.fillTemplate(template, { PRIVACY_URL: getPrivacyUrl() });
}


/** Hides the consent banner. */
function hideConsentBanner() {
  if (consentBanner) consentBanner.hidden = true;
}


/** Opens the consent banner and optionally focuses the reject button. */
async function showConsentBanner(focus = true) {
  if (!consentBanner) return;
  await renderConsentBanner();
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
async function initializeConsent() {
  consentBanner = document.querySelector('[data-consent-banner]');
  if (!consentBanner) return;
  consentBanner.addEventListener('click', handleConsentClick);
  document.querySelector('[data-consent-settings]')?.addEventListener('click', () => showConsentBanner());
  if (!getConsentChoice()) await showConsentBanner(false);
}


window.GlanzerConsent = {
  hasAnalyticsConsent,
  initialize: initializeConsent,
  open: () => showConsentBanner(),
};
