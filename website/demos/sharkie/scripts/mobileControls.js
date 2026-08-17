/** @file Connects touch controls with the shared keyboard state. */

const mobileJoystickZone = document.getElementById('mobileJoystickZone');
const mobileJoystick = document.getElementById('mobileJoystick');
const mobileJoystickKnob = document.getElementById('mobileJoystickKnob');
const mobileJoystickState = {
    pointerId: null,
    centerX: 0,
    centerY: 0,
    radius: 0
};


/**
 * Registers joystick and action controls used on touch devices.
 */
function bindMobileControls() {
    const buttons = mobileControls.querySelectorAll('.mobile-actions [data-control]');
    buttons.forEach((button) => bindMobileControlButton(button));
    bindMobileJoystick();
    mobileControls.addEventListener('contextmenu', preventMobileContextMenu);
    window.addEventListener('blur', releaseMobileControls);
    document.addEventListener('visibilitychange', releaseHiddenMobileControls);
}


/**
 * Registers pointer events for the fixed movement joystick.
 */
function bindMobileJoystick() {
    mobileJoystickZone.addEventListener('pointerdown', startMobileJoystick);
    mobileJoystickZone.addEventListener('pointermove', moveMobileJoystick);
    mobileJoystickZone.addEventListener('pointerup', stopMobileJoystick);
    mobileJoystickZone.addEventListener('pointercancel', stopMobileJoystick);
}


/**
 * Starts the fixed joystick when the player touches it.
 * @param {PointerEvent} event Pointer event from the movement area.
 */
function startMobileJoystick(event) {
    if (mobileJoystickState.pointerId !== null) return;
    event.preventDefault();
    mobileJoystickState.pointerId = event.pointerId;
    mobileJoystickZone.setPointerCapture?.(event.pointerId);
    setMobileJoystickCenter();
    mobileJoystick.classList.add('is-active');
    updateMobileJoystick(event);
}


/**
 * Stores the center and movement radius of the fixed joystick.
 */
function setMobileJoystickCenter() {
    const joystickRect = mobileJoystick.getBoundingClientRect();
    mobileJoystickState.centerX = joystickRect.left + joystickRect.width / 2;
    mobileJoystickState.centerY = joystickRect.top + joystickRect.height / 2;
    mobileJoystickState.radius = joystickRect.width * 0.28;
}


/**
 * Updates joystick movement while the active finger is dragged.
 * @param {PointerEvent} event Current pointer event.
 */
function moveMobileJoystick(event) {
    if (event.pointerId !== mobileJoystickState.pointerId) return;
    event.preventDefault();
    updateMobileJoystick(event);
}


/**
 * Applies the current pointer offset to the joystick and movement state.
 * @param {PointerEvent} event Current pointer event.
 */
function updateMobileJoystick(event) {
    const vector = getLimitedJoystickVector(event);
    updateMobileJoystickVisual(vector);
    updateJoystickMovement(vector);
}


/**
 * Moves the visual knob without moving the fixed joystick base.
 * @param {{x: number, y: number}} vector Limited joystick vector.
 */
function updateMobileJoystickVisual(vector) {
    const x = `calc(-50% + ${vector.x}px)`;
    const y = `calc(-50% + ${vector.y}px)`;
    mobileJoystickKnob.style.transform = `translate(${x}, ${y})`;
}


/**
 * Calculates the joystick vector limited to its visual radius.
 * @param {PointerEvent} event Current pointer event.
 * @returns {{x: number, y: number}} Limited joystick vector.
 */
function getLimitedJoystickVector(event) {
    const x = event.clientX - mobileJoystickState.centerX;
    const y = event.clientY - mobileJoystickState.centerY;
    const distance = Math.hypot(x, y) || 1;
    const scale = Math.min(1, mobileJoystickState.radius / distance);
    return { x: x * scale, y: y * scale };
}


/**
 * Converts joystick direction into shared movement controls.
 * @param {{x: number, y: number}} vector Limited joystick vector.
 */
function updateJoystickMovement(vector) {
    const deadZone = mobileJoystickState.radius * 0.28;
    keyboard.setControl('left', vector.x < -deadZone);
    keyboard.setControl('right', vector.x > deadZone);
    keyboard.setControl('up', vector.y < -deadZone);
    keyboard.setControl('down', vector.y > deadZone);
}


/**
 * Stops the active joystick and releases movement controls.
 * @param {PointerEvent} event Ending pointer event.
 */
function stopMobileJoystick(event) {
    if (event.pointerId !== mobileJoystickState.pointerId) return;
    event.preventDefault();
    mobileJoystickState.pointerId = null;
    releaseJoystickMovement();
    resetMobileJoystickVisual();
}


/**
 * Releases movement without interrupting action-button pointers.
 */
function releaseJoystickMovement() {
    ['left', 'right', 'up', 'down'].forEach((control) => {
        keyboard.setControl(control, false);
    });
}


/**
 * Hides the joystick and centers its visual knob.
 */
function resetMobileJoystickVisual() {
    mobileJoystick.classList.remove('is-active');
    mobileJoystickKnob.style.transform = '';
}


/**
 * Connects one touch action button with pointer press and release events.
 * @param {HTMLButtonElement} button Mobile action button.
 */
function bindMobileControlButton(button) {
    button.addEventListener('pointerdown', handleMobilePointerDown);
    button.addEventListener('pointerup', handleMobilePointerUp);
    button.addEventListener('pointercancel', handleMobilePointerUp);
}


/**
 * Starts one mobile action and captures the active pointer.
 * @param {PointerEvent} event Pointer event from an action button.
 */
function handleMobilePointerDown(event) {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateMobileControl(event.currentTarget, true);
}


/**
 * Releases one mobile action after the pointer ends.
 * @param {PointerEvent} event Pointer event from an action button.
 */
function handleMobilePointerUp(event) {
    event.preventDefault();
    updateMobileControl(event.currentTarget, false);
}


/**
 * Updates one mobile action state.
 * @param {HTMLElement} button Mobile action button.
 * @param {boolean} isPressed Whether the action is pressed.
 */
function updateMobileControl(button, isPressed) {
    const action = button.dataset.control;
    keyboard.setControl(action, isPressed);
}


/**
 * Releases all controls when the browser loses focus.
 */
function releaseMobileControls() {
    mobileJoystickState.pointerId = null;
    keyboard.reset();
    resetMobileJoystickVisual();
}


/**
 * Releases touch controls when the page becomes hidden.
 */
function releaseHiddenMobileControls() {
    if (document.hidden) releaseMobileControls();
}


/**
 * Prevents long-press context menus on mobile controls.
 * @param {Event} event Context menu event.
 */
function preventMobileContextMenu(event) {
    event.preventDefault();
}
