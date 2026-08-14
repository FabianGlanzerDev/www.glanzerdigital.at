/**
 * Represents the final whale enemy at the end of the level.
 */
class Endboss extends MovableObject {
    width = 520;
    height = 610;
    damage = 35;
    health = 100;
    maxHealth = 100;
    hitDamage = 25;
    triggerDistance = 1200;
    currentCameraX = 0;
    targetWorldX = 0;
    targetY = 0;
    attackTargetWorldX = 0;
    attackTargetY = 0;
    initialWorldX;
    initialY;
    baseY;
    movementAngle = 0;
    isActive = false;
    isDead = false;
    isDefeated = false;
    hurtUntil = 0;
    attackUntil = 0;
    attackWindupUntil = 0;
    nextAttackAt = 0;
    animationInterval = null;
    movementInterval = null;
    offset = { top: 120, right: 110, bottom: 100, left: 105 };

    floatingImages = [
        'assets/images/enemies/endboss/floating/endboss-floating-01.png',
        'assets/images/enemies/endboss/floating/endboss-floating-02.png',
        'assets/images/enemies/endboss/floating/endboss-floating-03.png',
        'assets/images/enemies/endboss/floating/endboss-floating-04.png',
        'assets/images/enemies/endboss/floating/endboss-floating-05.png',
        'assets/images/enemies/endboss/floating/endboss-floating-06.png',
        'assets/images/enemies/endboss/floating/endboss-floating-07.png',
        'assets/images/enemies/endboss/floating/endboss-floating-08.png',
        'assets/images/enemies/endboss/floating/endboss-floating-09.png',
        'assets/images/enemies/endboss/floating/endboss-floating-10.png',
        'assets/images/enemies/endboss/floating/endboss-floating-11.png',
        'assets/images/enemies/endboss/floating/endboss-floating-12.png',
        'assets/images/enemies/endboss/floating/endboss-floating-13.png'
    ];

    attackImages = [
        'assets/images/enemies/endboss/attack/endboss-attack-01.png',
        'assets/images/enemies/endboss/attack/endboss-attack-02.png',
        'assets/images/enemies/endboss/attack/endboss-attack-03.png',
        'assets/images/enemies/endboss/attack/endboss-attack-04.png',
        'assets/images/enemies/endboss/attack/endboss-attack-05.png',
        'assets/images/enemies/endboss/attack/endboss-attack-06.png'
    ];

    hurtImages = [
        'assets/images/enemies/endboss/hurt/endboss-hurt-01.png',
        'assets/images/enemies/endboss/hurt/endboss-hurt-02.png',
        'assets/images/enemies/endboss/hurt/endboss-hurt-03.png',
        'assets/images/enemies/endboss/hurt/endboss-hurt-04.png'
    ];

    deadImages = [
        'assets/images/enemies/endboss/dead/endboss-dead-01.png',
        'assets/images/enemies/endboss/dead/endboss-dead-02.png',
        'assets/images/enemies/endboss/dead/endboss-dead-03.png',
        'assets/images/enemies/endboss/dead/endboss-dead-04.png',
        'assets/images/enemies/endboss/dead/endboss-dead-05.png',
        'assets/images/enemies/endboss/dead/endboss-dead-06.png'
    ];

    /**
     * Creates the boss at a fixed world position.
     * @param {number} worldX Initial horizontal world position.
     * @param {number} y Initial vertical position.
     */
    constructor(worldX, y) {
        super();
        this.initialWorldX = worldX;
        this.initialY = y;
        this.loadBossImages();
        this.resetForHome();
    }

    /**
     * Loads all boss animation frames.
     */
    loadBossImages() {
        this.loadImages(this.floatingImages);
        this.loadImages(this.attackImages);
        this.loadImages(this.hurtImages);
        this.loadImages(this.deadImages);
    }

    /**
     * Starts the boss for a new game.
     * @param {number} cameraX Initial camera position.
     */
    start(cameraX = 0) {
        this.stop();
        this.currentCameraX = cameraX;
        this.resetState();
        this.startAnimationLoop();
        this.startMovementLoop();
    }

