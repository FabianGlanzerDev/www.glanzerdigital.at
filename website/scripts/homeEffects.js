const TERMINAL_SNIPPETS = [
  {
    de: { code: `const website = {\n  responsive: true,\n  seoReady: true,\n  secure: true,\n};\n\nconst ready = Object.values(website).every(Boolean);`, output: 'Bereit für Desktop, Tablet, Smartphone und den nächsten Schritt.' },
    en: { code: `const website = {\n  responsive: true,\n  seoReady: true,\n  secure: true,\n};\n\nconst ready = Object.values(website).every(Boolean);`, output: 'Ready for desktop, tablet, smartphone and the next step.' }
  },
  {
    de: { code: `const project = [\n  'Ziel verstehen',\n  'Lösung planen',\n  'sauber umsetzen',\n  'gemeinsam testen',\n];`, output: 'Technik folgt dem Ziel – nicht umgekehrt.' },
    en: { code: `const project = [\n  'understand the goal',\n  'plan the solution',\n  'build it cleanly',\n  'test it together',\n];`, output: 'Technology follows the goal – not the other way around.' }
  },
  {
    de: { code: `async function loadData() {\n  const response = await fetch('/api/data');\n  return response.json();\n}`, output: 'Web-App, API und Datenfluss greifen sauber ineinander.' },
    en: { code: `async function loadData() {\n  const response = await fetch('/api/data');\n  return response.json();\n}`, output: 'Web app, API and data flow work cleanly together.' }
  },
  {
    de: { code: `const existingWebsite = {\n  redesign: false,\n  improve: ['content', 'speed', 'features'],\n};`, output: 'Nicht alles neu bauen – gezielt verbessern, was wirklich Nutzen bringt.' },
    en: { code: `const existingWebsite = {\n  redesign: false,\n  improve: ['content', 'speed', 'features'],\n};`, output: 'Do not rebuild everything – improve what actually adds value.' }
  }
];

const INDUSTRY_DATA = {
  friseur: {
    icon: 'assets/images/icons/industries/friseur.svg', project: 'Neue Website oder Landingpage',
    de: { title: 'Friseursalon', text: 'Eine kompakte Website kann Öffnungszeiten, Leistungen, Preise und Kontaktmöglichkeiten jederzeit erreichbar machen.', features: ['Leistungen & Preise', 'Öffnungszeiten', 'Team & Galerie', 'Google Maps & Anfahrt', 'WhatsApp-Termin-Anfrage', 'Instagram & Social Media'] },
    en: { title: 'Hair salon', text: 'A compact website can make opening hours, services, prices and contact options available at any time.', features: ['Services & prices', 'Opening hours', 'Team & gallery', 'Google Maps & directions', 'WhatsApp appointment enquiry', 'Instagram & social media'] }
  },
  handwerk: {
    icon: 'assets/images/icons/industries/handwerk.svg', project: 'Neue Website oder Landingpage',
    de: { title: 'Handwerksbetrieb', text: 'Zeige Leistungen, Einsatzgebiet und Referenzen so, dass Interessenten schnell verstehen, was du anbietest und wie sie dich erreichen.', features: ['Leistungen', 'Einsatzgebiet', 'Referenzen', 'Vorher-/Nachher-Bilder', 'WhatsApp & Telefon', 'Anfrageformular'] },
    en: { title: 'Trade business', text: 'Present services, service area and references so prospects quickly understand what you offer and how to reach you.', features: ['Services', 'Service area', 'References', 'Before/after images', 'WhatsApp & phone', 'Enquiry form'] }
  },
  gastronomie: {
    icon: 'assets/images/icons/industries/gastronomie.svg', project: 'Neue Website oder Landingpage',
    de: { title: 'Restaurant / Café', text: 'Speisekarte, Öffnungszeiten und Standort sind sofort erreichbar – ergänzt um Reservierung, Bilder und aktuelle Hinweise.', features: ['Speisekarte', 'Öffnungszeiten', 'Standort & Maps', 'Reservierungslink', 'Galerie', 'Veranstaltungen & News'] },
    en: { title: 'Restaurant / café', text: 'Menu, opening hours and location are immediately available – complemented by reservations, images and current information.', features: ['Menu', 'Opening hours', 'Location & maps', 'Reservation link', 'Gallery', 'Events & news'] }
  },
  verein: {
    icon: 'assets/images/icons/industries/verein.svg', project: 'Neue Website oder Landingpage',
    de: { title: 'Verein', text: 'Eine Vereinswebsite kann Termine, Neuigkeiten, Mitgliederinformationen und wichtige Dokumente zentral an einem Ort bündeln.', features: ['Neuigkeiten', 'Termine', 'Teams & Mitglieder', 'Galerie', 'Downloads', 'Kontakt & Beitritt'] },
    en: { title: 'Association', text: 'An association website can bring together dates, news, member information and important documents in one central place.', features: ['News', 'Dates', 'Teams & members', 'Gallery', 'Downloads', 'Contact & membership'] }
  },
  selbststaendig: {
    icon: 'assets/images/icons/industries/selbststaendig.svg', project: 'Neue Website oder Landingpage',
    de: { title: 'Selbstständige / Dienstleister', text: 'Präsentiere deine Leistung klar, zeige Beispiele und führe Interessenten direkt zu einer Anfrage oder Terminvereinbarung.', features: ['Leistungsübersicht', 'Über mich', 'Referenzen', 'Preise / Pakete', 'Terminlink', 'WhatsApp & Kontakt'] },
    en: { title: 'Self-employed / services', text: 'Present your services clearly, show examples and guide prospects directly to an enquiry or booking.', features: ['Service overview', 'About me', 'References', 'Prices / packages', 'Booking link', 'WhatsApp & contact'] }
  },
  sonstiges: {
    icon: 'assets/images/icons/industries/sonstiges.svg', project: 'Noch unsicher – Beratung gewünscht',
    de: { title: 'Dein individuelles Vorhaben', text: 'Nicht jedes Projekt passt in eine Schublade. Beschreibe einfach dein Ziel – daraus lässt sich die passende Lösung ableiten.', features: ['klare Struktur', 'individuelle Inhalte', 'passende Funktionen', 'responsive Umsetzung', 'direkter Kontakt', 'später erweiterbar'] },
    en: { title: 'Your individual project', text: 'Not every project fits into a category. Simply describe your goal and the right solution can be derived from it.', features: ['clear structure', 'custom content', 'suitable features', 'responsive implementation', 'direct contact', 'easy to extend later'] }
  }
};

