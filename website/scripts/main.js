const layoutTemplates = window.LayoutTemplates;



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
  initializeNavigation();
  updateCurrentYear();
}


initializeSite();



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
  const rootPath = document.body.dataset.root || '.';
  return `${rootPath}/api/analytics-track.php`;
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
    label: normalizeAnalyticsLabel(label),
  };
}



/** Sends analytics event. @param {string} eventName - The event name value. @param {string} label - The label value. @returns {unknown} The operation result. */
function sendAnalyticsEvent(eventName, label = '') {
  const payload = JSON.stringify(buildAnalyticsPayload(eventName, label));
  if (navigator.sendBeacon) return navigator.sendBeacon(getAnalyticsEndpoint(), new Blob([payload], { type: 'application/json' }));
  fetch(getAnalyticsEndpoint(), { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
}



/** Returns link analytics event. @param {HTMLAnchorElement} link - The link value. @returns {unknown} The operation result. */
function getLinkAnalyticsEvent(link) {
  const href = link.getAttribute('href') || '';
  if (link.classList.contains('project-demo-button') || href.includes('/demos/')) return 'demo_click';
  if (href.includes('wa.me/') || href.startsWith('mailto:') || href.startsWith('tel:')) return 'contact_click';
  if (href.includes('github.com/')) return 'github_click';
  if (href.includes('portfolio.html')) return 'portfolio_click';
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
  sendAnalyticsEvent('page_view');
  document.addEventListener('click', handleAnalyticsClick, { passive: true });
}


window.GlanzerAnalytics = { track: sendAnalyticsEvent };
initializeAnalytics();
