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