let terminalIndex = 0;
let terminalCharacter = 0;
let terminalTimer = 0;
let terminalPaused = false;



/** Returns language. @returns {string} The operation result. */
function getLanguage() {
  return document.documentElement.lang === 'en' ? 'en' : 'de';
}



/** Returns terminal snippet. @returns {Object} The operation result. */
function getTerminalSnippet() {
  return TERMINAL_SNIPPETS[terminalIndex][getLanguage()];
}



/** Returns terminal elements. @returns {Object} The operation result. */
function getTerminalElements() {
  return {
    code: document.querySelector('[data-terminal-code]'),
    output: document.querySelector('[data-terminal-output]'),
    pause: document.querySelector('[data-terminal-pause]')
  };
}



/** Clears terminal timer. @returns {void} The operation result. */
function clearTerminalTimer() {
  window.clearTimeout(terminalTimer);
}



/** Updates pause button. @param {HTMLElement} button - The button value. @returns {void} The operation result. */
function setPauseButton(button) {
  const label = getLanguage() === 'en' ? ['Resume animation', 'Pause animation'] : ['Animation fortsetzen', 'Animation pausieren'];
  button.setAttribute('aria-pressed', String(terminalPaused));
  button.textContent = terminalPaused ? label[0] : label[1];
}



/** Shows terminal output. @param {HTMLElement} output - The output value. @returns {void} The operation result. */
function showTerminalOutput(output) {
  output.textContent = getTerminalSnippet().output;
  terminalTimer = window.setTimeout(nextTerminalSnippet, 3200);
}



/** Processes terminal character. @param {HTMLElement} code - The code value. @param {HTMLElement} output - The output value. @returns {void} The operation result. */
function typeTerminalCharacter(code, output) {
  if (terminalPaused) return;
  const snippet = getTerminalSnippet();
  code.textContent = snippet.code.slice(0, terminalCharacter += 1);
  if (terminalCharacter >= snippet.code.length) return showTerminalOutput(output);
  terminalTimer = window.setTimeout(() => typeTerminalCharacter(code, output), 22);
}



/** Starts terminal snippet. @returns {void} The operation result. */
function startTerminalSnippet() {
  const elements = getTerminalElements();
  if (!elements.code || !elements.output || terminalPaused) return;
  terminalCharacter = 0;
  elements.code.textContent = '';
  elements.output.textContent = getLanguage() === 'en' ? 'Running code …' : 'Code wird ausgeführt …';
  typeTerminalCharacter(elements.code, elements.output);
}



