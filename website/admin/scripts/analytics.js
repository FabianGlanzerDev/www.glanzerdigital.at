'use strict';

let selectedRange = '30';
let lastDashboardData = null;



/** Returns endpoint. @returns {string} The operation result. */
function getEndpoint() {
  return window.GlanzerAdminConfig?.endpoints?.analytics || './api/analytics.php';
}



/** Checks whether ready. @returns {boolean} The operation result. */
function isReady() {
  return window.GlanzerAdminAuth?.isAuthenticated() === true;
}



/** Returns token. @returns {Promise<unknown>} The operation result. */
async function getToken() {
  if (typeof window.GlanzerAdminAuth?.getIdToken !== 'function') return '';
  return window.GlanzerAdminAuth.getIdToken();
}



/** Updates text. @param {string} selector - The selector value. @param {unknown} value - The value value. @returns {void} The operation result. */
function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = String(value ?? '–');
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
  Object.entries(map).forEach(([name, key]) => setText(`[data-delta="${name}"]`, formatDelta(summary[key])));
  setText('[data-ratio="demos"]', `${formatPercent(summary.demosRate)} der Aufrufe`);
  setText('[data-ratio="contact"]', `${formatPercent(summary.contactRate)} der Aufrufe`);
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
  setText('[data-insight="bestHour"]', insights.bestHour || 'noch nicht erfasst');
  setText('[data-insight="bestDay"]', insights.bestDay || '–');
  setText('[data-insight="topProject"]', insights.topProject || 'Noch offen');
  setText('[data-insight="topProjectClicks"]', formatNumber(insights.topProjectClicks));
  setText('[data-live="lastEvent"]', formatTimestamp(insights.lastEvent));
}



/** Renders funnel. @param {Object} funnel - The funnel value. @returns {void} The operation result. */
function renderFunnel(funnel = {}) {
  ['pageviews', 'portfolio', 'demos', 'contact'].forEach((key) => {
    setText(`[data-funnel="${key}"]`, formatNumber(funnel[key]));
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
  if (empty) empty.hidden = false;
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
async function fetchDashboardData() {
  const token = await getToken();
  if (!token) throw new Error('Firebase-ID-Token fehlt.');
  const endpoint = `${getEndpoint()}?range=${encodeURIComponent(selectedRange)}`;
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Analytics konnten nicht geladen werden.');
  return data;
}



/** Returns the label for the active analytics range. @returns {string} The operation result. */
function rangeLabel() {
  return selectedRange === 'all' ? 'gesamter Zeitraum' : `${selectedRange} Tage`;
}



/** Runs the refresh dashboard operation. @returns {Promise<unknown>} The operation result. */
async function refreshDashboard() {
  if (!isReady()) return setText('[data-chart-state]', 'Anmeldung erforderlich');
  setText('[data-chart-state]', 'wird geladen …');
  try {
    renderDashboard(await fetchDashboardData());
    setText('[data-chart-state]', rangeLabel());
    window.GlanzerAdminUi?.setSystemState('analyticsApi', 'is-ok', 'Token geprüft / Daten geladen');
  } catch (error) {
    setText('[data-chart-state]', error.message || 'Fehler');
    window.GlanzerAdminUi?.setSystemState('analyticsApi', 'is-pending', error.message || 'API nicht erreichbar');
  }
}



/** Updates range. @param {string|number} range - The range value. @returns {void} The operation result. */
function setRange(range) {
  selectedRange = String(range || '30');
  refreshDashboard();
}



/** Initializes analytics panel. @returns {void} The operation result. */
function initializeAnalyticsPanel() {
  if (isReady()) refreshDashboard();
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


window.GlanzerAdminAnalytics = { exportAnalytics, initializeAnalyticsPanel, refreshDashboard, setRange };
