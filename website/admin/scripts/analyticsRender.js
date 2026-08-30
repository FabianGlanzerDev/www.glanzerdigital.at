'use strict';

let lastDashboardData = null;


/** Updates one analytics text target. */
function setAnalyticsText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = String(value ?? '–');
}


/** Updates one named analytics statistic. */
function setStat(name, value) {
  document.querySelectorAll(`[data-stat="${name}"]`).forEach((element) => {
    element.textContent = String(value ?? '–');
  });
}


/** Formats a numeric analytics value for de-AT. */
function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('de-AT').format(number) : '–';
}


/** Formats a percent value for de-AT. */
function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(1).replace('.', ',')} %` : '–';
}


/** Formats a percentage delta. */
function formatDelta(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'kein Vergleich';
  return `${number > 0 ? '+' : ''}${number.toFixed(1).replace('.', ',')} %`;
}


/** Renders summary comparison values. */
function renderComparisons(summary = {}) {
  const map = { today: 'todayDelta', yesterday: 'yesterdayDelta', week: 'weekDelta', month: 'monthDelta' };
  Object.entries(map).forEach(([name, key]) => setAnalyticsText(`[data-delta="${name}"]`, formatDelta(summary[key])));
  setAnalyticsText('[data-ratio="demos"]', `${formatPercent(summary.demosRate)} der Aufrufe`);
  setAnalyticsText('[data-ratio="contact"]', `${formatPercent(summary.contactRate)} der Aufrufe`);
}


/** Renders the dashboard summary cards. */
function renderSummary(summary = {}) {
  const keys = ['today', 'yesterday', 'week', 'month', 'total', 'demos', 'contact', 'github', 'activeNow'];
  keys.forEach((key) => setStat(key, formatNumber(summary[key])));
  setStat('conversion', formatPercent(summary.conversion));
  setStat('contactRate', formatPercent(summary.contactRate));
  renderComparisons(summary);
}


/** Creates one ranking row using DOM nodes instead of HTML strings. */
function createRankingItem(item = {}) {
  const row = document.createElement('li');
  const label = document.createElement('span');
  const value = document.createElement('strong');
  label.textContent = String(item.label ?? item.name ?? '–');
  value.textContent = formatNumber(item.value ?? item.count);
  row.append(label, value);
  return row;
}


/** Replaces one ranking list with current rows or an empty state. */
function renderRanking(name, rows = []) {
  const list = document.querySelector(`[data-ranking="${name}"]`);
  if (!list) return;
  const items = rows.length ? rows.slice(0, 6).map(createRankingItem) : [createRankingItem({ label: 'Keine Daten', value: null })];
  list.replaceChildren(...items);
}


/** Renders all ranking lists. */
function renderRankings(data = {}) {
  const names = ['landingPages', 'referrers', 'pages', 'demos', 'contacts', 'portfolio', 'ctas', 'browsers', 'operatingSystems', 'screens'];
  names.forEach((name) => renderRanking(name, data[name] || []));
}


/** Formats an analytics timestamp. */
function formatTimestamp(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return '–';
  return date.toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' });
}


/** Renders the insight values. */
function renderInsights(insights = {}) {
  setAnalyticsText('[data-insight="bestHour"]', insights.bestHour || 'noch nicht erfasst');
  setAnalyticsText('[data-insight="bestDay"]', insights.bestDay || '–');
  setAnalyticsText('[data-insight="topProject"]', insights.topProject || 'Noch offen');
  setAnalyticsText('[data-insight="topProjectClicks"]', formatNumber(insights.topProjectClicks));
  setAnalyticsText('[data-live="lastEvent"]', formatTimestamp(insights.lastEvent));
}


/** Renders the conversion funnel values. */
function renderFunnel(funnel = {}) {
  ['pageviews', 'portfolio', 'demos', 'contact'].forEach((key) => {
    setAnalyticsText(`[data-funnel="${key}"]`, formatNumber(funnel[key]));
  });
}


/** Updates one traffic-source distribution row. */
function updateDistributionRow(row, item = {}) {
  const percent = Number(item.percent) || 0;
  const label = row.querySelector('span');
  const bar = row.querySelector('i');
  const value = row.querySelector('strong');
  if (label && item.label) label.textContent = item.label;
  if (bar) bar.style.setProperty('--value', `${Math.max(0, Math.min(100, percent))}%`);
  if (value) value.textContent = formatPercent(percent);
}


/** Renders the traffic-source distribution. */
function renderSourceDistribution(sources = []) {
  const rows = document.querySelectorAll('[data-source-distribution] > div');
  rows.forEach((row, index) => updateDistributionRow(row, sources[index]));
}


/** Updates the device-distribution legend. */
function updateDeviceLegend(values) {
  document.querySelectorAll('[data-legend="devices"] strong').forEach((element, index) => {
    element.textContent = values[index] || '–';
  });
}


/** Renders device totals and distribution. */
function renderDevices(devices = {}) {
  const values = ['desktop', 'tablet', 'mobile'].map((key) => Number(devices[key]) || 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  const percentages = total ? values.map((value) => formatPercent(value / total * 100)) : ['–', '–', '–'];
  updateDeviceLegend(percentages);
  renderDeviceDonut(values, total);
}


/** Renders the device donut chart. */
function renderDeviceDonut(values, total) {
  const donut = document.querySelector('[data-donut="devices"]');
  if (!donut) return;
  const label = donut.querySelector('span');
  if (label) label.textContent = total ? formatNumber(total) : '–';
  if (!total) return;
  applyDeviceDonutGradient(donut, values, total);
}


/** Applies the conic-gradient values for the device donut. */
function applyDeviceDonutGradient(donut, values, total) {
  const desktop = values[0] / total * 100;
  const tablet = values[1] / total * 100;
  donut.style.background = `conic-gradient(#3d8dff 0 ${desktop}%, #21c7ff ${desktop}% ${desktop + tablet}%, #826fff ${desktop + tablet}% 100%)`;
}


