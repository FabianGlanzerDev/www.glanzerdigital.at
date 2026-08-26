const layoutTemplates = window.LayoutTemplates;

const LOCAL_ROUTE_FILES = {
  '/': 'index.html',
  '/leistungen': 'subpages/leistungen.html',
  '/portfolio': 'subpages/portfolio.html',
  '/ueber-mich': 'subpages/ueber-mich.html',
  '/kontakt': 'subpages/kontakt.html',
  '/impressum': 'subpages/impressum.html',
  '/datenschutz': 'subpages/datenschutz.html',
};


/** Checks whether the website runs on a local development host. @returns {boolean} Whether local routing is required. */
function isLocalDevelopment() {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}



/** Converts clean production routes to local HTML files for Live Server. @returns {void} */
function adaptCleanRoutesForLocalDevelopment() {
  if (!isLocalDevelopment()) return;
  const rootPath = document.body.dataset.root || '.';
  document.querySelectorAll('a[href^="/"]').forEach((link) => {
    const url = new URL(link.href);
    const file = LOCAL_ROUTE_FILES[url.pathname];
    if (file) link.href = `${rootPath}/${file}${url.search}${url.hash}`;
  });
}




/** Returns navigation label. @param {boolean} open - The open value. @returns {unknown} The operation result. */
function getNavigationLabel(open) {
  const english = document.documentElement.lang === 'en';
  if (english) return open ? 'Close navigation' : 'Open navigation';
  return open ? 'Navigation schließen' : 'Navigation öffnen';
}



/** Renders global layout. @returns {void} The operation result. */
function renderGlobalLayout() {
  if (!layoutTemplates) return;
  const rootPath = document.body.dataset.root || '.';
  const activePage = document.body.dataset.page || '';
  const header = document.querySelector('[data-site-header]');
  const footer = document.querySelector('[data-site-footer]');
  if (header) header.innerHTML = layoutTemplates.getHeaderTemplate(rootPath, activePage);
  if (footer) footer.innerHTML = layoutTemplates.getFooterTemplate(rootPath);
}



/** Closes navigation. @returns {void} The operation result. */
function closeNavigation() {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navigation = document.querySelector('[data-nav]');
  if (!navToggle || !navigation) return;
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', getNavigationLabel(false));
  navigation.dataset.open = 'false';
  document.body.classList.remove('nav-open');
}



/** Toggles navigation. @returns {void} The operation result. */
function toggleNavigation() {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navigation = document.querySelector('[data-nav]');
  if (!navToggle || !navigation) return;
  const willOpen = navToggle.getAttribute('aria-expanded') !== 'true';
  navToggle.setAttribute('aria-expanded', String(willOpen));
  navToggle.setAttribute('aria-label', getNavigationLabel(willOpen));
  navigation.dataset.open = String(willOpen);
  document.body.classList.toggle('nav-open', willOpen);
}



/** Handles navigation click. @param {Event} event - The event value. @returns {void} The operation result. */
function handleNavigationClick(event) {
  if (event.target instanceof HTMLAnchorElement) closeNavigation();
}



/** Handles escape key. @param {Event} event - The event value. @returns {void} The operation result. */
function handleEscapeKey(event) {
  if (event.key === 'Escape') closeNavigation();
}



/** Handles viewport resize. @returns {void} The operation result. */
function handleViewportResize() {
  if (window.innerWidth > 880) closeNavigation();
}



/** Initializes navigation. @returns {void} The operation result. */
function initializeNavigation() {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navigation = document.querySelector('[data-nav]');
  if (!navToggle || !navigation) return;
  navToggle.addEventListener('click', toggleNavigation);
  navigation.addEventListener('click', handleNavigationClick);
  document.addEventListener('keydown', handleEscapeKey);
  window.addEventListener('resize', handleViewportResize);
}



/** Updates current year. @returns {void} The operation result. */
function updateCurrentYear() {
  const currentYear = String(new Date().getFullYear());
  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = currentYear;
  });
}



/** Initializes site. @returns {void} The operation result. */
function initializeSite() {
  renderGlobalLayout();
  adaptCleanRoutesForLocalDevelopment();
  initializeNavigation();
  updateCurrentYear();
}

const CONSENT_STORAGE_KEY = 'gd-consent';
const CONSENT_VERSION = 2;

const CONSENT_COPY = {
  de: { title: 'Datenschutz-Einstellungen', text: 'Wir verwenden notwendige Browser-Speicherungen für Sprache und Datenschutzeinstellungen. Mit deiner Zustimmung aktivieren wir unsere eigene Reichweitenmessung und Google Analytics 4 (GA4) für Seitenaufrufe und ausgewählte Interaktionen.', note: 'GA4 wird erst nach deiner Zustimmung geladen und kann Analyse-Cookies setzen. Keine Werbetracker.', accept: 'Statistik erlauben', reject: 'Ablehnen', privacy: 'Datenschutz ansehen' },
  en: { title: 'Privacy settings', text: 'We use necessary browser storage for language and privacy settings. With your consent, we activate our own audience measurement and Google Analytics 4 (GA4) for page views and selected interactions.', note: 'GA4 is only loaded after your consent and may set analytics cookies. No advertising trackers.', accept: 'Allow statistics', reject: 'Reject', privacy: 'View privacy policy' },
};

