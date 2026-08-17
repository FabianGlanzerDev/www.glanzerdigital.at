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
