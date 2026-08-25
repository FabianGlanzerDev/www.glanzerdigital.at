function setTechCardState(card, expanded) {
  card.setAttribute('aria-expanded', String(expanded));
  card.classList.toggle('is-expanded', expanded);
}


function toggleTechCard(event) {
  const card = event.currentTarget;
  const expanded = card.getAttribute('aria-expanded') === 'true';
  setTechCardState(card, !expanded);
}


function closeTechCards(event) {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('.tech-card.is-expanded').forEach((card) => setTechCardState(card, false));
}


function initializeTechCards() {
  const cards = document.querySelectorAll('.tech-card');
  cards.forEach((card) => card.addEventListener('click', toggleTechCard));
  document.addEventListener('keydown', closeTechCards);
}


initializeTechCards();

function isLocalPreview() {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.protocol === 'file:';
}


function applyLocalDemoLinks() {
  if (!isLocalPreview()) return;
  document.querySelectorAll('[data-local-href]').forEach((link) => {
    link.setAttribute('href', link.dataset.localHref || link.getAttribute('href'));
  });
}


applyLocalDemoLinks();
