const TERMINAL_SNIPPETS = [
  {
    de: { code: `const developer = {\n  coffee: true,\n  bugs: 0,\n};\n\nif (developer.bugs === 0) {\n  console.log('Noch nicht getestet.');\n}`, output: 'Der Code funktioniert. Die Frage ist nur: warum?' },
    en: { code: `const developer = {\n  coffee: true,\n  bugs: 0,\n};\n\nif (developer.bugs === 0) {\n  console.log('Not tested yet.');\n}`, output: 'The code works. The only question is: why?' }
  },
  {
    de: { code: `function fixBug(bug) {\n  if (!bug) return 'feature';\n  return fixBug(null);\n}`, output: '90 % Debugging, 10 % herausfinden, was man eigentlich gebaut hat.' },
    en: { code: `function fixBug(bug) {\n  if (!bug) return 'feature';\n  return fixBug(null);\n}`, output: '90% debugging, 10% figuring out what you actually built.' }
  },
  {
    de: { code: `const coffee = 0;\n\nwhile (coffee === 0) {\n  console.log('Compiler wartet …');\n  break;\n}`, output: 'Kein Kaffee, kein Deployment.' },
    en: { code: `const coffee = 0;\n\nwhile (coffee === 0) {\n  console.log('Compiler is waiting …');\n  break;\n}`, output: 'No coffee, no deployment.' }
  },
  {
    de: { code: `const binaryJoke = 10;\n\nconsole.log(\n  'Es gibt ' + binaryJoke +\n  ' Arten von Menschen.'\n);`, output: 'Die, die Binär verstehen – und die anderen.' },
    en: { code: `const binaryJoke = 10;\n\nconsole.log(\n  'There are ' + binaryJoke +\n  ' types of people.'\n);`, output: 'Those who understand binary – and those who do not.' }
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


function getLanguage() {
  return document.documentElement.lang === 'en' ? 'en' : 'de';
}


function getTerminalSnippet() {
  return TERMINAL_SNIPPETS[terminalIndex][getLanguage()];
}


function getTerminalElements() {
  return {
    code: document.querySelector('[data-terminal-code]'),
    output: document.querySelector('[data-terminal-output]'),
    pause: document.querySelector('[data-terminal-pause]')
  };
}


function clearTerminalTimer() {
  window.clearTimeout(terminalTimer);
}


function setPauseButton(button) {
  const label = getLanguage() === 'en' ? ['Resume animation', 'Pause animation'] : ['Animation fortsetzen', 'Animation pausieren'];
  button.setAttribute('aria-pressed', String(terminalPaused));
  button.textContent = terminalPaused ? label[0] : label[1];
}


function showTerminalOutput(output) {
  output.textContent = getTerminalSnippet().output;
  terminalTimer = window.setTimeout(nextTerminalSnippet, 3200);
}


function typeTerminalCharacter(code, output) {
  if (terminalPaused) return;
  const snippet = getTerminalSnippet();
  code.textContent = snippet.code.slice(0, terminalCharacter += 1);
  if (terminalCharacter >= snippet.code.length) return showTerminalOutput(output);
  terminalTimer = window.setTimeout(() => typeTerminalCharacter(code, output), 22);
}


function startTerminalSnippet() {
  const elements = getTerminalElements();
  if (!elements.code || !elements.output || terminalPaused) return;
  terminalCharacter = 0;
  elements.code.textContent = '';
  elements.output.textContent = getLanguage() === 'en' ? 'Running code …' : 'Code wird ausgeführt …';
  typeTerminalCharacter(elements.code, elements.output);
}


function nextTerminalSnippet() {
  terminalIndex = (terminalIndex + 1) % TERMINAL_SNIPPETS.length;
  startTerminalSnippet();
}


function toggleTerminal() {
  const { pause } = getTerminalElements();
  if (!pause) return;
  terminalPaused = !terminalPaused;
  clearTerminalTimer();
  setPauseButton(pause);
  if (!terminalPaused) startTerminalSnippet();
}


function renderReducedMotionTerminal() {
  const { code, output, pause } = getTerminalElements();
  if (!code || !output || !pause) return;
  code.textContent = getTerminalSnippet().code;
  output.textContent = getTerminalSnippet().output;
  pause.hidden = true;
}


function initializeTerminal() {
  const { pause } = getTerminalElements();
  if (!pause) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return renderReducedMotionTerminal();
  pause.addEventListener('click', toggleTerminal);
  startTerminalSnippet();
}


function getIndustryElements() {
  return {
    title: document.querySelector('[data-industry-title]'), text: document.querySelector('[data-industry-text]'),
    icon: document.querySelector('[data-industry-icon]'), features: document.querySelector('[data-industry-features]'),
    cta: document.querySelector('[data-industry-cta]')
  };
}


function getIndustryContent(data) {
  return data[getLanguage()];
}


function buildContactLink(data, content) {
  const project = encodeURIComponent(data.project);
  const industry = encodeURIComponent(content.title);
  return `subpages/kontakt.html?project=${project}&industry=${industry}`;
}


function renderIndustryFeatures(list, features) {
  if (!list) return;
  list.innerHTML = features.map((feature) => `<li>${feature}</li>`).join('');
}


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


function getActiveIndustryKey() {
  const active = document.querySelector('[data-industry][aria-pressed="true"]');
  return active?.dataset.industry || 'friseur';
}


function setActiveIndustry(button) {
  document.querySelectorAll('[data-industry]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
}


function handleIndustryClick(event) {
  const button = event.target.closest('[data-industry]');
  if (!(button instanceof HTMLButtonElement)) return;
  setActiveIndustry(button);
  renderIndustry(button.dataset.industry || 'friseur');
}


function initializeIndustrySelector() {
  const tabs = document.querySelector('.industry-tabs');
  if (!tabs) return;
  tabs.addEventListener('click', handleIndustryClick);
  renderIndustry('friseur');
}


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
