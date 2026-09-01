'use strict';



/** Returns search config. @returns {Object} The operation result. */
function getSearchConfig() {
  return window.GLANZER_ADMIN_CONFIG || {};
}



/** Updates search text. @param {string} selector - The selector value. @param {unknown} value - The value value. @returns {void} The operation result. */
function setSearchText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = String(value ?? '–');
}



/** Formats search number. @param {unknown} value - The value value. @returns {string} The operation result. */
function formatSearchNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('de-AT').format(number) : '–';
}



/** Formats search percent. @param {unknown} value - The value value. @returns {string} The operation result. */
function formatSearchPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${(number * 100).toFixed(1).replace('.', ',')} %` : '–';
}



/** Renders search summary. @param {Object} summary - The summary value. @returns {void} The operation result. */
function renderSearchSummary(summary = {}) {
  setSearchText('[data-search-stat="clicks"]', formatSearchNumber(summary.clicks));
  setSearchText('[data-search-stat="impressions"]', formatSearchNumber(summary.impressions));
  setSearchText('[data-search-stat="ctr"]', formatSearchPercent(summary.ctr));
  setSearchText('[data-search-stat="position"]', formatSearchPosition(summary.position));
}



/** Creates one Search Console query table row using DOM nodes. */
function createSearchQueryRow(row = {}) {
  const cells = [
    row.query || '–',
    formatSearchNumber(row.clicks),
    formatSearchNumber(row.impressions),
    formatSearchPercent(row.ctr),
    formatSearchPosition(row.position),
  ];
  const tableRow = document.createElement('tr');
  tableRow.append(...cells.map(createSearchCell));
  return tableRow;
}


/** Creates one table cell with safe text content. */
function createSearchCell(value) {
  const cell = document.createElement('td');
  cell.textContent = String(value ?? '–');
  return cell;
}


/** Formats a Search Console average position. */
function formatSearchPosition(value) {
  if (value === null || value === undefined || value === '') return '–';
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(1).replace('.', ',') : '–';
}


/** Returns the raw page identifier used by Search Console. */
function getSearchPageValue(row = {}) {
  return row.page ?? row.label ?? row.name ?? row.url ?? '';
}


/** Creates an empty metric object for one main public page. */
function createSearchPageMetric(key) {
  const path = key === 'home' ? '/' : `/${key}`;
  const label = window.GlanzerPageLabels?.label(path) || key;
  return { key, label, clicks: 0, impressions: 0, positionTotal: 0, positionWeight: 0 };
}


/** Adds one Search Console page row to its matching main-page metric. */
function mergeSearchPageMetric(metric, row = {}) {
  const impressions = Number(row.impressions) || 0;
  const position = Number(row.position);
  metric.clicks += Number(row.clicks) || 0;
  metric.impressions += impressions;
  if (!Number.isFinite(position) || impressions <= 0) return;
  metric.positionTotal += position * impressions;
  metric.positionWeight += impressions;
}


/** Builds stable Search Console metrics for the five main public pages. */
function buildSearchPageMetrics(rows = []) {
  const keys = window.GlanzerPageLabels?.coreKeys || [];
  const metrics = new Map(keys.map((key) => [key, createSearchPageMetric(key)]));
  rows.forEach((row) => mergeSearchPageRow(metrics, row));
  return [...metrics.values()].map(finalizeSearchPageMetric);
}


/** Routes one Search Console row to a known main page. */
function mergeSearchPageRow(metrics, row = {}) {
  const key = window.GlanzerPageLabels?.key(getSearchPageValue(row)) || '';
  const metric = metrics.get(key);
  if (metric) mergeSearchPageMetric(metric, row);
}


/** Calculates derived CTR and average position for one page. */
function finalizeSearchPageMetric(metric) {
  const ctr = metric.impressions ? metric.clicks / metric.impressions : 0;
  const position = metric.positionWeight ? metric.positionTotal / metric.positionWeight : null;
  return { ...metric, ctr, position };
}


/** Updates one value inside a Search Console page card. */
function setSearchPageMetric(card, selector, value) {
  const target = card?.querySelector(selector);
  if (target) target.textContent = value;
}


/** Renders one main-page Search Console performance card. */
function renderSearchPageCard(metric = {}) {
  const card = document.querySelector(`[data-search-page="${metric.key}"]`);
  if (!card) return;
  setSearchPageMetric(card, '[data-search-page-clicks]', formatSearchNumber(metric.clicks));
  setSearchPageMetric(card, '[data-search-page-impressions]', formatSearchNumber(metric.impressions));
  setSearchPageMetric(card, '[data-search-page-ctr]', formatSearchPercent(metric.ctr));
  setSearchPageMetric(card, '[data-search-page-position]', formatSearchPosition(metric.position));
}


/** Renders Search Console metrics for Home, Leistungen, Portfolio, Über mich and Kontakt. */
function renderSearchPagePerformance(rows = []) {
  buildSearchPageMetrics(rows).forEach(renderSearchPageCard);
}


/** Creates the empty Search Console table row. */
function createEmptySearchRow() {
  const row = document.createElement('tr');
  const cell = createSearchCell('Noch keine Search-Console-Daten.');
  cell.colSpan = 5;
  row.append(cell);
  return row;
}


/** Renders Search Console query rows. */
function renderSearchQueries(rows = []) {
  const body = document.querySelector('[data-search-queries]');
  if (!body) return;
  const items = rows.length ? rows.slice(0, 12).map(createSearchQueryRow) : [createEmptySearchRow()];
  body.replaceChildren(...items);
}


/** Creates one Search Console ranking list item. */
function createSearchRankingItem(row = {}) {
  const item = document.createElement('li');
  const label = document.createElement('span');
  const value = document.createElement('strong');
  label.textContent = String(row.label || row.name || '–');
  value.textContent = formatSearchNumber(row.clicks ?? row.value);
  item.append(label, value);
  return item;
}


/** Renders one Search Console ranking list. */
function renderSearchRanking(name, rows = []) {
  const list = document.querySelector(`[data-search-ranking="${name}"]`);
  if (!list) return;
  const prepared = searchRankingRows(name, rows);
  const empty = [createSearchRankingItem({ label: 'Keine Daten', value: null })];
  list.replaceChildren(...(prepared.length ? prepared.slice(0, 8).map(createSearchRankingItem) : empty));
}


/** Applies friendly labels to Search Console page URLs. */
function searchRankingRows(name, rows = []) {
  if (name !== 'pages') return rows;
  return window.GlanzerPageLabels?.normalizeRows(rows) || rows;
}


/** Renders search opportunity. @param {Object} item - The item value. @returns {void} The operation result. */
function renderSearchOpportunity(item = {}) {
  setSearchText('[data-search-opportunity]', item.query || '–');
  const fallback = 'Noch keine Suchanfrage mit ausreichend Daten für eine klare SEO-Chance.';
  setSearchText('[data-search-opportunity-copy]', item.description || fallback);
}



/** Renders search console. @param {Object} data - The data value. @returns {void} The operation result. */
function renderSearchConsole(data = {}) {
  renderSearchSummary(data.summary || {});
  renderSearchQueries(data.queries || []);
  renderSearchPagePerformance(data.pages || []);
  renderSearchRanking('countries', data.countries || []);
  renderSearchRanking('devices', data.devices || []);
  renderSearchOpportunity(data.opportunity || {});
}



/** Updates search state. @param {string} text - The text value. @param {boolean} ok - The ok value. @returns {void} The operation result. */
function setSearchState(text, ok = false) {
  const state = document.querySelector('[data-search-console-state]');
  if (!state) return;
  state.textContent = text;
  state.classList.toggle('is-pending', !ok);
  state.classList.toggle('is-ok', ok);
}



/** Returns search token. @returns {Promise<unknown>} The operation result. */
async function getSearchToken() {
  if (typeof window.GlanzerAdminAuth?.getIdToken !== 'function') return '';
  return window.GlanzerAdminAuth.getIdToken();
}



/** Runs the fetch search console data operation. @returns {Promise<unknown>} The operation result. */
async function fetchSearchConsoleData() {
  const token = await getSearchToken();
  const endpoint = getSearchConfig().searchConsoleEndpoint;
  const headers = { Authorization: `Bearer ${token}`, 'X-Firebase-ID-Token': token };
  const response = await fetch(endpoint, { headers, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Search Console konnte nicht geladen werden.');
  return data;
}



/** Renders search error. @param {string} message - The message value. @returns {void} The operation result. */
function renderSearchError(message) {
  setSearchState(message || 'Nicht verbunden');
  window.GlanzerAdminUi?.setSystemState('searchConsole', 'is-pending', message || 'Nicht verbunden');
}



/** Initializes search console. @returns {Promise<void>} The operation result. */
async function initializeSearchConsole() {
  const config = getSearchConfig();
  setSearchText('[data-search-console-property]', config.searchConsoleProperty || 'nicht konfiguriert');
  if (!config.searchConsoleConfigured) return renderSearchError('Property nicht konfiguriert');
  setSearchState('wird geladen …');
  try {
    renderSearchConsole(await fetchSearchConsoleData());
    setSearchState('Verbunden', true);
    window.GlanzerAdminUi?.setSystemState('searchConsole', 'is-ok', 'Google-Daten geladen');
  } catch (error) { renderSearchError(error.message); }
}


window.GlanzerAdminSearch = { refresh: initializeSearchConsole };

document.addEventListener('glanzer:auth-ready', initializeSearchConsole);
if (window.GlanzerAdminAuth?.isAuthenticated()) initializeSearchConsole();
