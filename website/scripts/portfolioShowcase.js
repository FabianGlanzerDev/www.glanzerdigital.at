const showcase = document.querySelector('[data-practice-showcase]');
const toggleButton = document.querySelector('[data-practice-showcase-toggle]');
const track = showcase?.querySelector('.practice-showcase__track');
const slides = [...document.querySelectorAll('.practice-showcase__slide')];
const tabs = [...document.querySelectorAll('[data-practice-slide]')];
const progress = document.querySelector('[data-practice-progress]');
const mobileQuery = window.matchMedia('(max-width: 620px)');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

const AUTOPLAY_DELAY = 8000;
let activeSlide = 0;
let autoplayTimer = null;
let isPaused = false;
let touchStartX = 0;


/** Returns whether automatic project changes should be disabled. */
function shouldDisableAutoplay() {
  return reducedMotionQuery.matches;
}


/** Restarts the visible countdown for the next project. */
function restartProgress() {
  if (!progress || shouldDisableAutoplay() || isPaused) return;

  progress.classList.remove('is-running');
  void progress.offsetWidth;
  progress.classList.add('is-running');
}


/** Marks the selected project in the navigation. */
function updateTabs() {
  tabs.forEach((tab, index) => {
    const isActive = index === activeSlide;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-pressed', String(isActive));
  });
}


/** Updates which complete project is visible on small screens. */
function updateMobileSlides() {
  slides.forEach((slide, index) => {
    slide.classList.toggle('is-active', index === activeSlide);
  });
}


/** Displays one practice project. */
function showSlide(index, restartTimer = true) {
  if (!track || slides.length === 0) return;

  activeSlide = (index + slides.length) % slides.length;
  updateTabs();

  if (mobileQuery.matches) {
    track.style.transform = 'none';
    updateMobileSlides();
  } else {
    slides.forEach((slide) => slide.classList.add('is-active'));
    track.style.transform = `translateX(-${activeSlide * 50}%)`;
  }

  if (restartTimer) scheduleNextSlide();
}


/** Schedules the next automatic project change. */
function scheduleNextSlide() {
  clearTimeout(autoplayTimer);

  if (isPaused || shouldDisableAutoplay()) return;

  restartProgress();
  autoplayTimer = setTimeout(() => {
    showSlide(activeSlide + 1);
  }, AUTOPLAY_DELAY);
}


/** Updates pause state and the desktop pause button. */
function setPaused(paused) {
  isPaused = paused;

  if (showcase) showcase.dataset.paused = String(paused);

  if (toggleButton) {
    toggleButton.setAttribute('aria-pressed', String(paused));
    toggleButton.textContent = paused ? 'Animation fortsetzen' : 'Animation pausieren';
  }

  if (paused) {
    clearTimeout(autoplayTimer);
    progress?.classList.remove('is-running');
    return;
  }

  scheduleNextSlide();
}


/** Selects a project from the 01/02 buttons. */
function handleTabClick(event) {
  const index = Number(event.currentTarget.dataset.practiceSlide);
  if (!Number.isInteger(index)) return;

  showSlide(index);
}


/** Enables a simple left/right swipe on mobile. */
function handleTouchStart(event) {
  touchStartX = event.changedTouches[0]?.clientX ?? 0;
}


/** Changes project after a meaningful horizontal swipe. */
function handleTouchEnd(event) {
  if (!mobileQuery.matches) return;

  const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
  const distance = touchEndX - touchStartX;

  if (Math.abs(distance) < 45) return;

  showSlide(activeSlide + (distance < 0 ? 1 : -1));
}


/** Resets layout when the breakpoint or motion preference changes. */
function refreshShowcaseMode() {
  clearTimeout(autoplayTimer);

  if (!track || slides.length === 0) return;

  showSlide(activeSlide, false);

  if (shouldDisableAutoplay()) {
    progress?.classList.remove('is-running');
    return;
  }

  scheduleNextSlide();
}


tabs.forEach((tab) => tab.addEventListener('click', handleTabClick));
toggleButton?.addEventListener('click', () => setPaused(!isPaused));

showcase?.addEventListener('mouseenter', () => {
  if (!mobileQuery.matches) setPaused(true);
});

showcase?.addEventListener('mouseleave', () => {
  if (!mobileQuery.matches) setPaused(false);
});

showcase?.addEventListener('focusin', () => {
  if (!mobileQuery.matches) setPaused(true);
});

showcase?.addEventListener('focusout', (event) => {
  if (!mobileQuery.matches && !showcase.contains(event.relatedTarget)) setPaused(false);
});

showcase?.addEventListener('touchstart', handleTouchStart, { passive: true });
showcase?.addEventListener('touchend', handleTouchEnd, { passive: true });

mobileQuery.addEventListener?.('change', refreshShowcaseMode);
reducedMotionQuery.addEventListener?.('change', refreshShowcaseMode);

updateTabs();
refreshShowcaseMode();
