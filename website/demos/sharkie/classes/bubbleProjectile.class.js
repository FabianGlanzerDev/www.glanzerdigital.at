/**
 * Represents a bubble projectile fired by Sharkie.
 */
class BubbleProjectile extends MovableObject {
    width = 82;
    height = 82;
    speed = 15;
    direction = 1;
    active = true;
    offset = { top: 10, right: 10, bottom: 10, left: 10 };
    imagePath = 'assets/images/projectiles/bubble/bubble-projectile.png';

    /**
     * Creates a projectile at Sharkie's current world position.
     * @param {number} worldX Horizontal world position.
     * @param {number} y Vertical canvas position.
     * @param {number} direction Horizontal travel direction.
     */
    constructor(worldX, y, direction) {
        super();
        this.worldX = worldX;
        this.y = y;
        this.direction = direction;
        this.loadImage(this.imagePath);
    }

    /**
     * Moves the projectile and updates its screen position.
     * @param {number} cameraX Current horizontal camera position.
     * @param {number} levelWidth Total width of the level.
     */
    update(cameraX, levelWidth) {
        if (!this.active) return;
        this.worldX += this.speed * this.direction;
        this.updateScreenPosition(cameraX);
        this.checkBounds(levelWidth, cameraX);
    }

    /**
     * Deactivates projectiles that leave the useful game area.
     * @param {number} levelWidth Total width of the level.
     * @param {number} cameraX Current horizontal camera position.
     */
    checkBounds(levelWidth, cameraX) {
        const behindCamera = this.worldX < cameraX - this.width;
        const aheadOfCamera = this.worldX > cameraX + 2200;
        if (this.worldX < 0 || this.worldX > levelWidth || behindCamera || aheadOfCamera) {
            this.active = false;
        }
    }

    /**
     * Removes the projectile after a successful hit.
     */
    deactivate() {
        this.active = false;
    }

    /**
     * Draws the projectile while it is active.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    draw(context) {
        if (!this.active) return;
        context.save();
        context.shadowBlur = 24;
        context.shadowColor = this.getCssVariable('--color-bubble-projectile-glow');
        super.draw(context);
        context.restore();
    }
}
