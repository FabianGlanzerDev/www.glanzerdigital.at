'use strict';

let selectedRange = '30';


function getConfig() {
  return window.GLANZER_ADMIN_CONFIG || {};
}


function isReady() {
  return window.GlanzerAdminAuth?.isFirebaseConfigured() === true;
}


async function getToken() {
  if (typeof window.GlanzerAdminAuth?.getIdToken !== 'function') return '';
  return window.GlanzerAdminAuth.getIdToken();
}


function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = String(value ?? '–');
}


function setStat(name, value) {
  document.querySelectorAll(`[data-stat="${name}"]`).forEach((element) => {
    element.textContent = String(value ?? '–');
  });
}


function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('de-AT').format(number) : '–';
}


function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(1).replace('.', ',')} %` : '–';
}


function renderSummary(summary = {}) {
  ['today', 'yesterday', 'week', 'month', 'total', 'demos', 'contact', 'github', 'activeNow'].forEach((key) => {
    setStat(key, formatNumber(summary[key]));
  });
  setStat('conversion', formatPercent(summary.conversion));
  setStat('contactRate', formatPercent(summary.contactRate));
}


function renderRanking(name, rows = []) {
  const list = document.querySelector(`[data-ranking="${name}"]`);
  if (!list) return;
  list.innerHTML = rows.length ? rows.slice(0, 6).map(createRankingItem).join('') : '<li><span>Keine Daten</span><strong>–</strong></li>';
}


function createRankingItem(item) {
  const label = escapeHtml(item.label ?? item.name ?? '–');
  const value = formatNumber(item.value ?? item.count);
  return `<li><span>${label}</span><strong>${value}</strong></li>`;
}


function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}


function renderRankings(data = {}) {
  ['landingPages', 'referrers', 'pages', 'demos', 'exitPages', 'portfolio', 'ctas', 'browsers', 'operatingSystems', 'screens'].forEach((name) => {
    renderRanking(name, data[name] || []);
  });
}


function renderInsights(insights = {}) {
  setText('[data-insight="bestHour"]', insights.bestHour || '–');
  setText('[data-insight="bestDay"]', insights.bestDay || '–');
  setText('[data-insight="topProject"]', insights.topProject || 'Noch offen');
  setText('[data-insight="topProjectClicks"]', formatNumber(insights.topProjectClicks));
  setText('[data-live="lastEvent"]', insights.lastEvent || '–');
}


function renderFunnel(funnel = {}) {
  ['pageviews', 'portfolio', 'demos', 'contact'].forEach((key) => {
    setText(`[data-funnel="${key}"]`, formatNumber(funnel[key]));
  });
}


function renderSourceDistribution(sources = []) {
  const rows = document.querySelectorAll('[data-source-distribution] > div');
  rows.forEach((row, index) => updateDistributionRow(row, sources[index]));
}


function updateDistributionRow(row, item = {}) {
  const percent = Number(item.percent) || 0;
  const label = row.querySelector('span');
  const bar = row.querySelector('i');
  const value = row.querySelector('strong');
  if (label && item.label) label.textContent = item.label;
  if (bar) bar.style.setProperty('--value', `${Math.max(0, Math.min(100, percent))}%`);
  if (value) value.textContent = formatPercent(percent);
}


function renderDevices(devices = {}) {
  const desktop = Number(devices.desktop) || 0;
  const tablet = Number(devices.tablet) || 0;
  const mobile = Number(devices.mobile) || 0;
  const total = desktop + tablet + mobile;
  updateDeviceLegend(desktop, tablet, mobile, total);
  updateDeviceDonut(desktop, tablet, mobile, total);
}


function updateDeviceLegend(desktop, tablet, mobile, total) {
  const values = total ? [desktop, tablet, mobile].map((value) => formatPercent(value / total * 100)) : ['–', '–', '–'];
  document.querySelectorAll('[data-legend="devices"] strong').forEach((element, index) => { element.textContent = values[index] || '–'; });
}


function updateDeviceDonut(desktop, tablet, mobile, total) {
  const donut = document.querySelector('[data-donut="devices"]');
  if (!donut || !total) return;
  const d = desktop / total * 100;
  const t = tablet / total * 100;
  donut.style.background = `conic-gradient(#3d8dff 0 ${d}%, #21c7ff ${d}% ${d + t}%, #826fff ${d + t}% 100%)`;
  const label = donut.querySelector('span');
  if (label) label.textContent = formatNumber(total);
}


function renderDashboard(data = {}) {
  renderSummary(data.summary || {});
  renderRankings(data.rankings || {});
  renderInsights(data.insights || {});
  renderFunnel(data.funnel || {});
  renderSourceDistribution(data.sources || []);
  renderDevices(data.devices || {});
}


async function fetchDashboardData() {
  const token = await getToken();
  if (!token) throw new Error('Firebase-ID-Token fehlt.');
  const endpoint = `${getConfig().analyticsEndpoint}?range=${encodeURIComponent(selectedRange)}`;
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!response.ok) throw new Error('Analytics konnten nicht geladen werden.');
  return response.json();
}


function showUnavailableState() {
  setText('[data-chart-state]', 'Firebase noch nicht verbunden');
}


async function refreshDashboard() {
  if (!isReady()) return showUnavailableState();
  try { renderDashboard(await fetchDashboardData()); setText('[data-chart-state]', `${selectedRange} Tage`); }
  catch (error) { setText('[data-chart-state]', error.message || 'Fehler'); }
}


function setRange(range) {
  selectedRange = String(range || '30');
  refreshDashboard();
}


function initializeAnalyticsPanel() {
  if (!isReady()) return showUnavailableState();
  refreshDashboard();
}


window.GlanzerAdminAnalytics = { initializeAnalyticsPanel, refreshDashboard, setRange };
