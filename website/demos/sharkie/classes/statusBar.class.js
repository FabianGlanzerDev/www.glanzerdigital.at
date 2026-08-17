/**
 * Displays Sharkie's current health inside the canvas.
 */
class StatusBar extends DrawableObject {
    x = 42;
    y = 48;
    width = 300;
    height = 80;
    percentage = 100;

    healthImages = [
        'assets/images/interface/status-bars/health/health-0.png',
        'assets/images/interface/status-bars/health/health-20.png',
        'assets/images/interface/status-bars/health/health-40.png',
        'assets/images/interface/status-bars/health/health-60.png',
        'assets/images/interface/status-bars/health/health-80.png',
        'assets/images/interface/status-bars/health/health-100.png'
    ];

    /**
     * Creates a full health bar.
     */
    constructor() {
        super();
        this.loadImages(this.healthImages);
        this.setPercentage(100);
    }

    /**
     * Updates the displayed health percentage.
     * @param {number} percentage Current health percentage.
     */
    setPercentage(percentage) {
        this.percentage = Math.max(0, Math.min(100, percentage));
        const index = this.resolveImageIndex();
        this.image = this.imageCache[this.healthImages[index]];
    }

    /**
     * Maps the percentage to a matching status bar image.
     * @returns {number} Index of the matching image.
     */
    resolveImageIndex() {
        if (this.percentage >= 100) return 5;
        if (this.percentage >= 80) return 4;
        if (this.percentage >= 60) return 3;
        if (this.percentage >= 40) return 2;
        if (this.percentage >= 20) return 1;
        return 0;
    }
}