let analyticsInitialized = false;
let ga4ModulePromise = null;
let consentBanner = null;



/** Returns the stored consent choice. @returns {string|null} The current analytics consent choice. */
function getConsentChoice() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) || 'null');
    if (saved?.version !== CONSENT_VERSION) return null;
    return ['accepted', 'rejected'].includes(saved.analytics) ? saved.analytics : null;
  } catch {
    return null;
  }
}



/** Checks whether analytics consent is active. @returns {boolean} Whether analytics may run. */
function hasAnalyticsConsent() {
  return getConsentChoice() === 'accepted';
}



/** Stores the analytics consent choice locally. @param {string} choice - Accepted or rejected. @returns {void} */
function storeConsentChoice(choice) {
  const value = { version: CONSENT_VERSION, analytics: choice, updatedAt: new Date().toISOString() };
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(value));
}



/** Returns the privacy policy URL for the current environment. @returns {string} The privacy policy URL. */
function getConsentPrivacyUrl() {
  if (!isLocalDevelopment()) return '/datenschutz';
  const rootPath = document.body.dataset.root || '.';
  return `${rootPath}/subpages/datenschutz.html`;
}



/** Returns the consent copy for the active language. @returns {Object} Localized consent copy. */
function getConsentCopy() {
  const language = document.documentElement.lang === 'en' ? 'en' : 'de';
  return CONSENT_COPY[language];
}



/** Builds the consent banner markup. @returns {string} The consent banner markup. */
function getConsentMarkup() {
  const copy = getConsentCopy();
  return `<div class="consent-copy"><strong id="consent-title">${copy.title}</strong><p>${copy.text}</p><small>${copy.note}</small></div>
    <div class="consent-actions"><a href="${getConsentPrivacyUrl()}" class="consent-link">${copy.privacy}</a><button class="button button--secondary" type="button" data-consent-action="reject">${copy.reject}</button><button class="button button--primary" type="button" data-consent-action="accept">${copy.accept}</button></div>`;
}



/** Hides the consent banner. @returns {void} */
function hideConsentBanner() {
  if (consentBanner) consentBanner.hidden = true;
}



/** Shows the consent settings. @param {boolean} focus - Whether to focus the first decision button. @returns {void} */
function showConsentBanner(focus = true) {
  if (!consentBanner) return;
  consentBanner.innerHTML = getConsentMarkup();
  consentBanner.hidden = false;
  if (focus) consentBanner.querySelector('[data-consent-action="reject"]')?.focus();
}



/** Applies a consent choice and updates analytics. @param {string} choice - Accepted or rejected. @returns {void} */
function applyConsentChoice(choice) {
  storeConsentChoice(choice);
  if (choice === 'accepted') initializeAnalytics();
  else stopAnalytics();
  hideConsentBanner();
}



/** Handles interactions inside the consent banner. @param {Event} event - The click event. @returns {void} */
function handleConsentClick(event) {
  const button = event.target instanceof Element ? event.target.closest('[data-consent-action]') : null;
  if (!(button instanceof HTMLButtonElement)) return;
  applyConsentChoice(button.dataset.consentAction === 'accept' ? 'accepted' : 'rejected');
}



/** Refreshes an open banner after a language change. @returns {void} */
function refreshConsentLanguage() {
  if (consentBanner && !consentBanner.hidden) showConsentBanner(false);
}



/** Creates and initializes the site privacy controls. @returns {void} */
function initializeConsent() {
  consentBanner = document.createElement('section');
  consentBanner.className = 'consent-banner';
  consentBanner.setAttribute('role', 'dialog');
  consentBanner.setAttribute('aria-labelledby', 'consent-title');
  consentBanner.hidden = true;
  consentBanner.addEventListener('click', handleConsentClick);
  document.body.append(consentBanner);
  document.querySelector('[data-consent-settings]')?.addEventListener('click', () => showConsentBanner());
  window.addEventListener('gd:languagechange', refreshConsentLanguage);
  if (!getConsentChoice()) showConsentBanner(false);
}



/** Returns analytics device. @returns {string} The operation result. */
function getAnalyticsDevice() {
  if (window.innerWidth <= 620) return 'mobile';
  if (window.innerWidth <= 980) return 'tablet';
  return 'desktop';
}