/** Advances terminal snippet. @returns {void} The operation result. */
function nextTerminalSnippet() {
  terminalIndex = (terminalIndex + 1) % TERMINAL_SNIPPETS.length;
  startTerminalSnippet();
}



/** Toggles terminal. @returns {void} The operation result. */
function toggleTerminal() {
  const { pause } = getTerminalElements();
  if (!pause) return;
  terminalPaused = !terminalPaused;
  clearTerminalTimer();
  setPauseButton(pause);
  if (!terminalPaused) startTerminalSnippet();
}



/** Renders reduced motion terminal. @returns {void} The operation result. */
function renderReducedMotionTerminal() {
  const { code, output, pause } = getTerminalElements();
  if (!code || !output || !pause) return;
  code.textContent = getTerminalSnippet().code;
  output.textContent = getTerminalSnippet().output;
  pause.hidden = true;
}



/** Initializes terminal. @returns {void} The operation result. */
function initializeTerminal() {
  const { pause } = getTerminalElements();
  if (!pause) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return renderReducedMotionTerminal();
  pause.addEventListener('click', toggleTerminal);
  startTerminalSnippet();
}



/** Returns industry elements. @returns {unknown} The operation result. */
function getIndustryElements() {
  return {
    title: document.querySelector('[data-industry-title]'), text: document.querySelector('[data-industry-text]'),
    icon: document.querySelector('[data-industry-icon]'), features: document.querySelector('[data-industry-features]'),
    cta: document.querySelector('[data-industry-cta]')
  };
}



/** Returns industry content. @param {Object} data - The data value. @returns {Object} The operation result. */
function getIndustryContent(data) {
  return data[getLanguage()];
}



/** Builds contact link. @param {Object} data - The data value. @param {Object} content - The content value. @returns {string} The operation result. */
function buildContactLink(data, content) {
  const project = encodeURIComponent(data.project);
  const industry = encodeURIComponent(content.title);
  return `subpages/kontakt.html?project=${project}&industry=${industry}`;
}



/** Renders industry features. @param {HTMLElement} list - The list value. @param {Array} features - The features value. @returns {void} The operation result. */
function renderIndustryFeatures(list, features) {
  if (!list) return;
  list.innerHTML = features.map((feature) => `<li>${feature}</li>`).join('');
}



/** Renders industry. @param {string} key - The key value. @returns {void} The operation result. */
function renderIndustry(key) {
  const data = INDUSTRY_DATA[key];
  const elements = getIndustryElements();
  if (!data || !elements.title || !elements.text || !elements.icon || !elements.cta) return;
  const content = getIndustryContent(data);
  elements.title.textContent = content.title;
  elements.text.textContent = content.text;
  elements.icon.src = data.icon;
  elements.cta.href = buildContactLink(data, content);
  renderIndustryFeatures(elements.features, content.features);
}



/** Returns active industry key. @returns {string} The operation result. */
function getActiveIndustryKey() {
  const active = document.querySelector('[data-industry][aria-pressed="true"]');
  return active?.dataset.industry || 'friseur';
}



/** Updates active industry. @param {HTMLElement} button - The button value. @returns {void} The operation result. */
function setActiveIndustry(button) {
  document.querySelectorAll('[data-industry]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
}



/** Handles industry click. @param {Event} event - The event value. @returns {void} The operation result. */
function handleIndustryClick(event) {
  const button = event.target.closest('[data-industry]');
  if (!(button instanceof HTMLButtonElement)) return;
  setActiveIndustry(button);
  renderIndustry(button.dataset.industry || 'friseur');
}



/** Initializes industry selector. @returns {void} The operation result. */
function initializeIndustrySelector() {
  const tabs = document.querySelector('.industry-tabs');
  if (!tabs) return;
  tabs.addEventListener('click', handleIndustryClick);
  renderIndustry('friseur');
}



/** Handles language change. @returns {void} The operation result. */
function handleLanguageChange() {
  clearTerminalTimer();
  const { pause } = getTerminalElements();
  if (pause) setPauseButton(pause);
  if (!terminalPaused) startTerminalSnippet();
  renderIndustry(getActiveIndustryKey());
}


initializeTerminal();
initializeIndustrySelector();
window.addEventListener('gd:languagechange', handleLanguageChange);
