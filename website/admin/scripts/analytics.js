'use strict';

const ANALYTICS_FRONTEND_BUILD = '20260831-dashboard';
const ANALYTICS_REQUEST_TIMEOUT = 25000;
let selectedRange = '30';
let analyticsRequestController = null;
let analyticsInitialized = false;
let analyticsBootstrapTimer = null;

window.GLANZER_ANALYTICS_FRONTEND_BUILD = ANALYTICS_FRONTEND_BUILD;


/** Returns the historical analytics endpoint. */
function getAnalyticsEndpoint() {
  return './api/analytics-history-v2.php';
}


/** Returns whether Firebase admin authentication is ready. */
function isReady() {
  return window.GlanzerAdminAuth?.isAuthenticated() === true;
}


/** Returns a Firebase ID token with a short timeout. */
async function getAnalyticsToken() {
  if (typeof window.GlanzerAdminAuth?.getIdToken !== 'function') return '';
  const timeout = new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error('Firebase-Token Timeout.')), 5000);
  });
  return Promise.race([window.GlanzerAdminAuth.getIdToken(), timeout]);
}


/** Updates the visible historical-data status. */
function setHistoryStatus(value) {
  window.GlanzerAnalyticsRender?.setAnalyticsText('[data-history-status]', value);
}


/** Builds the analytics request URL for the current range. */
function buildAnalyticsRequestUrl(force) {
  const query = `range=${encodeURIComponent(selectedRange)}&force=${force ? '1' : '0'}&_=${Date.now()}`;
  return `${getAnalyticsEndpoint()}?${query}`;
}


/** Fetches the raw historical analytics response. */
async function fetchAnalyticsResponse(signal, force) {
  const token = await getAnalyticsToken();
  if (!token) throw new Error('Firebase-ID-Token fehlt.');
  return fetch(buildAnalyticsRequestUrl(force), {
    headers: { Authorization: `Bearer ${token}`, 'X-Firebase-ID-Token': token },
    credentials: 'same-origin', cache: 'no-store', signal,
  });
}


/** Parses one analytics response and adds build metadata. */
async function parseAnalyticsResponse(response) {
  const build = response.headers.get('X-Glanzer-Analytics-Build') || '';
  const contentType = response.headers.get('Content-Type') || '';
  const raw = await response.text();
  const data = parseAnalyticsJson(raw, response, contentType, build);
  validateAnalyticsResponse(response, data, build);
  return data;
}


/** Parses JSON and creates a useful diagnostics error when invalid. */
function parseAnalyticsJson(raw, response, contentType, build) {
  try { return JSON.parse(raw); }
  catch {
    const suffix = build ? ` · Build ${build}` : '';
    throw new Error(`Analytics API liefert kein gültiges JSON (HTTP ${response.status}, ${contentType || 'Content-Type fehlt'})${suffix}.`);
  }
}


/** Validates HTTP status and the expected dashboard schema. */
function validateAnalyticsResponse(response, data, build) {
  if (!response.ok) throw new Error(data.message || `Analytics API HTTP ${response.status}.`);
  if (data?.summary && Object.prototype.hasOwnProperty.call(data.summary, 'week')) return;
  const marker = data?.build || build || 'unbekannt';
  throw new Error(`Analytics API Schema unvollständig · Backend ${marker} · Frontend ${ANALYTICS_FRONTEND_BUILD}.`);
}


/** Loads and parses historical analytics data. */
async function fetchDashboardData(signal, force = false) {
  const response = await fetchAnalyticsResponse(signal, force);
  return parseAnalyticsResponse(response);
}


/** Returns the label for the active analytics range. */
function rangeLabel() {
  return selectedRange === 'all' ? 'gesamter Zeitraum' : `${selectedRange} Tage`;
}


/** Returns a human-readable status for the loaded source. */
function historyStatusForData(data = {}) {
  if (data.source === 'local-analytics-fallback') return `Lokale Statistik aktiv · ${data.warning || 'GA4 wird später erneut geladen.'}`;
  if (data.stale === true || data.source === 'ga4-cache-fallback') return 'GA4-Historie aus sicherem Cache geladen.';
  return 'GA4-Historie geladen.';
}


/** Creates and stores the AbortController for a new request. */
function startAnalyticsRequest() {
  analyticsRequestController?.abort();
  analyticsRequestController = new AbortController();
  return analyticsRequestController;
}


/** Updates the admin UI before historical data is requested. */
function showAnalyticsLoadingState() {
  window.GlanzerAnalyticsRender?.setAnalyticsText('[data-chart-state]', 'wird geladen …');
  setHistoryStatus('Historische GA4-Daten werden geladen …');
}


