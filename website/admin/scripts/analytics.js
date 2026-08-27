'use strict';

const ANALYTICS_FRONTEND_BUILD = '20260827-endpoint-reset-4';
window.GLANZER_ANALYTICS_FRONTEND_BUILD = ANALYTICS_FRONTEND_BUILD;

let selectedRange = '30';
let lastDashboardData = null;
let analyticsRefreshTimer = null;
let analyticsRequestController = null;
let analyticsInitialized = false;

const ANALYTICS_REQUEST_TIMEOUT = 25000;



/** Returns endpoint. @returns {string} The operation result. */
function getAnalyticsEndpoint() {
  return './api/analytics-history-v2.php';
}



/** Checks whether ready. @returns {boolean} The operation result. */
function isReady() {
  return window.GlanzerAdminAuth?.isAuthenticated() === true;
}



/** Returns token. @returns {Promise<unknown>} The operation result. */
async function getAnalyticsToken() {
  if (typeof window.GlanzerAdminAuth?.getIdToken !== 'function') return '';
  const timeout = new Promise((_, reject) => {
    window.setTimeout(() => reject(new Error('Firebase-Token Timeout.')), 5000);
  });
  return Promise.race([window.GlanzerAdminAuth.getIdToken(), timeout]);
}



/** Updates text. @param {string} selector - The selector value. @param {unknown} value - The value value. @returns {void} The operation result. */
function setAnalyticsText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = String(value ?? '–');
}


/** Updates the visible historical GA4 status. @param {string} value - Status text. @returns {void} */
function setHistoryStatus(value) {
  setAnalyticsText('[data-history-status]', value);
}



/** Updates stat. @param {string} name - The name value. @param {unknown} value - The value value. @returns {void} The operation result. */
function setStat(name, value) {
  document.querySelectorAll(`[data-stat="${name}"]`).forEach((element) => {
    element.textContent = String(value ?? '–');
  });
}



/** Formats number. @param {unknown} value - The value value. @returns {string} The operation result. */
function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('de-AT').format(number) : '–';
}



