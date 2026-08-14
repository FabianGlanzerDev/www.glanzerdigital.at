/**
 * Represents an animated puffer fish enemy inside the level world.
 */
class PufferFish extends MovableObject {
    width = 220;
    height = 180;
    speed = 2.8;
    damage = 20;
    patrolDistance = 760;
    direction = -1;
    baseY = 360;
    bobAngle = 0;
    bobAmplitude = 24;
    initialWorldX;
    initialY;
    currentCameraX = 0;
    animationInterval = null;
    movementInterval = null;
    isActive = false;
    isDead = false;
    isRemoved = false;
    hurtUntil = 0;
    hurtDuration = 700;
    deadUntil = 0;
    deadDuration = 850;
    hurtImages = [
        'assets/images/enemies/puffer-fish/hurt/puffer-fish-hurt-01.png',
        'assets/images/enemies/puffer-fish/hurt/puffer-fish-hurt-02.png',
        'assets/images/enemies/puffer-fish/hurt/puffer-fish-hurt-03.png',
        'assets/images/enemies/puffer-fish/hurt/puffer-fish-hurt-04.png',
        'assets/images/enemies/puffer-fish/hurt/puffer-fish-hurt-05.png'
    ];

    deadImages = [
        'assets/images/enemies/puffer-fish/dead-animation/puffer-fish-dead-01.png',
        'assets/images/enemies/puffer-fish/dead-animation/puffer-fish-dead-02.png',
        'assets/images/enemies/puffer-fish/dead-animation/puffer-fish-dead-03.png'
    ];
    offset = { top: 28, right: 38, bottom: 58, left: 18 };

    swimmingImages = [
        'assets/images/enemies/puffer-fish/swim/puffer-fish-swim-01.png',
        'assets/images/enemies/puffer-fish/swim/puffer-fish-swim-02.png',
        'assets/images/enemies/puffer-fish/swim/puffer-fish-swim-03.png',
        'assets/images/enemies/puffer-fish/swim/puffer-fish-swim-04.png',
        'assets/images/enemies/puffer-fish/swim/puffer-fish-swim-05.png'
    ];

    /**
     * Creates the enemy at a fixed world position.
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
     * Starts the enemy for a new game.
     * @param {number} cameraX Initial camera position.
     */
    start(cameraX = 0) {
        this.stop();
        this.currentCameraX = cameraX;
        this.resetState();
        this.isActive = true;
        this.startSwimmingAnimation();
        this.startMovementLoop();
    }

    /**
     * Stops the enemy and restores its initial position.
     */
    resetForHome() {
        this.stop();
        this.currentCameraX = 0;
        this.resetState();
    }

    /**
     * Restores the original enemy state.
     */
    resetState() {
        this.worldX = this.initialWorldX;
        this.baseY = this.initialY;
        this.y = this.initialY;
        this.direction = -1;
        this.bobAngle = 0;
        this.currentImage = 0;
        this.isDead = false;
        this.isRemoved = false;
        this.hurtUntil = 0;
        this.deadUntil = 0;
        this.image = this.imageCache[this.swimmingImages[0]];
        this.updateScreenPosition(this.currentCameraX);
    }

    /**
     * Starts the continuous swimming animation.
     */
    startSwimmingAnimation() {
        this.animationInterval = setInterval(() => {
            if (this.isRemoved) return;
            this.playAnimation(this.getAnimationImages());
        }, 140);
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
     * Starts the recurring movement update.
     */
    startMovementLoop() {
        this.movementInterval = setInterval(() => this.move(), 1000 / 60);
    }

    /**
     * Moves the enemy through level coordinates.
     */
    move() {
        if (!this.isActive || this.isDead || this.isRemoved) return;
        this.worldX += this.speed * this.direction;
        this.updatePatrolDirection();
        this.updateFloatingMovement();
    }

    /**
     * Updates the enemy relative to the camera.
     * @param {number} cameraX Current horizontal camera position.
     */
    update(cameraX) {
        this.currentCameraX = cameraX;
        this.finishDefeat();
        this.updateScreenPosition(cameraX);
    }

    /**
     * Reverses movement when the patrol limit is reached.
     */
    updatePatrolDirection() {
        const halfRange = this.patrolDistance / 2;
        if (this.worldX <= this.initialWorldX - halfRange) this.direction = 1;
        if (this.worldX >= this.initialWorldX + halfRange) this.direction = -1;
        this.otherDirection = this.direction > 0;
    }

    /**
     * Adds a subtle vertical floating movement.
     */
    updateFloatingMovement() {
        this.bobAngle += 0.035;
        this.y = this.baseY + Math.sin(this.bobAngle) * this.bobAmplitude;
    }

    /**
     * Defeats the enemy after one valid attack.
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
     * Removes the enemy after its defeat frame was shown.
     */
    finishDefeat() {
        if (!this.isDead || Date.now() < this.deadUntil) return;
        this.isRemoved = true;
        this.stop();
    }

    /**
     * Stops every enemy interval.
     */
    stop() {
        this.isActive = false;
        clearInterval(this.animationInterval);
        clearInterval(this.movementInterval);
        this.animationInterval = null;
        this.movementInterval = null;
    }

    /**
     * Draws the enemy while it has not been removed.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    draw(context) {
        if (!this.isRemoved) super.draw(context);
    }
}
