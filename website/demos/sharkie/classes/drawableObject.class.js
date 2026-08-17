/**
 * Base class for every object that can be drawn on the canvas.
 */
class DrawableObject {
    image = new Image();
    imageCache = {};
    currentImage = 0;
    otherDirection = false;
    x = 0;
    y = 0;
    width = 1920;
    height = 1080;
    offset = { top: 0, right: 0, bottom: 0, left: 0 };

    /**
     * Loads a single image.
     * @param {string} path Path to the image file.
     */
    loadImage(path) {
        this.image.src = path;
    }

    /**
     * Loads multiple images into the image cache.
     * @param {string[]} paths Paths to the image files.
     */
    loadImages(paths) {
        paths.forEach((path) => this.cacheImage(path));
    }

    /**
     * Stores an image for later animations.
     * @param {string} path Path to the image file.
     */
    cacheImage(path) {
        const image = new Image();
        image.src = path;
        this.imageCache[path] = image;
    }

    /**
     * Displays the next frame of a looping animation.
     * @param {string[]} images Animation frames in playback order.
     */
    playAnimation(images) {
        const index = this.currentImage % images.length;
        this.image = this.imageCache[images[index]];
        this.currentImage++;
    }

    /**
     * Displays a non-looping animation and keeps its final frame.
     * @param {string[]} images Animation frames in playback order.
     * @returns {boolean} Whether the final frame has been reached.
     */
    playAnimationOnce(images) {
        const index = Math.min(this.currentImage, images.length - 1);
        this.image = this.imageCache[images[index]];
        if (this.currentImage < images.length) this.currentImage++;
        return this.currentImage >= images.length;
    }

    /**
     * Checks whether this object overlaps another object.
     * @param {DrawableObject} object Object to check against.
     * @param {number} tolerance Optional inset applied to both hitboxes.
     * @returns {boolean} Whether both collision boxes overlap.
     */
    isColliding(object, tolerance = 0) {
        return this.getRightEdge() - tolerance > object.getLeftEdge() + tolerance
            && this.getLeftEdge() + tolerance < object.getRightEdge() - tolerance
            && this.getBottomEdge() - tolerance > object.getTopEdge() + tolerance
            && this.getTopEdge() + tolerance < object.getBottomEdge() - tolerance;
    }

    /** @returns {number} Left collision edge. */
    getLeftEdge() {
        return this.x + this.offset.left;
    }

    /** @returns {number} Right collision edge. */
    getRightEdge() {
        return this.x + this.width - this.offset.right;
    }

    /** @returns {number} Top collision edge. */
    getTopEdge() {
        return this.y + this.offset.top;
    }

    /** @returns {number} Bottom collision edge. */
    getBottomEdge() {
        return this.y + this.height - this.offset.bottom;
    }

    /**
     * Draws the object with the correct horizontal orientation.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    draw(context) {
        if (this.otherDirection) {
            this.drawFlipped(context);
        } else {
            this.drawNormally(context);
        }
    }

    /**
     * Draws the object without mirroring it.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    drawNormally(context) {
        context.drawImage(
            this.image,
            this.x,
            this.y,
            this.width,
            this.height
        );
    }

    /**
     * Draws the object mirrored horizontally.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    drawFlipped(context) {
        context.save();
        context.translate(this.x + this.width, this.y);
        context.scale(-1, 1);
        context.drawImage(this.image, 0, 0, this.width, this.height);
        context.restore();
    }

    /**
     * Reads a global CSS custom property.
     * @param {string} propertyName CSS custom property name.
     * @returns {string} Resolved CSS custom property value.
     */
    getCssVariable(propertyName) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(propertyName)
            .trim();
    }
}
