'use strict';


function getSearchConfig() {
  return window.GLANZER_ADMIN_CONFIG || {};
}


function setSearchText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = String(value ?? '–');
}


function formatSearchNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('de-AT').format(number) : '–';
}


function formatSearchPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${(number * 100).toFixed(1).replace('.', ',')} %` : '–';
}


function renderSearchSummary(summary = {}) {
  setSearchText('[data-search-stat="clicks"]', formatSearchNumber(summary.clicks));
  setSearchText('[data-search-stat="impressions"]', formatSearchNumber(summary.impressions));
  setSearchText('[data-search-stat="ctr"]', formatSearchPercent(summary.ctr));
  setSearchText('[data-search-stat="position"]', Number(summary.position)?.toFixed?.(1)?.replace('.', ',') || '–');
}


function escapeSearchHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}


function createSearchQueryRow(row = {}) {
  const query = escapeSearchHtml(row.query || '–');
  const ctr = formatSearchPercent(row.ctr);
  const position = Number(row.position)?.toFixed?.(1)?.replace('.', ',') || '–';
  return `<tr><td>${query}</td><td>${formatSearchNumber(row.clicks)}</td><td>${formatSearchNumber(row.impressions)}</td><td>${ctr}</td><td>${position}</td></tr>`;
}


function renderSearchQueries(rows = []) {
  const body = document.querySelector('[data-search-queries]');
  if (!body) return;
  body.innerHTML = rows.length ? rows.slice(0, 12).map(createSearchQueryRow).join('') : '<tr><td colspan="5">Noch keine Search-Console-Daten.</td></tr>';
}


function createSearchRankingItem(row = {}) {
  const label = escapeSearchHtml(row.label || row.name || '–');
  return `<li><span>${label}</span><strong>${formatSearchNumber(row.clicks ?? row.value)}</strong></li>`;
}


function renderSearchRanking(name, rows = []) {
  const list = document.querySelector(`[data-search-ranking="${name}"]`);
  if (!list) return;
  list.innerHTML = rows.length ? rows.slice(0, 8).map(createSearchRankingItem).join('') : '<li><span>Keine Daten</span><strong>–</strong></li>';
}


function renderSearchOpportunity(item = {}) {
  setSearchText('[data-search-opportunity]', item.query || '–');
  const fallback = 'Noch keine Suchanfrage mit ausreichend Daten für eine klare SEO-Chance.';
  setSearchText('[data-search-opportunity-copy]', item.description || fallback);
}


function renderSearchConsole(data = {}) {
  renderSearchSummary(data.summary || {});
  renderSearchQueries(data.queries || []);
  renderSearchRanking('countries', data.countries || []);
  renderSearchRanking('pages', data.pages || []);
  renderSearchRanking('devices', data.devices || []);
  renderSearchOpportunity(data.opportunity || {});
}


function setSearchState(text, ok = false) {
  const state = document.querySelector('[data-search-console-state]');
  if (!state) return;
  state.textContent = text;
  state.classList.toggle('is-pending', !ok);
  state.classList.toggle('is-ok', ok);
}


async function getSearchToken() {
  if (typeof window.GlanzerAdminAuth?.getIdToken !== 'function') return '';
  return window.GlanzerAdminAuth.getIdToken();
}


async function fetchSearchConsoleData() {
  const token = await getSearchToken();
  const endpoint = getSearchConfig().searchConsoleEndpoint;
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Search Console konnte nicht geladen werden.');
  return data;
}


function renderSearchError(message) {
  setSearchState(message || 'Nicht verbunden');
  window.GlanzerAdminUi?.setSystemState('searchConsole', 'is-pending', message || 'Nicht verbunden');
}


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
