/**
 * Represents a solid obstacle placed inside the level world.
 */
class Obstacle extends DrawableObject {
    worldX = 0;
    collisionBoxes = [];
    collisionInset = 7;

    /**
     * Creates a level obstacle with one or more collision zones.
     * @param {string} imagePath Path to the obstacle image.
     * @param {number} worldX Horizontal world position.
     * @param {number} y Vertical canvas position.
     * @param {number} width Rendered obstacle width.
     * @param {number} height Rendered obstacle height.
     * @param {Object[]} collisionBoxes Local collision rectangles.
     */
    constructor(imagePath, worldX, y, width, height, collisionBoxes) {
        super();
        this.worldX = worldX;
        this.y = y;
        this.width = width;
        this.height = height;
        this.collisionBoxes = collisionBoxes;
        this.loadImage(imagePath);
    }

    /**
     * Updates the obstacle position relative to the camera.
     * @param {number} cameraX Current horizontal camera position.
     */
    update(cameraX) {
        this.x = this.worldX - cameraX;
    }

    /**
     * Checks an object's current screen position against all solid zones.
     * @param {DrawableObject} object Object to test.
     * @returns {boolean} Whether a solid zone overlaps the object.
     */
    isCollidingWith(object) {
        return this.collisionBoxes.some((box) => {
            return this.isScreenBoxColliding(box, object);
        });
    }

    /**
     * Checks a proposed world position against the obstacle hitboxes.
     * @param {DrawableObject} object Object to test.
     * @param {number} objectWorldX Proposed object world position.
     * @param {number} objectY Proposed object vertical position.
     * @param {number} tolerance Additional hitbox tolerance in pixels.
     * @returns {boolean} Whether the proposed position overlaps a solid zone.
     */
    isCollidingAt(object, objectWorldX, objectY, tolerance = 0) {
        return this.collisionBoxes.some((box) => {
            return this.isWorldBoxColliding(
                box,
                object,
                objectWorldX,
                objectY,
                tolerance
            );
        });
    }

    /**
     * Checks one local obstacle rectangle against the current screen position.
     * @param {Object} box Local obstacle collision rectangle.
     * @param {DrawableObject} object Object to test.
     * @returns {boolean} Whether both rectangles overlap.
     */
    isScreenBoxColliding(box, object) {
        const inset = this.collisionInset;
        const left = this.x + box.x + inset;
        const right = this.x + box.x + box.width - inset;
        const top = this.y + box.y + inset;
        const bottom = this.y + box.y + box.height - inset;
        return right > object.getLeftEdge()
            && left < object.getRightEdge()
            && bottom > object.getTopEdge()
            && top < object.getBottomEdge();
    }

    /**
     * Checks a world-space obstacle rectangle against a proposed object position.
     * @param {Object} box Local obstacle collision rectangle.
     * @param {DrawableObject} object Object to test.
     * @param {number} objectWorldX Proposed object world position.
     * @param {number} objectY Proposed vertical position.
     * @param {number} tolerance Additional object hitbox inset.
     * @returns {boolean} Whether both collision rectangles overlap.
     */
    isWorldBoxColliding(box, object, objectWorldX, objectY, tolerance) {
        const inset = this.collisionInset;
        const left = this.worldX + box.x + inset, right = this.worldX + box.x + box.width - inset;
        const top = this.y + box.y + inset, bottom = this.y + box.y + box.height - inset;
        const objectLeft = objectWorldX + object.offset.left + tolerance;
        const objectRight = objectWorldX + object.width - object.offset.right - tolerance;
        const objectTop = objectY + object.offset.top + tolerance;
        const objectBottom = objectY + object.height - object.offset.bottom - tolerance;
        return right > objectLeft
            && left < objectRight
            && bottom > objectTop
            && top < objectBottom;
    }
}
