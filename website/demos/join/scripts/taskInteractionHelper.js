/**
 * Makes a horizontal overflow container draggable with the mouse.
 * Native touch scrolling remains available on touch devices.
 * @param {HTMLElement} container - The scrollable element.
 */
function initializeHorizontalDragScroll(container) {
    if (!container) return;
    if (container.dataset.dragScrollInitialized) return;
    container.dataset.dragScrollInitialized = "true";
    container.dragScrollState = { startX: 0, startScrollLeft: 0, didDrag: false, pointerId: null };
    container.addEventListener("pointerdown", (event) => startHorizontalDrag(event, container));
    container.addEventListener("pointermove", (event) => moveHorizontalDrag(event, container));
    container.addEventListener("pointerup", () => stopHorizontalDrag(container, true));
    container.addEventListener("pointercancel", () => stopHorizontalDrag(container, false));
    container.addEventListener("click", (event) => preventClickAfterDrag(event, container), true);
}


/**
 * Saves the starting position for horizontal mouse dragging.
 * @param {PointerEvent} event - The pointer event.
 * @param {HTMLElement} element - The scrollable element.
 */
function startHorizontalDrag(event, element) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    if (event.target.closest(".task-card")) return;
    const state = element.dragScrollState;
    state.startX = event.clientX;
    state.startScrollLeft = element.scrollLeft;
    state.didDrag = false;
    state.pointerId = event.pointerId;
}


/**
 * Moves the element while the mouse is being dragged.
 * @param {PointerEvent} event - The pointer event.
 * @param {HTMLElement} element - The scrollable element.
 */
function moveHorizontalDrag(event, element) {
    const state = element.dragScrollState;
    if (event.pointerId !== state.pointerId) return;
    if (!state.didDrag && Math.abs(event.clientX - state.startX) > 4) beginHorizontalDrag(event, element);
    if (!state.didDrag) return;
    element.scrollLeft = state.startScrollLeft - (event.clientX - state.startX);
}


/**
 * Activates the dragging state after the pointer has moved.
 * @param {PointerEvent} event - The pointer event.
 * @param {HTMLElement} element - The scrollable element.
 */
function beginHorizontalDrag(event, element) {
    element.dragScrollState.didDrag = true;
    element.classList.add("is-dragging");
    element.setPointerCapture(event.pointerId);
}


/**
 * Stops horizontal dragging and resets its state.
 * @param {HTMLElement} element - The scrollable element.
 * @param {boolean} keepDragState - Whether to delay resetting the drag flag.
 */
function stopHorizontalDrag(element, keepDragState) {
    const state = element.dragScrollState;
    element.classList.remove("is-dragging");
    state.pointerId = null;
    if (!keepDragState) state.didDrag = false;
    else setTimeout(() => { state.didDrag = false; }, 0);
}


/**
 * Prevents a click when the pointer was used for dragging.
 * @param {MouseEvent} event - The click event.
 * @param {HTMLElement} element - The scrollable element.
 */
function preventClickAfterDrag(event, element) {
    if (!element.dragScrollState.didDrag) return;
    event.preventDefault();
    event.stopImmediatePropagation();
}


/**
 * Makes every visible priority option independently keyboard accessible.
 * @param {HTMLElement} group - The priority radio group.
 */
function initializePriorityKeyboard(group) {
    if (!group) return;
    const labels = group.querySelectorAll("label[for]");
    updatePriorityAriaState(group);
    labels.forEach((label) => {
        label.addEventListener("keydown", (event) => selectPriorityWithKeyboard(event, group));
    });
    group.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.addEventListener("change", () => updatePriorityAriaState(group));
    });
}


/**
 * Selects a priority when Enter or Space is pressed.
 * @param {KeyboardEvent} event - The keyboard event.
 * @param {HTMLElement} group - The priority radio group.
 */
function selectPriorityWithKeyboard(event, group) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const input = event.currentTarget.control;
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
}


/**
 * Updates the accessible selected state of all priorities.
 * @param {HTMLElement} group - The priority radio group.
 */
function updatePriorityAriaState(group) {
    group.querySelectorAll("label[for]").forEach((label) => {
        label.setAttribute("aria-checked", String(label.control.checked));
    });
}
