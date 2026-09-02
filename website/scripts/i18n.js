const LANGUAGE_STORAGE_KEY = 'gd-language';
const DEFAULT_LANGUAGE = 'de';

const TRANSLATIONS = window.GD_I18N_DATA?.translations || {};
const META_TRANSLATIONS = window.GD_I18N_DATA?.meta || {};

const ATTRIBUTE_NAMES = ['placeholder', 'aria-label', 'title', 'alt'];

const META_SELECTORS = [
  'meta[name="description"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[property="og:image:alt"]',
  'meta[name="twitter:title"]',
  'meta[name="twitter:description"]',
  'meta[name="twitter:image:alt"]'
];



/** Normalizes text. @param {unknown} value - The value value. @returns {string} The operation result. */
function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}



/** Translates value. @param {unknown} value - The value value. @param {string} language - The language value. @returns {string} The operation result. */
function translateValue(value, language) {
  const normalized = normalizeText(value);
  if (!normalized) return value;
  if (language === 'en') return TRANSLATIONS[normalized] || META_TRANSLATIONS[normalized] || value;
  const reverse = Object.entries({ ...TRANSLATIONS, ...META_TRANSLATIONS }).find(([, english]) => english === normalized);
  return reverse ? reverse[0] : value;
}



/** Translates text node. @param {Text} node - The node value. @param {string} language - The language value. @returns {unknown} The operation result. */
function translateTextNode(node, language) {
  const original = normalizeText(node.nodeValue);
  if (!original) return;
  const translated = translateValue(original, language);
  if (translated === original) return;
  const leading = node.nodeValue.match(/^\s*/)?.[0] || '';
  const trailing = node.nodeValue.match(/\s*$/)?.[0] || '';
  node.nodeValue = `${leading}${translated}${trailing}`;
}



/** Translates attributes. @param {Element} root - The root value. @param {string} language - The language value. @returns {unknown} The operation result. */
function translateAttributes(root, language) {
  root.querySelectorAll('*').forEach((element) => {
    ATTRIBUTE_NAMES.forEach((attribute) => {
      if (!element.hasAttribute(attribute)) return;
      const value = element.getAttribute(attribute);
      const translated = translateValue(value, language);
      if (translated !== value) element.setAttribute(attribute, translated);
    });
  });
}



/** Translates document text. @param {string} language - The language value. @returns {void} The operation result. */
function translateDocumentText(language) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const parent = walker.currentNode.parentElement;
    if (!parent || ['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(parent.tagName)) continue;
    nodes.push(walker.currentNode);
  }
  nodes.forEach((node) => translateTextNode(node, language));
  translateAttributes(document.body, language);
}



/** Translates one metadata element. */
function translateMetaElement(element, language) {
  if (!element) return;
  element.content = translateValue(element.content, language);
}


/** Translates page metadata. */
function translateMetadata(language) {
  document.title = translateValue(document.title, language);
  META_SELECTORS.forEach((selector) => {
    translateMetaElement(document.querySelector(selector), language);
  });
}



/** Updates the visible DE/EN language selector. */
function updateLanguageToggle(language) {
  document.querySelectorAll('[data-language-option]').forEach((button) => {
    const isActive = button.dataset.languageOption === language;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}



/** Updates language. @param {string} language - The language value. @param {boolean} persist - The persist value. @returns {void} The operation result. */
function setLanguage(language, persist = true) {
  const resolved = language === 'en' ? 'en' : DEFAULT_LANGUAGE;
  translateDocumentText(resolved);
  translateMetadata(resolved);
  document.documentElement.lang = resolved;
  updateLanguageToggle(resolved);
  if (persist) localStorage.setItem(LANGUAGE_STORAGE_KEY, resolved);
  window.dispatchEvent(new CustomEvent('gd:languagechange', { detail: { language: resolved } }));
}



/** Returns stored language. @returns {string} The operation result. */
function getStoredLanguage() {
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return saved === 'en' ? 'en' : DEFAULT_LANGUAGE;
}



/** Handles one explicit language selection. */
function handleLanguageSelection(event) {
  const language = event.currentTarget.dataset.languageOption;
  setLanguage(language);
}



/** Initializes language switch after the shared header exists. */
function initializeLanguageSwitch() {
  document.querySelectorAll('[data-language-option]').forEach((button) => {
    button.addEventListener('click', handleLanguageSelection);
  });
  setLanguage(getStoredLanguage(), false);
}

/** Returns the currently active language. */
function getCurrentLanguage() {
  return document.documentElement.lang === 'en' ? 'en' : 'de';
}


/** Translates one runtime value to the active language. */
function translateRuntimeValue(value) {
  return translateValue(value, getCurrentLanguage());
}


/** Reapplies the active language after dynamic markup was inserted. */
function refreshLanguage() {
  const language = getCurrentLanguage();
  translateDocumentText(language);
  translateMetadata(language);
  updateLanguageToggle(language);
}


window.GlanzerI18n = {
  getLanguage: getCurrentLanguage,
  translate: translateRuntimeValue,
  refresh: refreshLanguage,
  setLanguage,
  initialize: initializeLanguageSwitch
};
