/**
 * Represents a harmless decorative fish that adds life to the level.
 */
class AmbientFish extends DrawableObject {
    worldX = 0;
    initialWorldX = 0;
    baseY = 0;
    speed = 0.8;
    direction = -1;
    travelDistance = 520;
    floatAngle = 0;
    floatAmplitude = 12;
    currentCameraX = 0;
    animationInterval = null;
    movementInterval = null;
    isActive = false;
    opacity = 0.38;
    animationImages = [];

    /**
     * Creates a decorative fish at a level position.
     * @param {number} worldX Initial horizontal world position.
     * @param {number} y Initial vertical position.
     * @param {string} variant Visual color variant.
     * @param {number} size Rendered fish width.
     * @param {number} speed Horizontal movement speed.
     */
    constructor(worldX, y, variant = 'coral', size = 110, speed = 0.8) {
        super();
        this.configure(worldX, y, size, speed);
        this.animationImages = this.getImages(variant);
        this.loadImages(this.animationImages);
        this.resetForHome();
    }

    /**
     * Stores the initial position and appearance values.
     */
    configure(worldX, y, size, speed) {
        this.initialWorldX = worldX;
        this.baseY = y;
        this.width = size;
        this.height = size * 0.76;
        this.speed = speed;
    }

    /**
     * Returns animation frames for a visual variant.
     * @param {string} variant Visual color variant.
     * @returns {string[]} Fish animation frames.
     */
    getImages(variant) {
        const folder = variant === 'red' ? 'red' : 'coral';
        return [1, 2, 3, 4, 5].map((frame) => {
            return `assets/images/ambient-fish/${folder}/reef-fish-${frame}.png`;
        });
    }

    /**
     * Starts decorative animation and movement.
     * @param {number} cameraX Initial camera position.
     */
    start(cameraX = 0) {
        this.stop();
        this.currentCameraX = cameraX;
        this.resetState();
        this.isActive = true;
        this.startAnimationLoop();
        this.startMovementLoop();
    }

    /**
     * Restores the fish while the game is on the home screen.
     */
    resetForHome() {
        this.stop();
        this.currentCameraX = 0;
        this.resetState();
    }

    /**
     * Restores animation and movement values.
     */
    resetState() {
        this.worldX = this.initialWorldX;
        this.y = this.baseY;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.floatAngle = Math.random() * Math.PI * 2;
        this.currentImage = 0;
        this.image = this.imageCache[this.animationImages[0]];
        this.updateScreenPosition(this.currentCameraX);
    }

    /**
     * Starts the recurring fish animation.
     */
    startAnimationLoop() {
        this.animationInterval = setInterval(() => {
            if (this.isActive) this.playAnimation(this.animationImages);
        }, 180);
    }

    /**
     * Starts the recurring movement update.
     */
    startMovementLoop() {
        this.movementInterval = setInterval(() => this.move(), 1000 / 60);
    }

    /**
     * Moves the fish slowly through its local reef area.
     */
    move() {
        if (!this.isActive) return;
        this.worldX += this.speed * this.direction;
        this.updateDirection();
        this.updateFloatingMovement();
    }

    /**
     * Reverses the fish at the edges of its decorative patrol area.
     */
    updateDirection() {
        const halfRange = this.travelDistance / 2;
        if (this.worldX < this.initialWorldX - halfRange) this.direction = 1;
        if (this.worldX > this.initialWorldX + halfRange) this.direction = -1;
        this.otherDirection = this.direction > 0;
    }

    /**
     * Adds a subtle vertical floating movement.
     */
    updateFloatingMovement() {
        this.floatAngle += 0.015;
        this.y = this.baseY + Math.sin(this.floatAngle) * this.floatAmplitude;
    }

    /**
     * Updates the fish relative to the current camera.
     * @param {number} cameraX Current horizontal camera position.
     */
    update(cameraX) {
        this.currentCameraX = cameraX;
        this.updateScreenPosition(cameraX);
    }

    /**
     * Converts the world position to the current screen position.
     * @param {number} cameraX Current horizontal camera position.
     */
    updateScreenPosition(cameraX) {
        this.x = this.worldX - cameraX;
    }

    /**
     * Stops all decorative fish intervals.
     */
    stop() {
        this.isActive = false;
        clearInterval(this.animationInterval);
        clearInterval(this.movementInterval);
        this.animationInterval = null;
        this.movementInterval = null;
    }

    /**
     * Draws the decorative fish with reduced opacity.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    draw(context) {
        context.save();
        context.globalAlpha = this.opacity;
        super.draw(context);
        context.restore();
    }
}
