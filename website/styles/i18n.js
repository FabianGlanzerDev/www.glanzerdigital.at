const LANGUAGE_STORAGE_KEY = 'gd-language';


/** Keeps the website permanently in German after removing the language switch. */
function initializeGermanLanguage() {
  document.documentElement.lang = 'de';

  try {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.warn('Sprachspeicher konnte nicht entfernt werden.', error);
  }

  window.dispatchEvent(new CustomEvent('gd:languagechange', {
    detail: { language: 'de' }
  }));
}


window.GlanzerI18n = {
  getLanguage: () => 'de',
  setLanguage: initializeGermanLanguage,
};


initializeGermanLanguage();
