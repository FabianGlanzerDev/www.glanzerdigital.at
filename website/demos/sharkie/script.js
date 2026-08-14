/** @file Global application entry point. */

let touchInputDetected = false;

/**
 * Starts the application after all game modules are available.
 */
function initializeApplication() {
    applyTouchCapabilityClass();
    applyPlatformClasses();
    bindTouchCapabilityEvents();
    initializeGame();
}


/**
 * Marks every touch-capable device for responsive controls.
 */
function applyTouchCapabilityClass() {
    document.documentElement.classList.toggle('touch-device', isTouchCapable());
}


/**
 * Applies platform classes used for iOS and standalone layout rules.
 */
function applyPlatformClasses() {
    document.documentElement.classList.toggle('ios-device', isIosDevice());
    document.documentElement.classList.toggle('standalone-mode', isStandaloneMode());
}


/**
 * Checks whether the current browser runs on an iPhone or iPad.
 * @returns {boolean} Whether the device uses iOS or iPadOS.
 */
function isIosDevice() {
    const classicIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const modernIpad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return classicIos || modernIpad;
}


/**
 * Checks whether the page runs as an installed standalone web app.
 * @returns {boolean} Whether standalone display mode is active.
 */
function isStandaloneMode() {
    const standaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
    return standaloneDisplay || navigator.standalone === true;
}


/**
 * Keeps touch detection synchronized after device or orientation changes.
 */
function bindTouchCapabilityEvents() {
    window.addEventListener('resize', updateScreenVisibility);
    window.addEventListener('orientationchange', updateScreenVisibility);
    window.addEventListener('pointerdown', detectTouchPointer, { passive: true });
    bindTouchMediaQuery('(pointer: coarse)');
    bindTouchMediaQuery('(any-pointer: coarse)');
}


/**
 * Re-evaluates touch UI when a pointer capability changes.
 * @param {string} query Pointer media query to observe.
 */
function bindTouchMediaQuery(query) {
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener?.('change', updateScreenVisibility);
}


/**
 * Marks the page as touch capable after a real touch pointer is detected.
 * @param {PointerEvent} event Pointer event received by the page.
 */
function detectTouchPointer(event) {
    if (event.pointerType !== 'touch') return;
    touchInputDetected = true;
    document.documentElement.classList.add('touch-device');
    updateScreenVisibility();
}


/**
 * Checks touch support without relying on a specific device size.
 * @returns {boolean} Whether the device supports touch input.
 */
function isTouchCapable() {
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const anyCoarsePointer = window.matchMedia('(any-pointer: coarse)').matches;
    return touchInputDetected || navigator.maxTouchPoints > 0 || coarsePointer || anyCoarsePointer || 'ontouchstart' in window;
}


initializeApplication();
