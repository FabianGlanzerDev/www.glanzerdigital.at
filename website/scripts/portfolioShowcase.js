const showcase = document.querySelector('[data-practice-showcase]');
const track = showcase?.querySelector('.practice-showcase__track');
const slides = [...document.querySelectorAll('.practice-showcase__slide')];
const tabs = [...document.querySelectorAll('[data-practice-slide]')];
const mobileQuery = window.matchMedia('(max-width: 620px)');
let activeSlide = 0;
let touchStartX = 0;


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
  slides.forEach((slide, index) => slide.classList.toggle('is-active', index === activeSlide));
}


/** Displays one practice project without automatic changes. */
function showSlide(index) {
  if (!track || slides.length === 0) return;
  activeSlide = (index + slides.length) % slides.length;
  updateTabs();
  updateShowcaseTrack();
}


/** Applies the current desktop or mobile showcase layout. */
function updateShowcaseTrack() {
  if (mobileQuery.matches) {
    track.style.transform = 'none';
    updateMobileSlides();
    return;
  }
  slides.forEach((slide) => slide.classList.add('is-active'));
  track.style.transform = `translateX(-${activeSlide * 50}%)`;
}


/** Selects a project from the visible buttons. */
function handleTabClick(event) {
  const index = Number(event.currentTarget.dataset.practiceSlide);
  if (Number.isInteger(index)) showSlide(index);
}


/** Remembers the horizontal touch start position. */
function handleTouchStart(event) {
  touchStartX = event.changedTouches[0]?.clientX ?? 0;
}


/** Changes project after a meaningful horizontal swipe. */
function handleTouchEnd(event) {
  if (!mobileQuery.matches) return;
  const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
  const distance = touchEndX - touchStartX;
  if (Math.abs(distance) >= 45) showSlide(activeSlide + (distance < 0 ? 1 : -1));
}


tabs.forEach((tab) => tab.addEventListener('click', handleTabClick));
showcase?.addEventListener('touchstart', handleTouchStart, { passive: true });
showcase?.addEventListener('touchend', handleTouchEnd, { passive: true });
mobileQuery.addEventListener?.('change', updateShowcaseTrack);
showSlide(0);