/** Formats percent. @param {unknown} value - The value value. @returns {string} The operation result. */
function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(1).replace('.', ',')} %` : '–';
}



/** Formats delta. @param {unknown} value - The value value. @returns {string} The operation result. */
function formatDelta(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'kein Vergleich';
  const prefix = number > 0 ? '+' : '';
  return `${prefix}${number.toFixed(1).replace('.', ',')} %`;
}



/** Renders comparisons. @param {Object} summary - The summary value. @returns {void} The operation result. */
function renderComparisons(summary = {}) {
  const map = { today: 'todayDelta', yesterday: 'yesterdayDelta', week: 'weekDelta', month: 'monthDelta' };
  Object.entries(map).forEach(([name, key]) => setAnalyticsText(`[data-delta="${name}"]`, formatDelta(summary[key])));
  setAnalyticsText('[data-ratio="demos"]', `${formatPercent(summary.demosRate)} der Aufrufe`);
  setAnalyticsText('[data-ratio="contact"]', `${formatPercent(summary.contactRate)} der Aufrufe`);
}



/** Renders summary. @param {Object} summary - The summary value. @returns {void} The operation result. */
function renderSummary(summary = {}) {
  ['today', 'yesterday', 'week', 'month', 'total', 'demos', 'contact', 'github', 'activeNow'].forEach((key) => {
    setStat(key, formatNumber(summary[key]));
  });
  setStat('conversion', formatPercent(summary.conversion));
  setStat('contactRate', formatPercent(summary.contactRate));
  renderComparisons(summary);
}



/** Escapes html. @param {unknown} value - The value value. @returns {string} The operation result. */
function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}



/** Creates ranking item. @param {Object} item - The item value. @returns {unknown} The operation result. */
function createRankingItem(item) {
  const label = escapeHtml(item.label ?? item.name ?? '–');
  const value = formatNumber(item.value ?? item.count);
  return `<li><span>${label}</span><strong>${value}</strong></li>`;
}



/** Renders ranking. @param {string} name - The name value. @param {Array} rows - The rows value. @returns {void} The operation result. */
function renderRanking(name, rows = []) {
  const list = document.querySelector(`[data-ranking="${name}"]`);
  if (!list) return;
  list.innerHTML = rows.length ? rows.slice(0, 6).map(createRankingItem).join('') : '<li><span>Keine Daten</span><strong>–</strong></li>';
}



/** Renders rankings. @param {Object} data - The data value. @returns {void} The operation result. */
function renderRankings(data = {}) {
  const names = ['landingPages', 'referrers', 'pages', 'demos', 'contacts', 'portfolio', 'ctas', 'browsers', 'operatingSystems', 'screens'];
  names.forEach((name) => renderRanking(name, data[name] || []));
}



/** Formats timestamp. @param {unknown} value - The value value. @returns {string} The operation result. */
function formatTimestamp(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return '–';
  return date.toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' });
}



/** Renders insights. @param {Object} insights - The insights value. @returns {void} The operation result. */
function renderInsights(insights = {}) {
  setAnalyticsText('[data-insight="bestHour"]', insights.bestHour || 'noch nicht erfasst');
  setAnalyticsText('[data-insight="bestDay"]', insights.bestDay || '–');
  setAnalyticsText('[data-insight="topProject"]', insights.topProject || 'Noch offen');
  setAnalyticsText('[data-insight="topProjectClicks"]', formatNumber(insights.topProjectClicks));
  setAnalyticsText('[data-live="lastEvent"]', formatTimestamp(insights.lastEvent));
}



/** Renders funnel. @param {Object} funnel - The funnel value. @returns {void} The operation result. */
function renderFunnel(funnel = {}) {
  ['pageviews', 'portfolio', 'demos', 'contact'].forEach((key) => {
    setAnalyticsText(`[data-funnel="${key}"]`, formatNumber(funnel[key]));
  });
}



/** Updates distribution row. @param {unknown} row - The row value. @param {Object} item - The item value. @returns {void} The operation result. */
function updateDistributionRow(row, item = {}) {
  const percent = Number(item.percent) || 0;
  const label = row.querySelector('span');
  const bar = row.querySelector('i');
  const value = row.querySelector('strong');
  if (label && item.label) label.textContent = item.label;
  if (bar) bar.style.setProperty('--value', `${Math.max(0, Math.min(100, percent))}%`);
  if (value) value.textContent = formatPercent(percent);
}



/** Renders source distribution. @param {Array} sources - The sources value. @returns {void} The operation result. */
function renderSourceDistribution(sources = []) {
  const rows = document.querySelectorAll('[data-source-distribution] > div');
  rows.forEach((row, index) => updateDistributionRow(row, sources[index]));
}



/** Updates device legend. @param {Array} values - The values value. @returns {void} The operation result. */
function updateDeviceLegend(values) {
  document.querySelectorAll('[data-legend="devices"] strong').forEach((element, index) => {
    element.textContent = values[index] || '–';
  });
}



/** Renders devices. @param {Object} devices - The devices value. @returns {void} The operation result. */
function renderDevices(devices = {}) {
  const values = ['desktop', 'tablet', 'mobile'].map((key) => Number(devices[key]) || 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  updateDeviceLegend(total ? values.map((value) => formatPercent(value / total * 100)) : ['–', '–', '–']);
  renderDeviceDonut(values, total);
}



/** Renders device donut. @param {Array} values - The values value. @param {unknown} total - The total value. @returns {void} The operation result. */
function renderDeviceDonut(values, total) {
  const donut = document.querySelector('[data-donut="devices"]');
  if (!donut) return;
  const label = donut.querySelector('span');
  if (label) label.textContent = total ? formatNumber(total) : '–';
  if (!total) return;
  const desktop = values[0] / total * 100;
  const tablet = values[1] / total * 100;
  donut.style.background = `conic-gradient(#3d8dff 0 ${desktop}%, #21c7ff ${desktop}% ${desktop + tablet}%, #826fff ${desktop + tablet}% 100%)`;
}



