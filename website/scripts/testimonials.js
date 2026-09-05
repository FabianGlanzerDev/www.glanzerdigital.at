'use strict';

const TESTIMONIAL_SELECTORS = {
  section: '[data-testimonials-section]',
  list: '[data-testimonials-list]',
  kicker: '[data-testimonials-kicker]',
  title: '[data-testimonials-title]',
  intro: '[data-testimonials-intro]',
  template: '#testimonial-card-template',
};



/** Returns the active website language. */
function getTestimonialLanguage() {
  return window.GlanzerI18n?.getLanguage() === 'en' ? 'en' : 'de';
}



/** Resolves a bilingual config value with German fallback. */
function getTestimonialText(value, language) {
  if (typeof value === 'string') return value;
  return value?.[language] || value?.de || '';
}



/** Updates one text target inside the testimonial section. */
function setTestimonialText(root, selector, value) {
  const target = root.querySelector(selector);
  if (target) target.textContent = value;
}



/** Fills one testimonial card from configuration data. */
function fillTestimonialCard(fragment, item, language) {
  setTestimonialText(fragment, '[data-testimonial-type]', getTestimonialText(item.type, language));
  setTestimonialText(fragment, '[data-testimonial-quote]', getTestimonialText(item.quote, language));
  setTestimonialText(fragment, '[data-testimonial-person]', item.person || '');
  setTestimonialText(fragment, '[data-testimonial-organization]', item.organization || '');
  setTestimonialText(fragment, '[data-testimonial-project]', getTestimonialText(item.project, language));
}



/** Creates one testimonial card from the HTML template. */
function createTestimonialCard(template, item, language) {
  const fragment = template.content.cloneNode(true);
  fillTestimonialCard(fragment, item, language);
  return fragment;
}



/** Returns how many testimonial cards are visible at once. */
function getVisibleTestimonialCount() {
  return window.matchMedia('(max-width: 900px)').matches ? 1 : 2;
}



/** Returns the width of one slider step. */
function getTestimonialStep(list) {
  const card = list.querySelector('.testimonial-item');
  if (!card) return list.clientWidth;
  const gap = parseFloat(getComputedStyle(list.querySelector('.testimonials-slider__track')).columnGap) || 0;
  return card.getBoundingClientRect().width + gap;
}



/** Returns the active card index from the current scroll position. */
function getTestimonialIndex(list) {
  const step = getTestimonialStep(list);
  return step > 0 ? Math.round(list.scrollLeft / step) : 0;
}



/** Builds the accessible range label below the testimonial slider. */
function getTestimonialStatus(index, total) {
  const visible = getVisibleTestimonialCount();
  const end = Math.min(index + visible, total);
  return visible > 1 ? `${index + 1}–${end} / ${total}` : `${index + 1} / ${total}`;
}



/** Updates counter and arrow states for the current slider position. */
function updateTestimonialControls(list, controls, total) {
  const visible = getVisibleTestimonialCount();
  const index = Math.min(getTestimonialIndex(list), Math.max(0, total - visible));
  controls.status.textContent = getTestimonialStatus(index, total);
  controls.previous.disabled = index <= 0;
  controls.next.disabled = index >= total - visible;
}



/** Scrolls the testimonial slider by one card. */
function moveTestimonials(list, direction) {
  list.scrollBy({ left: getTestimonialStep(list) * direction, behavior: 'smooth' });
}



/** Creates one arrow button for the testimonial navigation. */
function createTestimonialButton(direction, language) {
  const button = document.createElement('button');
  const previous = direction === 'previous';
  button.type = 'button';
  button.className = `testimonials-control testimonials-control--${direction}`;
  button.setAttribute('aria-label', getTestimonialButtonLabel(previous, language));
  button.textContent = previous ? '←' : '→';
  return button;
}



/** Returns the accessible label for one slider arrow. */
function getTestimonialButtonLabel(previous, language) {
  if (language === 'en') return previous ? 'Previous feedback' : 'Next feedback';
  return previous ? 'Vorheriges Feedback' : 'Nächstes Feedback';
}



/** Creates the testimonial navigation shown below the cards. */
function createTestimonialControls(language) {
  const wrapper = document.createElement('div');
  const previous = createTestimonialButton('previous', language);
  const next = createTestimonialButton('next', language);
  const status = document.createElement('span');
  wrapper.className = 'testimonials-controls';
  status.className = 'testimonials-status';
  status.setAttribute('aria-live', 'polite');
  wrapper.append(previous, status, next);
  return { wrapper, previous, next, status };
}



/** Connects arrow and keyboard navigation to the testimonial slider. */
function bindTestimonialNavigation(list, controls, total) {
  controls.previous.addEventListener('click', () => moveTestimonials(list, -1));
  controls.next.addEventListener('click', () => moveTestimonials(list, 1));
  list.addEventListener('keydown', (event) => handleTestimonialKeydown(event, list));
  list.addEventListener('scroll', () => updateTestimonialControls(list, controls, total), { passive: true });
  window.addEventListener('resize', () => updateTestimonialControls(list, controls, total), { passive: true });
}



/** Handles left and right arrow keys while the slider is focused. */
function handleTestimonialKeydown(event, list) {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  moveTestimonials(list, event.key === 'ArrowRight' ? 1 : -1);
}



/** Renders the manual testimonial slider. */
function renderTestimonialSlider(list, template, items, language) {
  const track = document.createElement('div');
  const controls = createTestimonialControls(language);
  track.className = 'testimonials-slider__track';
  items.forEach((item) => track.append(createTestimonialCard(template, item, language)));
  list.replaceChildren(track);
  list.after(controls.wrapper);
  bindTestimonialNavigation(list, controls, items.length);
  updateTestimonialControls(list, controls, items.length);
}



/** Updates the testimonial section heading for the active language. */
function renderTestimonialHeading(section, config, language) {
  setTestimonialText(section, TESTIMONIAL_SELECTORS.kicker, getTestimonialText(config.section.kicker, language));
  setTestimonialText(section, TESTIMONIAL_SELECTORS.title, getTestimonialText(config.section.title, language));
  setTestimonialText(section, TESTIMONIAL_SELECTORS.intro, getTestimonialText(config.section.intro, language));
}



/** Removes an existing testimonial navigation before rerendering. */
function removeTestimonialControls(section) {
  section.querySelector('.testimonials-controls')?.remove();
}



/** Renders the currently enabled testimonial entries. */
function renderTestimonials() {
  const config = window.GD_TESTIMONIALS_CONFIG;
  const section = document.querySelector(TESTIMONIAL_SELECTORS.section);
  const template = document.querySelector(TESTIMONIAL_SELECTORS.template);
  if (!config || !section || !template) return;
  const language = getTestimonialLanguage();
  const list = section.querySelector(TESTIMONIAL_SELECTORS.list);
  const items = config.items.filter((item) => item.visible !== false);
  section.hidden = items.length === 0;
  if (!list || items.length === 0) return;
  removeTestimonialControls(section);
  renderTestimonialSlider(list, template, items, language);
  renderTestimonialHeading(section, config, language);
}



/** Initializes testimonials and keeps them in sync with the language switch. */
function initializeTestimonials() {
  renderTestimonials();
  window.addEventListener('gd:languagechange', renderTestimonials);
}



document.addEventListener('DOMContentLoaded', initializeTestimonials);
