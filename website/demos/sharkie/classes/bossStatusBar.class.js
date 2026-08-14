/**
 * Draws the final boss health bar inside the canvas HUD.
 */
class BossStatusBar extends DrawableObject {
    percentage = 100;
    x = 680;
    y = 50;
    width = 560;
    height = 46;

    /**
     * Updates the displayed boss health percentage.
     * @param {number} percentage Current boss health percentage.
     */
    setPercentage(percentage) {
        this.percentage = Math.max(0, Math.min(100, percentage));
    }

    /**
     * Draws the boss label and health bar.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    draw(context) {
        context.save();
        this.drawLabel(context);
        this.drawTrack(context);
        this.drawFill(context);
        context.restore();
    }

    /**
     * Draws the boss label above the bar.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    drawLabel(context) {
        const font = this.getCssVariable('--font-family-display');
        const size = this.getCssVariable('--font-size-boss-label');
        context.fillStyle = this.getCssVariable('--color-white');
        context.font = `400 ${size} ${font}`;
        context.textAlign = 'center';
        context.fillText('FINAL ENEMY', this.x + this.width / 2, this.y - 10);
    }

    /**
     * Draws the boss bar background and border.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    drawTrack(context) {
        context.fillStyle = this.getCssVariable('--color-boss-bar-background');
        context.strokeStyle = this.getCssVariable('--color-boss-bar-border');
        context.lineWidth = 3;
        context.beginPath();
        context.roundRect(this.x, this.y, this.width, this.height, 20);
        context.fill();
        context.stroke();
    }

    /**
     * Draws the remaining boss health.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    drawFill(context) {
        const fillWidth = (this.width - 10) * this.percentage / 100;
        if (fillWidth <= 0) return;
        context.fillStyle = this.getCssVariable('--color-boss-bar-fill');
        context.beginPath();
        context.roundRect(this.x + 5, this.y + 5, fillWidth, this.height - 10, 15);
        context.fill();
    }
}
