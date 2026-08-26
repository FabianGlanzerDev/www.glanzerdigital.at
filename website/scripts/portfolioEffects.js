/**
 * Updates the expanded state of a technology card.
 *
 * @param {HTMLElement} card - Technology card to update.
 * @param {boolean} expanded - Whether the code example should stay open.
 * @returns {void}
 */
function setTechCardState(card, expanded) {
  card.setAttribute('aria-expanded', String(expanded));
  card.classList.toggle('is-expanded', expanded);
}



/**
 * Toggles the code example of the selected technology card.
 *
 * @param {Event} event - Click event of the technology card.
 * @returns {void}
 */
function toggleTechCard(event) {
  const card = event.currentTarget;
  const expanded = card.getAttribute('aria-expanded') === 'true';
  setTechCardState(card, !expanded);
}



/**
 * Closes all expanded technology cards when Escape is pressed.
 *
 * @param {KeyboardEvent} event - Keyboard event to evaluate.
 * @returns {void}
 */
function closeTechCards(event) {
  if (event.key !== 'Escape') return;
  const cards = document.querySelectorAll('.tech-card.is-expanded');
  cards.forEach((card) => setTechCardState(card, false));
}



/**
 * Initializes interactive technology cards.
 *
 * @returns {void}
 */
function initializeTechCards() {
  const cards = document.querySelectorAll('.tech-card');
  cards.forEach((card) => card.addEventListener('click', toggleTechCard));
  document.addEventListener('keydown', closeTechCards);
}



/**
 * Checks whether the portfolio is running as a local preview.
 *
 * @returns {boolean} Whether local demo links should be used.
 */
function isLocalPreview() {
  const localHosts = ['localhost', '127.0.0.1'];
  return localHosts.includes(window.location.hostname) || window.location.protocol === 'file:';
}



/**
 * Replaces public demo links with local paths during development.
 *
 * @returns {void}
 */
function applyLocalDemoLinks() {
  if (!isLocalPreview()) return;
  document.querySelectorAll('[data-local-href]').forEach((link) => {
    const localHref = link.dataset.localHref || link.getAttribute('href');
    link.setAttribute('href', localHref);
  });
}



initializeTechCards();
applyLocalDemoLinks();