/** Renders series. @param {Array} series - The series value. @returns {void} The operation result. */
function renderSeries(series = []) {
  const line = document.querySelector('[data-chart-line]');
  const empty = document.querySelector('.admin-chart-empty');
  if (!line || !series.length) return showEmptyChart(empty);
  const max = Math.max(1, ...series.map((item) => Number(item.views) || 0));
  const denominator = Math.max(1, series.length - 1);
  const points = series.map((item, index) => `${index / denominator * 900},${230 - (Number(item.views) || 0) / max * 190}`);
  line.setAttribute('points', points.join(' '));
  line.style.opacity = '1';
  if (empty) empty.hidden = true;
}




/** Shows empty chart. @param {HTMLElement} empty - The empty chart element. @returns {void} The operation result. */
function showEmptyChart(empty = document.querySelector('.admin-chart-empty')) {
  const line = document.querySelector('[data-chart-line]');
  if (line) line.style.opacity = '0.18';
  if (empty) {
    empty.textContent = 'Noch keine Statistikdaten im gewählten Zeitraum.';
    empty.hidden = false;
  }
}



/** Renders dashboard. @param {Object} data - The data value. @returns {void} The operation result. */
function renderDashboard(data = {}) {
  lastDashboardData = data;
  const exportButton = document.querySelector('[data-action="export"]');
  if (exportButton) exportButton.disabled = false;
  renderSummary(data.summary || {});
  renderRankings(data.rankings || {});
  renderInsights(data.insights || {});
  renderFunnel(data.funnel || {});
  renderSourceDistribution(data.sources || []);
  renderDevices(data.devices || {});
  renderSeries(data.series || []);
}



