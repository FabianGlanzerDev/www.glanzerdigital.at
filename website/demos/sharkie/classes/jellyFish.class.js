/**
 * Represents an animated jellyfish enemy with a looping patrol pattern.
 */
class JellyFish extends MovableObject {
    width = 150;
    height = 214;
    damage = 25;
    patrolWidth = 230;
    patrolHeight = 300;
    movementAngle = 0;
    movementSpeed = 0.018;
    currentCameraX = 0;
    animationInterval = null;
    movementInterval = null;
    isActive = false;
    isDead = false;
    isRemoved = false;
    hurtUntil = 0;
    hurtDuration = 600;
    deadUntil = 0;
    deadDuration = 900;
    initialWorldX;
    initialY;
    patrolCenterX;
    patrolCenterY;
    offset = { top: 30, right: 30, bottom: 26, left: 30 };

    swimmingImages = [
        'assets/images/enemies/jelly-fish/swim/jelly-fish-swim-01.png',
        'assets/images/enemies/jelly-fish/swim/jelly-fish-swim-02.png',
        'assets/images/enemies/jelly-fish/swim/jelly-fish-swim-03.png',
        'assets/images/enemies/jelly-fish/swim/jelly-fish-swim-04.png'
    ];

    hurtImages = [
        'assets/images/enemies/jelly-fish/hurt/jelly-fish-hurt-01.png',
        'assets/images/enemies/jelly-fish/hurt/jelly-fish-hurt-02.png',
        'assets/images/enemies/jelly-fish/hurt/jelly-fish-hurt-03.png',
        'assets/images/enemies/jelly-fish/hurt/jelly-fish-hurt-04.png'
    ];

    deadImages = [
        'assets/images/enemies/jelly-fish/dead/jelly-fish-dead-01.png',
        'assets/images/enemies/jelly-fish/dead/jelly-fish-dead-02.png',
        'assets/images/enemies/jelly-fish/dead/jelly-fish-dead-03.png',
        'assets/images/enemies/jelly-fish/dead/jelly-fish-dead-04.png'
    ];

    /**
     * Creates a jellyfish at a fixed level position.
     * @param {number} worldX Initial horizontal world position.
     * @param {number} y Initial vertical position.
     */
    constructor(worldX, y) {
        super();
        this.initialWorldX = worldX;
        this.initialY = y;
        this.loadImages(this.swimmingImages);
        this.loadImages(this.hurtImages);
        this.loadImages(this.deadImages);
        this.resetForHome();
    }

    /**
     * Starts the jellyfish for a new round.
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
     * Stops the enemy and restores its initial state.
     */
    resetForHome() {
        this.stop();
        this.currentCameraX = 0;
        this.resetState();
    }

    /**
     * Restores animation and patrol values.
     */
    resetState() {
        this.isDead = false;
        this.isRemoved = false;
        this.hurtUntil = 0;
        this.deadUntil = 0;
        this.currentImage = 0;
        this.movementAngle = 0;
        this.patrolCenterX = this.initialWorldX;
        this.patrolCenterY = this.initialY;
        this.image = this.imageCache[this.swimmingImages[0]];
        this.updatePatrolPosition();
    }

    /**
     * Starts the recurring swim and death animations.
     */
    startAnimationLoop() {
        this.animationInterval = setInterval(() => {
            if (this.isRemoved) return;
            this.playAnimation(this.getAnimationImages());
        }, 150);
    }


    /**
     * Selects swim, hurt or death frames for the current state.
     * @returns {string[]} Current animation frame list.
     */
    getAnimationImages() {
        if (Date.now() < this.hurtUntil) return this.hurtImages;
        return this.isDead ? this.deadImages : this.swimmingImages;
    }

    /**
     * Starts the recurring patrol update.
     */
    startMovementLoop() {
        this.movementInterval = setInterval(() => this.move(), 1000 / 60);
    }

    /**
     * Moves the jellyfish in a slow looping pattern.
     */
    move() {
        if (!this.isActive || this.isDead || this.isRemoved) return;
        this.movementAngle += this.movementSpeed;
        this.updatePatrolPosition();
    }

    /**
     * Updates the world coordinates from the current patrol angle.
     */
    updatePatrolPosition() {
        this.worldX = this.patrolCenterX + Math.sin(this.movementAngle * 0.7) * this.patrolWidth;
        this.y = this.patrolCenterY + Math.sin(this.movementAngle) * this.patrolHeight / 2;
        this.updateScreenPosition(this.currentCameraX);
    }

    /**
     * Updates the jellyfish relative to the current camera.
     * @param {number} cameraX Current horizontal camera position.
     */
    update(cameraX) {
        this.currentCameraX = cameraX;
        this.finishDefeat();
        this.updateScreenPosition(cameraX);
    }

    /**
     * Defeats the jellyfish after one valid attack.
     * @returns {boolean} Whether the hit was accepted.
     */
    takeHit() {
        if (this.isDead || this.isRemoved || !this.isActive) return false;
        const now = Date.now();
        this.isDead = true;
        this.hurtUntil = now + this.hurtDuration;
        this.deadUntil = this.hurtUntil + this.deadDuration;
        this.currentImage = 0;
        this.image = this.imageCache[this.hurtImages[0]];
        return true;
    }

    /**
     * Removes the jellyfish after its death animation.
     */
    finishDefeat() {
        if (!this.isDead || Date.now() < this.deadUntil) return;
        this.isRemoved = true;
        this.stop();
    }

    /**
     * Stops every active jellyfish interval.
     */
    stop() {
        this.isActive = false;
        clearInterval(this.animationInterval);
        clearInterval(this.movementInterval);
        this.animationInterval = null;
        this.movementInterval = null;
    }

    /**
     * Draws the jellyfish while it has not been removed.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    draw(context) {
        if (!this.isRemoved) super.draw(context);
    }
}