/** Returns analytics screen. @returns {string} The operation result. */
function getAnalyticsScreen() {
  const width = window.innerWidth;
  if (width < 400) return '<400 px';
  if (width < 768) return '400–767 px';
  if (width < 1024) return '768–1023 px';
  if (width < 1440) return '1024–1439 px';
  return '1440+ px';
}



/** Returns analytics referrer. @returns {string} The operation result. */
function getAnalyticsReferrer() {
  if (!document.referrer) return '';
  try { return new URL(document.referrer).hostname.toLowerCase(); }
  catch { return ''; }
}



/** Returns analytics endpoint. @returns {string} The operation result. */
function getAnalyticsEndpoint() {
  return '/api/analytics-track.php';
}



/** Normalizes analytics label. @param {string} label - The label value. @returns {unknown} The operation result. */
function normalizeAnalyticsLabel(label) {
  return String(label || '').replace(/\s+/g, ' ').trim().slice(0, 60);
}



/** Builds analytics payload. @param {string} eventName - The event name value. @param {string} label - The label value. @returns {Object} The operation result. */
function buildAnalyticsPayload(eventName, label = '') {
  return {
    event: eventName, page: location.pathname, device: getAnalyticsDevice(),
    screen: getAnalyticsScreen(), referrer: getAnalyticsReferrer(),
    label: normalizeAnalyticsLabel(label), consent: true,
  };
}



/** Sends analytics event. @param {string} eventName - The event name value. @param {string} label - The label value. @returns {unknown} The operation result. */
function sendAnalyticsEvent(eventName, label = '') {
  if (!hasAnalyticsConsent()) return false;
  const payload = JSON.stringify(buildAnalyticsPayload(eventName, label));
  fetch(getAnalyticsEndpoint(), {
    method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin', cache: 'no-store', keepalive: true,
  }).catch(() => {});
  ga4ModulePromise?.then((module) => module.trackGoogleAnalyticsEvent(eventName, label));
  return true;
}



/** Returns link analytics event. @param {HTMLAnchorElement} link - The link value. @returns {unknown} The operation result. */
function getLinkAnalyticsEvent(link) {
  const href = link.getAttribute('href') || '';
  if (link.classList.contains('project-demo-button') || href.includes('/demos/')) return 'demo_click';
  if (href.includes('wa.me/') || href.startsWith('mailto:') || href.startsWith('tel:')) return 'contact_click';
  if (href.includes('github.com/')) return 'github_click';
  if (href.includes('/portfolio')) return 'portfolio_click';
  if (link.classList.contains('button')) return 'cta_click';
  return null;
}



/** Returns analytics label. @param {HTMLAnchorElement} link - The link value. @param {string} eventName - The event name value. @returns {string} The operation result. */
function getAnalyticsLabel(link, eventName) {
  if (link.dataset.analyticsLabel) return link.dataset.analyticsLabel;
  if (eventName === 'contact_click') return getContactLinkLabel(link);
  return link.textContent || link.getAttribute('aria-label') || '';
}



/** Returns contact link label. @param {HTMLAnchorElement} link - The link value. @returns {string} The operation result. */
function getContactLinkLabel(link) {
  const href = link.getAttribute('href') || '';
  if (href.includes('wa.me/')) return 'WhatsApp';
  if (href.startsWith('mailto:')) return 'E-Mail';
  if (href.startsWith('tel:')) return 'Telefon';
  return 'Kontakt';
}



/** Handles analytics click. @param {Event} event - The event value. @returns {void} The operation result. */
function handleAnalyticsClick(event) {
  const link = event.target instanceof Element ? event.target.closest('a') : null;
  if (!(link instanceof HTMLAnchorElement)) return;
  const eventName = getLinkAnalyticsEvent(link);
  if (eventName) sendAnalyticsEvent(eventName, getAnalyticsLabel(link, eventName));
}



/** Initializes analytics. @returns {void} The operation result. */
function initializeAnalytics() {
  if (analyticsInitialized || !hasAnalyticsConsent()) return;
  analyticsInitialized = true;
  if (!isLocalDevelopment()) {
    ga4ModulePromise ||= import('/scripts/googleAnalytics.js?v=20260826-2000');
    ga4ModulePromise.then((module) => module.initializeGoogleAnalytics());
  }
  sendAnalyticsEvent('page_view');
  document.addEventListener('click', handleAnalyticsClick, { passive: true });
}


/** Stops analytics after consent is withdrawn. @returns {void} */
function stopAnalytics() {
  ga4ModulePromise?.then((module) => module.disableGoogleAnalytics());
  if (!analyticsInitialized) return;
  document.removeEventListener('click', handleAnalyticsClick);
  analyticsInitialized = false;
}


window.GlanzerAnalytics = { track: sendAnalyticsEvent, hasConsent: hasAnalyticsConsent };window.GlanzerConsent = { open: () => showConsentBanner(), hasAnalyticsConsent };
initializeSite();
initializeConsent();
initializeAnalytics();
