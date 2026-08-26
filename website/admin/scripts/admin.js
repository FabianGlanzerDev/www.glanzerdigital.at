'use strict';



/** Updates the dashboard clock and date. @returns {void} The operation result. */
function updateClock() {
  const now = new Date();
  const time = document.querySelector('[data-clock-time]');
  const date = document.querySelector('[data-clock-date]');
  if (time) time.textContent = now.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
  if (date) date.textContent = now.toLocaleDateString('de-AT');
}



/** Updates active navigation. @param {unknown} id - The id value. @returns {void} The operation result. */
function setActiveNavigation(id) {
  document.querySelectorAll('.admin-nav a').forEach((link) => {
    link.toggleAttribute('aria-current', link.getAttribute('href') === `#${id}`);
  });
}



/** Handles section entries. @param {Array} entries - The entries value. @returns {void} The operation result. */
function handleSectionEntries(entries) {
  const visible = entries.find((entry) => entry.isIntersecting);
  if (visible) setActiveNavigation(visible.target.id);
}



/** Runs the observe admin sections operation. @returns {unknown} The operation result. */
function observeAdminSections() {
  const sections = document.querySelectorAll('[id].admin-section, #overview');
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(handleSectionEntries, { rootMargin: '-25% 0px -65%' });
  sections.forEach((section) => observer.observe(section));
}



/** Handles range click. @param {Event} event - The event value. @returns {void} The operation result. */
function handleRangeClick(event) {
  const button = event.target.closest('[data-range]');
  if (!(button instanceof HTMLButtonElement)) return;
  document.querySelectorAll('[data-range]').forEach((item) => item.removeAttribute('aria-pressed'));
  button.setAttribute('aria-pressed', 'true');
  window.GlanzerAdminAnalytics?.setRange(button.dataset.range || '30');
}



/** Initializes range buttons. @returns {void} The operation result. */
function initializeRangeButtons() {
  document.querySelector('.admin-range')?.addEventListener('click', handleRangeClick);
}



/** Returns admin token. @returns {Promise<unknown>} The operation result. */
async function getAdminToken() {
  return window.GlanzerAdminAuth?.getIdToken?.() || '';
}



/** Runs the fetch health data operation. @returns {Promise<unknown>} The operation result. */
async function fetchHealthData() {
  const token = await getAdminToken();
  const endpoint = window.GlanzerAdminConfig?.endpoints?.health || './api/health.php';
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Systemcheck fehlgeschlagen.');
  return data.checks || {};
}



/** Renders boolean health. @param {string} name - The name value. @param {boolean} ok - The ok value. @param {string} readyText - The ready text value. @param {string} errorText - The error text value. @returns {void} The operation result. */
function renderBooleanHealth(name, ok, readyText, errorText) {
  setSystemState(name, ok ? 'is-ok' : 'is-pending', ok ? readyText : errorText);
}



/** Renders health checks. @param {Object} checks - The checks value. @returns {void} The operation result. */
function renderHealthChecks(checks = {}) {
  renderBooleanHealth('privateStorage', checks.privateStorage, 'Privater Speicher schreibbar', 'Speicher nicht schreibbar');
  renderBooleanHealth('analyticsFile', checks.analyticsFile, 'Analytics-Datei bereit', 'Analytics-Datei prüfen');
  renderBooleanHealth('openssl', checks.openssl, 'OpenSSL verfügbar', 'OpenSSL fehlt');
  renderBooleanHealth('searchConsole', checks.searchConsole, 'Service-Account vorhanden', 'Service-Account fehlt');
  renderBooleanHealth('ga4', checks.ga4, 'Property und Service-Account vorhanden', 'GA4-Konfiguration fehlt');
  renderBooleanHealth('sitemap', checks.sitemap, 'Datei vorhanden', 'Datei fehlt');
  renderBooleanHealth('robots', checks.robots, 'Datei vorhanden', 'Datei fehlt');
}



/** Runs the run health check operation. @returns {Promise<unknown>} The operation result. */
async function runHealthCheck() {
  if (!window.GlanzerAdminAuth?.isAuthenticated()) return;
  try { renderHealthChecks(await fetchHealthData()); }
  catch { setSystemState('privateStorage', 'is-pending', 'Systemcheck nicht erreichbar'); }
}



/** Handles refresh click. @returns {void} The operation result. */
function handleRefreshClick() {
  window.GlanzerAdminAnalytics?.refreshDashboard();
  window.GlanzerAdminGa4?.refresh();
  window.GlanzerAdminMaintenance?.loadMaintenanceState();
  window.GlanzerAdminSearch?.refresh?.();
  runHealthCheck();
}



/** Handles export click. @returns {void} The operation result. */
function handleExportClick() {
  window.GlanzerAdminAnalytics?.exportAnalytics();
}



/** Initializes system actions. @returns {void} The operation result. */
function initializeSystemActions() {
  document.querySelector('[data-refresh-dashboard]')?.addEventListener('click', handleRefreshClick);
  document.querySelector('[data-action="check-health"]')?.addEventListener('click', runHealthCheck);
  document.querySelector('[data-action="export"]')?.addEventListener('click', handleExportClick);
}



/** Updates system state. @param {string} name - The name value. @param {string} state - The state value. @param {string} text - The text value. @returns {void} The operation result. */
function setSystemState(name, state, text) {
  const card = document.querySelector(`[data-system="${name}"]`);
  if (!card) return;
  card.classList.remove('is-pending', 'is-ok', 'is-error');
  if (state) card.classList.add(state);
  const label = card.querySelector('small');
  if (label) label.textContent = text;
}



/** Marks firebase ready. @returns {void} The operation result. */
function markFirebaseReady() {
  setSystemState('firebase', 'is-ok', 'Firebase Auth verbunden');
  setSystemState('token', 'is-ok', 'ID-Token verfügbar');
}



/** Handles authenticated. @returns {void} The operation result. */
function handleAuthenticated() {
  markFirebaseReady();
  window.GlanzerAdminAnalytics?.initializeAnalyticsPanel();
  window.GlanzerAdminMaintenance?.initializeMaintenancePanel();
  runHealthCheck();
}



/** Initializes admin dashboard. @returns {void} The operation result. */
function initializeAdminDashboard() {
  initializeRangeButtons();
  initializeSystemActions();
  observeAdminSections();
  updateClock();
  window.setInterval(updateClock, 30000);
  document.addEventListener('glanzer:auth-ready', handleAuthenticated);
  if (window.GlanzerAdminAuth?.isAuthenticated()) handleAuthenticated();
}


window.GlanzerAdminUi = { setSystemState };
initializeAdminDashboard();
