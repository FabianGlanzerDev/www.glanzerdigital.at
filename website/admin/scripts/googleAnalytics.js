'use strict';

let ga4RefreshTimer = null;
let ga4RequestController = null;

const GA4_REFRESH_INTERVAL = 15000;
const GA4_REQUEST_TIMEOUT = 8000;


/** Returns whether the Firebase admin session is ready. @returns {boolean} Whether GA4 may load. */
function isGa4Ready() {
  return window.GlanzerAdminAuth?.isAuthenticated() === true;
}



/** Returns the protected GA4 API endpoint. @returns {string} The endpoint URL. */
function getGa4Endpoint() {
  return window.GlanzerAdminConfig?.endpoints?.googleAnalytics || './api/google-analytics.php';
}



/** Returns a Firebase ID token with a short timeout. @returns {Promise<string>} The ID token. */
async function getGa4AdminToken() {
  const getter = window.GlanzerAdminAuth?.getIdToken;
  if (typeof getter !== 'function') return '';
  const timeout = new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error('Firebase-Token Timeout.')), 5000);
  });
  return Promise.race([getter(), timeout]);
}



/** Updates one GA4 dashboard value. @param {string} name - Data attribute name. @param {unknown} value - Display value. @returns {void} */
function setGa4Value(name, value) {
  const element = document.querySelector(`[data-ga4="${name}"]`);
  if (element) element.textContent = String(value ?? '–');
}



/** Formats a numeric GA4 value for Austria. @param {unknown} value - Numeric input. @returns {string} Formatted number. */
function formatGa4Number(value) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('de-AT').format(number) : '–';
}



/** Updates the GA4 connection badge. @param {string} text - Status text. @param {string} state - Status class. @returns {void} */
function setGa4State(text, state = 'is-pending') {
  const element = document.querySelector('[data-ga4-state]');
  if (!element) return;
  element.classList.remove('is-pending', 'is-ok', 'is-error');
  element.classList.add(state);
  element.textContent = text;
}



/** Renders realtime values returned by the GA4 Data API. @param {Object} data - API response. @returns {void} */
function renderGa4Realtime(data = {}) {
  const realtime = data.realtime || {};
  setGa4Value('activeUsers', formatGa4Number(realtime.activeUsers));
  setGa4Value('screenPageViews', formatGa4Number(realtime.screenPageViews));
  setGa4Value('eventCount', formatGa4Number(realtime.eventCount));
  setGa4Value('topPage', realtime.topPage || '–');
  setGa4State('GA4 live', 'is-ok');
  window.GlanzerAdminUi?.setSystemState('ga4', 'is-ok', 'Realtime verbunden');
}



/** Fetches the server-side GA4 realtime report. @param {AbortSignal} signal - Abort signal. @returns {Promise<Object>} API response. */
async function fetchGa4Realtime(signal) {
  const token = await getGa4AdminToken();
  if (!token) throw new Error('Firebase-ID-Token fehlt.');
  const response = await fetch(`${getGa4Endpoint()}?_=${Date.now()}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'same-origin', cache: 'no-store', signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'GA4 Realtime konnte nicht geladen werden.');
  return data;
}



/** Refreshes GA4 realtime values without affecting local analytics. @returns {Promise<void>} */
async function refreshGa4() {
  if (!isGa4Ready()) return;
  ga4RequestController?.abort();
  ga4RequestController = new AbortController();
  const controller = ga4RequestController;
  const timeoutId = window.setTimeout(() => controller.abort(), GA4_REQUEST_TIMEOUT);

  try {
    renderGa4Realtime(await fetchGa4Realtime(controller.signal));
  } catch (error) {
    if (error?.name === 'AbortError') return;
    setGa4State(error?.message || 'GA4 nicht erreichbar', 'is-error');
    window.GlanzerAdminUi?.setSystemState('ga4', 'is-pending', error?.message || 'GA4 nicht erreichbar');
  } finally {
    window.clearTimeout(timeoutId);
    if (controller === ga4RequestController) ga4RequestController = null;
  }
}



/** Starts periodic GA4 realtime updates. @returns {void} */
function startGa4Polling() {
  if (ga4RefreshTimer) return;
  refreshGa4();
  ga4RefreshTimer = window.setInterval(() => {
    if (!document.hidden && isGa4Ready()) refreshGa4();
  }, GA4_REFRESH_INTERVAL);
}



/** Stops GA4 requests after admin logout. @returns {void} */
function stopGa4Polling() {
  if (ga4RefreshTimer) window.clearInterval(ga4RefreshTimer);
  ga4RefreshTimer = null;
  ga4RequestController?.abort();
  ga4RequestController = null;
}



/** Refreshes GA4 after returning to the tab. @returns {void} */
function handleGa4Visibility() {
  if (!document.hidden && isGa4Ready()) refreshGa4();
}


document.addEventListener('glanzer:auth-ready', startGa4Polling);
document.addEventListener('glanzer:auth-signed-out', stopGa4Polling);
document.addEventListener('visibilitychange', handleGa4Visibility);

window.GlanzerAdminGa4 = { refresh: refreshGa4 };
if (isGa4Ready()) startGa4Polling();
