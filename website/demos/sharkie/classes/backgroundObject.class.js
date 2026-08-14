/**
 * Represents one endlessly repeating layer of the game background.
 */
class BackgroundObject extends DrawableObject {
    width = 3840;
    height = 1080;
    scrollFactor;

    /**
     * Creates a background layer.
     * @param {string} imagePath Path to the background image.
     * @param {number} scrollFactor Movement speed of the layer.
     */
    constructor(imagePath, scrollFactor) {
        super();
        this.scrollFactor = scrollFactor;
        this.loadImage(imagePath);
    }

    /**
     * Updates the layer position based on the camera position.
     * @param {number} cameraX Current horizontal camera position.
     */
    updatePosition(cameraX) {
        const travel = cameraX * this.scrollFactor;
        this.x = -(travel % this.width);
    }

    /**
     * Draws two copies to prevent gaps during long-distance scrolling.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    draw(context) {
        this.drawTile(context, this.x);
        this.drawTile(context, this.x + this.width);
    }

    /**
     * Draws one background tile.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     * @param {number} x Horizontal tile position.
     */
    drawTile(context, x) {
        context.drawImage(this.image, x, this.y, this.width, this.height);
    }
}