/** Renders the page-view series into the SVG polyline. */
function renderSeries(series = []) {
  const line = document.querySelector('[data-chart-line]');
  const empty = document.querySelector('.admin-chart-empty');
  if (!line || !series.length) return showEmptyChart(empty);
  line.setAttribute('points', buildSeriesPoints(series).join(' '));
  line.style.opacity = '1';
  if (empty) empty.hidden = true;
}


/** Builds the SVG coordinate list for the page-view series. */
function buildSeriesPoints(series) {
  const max = Math.max(1, ...series.map((item) => Number(item.views) || 0));
  const denominator = Math.max(1, series.length - 1);
  return series.map((item, index) => {
    return `${index / denominator * 900},${230 - (Number(item.views) || 0) / max * 190}`;
  });
}


/** Shows the empty-state message for the history chart. */
function showEmptyChart(empty = document.querySelector('.admin-chart-empty')) {
  const line = document.querySelector('[data-chart-line]');
  if (line) line.style.opacity = '0.18';
  if (!empty) return;
  empty.textContent = 'Noch keine Statistikdaten im gewählten Zeitraum.';
  empty.hidden = false;
}


/** Renders one complete analytics dashboard response. */
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


/** Exports the latest dashboard response as JSON. */
function exportAnalytics() {
  if (!lastDashboardData) return;
  const blob = new Blob([JSON.stringify(lastDashboardData, null, 2)], { type: 'application/json' });
  downloadAnalyticsBlob(blob);
}


/** Downloads one generated analytics JSON blob. */
function downloadAnalyticsBlob(blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `glanzerdigital-analytics-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}


window.GlanzerAnalyticsRender = {
  exportAnalytics,
  formatNumber,
  renderDashboard,
  setAnalyticsText,
};
