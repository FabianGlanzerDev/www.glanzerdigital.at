/**
 * Draws a collectible counter inside the canvas HUD.
 */
class CollectibleCounter extends DrawableObject {
    value = 0;
    total = 0;
    label = '';

    /**
     * Creates a HUD counter with an icon and total amount.
     * @param {string} imagePath Path to the counter icon.
     * @param {number} x Horizontal canvas position.
     * @param {number} y Vertical canvas position.
     * @param {string} label Accessible counter label.
     * @param {number} total Total amount available in the level.
     */
    constructor(imagePath, x, y, label, total) {
        super();
        this.x = x;
        this.y = y;
        this.label = label;
        this.total = total;
        this.loadImage(imagePath);
    }

    /**
     * Updates the displayed counter value.
     * @param {number} value Current collected amount.
     */
    setValue(value) {
        this.value = Math.max(0, Math.min(this.total, value));
    }

    /**
     * Draws the HUD panel, icon and numeric value.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    draw(context) {
        context.save();
        this.drawPanel(context);
        this.drawIcon(context);
        this.drawText(context);
        context.restore();
    }

    /**
     * Draws the translucent counter background.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    drawPanel(context) {
        context.fillStyle = this.getCssVariable('--color-counter-background');
        context.strokeStyle = this.getCssVariable('--color-counter-border');
        context.lineWidth = 2;
        context.beginPath();
        context.roundRect(this.x, this.y, 245, 74, 20);
        context.fill();
        context.stroke();
    }

    /**
     * Draws the collectible icon.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    drawIcon(context) {
        const iconSize = 48;
        const iconY = this.y + (74 - iconSize) / 2;
        context.drawImage(this.image, this.x + 16, iconY, iconSize, iconSize);
    }

    /**
     * Draws the label and collected amount.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    drawText(context) {
        const fontFamily = this.getCssVariable('--font-family-primary');
        const labelSize = this.getCssVariable('--font-size-counter-label');
        const valueSize = this.getCssVariable('--font-size-counter-value');
        context.fillStyle = this.getCssVariable('--color-counter-label');
        context.font = `700 ${labelSize} ${fontFamily}`;
        context.fillText(this.label.toUpperCase(), this.x + 82, this.y + 27);
        context.fillStyle = this.getCssVariable('--color-white');
        context.font = `800 ${valueSize} ${fontFamily}`;
        context.fillText(`${this.value} / ${this.total}`, this.x + 82, this.y + 58);
    }


}
