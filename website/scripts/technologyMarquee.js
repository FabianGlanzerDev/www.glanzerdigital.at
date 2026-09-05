'use strict';

const TECHNOLOGY_MARQUEE_SELECTOR = '.technology-marquee';
const TECHNOLOGY_ITEM_SELECTOR = '.technology-marquee__item';



/** Returns whether the current device uses touch/coarse input. */
function usesTouchMarqueeControls() {
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}



/** Toggles the technology animation after tapping one skill card. */
function handleTechnologyMarqueeTap(event) {
  if (!usesTouchMarqueeControls()) return;
  if (!event.target.closest(TECHNOLOGY_ITEM_SELECTOR)) return;
  event.currentTarget.classList.toggle('is-paused');
}



/** Initializes touch pause/resume for the technology marquee. */
function initializeTechnologyMarquee() {
  const marquee = document.querySelector(TECHNOLOGY_MARQUEE_SELECTOR);
  marquee?.addEventListener('click', handleTechnologyMarqueeTap);
}



document.addEventListener('DOMContentLoaded', initializeTechnologyMarquee);