    /**
     * Stops the boss and restores the home-screen state.
     */
    resetForHome() {
        this.stop();
        this.currentCameraX = 0;
        this.resetState();
    }

    /**
     * Restores health, position and combat flags.
     */
    resetState() {
        this.worldX = this.initialWorldX;
        this.baseY = this.initialY;
        this.y = this.initialY;
        this.health = this.maxHealth;
        this.resetCombatFlags();
        this.image = this.imageCache[this.floatingImages[0]];
        this.updateScreenPosition(this.currentCameraX);
    }

    /**
     * Clears all temporary boss state values.
     */
    resetCombatFlags() {
        this.currentImage = 0;
        this.movementAngle = 0;
        this.isActive = false;
        this.isDead = false;
        this.isDefeated = false;
        this.hurtUntil = 0;
        this.attackUntil = 0;
        this.attackWindupUntil = 0;
        this.nextAttackAt = Date.now() + 1500;
        this.attackTargetWorldX = this.initialWorldX;
        this.attackTargetY = this.initialY;
    }

    /**
     * Starts the recurring boss animation update.
     */
    startAnimationLoop() {
        this.animationInterval = setInterval(() => this.updateAnimation(), 130);
    }

    /**
     * Selects the boss animation for the current combat state.
     */
    updateAnimation() {
        if (this.isDead) return this.updateDeathAnimation();
        const images = this.getActiveAnimation();
        this.playAnimation(images);
    }

    /**
     * Returns the current boss animation frames.
     * @returns {string[]} Animation frame paths.
     */
    getActiveAnimation() {
        if (Date.now() < this.hurtUntil) return this.hurtImages;
        if (Date.now() < this.attackUntil) return this.attackImages;
        return this.floatingImages;
    }

    /**
     * Plays the death animation once and marks the boss defeated.
     */
    updateDeathAnimation() {
        const finished = this.playAnimationOnce(this.deadImages);
        if (!finished) return;
        this.isDefeated = true;
        this.stopMovementLoop();
        this.stopAnimationLoop();
    }

    /**
     * Starts the recurring boss movement update.
     */
    startMovementLoop() {
        this.movementInterval = setInterval(() => this.move(), 1000 / 60);
    }

    /**
     * Activates and moves the boss during the final encounter.
     */
    move() {
        if (!this.isActive || this.isDead) return;
        this.movementAngle += 0.025;
        this.updateAttackState();
        this.updateMovementState();
    }

    /**
     * Starts a targeted charge attack when its cooldown ends.
     */
    updateAttackState() {
        if (Date.now() < this.nextAttackAt || Date.now() < this.hurtUntil) return;
        this.captureAttackTarget();
        this.attackWindupUntil = Date.now() + 420;
        this.attackUntil = Date.now() + 1250;
        this.nextAttackAt = Date.now() + 2850;
        this.currentImage = 0;
    }

    /**
     * Stores Sharkie's position so the charge can be dodged.
     */
    captureAttackTarget() {
        const minimumX = this.initialWorldX - 1350;
        const desiredX = this.targetWorldX + 250;
        this.attackTargetWorldX = this.clamp(desiredX, minimumX, this.initialWorldX);
        this.attackTargetY = this.clamp(this.targetY - 180, 30, 440);
    }

    /**
     * Selects windup, charge or recovery movement.
     */
    updateMovementState() {
        if (this.isWindingUp()) return this.moveDuringWindup();
        if (this.isCharging()) return this.moveDuringCharge();
        this.returnToArenaPosition();
    }

    /**
     * Returns whether the boss is preparing its next charge.
     * @returns {boolean} Whether the windup is active.
     */
    isWindingUp() {
        return Date.now() < this.attackWindupUntil;
    }

    /**
     * Returns whether the boss is currently charging.
     * @returns {boolean} Whether the charge is active.
     */
    isCharging() {
        const now = Date.now();
        return now >= this.attackWindupUntil && now < this.attackUntil;
    }

