const layoutTemplates = window.LayoutTemplates;



/**
 * Inserts the shared header and footer into the current page.
 */
function renderGlobalLayout() {
  if (!layoutTemplates) return;
  const rootPath = document.body.dataset.root || '.';
  const activePage = document.body.dataset.page || '';
  const header = document.querySelector('[data-site-header]');
  const footer = document.querySelector('[data-site-footer]');
  if (header) header.innerHTML = layoutTemplates.getHeaderTemplate(rootPath, activePage);
  if (footer) footer.innerHTML = layoutTemplates.getFooterTemplate(rootPath);
}



/**
 * Closes the mobile navigation and restores its accessibility state.
 */
function closeNavigation() {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navigation = document.querySelector('[data-nav]');
  if (!navToggle || !navigation) return;
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Navigation öffnen');
  navigation.dataset.open = 'false';
  document.body.classList.remove('nav-open');
}



/**
 * Toggles the mobile navigation state.
 */
function toggleNavigation() {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navigation = document.querySelector('[data-nav]');
  if (!navToggle || !navigation) return;
  const willOpen = navToggle.getAttribute('aria-expanded') !== 'true';
  navToggle.setAttribute('aria-expanded', String(willOpen));
  navToggle.setAttribute('aria-label', willOpen ? 'Navigation schließen' : 'Navigation öffnen');
  navigation.dataset.open = String(willOpen);
  document.body.classList.toggle('nav-open', willOpen);
}



/**
 * Closes the mobile navigation after selecting a navigation link.
 * @param {MouseEvent} event - The click event inside the navigation.
 */
function handleNavigationClick(event) {
  if (event.target instanceof HTMLAnchorElement) closeNavigation();
}



/**
 * Closes the mobile navigation when Escape is pressed.
 * @param {KeyboardEvent} event - The keyboard event.
 */
function handleEscapeKey(event) {
  if (event.key === 'Escape') closeNavigation();
}



/**
 * Closes the mobile menu after switching back to desktop width.
 */
function handleViewportResize() {
  if (window.innerWidth > 880) closeNavigation();
}



/**
 * Registers all events required by the global navigation.
 */
function initializeNavigation() {
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navigation = document.querySelector('[data-nav]');
  if (!navToggle || !navigation) return;
  navToggle.addEventListener('click', toggleNavigation);
  navigation.addEventListener('click', handleNavigationClick);
  document.addEventListener('keydown', handleEscapeKey);
  window.addEventListener('resize', handleViewportResize);
}



/**
 * Writes the current year into all global year placeholders.
 */
function updateCurrentYear() {
  const currentYear = String(new Date().getFullYear());
  const yearElements = document.querySelectorAll('[data-current-year]');
  yearElements.forEach((element) => {
    element.textContent = currentYear;
  });
}



/**
 * Initializes the shared layout and global page behavior.
 */
function initializeSite() {
  renderGlobalLayout();
  initializeNavigation();
  updateCurrentYear();
}



initializeSite();


/**
 * Returns the coarse device class used by local analytics.
 * @returns {string} desktop, tablet or mobile.
 */
function getAnalyticsDevice() {
  if (window.innerWidth <= 620) return 'mobile';
  if (window.innerWidth <= 980) return 'tablet';
  return 'desktop';
}


/**
 * Builds the local analytics endpoint for the current page depth.
 * @returns {string} Relative endpoint URL.
 */
function getAnalyticsEndpoint() {
  const rootPath = document.body.dataset.root || '.';
  return `${rootPath}/api/analytics-track.php`;
}


/**
 * Sends one anonymous aggregate event to the local analytics endpoint.
 * @param {string} eventName - Allowed analytics event name.
 */
function sendAnalyticsEvent(eventName) {
  const payload = JSON.stringify({ event: eventName, page: location.pathname, device: getAnalyticsDevice() });
  if (navigator.sendBeacon) return navigator.sendBeacon(getAnalyticsEndpoint(), new Blob([payload], { type: 'application/json' }));
  fetch(getAnalyticsEndpoint(), { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
}


/**
 * Classifies a clicked link into a small, non-identifying event group.
 * @param {HTMLAnchorElement} link - Clicked link.
 * @returns {string|null} Event name or null.
 */
function getLinkAnalyticsEvent(link) {
  const href = link.getAttribute('href') || '';
  if (href.includes('/demos/') || href.startsWith('demos/')) return 'demo_click';
  if (href.includes('kontakt.html') || href.includes('wa.me/') || href.startsWith('mailto:') || href.startsWith('tel:')) return 'contact_click';
  if (href.includes('github.com/')) return 'github_click';
  if (href.includes('portfolio.html')) return 'portfolio_click';
  if (link.classList.contains('button')) return 'cta_click';
  return null;
}


/**
 * Tracks supported link interactions without storing personal identifiers.
 * @param {MouseEvent} event - Document click event.
 */
function handleAnalyticsClick(event) {
  const link = event.target instanceof Element ? event.target.closest('a') : null;
  if (!(link instanceof HTMLAnchorElement)) return;
  const eventName = getLinkAnalyticsEvent(link);
  if (eventName) sendAnalyticsEvent(eventName);
}


/**
 * Starts local, cookieless aggregate analytics.
 */
function initializeAnalytics() {
  sendAnalyticsEvent('page_view');
  document.addEventListener('click', handleAnalyticsClick, { passive: true });
}


initializeAnalytics();
