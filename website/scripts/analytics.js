'use strict';

let analyticsInitialized = false;
let ga4ModulePromise = null;


/** Returns whether the site is running on a local development host. */
function isAnalyticsLocalDevelopment() {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}


/** Returns the current coarse device category. */
function getAnalyticsDevice() {
  if (window.innerWidth <= 620) return 'mobile';
  if (window.innerWidth <= 980) return 'tablet';
  return 'desktop';
}


/** Returns the current viewport size category. */
function getAnalyticsScreen() {
  const width = window.innerWidth;
  if (width < 400) return '<400 px';
  if (width < 768) return '400–767 px';
  if (width < 1024) return '768–1023 px';
  if (width < 1440) return '1024–1439 px';
  return '1440+ px';
}


/** Returns the referrer hostname without path or query data. */
function getAnalyticsReferrer() {
  if (!document.referrer) return '';
  try { return new URL(document.referrer).hostname.toLowerCase(); }
  catch { return ''; }
}


/** Normalizes an analytics label before transport. */
function normalizeAnalyticsLabel(label) {
  return String(label || '').replace(/\s+/g, ' ').trim().slice(0, 60);
}


/** Builds the first-party analytics event payload. */
function buildAnalyticsPayload(eventName, label = '') {
  return {
    event: eventName, page: location.pathname, device: getAnalyticsDevice(),
    screen: getAnalyticsScreen(), referrer: getAnalyticsReferrer(),
    label: normalizeAnalyticsLabel(label), consent: true,
  };
}


/** Returns whether statistics consent is currently active. */
function hasAnalyticsConsent() {
  return window.GlanzerConsent?.hasAnalyticsConsent() === true;
}


/** Sends one first-party event and mirrors it to GA4 when available. */
function sendAnalyticsEvent(eventName, label = '') {
  if (!hasAnalyticsConsent()) return false;
  sendFirstPartyEvent(buildAnalyticsPayload(eventName, label));
  ga4ModulePromise?.then((module) => module.trackGoogleAnalyticsEvent(eventName, label));
  return true;
}


/** Sends an event to the site's own statistics endpoint. */
function sendFirstPartyEvent(payload) {
  fetch('/api/analytics-track.php', {
    method: 'POST', body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin', cache: 'no-store', keepalive: true,
  }).catch(() => {});
}


/** Returns the analytics event type for one clicked link. */
function getLinkAnalyticsEvent(link) {
  const href = link.getAttribute('href') || '';
  if (link.classList.contains('project-demo-button') || href.includes('/demos/')) return 'demo_click';
  if (href.includes('wa.me/') || href.startsWith('mailto:') || href.startsWith('tel:')) return 'contact_click';
  if (href.includes('github.com/')) return 'github_click';
  if (href.includes('/portfolio')) return 'portfolio_click';
  return link.classList.contains('button') ? 'cta_click' : null;
}


/** Returns a concise analytics label for one clicked link. */
function getAnalyticsLabel(link, eventName) {
  if (link.dataset.analyticsLabel) return link.dataset.analyticsLabel;
  if (eventName === 'contact_click') return getContactLinkLabel(link);
  return link.textContent || link.getAttribute('aria-label') || '';
}


/** Returns a normalized label for a contact link. */
function getContactLinkLabel(link) {
  const href = link.getAttribute('href') || '';
  if (href.includes('wa.me/')) return 'WhatsApp';
  if (href.startsWith('mailto:')) return 'E-Mail';
  if (href.startsWith('tel:')) return 'Telefon';
  return 'Kontakt';
}


/** Handles analytics for eligible link clicks. */
function handleAnalyticsClick(event) {
  const link = event.target instanceof Element ? event.target.closest('a') : null;
  if (!(link instanceof HTMLAnchorElement)) return;
  const eventName = getLinkAnalyticsEvent(link);
  if (eventName) sendAnalyticsEvent(eventName, getAnalyticsLabel(link, eventName));
}


/** Loads GA4 only after consent and starts site analytics. */
function initializeAnalytics() {
  if (analyticsInitialized || !hasAnalyticsConsent()) return;
  analyticsInitialized = true;
  if (!isAnalyticsLocalDevelopment()) loadGa4Module();
  sendAnalyticsEvent('page_view');
  document.addEventListener('click', handleAnalyticsClick, { passive: true });
}


/** Loads the GA4 module lazily. */
function loadGa4Module() {
  ga4ModulePromise ||= import('/scripts/googleAnalytics.js?v=20260830-clean');
  ga4ModulePromise.then((module) => module.initializeGoogleAnalytics());
}


/** Stops analytics after consent is withdrawn. */
function stopAnalytics() {
  ga4ModulePromise?.then((module) => module.disableGoogleAnalytics());
  if (!analyticsInitialized) return;
  document.removeEventListener('click', handleAnalyticsClick);
  analyticsInitialized = false;
}


window.GlanzerAnalytics = {
  initialize: initializeAnalytics,
  stop: stopAnalytics,
  track: sendAnalyticsEvent,
};
