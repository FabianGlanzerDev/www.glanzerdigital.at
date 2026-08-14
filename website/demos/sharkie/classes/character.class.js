/**
 * Represents the controllable main character.
 */
class Character extends MovableObject {
    x = 160;
    worldX = 160;
    y = 430;
    width = 270;
    height = 330;
    speed = 7;
    energy = 100;
    bubbleEnergy = 0;
    maxBubbleEnergy = 5;
    lastHit = 0;
    hurtDuration = 700;
    damageCooldown = 1200;
    canvasWidth = 1920;
    canvasHeight = 1080;
    levelWidth = 12000;
    boundaryMargin = 20;
    keyboard;
    physics;
    animator;
    audioManager;
    animationInterval = null;
    movementInterval = null;
    isActive = false;
    isDead = false;
    deathAnimationFinished = false;
    isJumping = false;
    verticalVelocity = 0;
    gravity = 0.4;
    liftAcceleration = 0.9;
    diveAcceleration = 0.28;
    maxRiseSpeed = 8.5;
    maxSinkSpeed = 4.5;
    jumpStrength = 10.5;
    lastActivity = Date.now();
    sleepDelay = 15000;
    offset = { top: 155, right: 60, bottom: 80, left: 60 };

    /**
     * Creates Sharkie and prepares movement and animation systems.
     * @param {Keyboard} keyboard Current keyboard state.
     * @param {number} levelWidth Total width of the level.
     * @param {AudioManager} audioManager Shared audio manager.
     */
    constructor(keyboard, levelWidth, audioManager) {
        super();
        this.keyboard = keyboard;
        this.levelWidth = levelWidth;
        this.audioManager = audioManager;
        this.physics = new CharacterPhysics(this);
        this.animator = new CharacterAnimator(this, audioManager);
        this.resetForHome();
    }

    /**
     * Resets Sharkie and starts a new game.
     */
    reset() {
        this.stop();
        this.resetState();
        this.isActive = true;
        this.startAnimationLoop();
        this.startMovementLoop();
    }

    /**
     * Resets Sharkie without starting movement or animation.
     */
    resetForHome() {
        this.stop();
        this.resetState();
    }

    /**
     * Restores character properties to their initial values.
     */
    resetState() {
        this.worldX = 160;
        this.x = 160;
        this.y = 430;
        this.energy = 100;
        this.bubbleEnergy = 0;
        this.lastHit = 0;
        this.lastActivity = Date.now();
        this.resetTransientState();
        this.animator.reset();
    }

    /**
     * Clears temporary movement and death state.
     */
    resetTransientState() {
        this.currentImage = 0;
        this.otherDirection = false;
        this.isDead = false;
        this.deathAnimationFinished = false;
        this.resetJump();
    }

    /**
     * Starts the recurring animation update.
     */
    startAnimationLoop() {
        if (this.animationInterval) return;
        this.animationInterval = setInterval(() => this.animator.update(), 115);
    }

    /**
     * Starts the recurring movement check.
     */
    startMovementLoop() {
        if (this.movementInterval) return;
        this.movementInterval = setInterval(() => this.move(), 1000 / 60);
    }

    /**
     * Moves Sharkie using obstacle-aware physics.
     */
    move() {
        if (!this.isActive || this.isDead) return;
        if (this.keyboard.hasMovementInput()) this.registerActivity();
        this.physics.update();
    }

    /**
     * Defines solid obstacles used by Sharkie's movement physics.
     * @param {Obstacle[]} obstacles Solid level obstacles.
     */
    setObstacles(obstacles) {
        this.physics.setObstacles(obstacles);
    }

    /**
     * Records player activity and resets the sleep timer.
     */
    registerActivity() {
        this.lastActivity = Date.now();
    }

    /**
     * Checks whether the long idle animation should run.
     * @returns {boolean} Whether Sharkie is sleeping.
     */
    isSleeping() {
        return !this.keyboard.hasMovementInput() && Date.now() - this.lastActivity >= this.sleepDelay;
    }

    /**
     * Starts the bubble attack animation.
     */
    startBubbleAttack() {
        this.registerActivity();
        this.animator.startBubbleAttack();
    }

    /**
     * Starts the fin-slap animation.
     */
    startFinSlap() {
        this.registerActivity();
        this.animator.startFinSlap();
    }

    /**
     * Checks whether the fin slap is active.
     * @returns {boolean} Whether the fin slap is active.
     */
    isFinSlapActive() {
        return this.animator.isFinSlapActive();
    }

    /**
     * Clears the active jump state and vertical velocity.
     */
    resetJump() {
        this.isJumping = false;
        this.verticalVelocity = 0;
    }

    /**
     * Reduces energy when the damage cooldown allows it.
     * @param {number} damage Amount of energy to remove.
     * @returns {boolean} Whether damage was applied.
     */
    hit(damage) {
        if (this.isDead || !this.canTakeDamage()) return false;
        this.energy = Math.max(0, this.energy - damage);
        this.lastHit = Date.now();
        this.currentImage = 0;
        this.audioManager.playSound('hurt');
        if (this.energy === 0) this.die();
        return true;
    }

    /**
     * Adds one bubble energy charge when capacity is available.
     * @returns {boolean} Whether a charge was added.
     */
    addBubbleEnergy() {
        if (this.bubbleEnergy >= this.maxBubbleEnergy) return false;
        this.bubbleEnergy++;
        return true;
    }

    /**
     * Consumes one bubble energy charge for a projectile.
     * @returns {boolean} Whether a charge was available.
     */
    useBubbleEnergy() {
        if (this.bubbleEnergy <= 0 || this.isDead) return false;
        this.bubbleEnergy--;
        return true;
    }

    /**
     * Switches Sharkie to the dead state.
     */
    die() {
        this.isDead = true;
        this.isActive = false;
        this.currentImage = 0;
        this.resetJump();
        this.stopMovementLoop();
    }

    /**
     * Stops every character interval.
     */
    stop() {
        this.isActive = false;
        this.stopMovementLoop();
        this.stopAnimationLoop();
    }

    /**
     * Stops the movement interval.
     */
    stopMovementLoop() {
        clearInterval(this.movementInterval);
        this.movementInterval = null;
    }

    /**
     * Stops the animation interval.
     */
    stopAnimationLoop() {
        clearInterval(this.animationInterval);
        this.animationInterval = null;
    }

    /**
     * Checks whether the damage cooldown has ended.
     * @returns {boolean} Whether Sharkie may take damage.
     */
    canTakeDamage() {
        return Date.now() - this.lastHit >= this.damageCooldown;
    }

    /**
     * Checks whether the hurt animation is active.
     * @returns {boolean} Whether Sharkie is currently hurt.
     */
    isHurt() {
        return Date.now() - this.lastHit < this.hurtDuration;
    }

    /**
     * Calculates the final horizontal world position.
     * @returns {number} Maximum horizontal world position.
     */
    getMaximumWorldX() {
        return this.levelWidth - this.width;
    }

    /**
     * Calculates the upper movement boundary from the hitbox.
     * @returns {number} Minimum vertical image position.
     */
    getMinimumY() {
        return this.boundaryMargin - this.offset.top;
    }

    /**
     * Calculates the lower movement boundary from the hitbox.
     * @returns {number} Maximum vertical image position.
     */
    getMaximumY() {
        const visibleHitboxHeight = this.height - this.offset.bottom;
        return this.canvasHeight - this.boundaryMargin - visibleHitboxHeight;
    }
}
