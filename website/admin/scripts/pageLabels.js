'use strict';

const GD_PAGE_LABELS = {
  home: 'Home',
  leistungen: 'Leistungen',
  portfolio: 'Portfolio',
  'ueber-mich': 'Über mich',
  kontakt: 'Kontakt',
  impressum: 'Impressum',
  datenschutz: 'Datenschutz',
};

const GD_CORE_PAGE_KEYS = ['home', 'leistungen', 'portfolio', 'ueber-mich', 'kontakt'];

const GD_PAGE_PATHS = new Map([
  ['/', 'home'], ['/index', 'home'],
  ['/leistungen', 'leistungen'], ['/subpages/leistungen', 'leistungen'],
  ['/portfolio', 'portfolio'], ['/subpages/portfolio', 'portfolio'],
  ['/ueber-mich', 'ueber-mich'], ['/über-mich', 'ueber-mich'], ['/subpages/ueber-mich', 'ueber-mich'],
  ['/kontakt', 'kontakt'], ['/subpages/kontakt', 'kontakt'],
  ['/impressum', 'impressum'], ['/subpages/impressum', 'impressum'],
  ['/datenschutz', 'datenschutz'], ['/subpages/datenschutz', 'datenschutz'],
]);

const GD_TITLE_PATTERNS = [
  ['leistungen', ['leistungen', 'webdesign & websites']],
  ['portfolio', ['portfolio']],
  ['ueber-mich', ['über mich', 'ueber mich', 'fabian glanzer', 'webentwickler']],
  ['kontakt', ['kontakt', 'website anfragen', 'projektanfrage']],
  ['impressum', ['impressum']],
  ['datenschutz', ['datenschutz']],
  ['home', ['startseite', 'professionelle websites', 'home']],
];

/** Returns a decoded, trimmed page value. */
function cleanPageValue(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  try { return decodeURIComponent(text); }
  catch { return text; }
}

/** Extracts a normalized pathname from a URL or path-like value. */
function pagePathFromValue(value) {
  const text = cleanPageValue(value);
  if (!text || (!text.includes('/') && !text.includes('://'))) return '';
  try { return normalizePagePath(new URL(text, 'https://glanzerdigital.at').pathname); }
  catch { return normalizePagePath(text.split(/[?#]/, 1)[0]); }
}

/** Normalizes one pathname for stable page matching. */
function normalizePagePath(value) {
  let path = String(value || '/').replace(/\\/g, '/').replace(/\/+$/, '') || '/';
  path = path.replace(/\.html?$/i, '').toLowerCase();
  return path;
}

/** Detects a known page key from an exact path. */
function pageKeyFromPath(value) {
  const path = pagePathFromValue(value);
  return path ? (GD_PAGE_PATHS.get(path) || '') : '';
}

/** Detects a known page key from a title or human-readable label. */
function pageKeyFromTitle(value) {
  const text = cleanPageValue(value).toLowerCase();
  const match = GD_TITLE_PATTERNS.find(([, patterns]) => patterns.some((pattern) => text.includes(pattern)));
  return match?.[0] || '';
}

/** Returns the stable key for a known GlanzerDigital page. */
function getPageKey(value) {
  return pageKeyFromPath(value) || pageKeyFromTitle(value);
}

/** Returns a short dashboard label for a page title, URL or path. */
function getPageLabel(value) {
  const key = getPageKey(value);
  if (key) return GD_PAGE_LABELS[key];
  const text = cleanPageValue(value);
  return text || '–';
}

/** Returns the numeric ranking value supported by analytics and Search Console. */
function getRowValue(row = {}) {
  return Number(row.value ?? row.count ?? row.clicks ?? 0) || 0;
}

/** Merges duplicate page representations and applies short dashboard labels. */
function normalizePageRows(rows = []) {
  const merged = new Map();
  rows.forEach((row) => mergePageRow(merged, row));
  return [...merged.values()].sort((a, b) => b.value - a.value);
}

/** Adds one page ranking row to an aggregated map. */
function mergePageRow(merged, row = {}) {
  const raw = row.label ?? row.name ?? row.page ?? '–';
  const key = getPageKey(raw) || `other:${cleanPageValue(raw).toLowerCase()}`;
  const current = merged.get(key) || { label: getPageLabel(raw), value: 0 };
  current.value += getRowValue(row);
  if (row.clicks != null) current.clicks = current.value;
  merged.set(key, current);
}

/** Builds stats for the five main public pages. */
function getCorePageStats(rows = [], totalViews = 0) {
  const normalized = normalizePageRows(rows);
  return GD_CORE_PAGE_KEYS.map((key) => buildCorePageStat(key, normalized, totalViews));
}

/** Builds one core-page statistic. */
function buildCorePageStat(key, rows, totalViews) {
  const row = rows.find((item) => getPageKey(item.label) === key);
  const value = row ? Number(row.value) || 0 : null;
  const share = value !== null && totalViews > 0 ? value / totalViews * 100 : null;
  return { key, label: GD_PAGE_LABELS[key], value, share };
}

window.GlanzerPageLabels = {
  coreKeys: GD_CORE_PAGE_KEYS,
  coreStats: getCorePageStats,
  key: getPageKey,
  label: getPageLabel,
  normalizeRows: normalizePageRows,
};