/** Runs the fetch dashboard data operation. @returns {Promise<unknown>} The operation result. */
async function fetchDashboardData(signal, force = false) {
  const token = await getAnalyticsToken();
  if (!token) throw new Error('Firebase-ID-Token fehlt.');
  const query = `range=${encodeURIComponent(selectedRange)}&force=${force ? '1' : '0'}&_=${Date.now()}`;
  const response = await fetch(`${getAnalyticsEndpoint()}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
  });
  const build = response.headers.get('X-Glanzer-Analytics-Build') || '';
  const contentType = response.headers.get('Content-Type') || '';
  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    const suffix = build ? ` · Build ${build}` : '';
    throw new Error(`Analytics API liefert kein gültiges JSON (HTTP ${response.status}, ${contentType || 'Content-Type fehlt'})${suffix}.`);
  }
  if (!response.ok) throw new Error(data.message || `Analytics API HTTP ${response.status}.`);
  if (!data?.summary || !Object.prototype.hasOwnProperty.call(data.summary, 'week')) {
    const marker = data?.build || build || 'unbekannt';
    throw new Error(`Analytics API Schema unvollständig · Backend ${marker} · Frontend ${ANALYTICS_FRONTEND_BUILD}.`);
  }
  return data;
}



/** Returns the label for the active analytics range. @returns {string} The operation result. */
function rangeLabel() {
  return selectedRange === 'all' ? 'gesamter Zeitraum' : `${selectedRange} Tage`;
}



/** Returns the status text for the loaded analytics source. @param {Object} data - Dashboard response. @returns {string} Status text. */
function historyStatusForData(data = {}) {
  if (data.source === 'local-analytics-fallback') return `Lokale Statistik aktiv · ${data.warning || 'GA4 wird später erneut geladen.'}`;
  if (data.stale === true || data.source === 'ga4-cache-fallback') return 'GA4-Historie aus sicherem Cache geladen.';
  return 'GA4-Historie geladen.';
}



/** Runs the refresh dashboard operation. @returns {Promise<unknown>} The operation result. */
async function refreshDashboard(force = false) {
  if (!isReady()) {
    setHistoryStatus('Firebase-Anmeldung erforderlich.');
    return setAnalyticsText('[data-chart-state]', 'Anmeldung erforderlich');
  }

  analyticsRequestController?.abort();
  analyticsRequestController = new AbortController();
  const controller = analyticsRequestController;
  const timeoutId = window.setTimeout(() => controller.abort(), ANALYTICS_REQUEST_TIMEOUT);

  setAnalyticsText('[data-chart-state]', 'wird geladen …');
  setHistoryStatus('Historische GA4-Daten werden geladen …');

  try {
    const data = await fetchDashboardData(controller.signal, force);
    if (controller !== analyticsRequestController) return;
    renderDashboard(data);
    setAnalyticsText('[data-chart-state]', rangeLabel());
    const status = historyStatusForData(data);
    setHistoryStatus(status);
    window.GlanzerAdminUi?.setSystemState('analyticsApi', data.source === 'local-analytics-fallback' ? 'is-pending' : 'is-ok', status);
  } catch (error) {
    if (controller !== analyticsRequestController) return;
    const message = error?.name === 'AbortError'
      ? 'GA4-Historie: Zeitüberschreitung beim Serverabruf.'
      : (error?.message || 'Analytics konnten nicht geladen werden.');
    setAnalyticsText('[data-chart-state]', message);
    setHistoryStatus(message);
    window.GlanzerAdminUi?.setSystemState('analyticsApi', 'is-pending', message);
  } finally {
    window.clearTimeout(timeoutId);
    if (controller === analyticsRequestController) analyticsRequestController = null;
  }
}



/** Updates range. @param {string|number} range - The range value. @returns {void} The operation result. */
function setRange(range) {
  selectedRange = String(range || '30');
  refreshDashboard();
}



/** Initializes analytics panel. @returns {void} The operation result. */
function initializeAnalyticsPanel() {
  if (!isReady() || analyticsInitialized) return;
  analyticsInitialized = true;
  refreshDashboard();
}


function stopAnalyticsPolling() {
  analyticsInitialized = false;
  analyticsRequestController?.abort();
  analyticsRequestController = null;
}



/** Exports analytics. @returns {void} The operation result. */
function exportAnalytics() {
  if (!lastDashboardData) return;
  const content = JSON.stringify(lastDashboardData, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `glanzerdigital-analytics-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}


let analyticsBootstrapTimer = null;


function bootstrapAnalyticsPanel() {
  if (isReady()) {
    if (analyticsBootstrapTimer) window.clearInterval(analyticsBootstrapTimer);
    analyticsBootstrapTimer = null;
    initializeAnalyticsPanel();
    return;
  }

  if (analyticsBootstrapTimer) return;
  analyticsBootstrapTimer = window.setInterval(() => {
    if (!isReady()) return;
    window.clearInterval(analyticsBootstrapTimer);
    analyticsBootstrapTimer = null;
    initializeAnalyticsPanel();
  }, 500);
}


function handleAnalyticsSignedOut() {
  analyticsInitialized = false;
  stopAnalyticsPolling();
  if (analyticsBootstrapTimer) window.clearInterval(analyticsBootstrapTimer);
  analyticsBootstrapTimer = null;
  setHistoryStatus('Firebase-Anmeldung erforderlich.');
}


document.addEventListener('glanzer:auth-ready', bootstrapAnalyticsPanel);
document.addEventListener('glanzer:auth-signed-out', handleAnalyticsSignedOut);

window.GlanzerAdminAnalytics = { exportAnalytics, initializeAnalyticsPanel, refreshDashboard, setRange };
bootstrapAnalyticsPanel();
