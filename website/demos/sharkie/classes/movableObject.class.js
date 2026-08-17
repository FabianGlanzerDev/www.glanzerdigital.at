/**
 * Base class for every movable game object.
 */
class MovableObject extends DrawableObject {
    speed = 5;
    worldX = 0;

    /**
     * Moves the object to the right on the canvas.
     */
    moveRight() {
        this.x += this.speed;
        this.otherDirection = false;
    }

    /**
     * Moves the object to the left on the canvas.
     */
    moveLeft() {
        this.x -= this.speed;
        this.otherDirection = true;
    }

    /**
     * Moves the object to the right inside the level.
     */
    moveWorldRight() {
        this.worldX += this.speed;
        this.otherDirection = false;
    }

    /**
     * Moves the object to the left inside the level.
     */
    moveWorldLeft() {
        this.worldX -= this.speed;
        this.otherDirection = true;
    }

    /**
     * Moves the object upward.
     */
    moveUp() {
        this.y -= this.speed;
    }

    /**
     * Moves the object downward.
     */
    moveDown() {
        this.y += this.speed;
    }

    /**
     * Converts a world position into a canvas position.
     * @param {number} cameraX Current horizontal camera position.
     */
    updateScreenPosition(cameraX) {
        this.x = this.worldX - cameraX;
    }
}
