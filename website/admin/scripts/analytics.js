'use strict';

let selectedRange = '30';


function getEndpoint() {
  return window.GlanzerAdminConfig?.endpoints?.analytics || './api/analytics.php';
}


function isReady() {
  return window.GlanzerAdminAuth?.isAuthenticated() === true;
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


function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}


function createRankingItem(item) {
  const label = escapeHtml(item.label ?? item.name ?? '–');
  const value = formatNumber(item.value ?? item.count);
  return `<li><span>${label}</span><strong>${value}</strong></li>`;
}


function renderRanking(name, rows = []) {
  const list = document.querySelector(`[data-ranking="${name}"]`);
  if (!list) return;
  list.innerHTML = rows.length ? rows.slice(0, 6).map(createRankingItem).join('') : '<li><span>Keine Daten</span><strong>–</strong></li>';
}


function renderRankings(data = {}) {
  const names = ['landingPages', 'referrers', 'pages', 'demos', 'exitPages', 'portfolio', 'ctas', 'browsers', 'operatingSystems', 'screens'];
  names.forEach((name) => renderRanking(name, data[name] || []));
}


function renderInsights(insights = {}) {
  setText('[data-insight="bestHour"]', insights.bestHour || 'noch nicht erfasst');
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


function updateDistributionRow(row, item = {}) {
  const percent = Number(item.percent) || 0;
  const label = row.querySelector('span');
  const bar = row.querySelector('i');
  const value = row.querySelector('strong');
  if (label && item.label) label.textContent = item.label;
  if (bar) bar.style.setProperty('--value', `${Math.max(0, Math.min(100, percent))}%`);
  if (value) value.textContent = formatPercent(percent);
}


function renderSourceDistribution(sources = []) {
  const rows = document.querySelectorAll('[data-source-distribution] > div');
  rows.forEach((row, index) => updateDistributionRow(row, sources[index]));
}


function updateDeviceLegend(values) {
  document.querySelectorAll('[data-legend="devices"] strong').forEach((element, index) => {
    element.textContent = values[index] || '–';
  });
}


function renderDevices(devices = {}) {
  const values = ['desktop', 'tablet', 'mobile'].map((key) => Number(devices[key]) || 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  updateDeviceLegend(total ? values.map((value) => formatPercent(value / total * 100)) : ['–', '–', '–']);
  renderDeviceDonut(values, total);
}


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


function showEmptyChart(empty = document.querySelector('.admin-chart-empty')) {
  const line = document.querySelector('[data-chart-line]');
  if (line) line.style.opacity = '0.18';
  if (empty) empty.hidden = false;
}


function renderDashboard(data = {}) {
  renderSummary(data.summary || {});
  renderRankings(data.rankings || {});
  renderInsights(data.insights || {});
  renderFunnel(data.funnel || {});
  renderSourceDistribution(data.sources || []);
  renderDevices(data.devices || {});
  renderSeries(data.series || []);
}


async function fetchDashboardData() {
  const token = await getToken();
  if (!token) throw new Error('Firebase-ID-Token fehlt.');
  const endpoint = `${getEndpoint()}?range=${encodeURIComponent(selectedRange)}`;
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Analytics konnten nicht geladen werden.');
  return data;
}


function rangeLabel() {
  return selectedRange === 'all' ? 'gesamter Zeitraum' : `${selectedRange} Tage`;
}


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


function setRange(range) {
  selectedRange = String(range || '30');
  refreshDashboard();
}


function initializeAnalyticsPanel() {
  if (isReady()) refreshDashboard();
}


window.GlanzerAdminAnalytics = { initializeAnalyticsPanel, refreshDashboard, setRange };
