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



/** Builds one row of testimonial cards for the endless marquee. */
function createTestimonialGroup(template, items, language, hidden = false) {
  const group = document.createElement('div');
  group.className = 'testimonials-marquee__group';
  if (hidden) group.setAttribute('aria-hidden', 'true');
  items.forEach((item) => group.append(createTestimonialCard(template, item, language)));
  return group;
}



/** Creates two equal groups so the marquee can loop without a visible jump. */
function renderTestimonialMarquee(list, template, items, language) {
  const track = document.createElement('div');
  track.className = 'testimonials-marquee__track';
  track.append(createTestimonialGroup(template, items, language));
  track.append(createTestimonialGroup(template, items, language, true));
  list.replaceChildren(track);
}



/** Updates the testimonial section heading for the active language. */
function renderTestimonialHeading(section, config, language) {
  setTestimonialText(section, TESTIMONIAL_SELECTORS.kicker, getTestimonialText(config.section.kicker, language));
  setTestimonialText(section, TESTIMONIAL_SELECTORS.title, getTestimonialText(config.section.title, language));
  setTestimonialText(section, TESTIMONIAL_SELECTORS.intro, getTestimonialText(config.section.intro, language));
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
  renderTestimonialMarquee(list, template, items, language);
  renderTestimonialHeading(section, config, language);
}



/** Initializes testimonials and keeps them in sync with the language switch. */
function initializeTestimonials() {
  renderTestimonials();
  window.addEventListener('gd:languagechange', renderTestimonials);
}



document.addEventListener('DOMContentLoaded', initializeTestimonials);
