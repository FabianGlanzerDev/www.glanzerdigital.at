'use strict';

const LOCAL_ROUTE_FILES = {
  '/': 'index.html',
  '/leistungen': 'subpages/leistungen.html',
  '/portfolio': 'subpages/portfolio.html',
  '/ueber-mich': 'subpages/ueber-mich.html',
  '/kontakt': 'subpages/kontakt.html',
  '/impressum': 'subpages/impressum.html',
  '/datenschutz': 'subpages/datenschutz.html',
};


/** Checks whether the website runs on a local development host. */
function isLocalDevelopment() {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}


/** Converts clean production routes to local HTML files for Live Server. */
function adaptCleanRoutesForLocalDevelopment() {
  if (!isLocalDevelopment()) return;
  const rootPath = document.body.dataset.root || '.';
  document.querySelectorAll('a[href^="/"]').forEach((link) => adaptLocalLink(link, rootPath));
}


/** Converts one clean internal route to its local HTML equivalent. */
function adaptLocalLink(link, rootPath) {
  const url = new URL(link.href);
  const file = LOCAL_ROUTE_FILES[url.pathname];
  if (file) link.href = `${rootPath}/${file}${url.search}${url.hash}`;
}


/** Returns the German navigation label for the current state. */
function getNavigationLabel(open) {
  return open ? 'Navigation schließen' : 'Navigation öffnen';
}


/** Returns the current mobile-navigation controls. */
function getNavigationElements() {
  return {
    toggle: document.querySelector('[data-nav-toggle]'),
    navigation: document.querySelector('[data-nav]'),
  };
}


/** Closes the mobile navigation. */
function closeNavigation() {
  const { toggle, navigation } = getNavigationElements();
  if (!toggle || !navigation) return;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', getNavigationLabel(false));
  navigation.dataset.open = 'false';
  document.body.classList.remove('nav-open');
}


/** Toggles the mobile navigation. */
function toggleNavigation() {
  const { toggle, navigation } = getNavigationElements();
  if (!toggle || !navigation) return;
  const willOpen = toggle.getAttribute('aria-expanded') !== 'true';
  updateNavigationState(toggle, navigation, willOpen);
}


/** Applies the open/closed state to the mobile navigation. */
function updateNavigationState(toggle, navigation, open) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', getNavigationLabel(open));
  navigation.dataset.open = String(open);
  document.body.classList.toggle('nav-open', open);
}


/** Closes navigation after activating one of its links. */
function handleNavigationClick(event) {
  if (event.target instanceof HTMLAnchorElement) closeNavigation();
}


/** Closes navigation with the Escape key. */
function handleEscapeKey(event) {
  if (event.key === 'Escape') closeNavigation();
}


/** Closes the mobile menu after switching to desktop width. */
function handleViewportResize() {
  if (window.innerWidth > 880) closeNavigation();
}


/** Registers mobile-navigation event listeners. */
function initializeNavigation() {
  const { toggle, navigation } = getNavigationElements();
  if (!toggle || !navigation) return;
  toggle.addEventListener('click', toggleNavigation);
  navigation.addEventListener('click', handleNavigationClick);
  document.addEventListener('keydown', handleEscapeKey);
  window.addEventListener('resize', handleViewportResize);
}


/** Updates all visible copyright years. */
function updateCurrentYear() {
  const currentYear = String(new Date().getFullYear());
  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = currentYear;
  });
}


/** Initializes shared layout, navigation, consent and analytics. */
async function initializeSite() {
  await window.GlanzerLayout?.render();
  adaptCleanRoutesForLocalDevelopment();
  initializeNavigation();
  updateCurrentYear();
  await window.GlanzerConsent?.initialize();
  window.GlanzerAnalytics?.initialize();
}


initializeSite().catch((error) => console.error('Website konnte nicht vollständig initialisiert werden.', error));