    /**
     * Tracks Sharkie's vertical position before the charge begins.
     */
    moveDuringWindup() {
        this.y = this.approach(this.y, this.attackTargetY, 3.5);
        this.worldX = this.approach(this.worldX, this.initialWorldX, 2);
        this.otherDirection = false;
    }

    /**
     * Charges quickly toward the locked target position.
     */
    moveDuringCharge() {
        this.worldX = this.approach(this.worldX, this.attackTargetWorldX, 13);
        this.y = this.approach(this.y, this.attackTargetY, 8);
        this.otherDirection = false;
    }

    /**
     * Returns the boss to its floating arena position after attacking.
     */
    returnToArenaPosition() {
        const floatingY = this.baseY + Math.sin(this.movementAngle) * 120;
        this.worldX = this.approach(this.worldX, this.initialWorldX, 5);
        this.y = this.approach(this.y, floatingY, 4);
        this.otherDirection = this.worldX < this.initialWorldX - 2;
    }

    /**
     * Moves one numeric value toward a target without overshooting.
     * @param {number} value Current value.
     * @param {number} target Target value.
     * @param {number} speed Maximum movement per tick.
     * @returns {number} Updated value.
     */
    approach(value, target, speed) {
        const difference = target - value;
        return value + Math.sign(difference) * Math.min(Math.abs(difference), speed);
    }

    /**
     * Restricts a number to the configured range.
     * @param {number} value Value to restrict.
     * @param {number} minimum Lowest allowed value.
     * @param {number} maximum Highest allowed value.
     * @returns {number} Restricted value.
     */
    clamp(value, minimum, maximum) {
        return Math.min(Math.max(value, minimum), maximum);
    }

    /**
     * Updates activation, target and screen position.
     * @param {number} cameraX Current camera position.
     * @param {number} sharkieWorldX Sharkie's horizontal world position.
     * @param {number} sharkieY Sharkie's vertical position.
     */
    update(cameraX, sharkieWorldX, sharkieY) {
        this.currentCameraX = cameraX;
        this.targetWorldX = sharkieWorldX;
        this.targetY = sharkieY;
        this.activateWhenClose(sharkieWorldX);
        this.updateScreenPosition(cameraX);
    }

    /**
     * Activates the boss when Sharkie reaches the final arena.
     * @param {number} sharkieWorldX Sharkie's horizontal world position.
     */
    activateWhenClose(sharkieWorldX) {
        if (this.isDead || this.isDefeated) return;
        if (sharkieWorldX >= this.initialWorldX - this.triggerDistance) this.isActive = true;
    }

    /**
     * Applies one projectile hit to the boss.
     * @returns {boolean} Whether the hit was accepted.
     */
    takeHit() {
        if (!this.isActive || this.isDead || Date.now() < this.hurtUntil) return false;
        this.health = Math.max(0, this.health - this.hitDamage);
        this.hurtUntil = Date.now() + 520;
        this.currentImage = 0;
        if (this.health === 0) this.die();
        return true;
    }

    /**
     * Switches the boss to its final death animation.
     */
    die() {
        this.isDead = true;
        this.currentImage = 0;
        this.attackUntil = 0;
        this.stopMovementLoop();
    }

    /**
     * Stops every boss interval.
     */
    stop() {
        this.stopMovementLoop();
        this.stopAnimationLoop();
        this.isActive = false;
    }

    /**
     * Stops the boss movement interval.
     */
    stopMovementLoop() {
        clearInterval(this.movementInterval);
        this.movementInterval = null;
    }

    /**
     * Stops the boss animation interval.
     */
    stopAnimationLoop() {
        clearInterval(this.animationInterval);
        this.animationInterval = null;
    }

    /**
     * Draws the boss only after the final encounter starts.
     * @param {CanvasRenderingContext2D} context Canvas rendering context.
     */
    draw(context) {
        if (!this.isActive && !this.isDead) return;
        if (!this.isDefeated) super.draw(context);
    }
}
