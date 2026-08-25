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


function renderSearchQueries(rows = []) {
  const body = document.querySelector('[data-search-queries]');
  if (!body) return;
  body.innerHTML = rows.length ? rows.slice(0, 12).map(createSearchQueryRow).join('') : '<tr><td colspan="5">Noch keine Search-Console-Daten.</td></tr>';
}


function createSearchQueryRow(row = {}) {
  const query = escapeSearchHtml(row.query || '–');
  const clicks = formatSearchNumber(row.clicks);
  const impressions = formatSearchNumber(row.impressions);
  const ctr = formatSearchPercent(row.ctr);
  const position = Number(row.position)?.toFixed?.(1)?.replace('.', ',') || '–';
  return `<tr><td>${query}</td><td>${clicks}</td><td>${impressions}</td><td>${ctr}</td><td>${position}</td></tr>`;
}


function renderSearchRanking(name, rows = []) {
  const list = document.querySelector(`[data-search-ranking="${name}"]`);
  if (!list) return;
  list.innerHTML = rows.length ? rows.slice(0, 8).map(createSearchRankingItem).join('') : '<li><span>Keine Daten</span><strong>–</strong></li>';
}


function createSearchRankingItem(row = {}) {
  const label = escapeSearchHtml(row.label || row.name || '–');
  return `<li><span>${label}</span><strong>${formatSearchNumber(row.clicks ?? row.value)}</strong></li>`;
}


function renderSearchConsole(data = {}) {
  renderSearchSummary(data.summary || {});
  renderSearchQueries(data.queries || []);
  renderSearchRanking('countries', data.countries || []);
  renderSearchRanking('pages', data.pages || []);
  renderSearchRanking('devices', data.devices || []);
  renderSearchOpportunity(data.opportunity || {});
}


function renderSearchOpportunity(item = {}) {
  setSearchText('[data-search-opportunity]', item.query || '–');
  const copy = item.description || 'Später erscheint hier automatisch eine Suchanfrage mit vielen Impressionen und Verbesserungspotenzial.';
  setSearchText('[data-search-opportunity-copy]', copy);
}


function renderSearchPending() {
  const config = getSearchConfig();
  setSearchText('[data-search-console-property]', config.searchConsoleProperty || 'noch offen');
  setSearchText('[data-search-console-state]', 'Domain noch nicht verbunden');
}


async function getSearchToken() {
  if (typeof window.GlanzerAdminAuth?.getIdToken !== 'function') return '';
  return window.GlanzerAdminAuth.getIdToken();
}


async function fetchSearchConsoleData() {
  const token = await getSearchToken();
  const endpoint = getSearchConfig().searchConsoleEndpoint;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(endpoint, { headers, cache: 'no-store' });
  if (!response.ok) throw new Error('Search Console noch nicht verbunden.');
  return response.json();
}


async function initializeSearchConsole() {
  const config = getSearchConfig();
  if (!config.searchConsoleConfigured) return renderSearchPending();
  try { renderSearchConsole(await fetchSearchConsoleData()); setSearchText('[data-search-console-state]', 'Verbunden'); }
  catch { renderSearchPending(); }
}


document.addEventListener('glanzer:auth-ready', initializeSearchConsole);
if (window.GlanzerAdminAuth?.isAuthenticated()) initializeSearchConsole();
