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
  setSearchText('[data-search-stat="position"]', Number(summary.position)?.toFixed?.(1)?.replace('.', ',') || '–');
}



/** Escapes search html. @param {unknown} value - The value value. @returns {string} The operation result. */
function escapeSearchHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}



/** Creates search query row. @param {unknown} row - The row value. @returns {string} The operation result. */
function createSearchQueryRow(row = {}) {
  const query = escapeSearchHtml(row.query || '–');
  const ctr = formatSearchPercent(row.ctr);
  const position = Number(row.position)?.toFixed?.(1)?.replace('.', ',') || '–';
  return `<tr><td>${query}</td><td>${formatSearchNumber(row.clicks)}</td><td>${formatSearchNumber(row.impressions)}</td><td>${ctr}</td><td>${position}</td></tr>`;
}



/** Renders search queries. @param {Array} rows - The rows value. @returns {void} The operation result. */
function renderSearchQueries(rows = []) {
  const body = document.querySelector('[data-search-queries]');
  if (!body) return;
  body.innerHTML = rows.length ? rows.slice(0, 12).map(createSearchQueryRow).join('') : '<tr><td colspan="5">Noch keine Search-Console-Daten.</td></tr>';
}



/** Creates search ranking item. @param {unknown} row - The row value. @returns {string} The operation result. */
function createSearchRankingItem(row = {}) {
  const label = escapeSearchHtml(row.label || row.name || '–');
  return `<li><span>${label}</span><strong>${formatSearchNumber(row.clicks ?? row.value)}</strong></li>`;
}



/** Renders search ranking. @param {string} name - The name value. @param {Array} rows - The rows value. @returns {void} The operation result. */
function renderSearchRanking(name, rows = []) {
  const list = document.querySelector(`[data-search-ranking="${name}"]`);
  if (!list) return;
  list.innerHTML = rows.length ? rows.slice(0, 8).map(createSearchRankingItem).join('') : '<li><span>Keine Daten</span><strong>–</strong></li>';
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
  renderSearchRanking('countries', data.countries || []);
  renderSearchRanking('pages', data.pages || []);
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
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
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