/** Applies one successful historical analytics response. */
function handleAnalyticsSuccess(data) {
  data.range = data.range || selectedRange;
  window.GlanzerAnalyticsRender?.renderDashboard(data);
  window.GlanzerAnalyticsRender?.setAnalyticsText('[data-chart-state]', rangeLabel());
  const status = historyStatusForData(data);
  setHistoryStatus(status);
  const state = data.source === 'local-analytics-fallback' ? 'is-pending' : 'is-ok';
  window.GlanzerAdminUi?.setSystemState('analyticsApi', state, status);
}


/** Converts a historical analytics error into a visible status. */
function handleAnalyticsError(error) {
  const message = error?.name === 'AbortError'
    ? 'GA4-Historie: Zeitüberschreitung beim Serverabruf.'
    : (error?.message || 'Analytics konnten nicht geladen werden.');
  window.GlanzerAnalyticsRender?.setAnalyticsText('[data-chart-state]', message);
  setHistoryStatus(message);
  window.GlanzerAdminUi?.setSystemState('analyticsApi', 'is-pending', message);
}


/** Refreshes the historical analytics dashboard. */
async function refreshDashboard(force = false) {
  if (!isReady()) return showAuthenticationRequired();
  const controller = startAnalyticsRequest();
  const timeoutId = window.setTimeout(() => controller.abort(), ANALYTICS_REQUEST_TIMEOUT);
  showAnalyticsLoadingState();
  await runAnalyticsRequest(controller, timeoutId, force);
}


/** Runs one request and ignores responses from superseded controllers. */
async function runAnalyticsRequest(controller, timeoutId, force) {
  try {
    const data = await fetchDashboardData(controller.signal, force);
    if (controller === analyticsRequestController) handleAnalyticsSuccess(data);
  } catch (error) {
    if (controller === analyticsRequestController) handleAnalyticsError(error);
  } finally {
    finishAnalyticsRequest(controller, timeoutId);
  }
}


/** Cleans up one completed analytics request. */
function finishAnalyticsRequest(controller, timeoutId) {
  window.clearTimeout(timeoutId);
  if (controller === analyticsRequestController) analyticsRequestController = null;
}


/** Shows the state used before Firebase authentication is ready. */
function showAuthenticationRequired() {
  setHistoryStatus('Firebase-Anmeldung erforderlich.');
  window.GlanzerAnalyticsRender?.setAnalyticsText('[data-chart-state]', 'Anmeldung erforderlich');
}


/** Updates the selected history range and refreshes the dashboard. */
function setRange(range) {
  selectedRange = String(range || '30');
  refreshDashboard();
}


/** Initializes the analytics panel once after authentication. */
function initializeAnalyticsPanel() {
  if (!isReady() || analyticsInitialized) return;
  analyticsInitialized = true;
  refreshDashboard();
}


/** Stops current analytics loading and resets initialization state. */
function stopAnalyticsPolling() {
  analyticsInitialized = false;
  analyticsRequestController?.abort();
  analyticsRequestController = null;
}


/** Starts or reuses the authentication bootstrap timer. */
function bootstrapAnalyticsPanel() {
  if (isReady()) return completeAnalyticsBootstrap();
  if (analyticsBootstrapTimer) return;
  analyticsBootstrapTimer = window.setInterval(checkAnalyticsBootstrap, 500);
}


/** Checks whether Firebase authentication became ready. */
function checkAnalyticsBootstrap() {
  if (isReady()) completeAnalyticsBootstrap();
}


/** Clears the bootstrap timer and initializes the panel. */
function completeAnalyticsBootstrap() {
  if (analyticsBootstrapTimer) window.clearInterval(analyticsBootstrapTimer);
  analyticsBootstrapTimer = null;
  initializeAnalyticsPanel();
}


/** Resets analytics UI after Firebase sign-out. */
function handleAnalyticsSignedOut() {
  stopAnalyticsPolling();
  if (analyticsBootstrapTimer) window.clearInterval(analyticsBootstrapTimer);
  analyticsBootstrapTimer = null;
  setHistoryStatus('Firebase-Anmeldung erforderlich.');
}


document.addEventListener('glanzer:auth-ready', bootstrapAnalyticsPanel);
document.addEventListener('glanzer:auth-signed-out', handleAnalyticsSignedOut);

window.GlanzerAdminAnalytics = {
  exportAnalytics: () => window.GlanzerAnalyticsRender?.exportAnalytics(),
  initializeAnalyticsPanel,
  refreshDashboard,
  setRange,
};

bootstrapAnalyticsPanel();
