const pageRevealSelectors = [
  '.hero-clean-copy',
  '.trust-bar-grid',
  '.clean-heading',
  '.clean-service-list',
  '.testimonials-grid',
  '.pricing-grid',
  '.pricing-notes',
  '.services-hero__inner',
  '.services-trust__grid',
  '.services-detail__list',
  '.services-options__grid',
  '.process-service__grid',
  '.preparation-grid',
  '.extras-grid',
  '.automation-service__grid',
  '.contact-hero__inner',
  '.contact-request-card',
  '.about-hero__inner',
  '.about-clean-grid',
  '.about-collaboration-heading',
  '.about-collaboration-grid',
  '.about-values-grid',
  '.page-hero-inner',
  '.legal-content',
  '.cta-row',
  '.error-layout'
];
const pageReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let pageLastScrollY = window.scrollY;


/** Returns all elements that should animate on the current page. */
function getPageRevealItems() {
  const selected = pageRevealSelectors.flatMap((selector) => [...document.querySelectorAll(selector)]);
  const existing = [...document.querySelectorAll('[data-page-reveal]')];
  return [...new Set([...selected, ...existing])];
}


/** Adds the reveal marker to one element. */
function preparePageReveal(element) {
  element.setAttribute('data-page-reveal', '');
}


/** Makes one page element visible. */
function showPageReveal(element) {
  element.classList.add('is-visible');
}


/** Reveals all page elements without animation. */
function showAllPageReveals(items) {
  items.forEach(showPageReveal);
}


/** Returns the current vertical scroll direction. */
function getPageScrollDirection() {
  const direction = window.scrollY < pageLastScrollY ? 'up' : 'down';
  pageLastScrollY = window.scrollY;
  return direction;
}


/** Sets the direction used for the next reveal animation. */
function setPageRevealDirection(element, direction) {
  element.classList.toggle('reveal-from-top', direction === 'up');
  element.classList.toggle('reveal-from-bottom', direction === 'down');
}


/** Updates one element when it enters or leaves the viewport. */
function updatePageReveal(entry, direction) {
  setPageRevealDirection(entry.target, direction);
  entry.target.classList.toggle('is-visible', entry.isIntersecting);
}


/** Updates reveal states while scrolling in either direction. */
function handlePageReveal(entries) {
  const direction = getPageScrollDirection();
  entries.forEach((entry) => updatePageReveal(entry, direction));
}


/** Starts repeatable page animations when motion is allowed. */
function initPageMotion() {
  const items = getPageRevealItems();
  items.forEach(preparePageReveal);
  if (pageReduceMotion.matches) return showAllPageReveals(items);
  const observer = new IntersectionObserver(handlePageReveal, { threshold: .14, rootMargin: '0px 0px -7%' });
  items.forEach((item) => observer.observe(item));
}


initPageMotion();
