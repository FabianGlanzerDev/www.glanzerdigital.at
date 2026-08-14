/**
 * Stores the current state of keyboard and touch controls.
 */
class Keyboard {
    left = false;
    right = false;
    up = false;
    down = false;
    space = false;
    jumpRequested = false;
    attack = false;
    attackRequested = false;
    slap = false;
    slapRequested = false;

    keyMap = {
        ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
        ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
        Space: 'jump', KeyX: 'attack', KeyE: 'attack', KeyY: 'slap', KeyF: 'slap'
    };

    /**
     * Creates the shared keyboard and touch control state.
     */
    constructor() {
        this.bindEvents();
    }

    /**
     * Registers keyboard events.
     */
    bindEvents() {
        window.addEventListener('keydown', (event) => this.handleKeyEvent(event, true));
        window.addEventListener('keyup', (event) => this.handleKeyEvent(event, false));
    }

    /**
     * Handles a pressed or released control key.
     * @param {KeyboardEvent} event Triggered keyboard event.
     * @param {boolean} isPressed Current key state.
     */
    handleKeyEvent(event, isPressed) {
        const action = this.keyMap[event.code];
        if (!action) return;
        event.preventDefault();
        this.setControl(action, isPressed);
    }

    /**
     * Updates one keyboard or touch control action.
     * @param {string} action Control action name.
     * @param {boolean} isPressed Current pressed state.
     */
    setControl(action, isPressed) {
        if (action === 'jump') return this.updateJump(isPressed);
        if (action === 'attack') return this.updateAttack(isPressed);
        if (action === 'slap') return this.updateSlap(isPressed);
        if (action in this) this[action] = isPressed;
    }

    /**
     * Stores one jump request for every new press.
     * @param {boolean} isPressed Current control state.
     */
    updateJump(isPressed) {
        if (isPressed && !this.space) this.jumpRequested = true;
        this.space = isPressed;
    }

    /**
     * Stores one bubble attack request for every new press.
     * @param {boolean} isPressed Current control state.
     */
    updateAttack(isPressed) {
        if (isPressed && !this.attack) this.attackRequested = true;
        this.attack = isPressed;
    }

    /**
     * Stores one fin-slap request for every new press.
     * @param {boolean} isPressed Current control state.
     */
    updateSlap(isPressed) {
        if (isPressed && !this.slap) this.slapRequested = true;
        this.slap = isPressed;
    }

    /**
     * Returns and clears the pending jump request.
     * @returns {boolean} Whether a jump was requested.
     */
    consumeJump() {
        const requested = this.jumpRequested;
        this.jumpRequested = false;
        return requested;
    }

    /**
     * Returns and clears the pending bubble attack request.
     * @returns {boolean} Whether an attack was requested.
     */
    consumeAttack() {
        const requested = this.attackRequested;
        this.attackRequested = false;
        return requested;
    }

    /**
     * Returns and clears the pending fin-slap request.
     * @returns {boolean} Whether a slap was requested.
     */
    consumeSlap() {
        const requested = this.slapRequested;
        this.slapRequested = false;
        return requested;
    }

    /**
     * Checks whether Sharkie currently receives movement input.
     * @returns {boolean} Whether a movement control is pressed.
     */
    hasMovementInput() {
        return this.left || this.right || this.up || this.down;
    }

    /**
     * Releases every control key and pending action.
     */
    reset() {
        ['left', 'right', 'up', 'down', 'space', 'attack', 'slap'].forEach((key) => this[key] = false);
        this.jumpRequested = false;
        this.attackRequested = false;
        this.slapRequested = false;
    }
}
