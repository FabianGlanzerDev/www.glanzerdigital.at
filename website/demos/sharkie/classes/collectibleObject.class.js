/**
 * Base class for animated collectible objects in the game world.
 */
class CollectibleObject extends DrawableObject {
    worldX = 0;
    collected = false;
    animationImages = [];
    frameDelay = 120;
    lastFrameChange = 0;
    type = '';

    /**
     * Creates an animated collectible at a world position.
     * @param {string[]} images Animation frames.
     * @param {number} worldX Horizontal world position.
     * @param {number} y Vertical canvas position.
     * @param {string} type Collectible type.
     */
    constructor(images, worldX, y, type) {
        super();
        this.animationImages = images;
        this.worldX = worldX;
        this.y = y;
        this.type = type;
        this.loadImages(images);
        this.reset();
    }

    /**
     * Updates the screen position and animation frame.
     * @param {number} cameraX Current horizontal camera position.
     */
    update(cameraX) {
        this.x = this.worldX - cameraX;
        if (!this.collected) this.updateAnimation();
    }

    /**
     * Advances the animation after the configured delay.
     */
    updateAnimation() {
        const now = Date.now();
        if (now - this.lastFrameChange < this.frameDelay) return;
        this.playAnimation(this.animationImages);
        this.lastFrameChange = now;
    }

    /**
     * Marks the object as collected.
     */
    collect() {
        this.collected = true;
    }

    /**
     * Restores the object for a new game.
     */
    reset() {
        this.collected = false;
        this.currentImage = 0;
        this.lastFrameChange = 0;
        this.image = this.imageCache[this.animationImages[0]];
    }

    /**
     * Draws the collectible while it is available.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    draw(context) {
        if (!this.collected) super.draw(context);
    }
}
