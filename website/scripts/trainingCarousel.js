const trainingCarousel = document.querySelector('.training-marquee');
const trainingCards = [...document.querySelectorAll('.training-marquee__group:first-child .training-project')];
const trainingDots = [...document.querySelectorAll('[data-training-slide]')];
const trainingPrev = document.querySelector('[data-training-prev]');
const trainingNext = document.querySelector('[data-training-next]');
let trainingIndex = 0;
let trainingScrollTimer = null;


/** Returns the scroll position of one training card. */
function getTrainingCardLeft(card) {
  const cardBox = card.getBoundingClientRect();
  const carouselBox = trainingCarousel.getBoundingClientRect();
  return trainingCarousel.scrollLeft + cardBox.left - carouselBox.left;
}


/** Updates dots and arrow availability. */
function updateTrainingControls() {
  trainingDots.forEach((dot, index) => {
    const active = index === trainingIndex;
    dot.classList.toggle('is-active', active);
    dot.setAttribute('aria-pressed', String(active));
  });
  if (trainingPrev) trainingPrev.disabled = trainingIndex === 0;
  if (trainingNext) trainingNext.disabled = trainingIndex === trainingCards.length - 1;
}


/** Scrolls to one training project. */
function showTrainingProject(index) {
  if (!trainingCarousel || trainingCards.length === 0) return;
  trainingIndex = Math.max(0, Math.min(index, trainingCards.length - 1));
  trainingCarousel.scrollTo({ left: getTrainingCardLeft(trainingCards[trainingIndex]), behavior: 'smooth' });
  updateTrainingControls();
}


/** Syncs the active dot after manual swiping or scrolling. */
function syncTrainingIndex() {
  if (!trainingCarousel || trainingCards.length === 0) return;
  const maxScroll = trainingCarousel.scrollWidth - trainingCarousel.clientWidth;
  const targets = trainingCards.map((card) => Math.min(getTrainingCardLeft(card), maxScroll));
  const distances = targets.map((left) => Math.abs(left - trainingCarousel.scrollLeft));
  trainingIndex = distances.indexOf(Math.min(...distances));
  updateTrainingControls();
}


trainingDots.forEach((dot) => dot.addEventListener('click', () => showTrainingProject(Number(dot.dataset.trainingSlide))));
trainingPrev?.addEventListener('click', () => showTrainingProject(trainingIndex - 1));
trainingNext?.addEventListener('click', () => showTrainingProject(trainingIndex + 1));
/** Debounces active-dot updates while the carousel is moving. */
function scheduleTrainingSync() {
  window.clearTimeout(trainingScrollTimer);
  trainingScrollTimer = window.setTimeout(syncTrainingIndex, 120);
}


trainingCarousel?.addEventListener('scrollend', syncTrainingIndex);
trainingCarousel?.addEventListener('scroll', scheduleTrainingSync, { passive: true });
updateTrainingControls();
