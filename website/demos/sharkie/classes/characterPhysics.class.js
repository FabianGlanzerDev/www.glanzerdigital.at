/**
 * Handles obstacle-aware movement and buoyancy physics for Sharkie.
 */
class CharacterPhysics {
    character;
    obstacles = [];
    collisionTolerance = 6;

    /**
     * Creates the physics controller for a character.
     * @param {Character} character Character controlled by this physics instance.
     */
    constructor(character) {
        this.character = character;
    }

    /**
     * Defines the solid level obstacles used for movement checks.
     * @param {Obstacle[]} obstacles Solid obstacles inside the current level.
     */
    setObstacles(obstacles) {
        this.obstacles = obstacles;
    }

    /**
     * Updates horizontal movement, boost input and buoyancy physics.
     */
    update() {
        this.handleBoost();
        this.moveHorizontally();
        this.updateVerticalVelocity();
        this.applyVerticalMovement();
        this.updateBoostState();
    }

    /**
     * Handles horizontal keyboard movement with directional collision blocking.
     */
    moveHorizontally() {
        const character = this.character;
        if (character.keyboard.right) this.tryMoveWorld(character.speed);
        if (character.keyboard.left) this.tryMoveWorld(-character.speed);
    }

    /**
     * Updates vertical velocity using gravity, lift and optional fast diving.
     */
    updateVerticalVelocity() {
        const character = this.character;
        character.verticalVelocity += character.gravity;
        if (character.keyboard.up) character.verticalVelocity -= character.liftAcceleration;
        if (character.keyboard.down) character.verticalVelocity += character.diveAcceleration;
        character.verticalVelocity = this.clampVerticalVelocity(character.verticalVelocity);
    }

    /**
     * Restricts vertical velocity to a fair rising and sinking speed.
     * @param {number} velocity Current vertical velocity.
     * @returns {number} Restricted vertical velocity.
     */
    clampVerticalVelocity(velocity) {
        const character = this.character;
        return this.clamp(velocity, -character.maxRiseSpeed, character.maxSinkSpeed);
    }

    /**
     * Applies the current vertical velocity while respecting obstacles.
     */
    applyVerticalMovement() {
        const character = this.character;
        const moved = this.tryMoveVertical(character.verticalVelocity);
        if (!moved) character.verticalVelocity = 0;
    }

    /**
     * Starts one stronger upward boost when Space is pressed.
     */
    handleBoost() {
        if (!this.character.keyboard.consumeJump()) return;
        this.character.registerActivity();
        this.character.isJumping = true;
        this.character.verticalVelocity = -this.character.jumpStrength;
    }

    /**
     * Ends the boost animation after Sharkie starts sinking again.
     */
    updateBoostState() {
        const character = this.character;
        if (!character.isJumping || character.verticalVelocity < 0) return;
        character.isJumping = false;
    }

    /**
     * Attempts to move Sharkie horizontally without entering a solid obstacle.
     * @param {number} delta Horizontal movement amount.
     */
    tryMoveWorld(delta) {
        const character = this.character;
        const nextX = this.clamp(character.worldX + delta, 0, character.getMaximumWorldX());
        character.otherDirection = delta < 0;
        if (this.canOccupy(nextX, character.y)) character.worldX = nextX;
    }

    /**
     * Attempts to move Sharkie vertically without entering a solid obstacle.
     * @param {number} delta Vertical movement amount.
     * @returns {boolean} Whether Sharkie changed vertical position.
     */
    tryMoveVertical(delta) {
        const character = this.character;
        const nextY = this.clamp(character.y + delta, character.getMinimumY(), character.getMaximumY());
        if (Math.abs(nextY - character.y) < 0.01) return false;
        if (!this.canOccupy(character.worldX, nextY)) return false;
        character.y = nextY;
        return true;
    }

    /**
     * Checks whether Sharkie's collision box can occupy a world position.
     * @param {number} worldX Proposed horizontal world position.
     * @param {number} y Proposed vertical canvas position.
     * @returns {boolean} Whether the position is free of solid obstacles.
     */
    canOccupy(worldX, y) {
        return !this.obstacles.some((obstacle) => {
            return obstacle.isCollidingAt(this.character, worldX, y, this.collisionTolerance);
        });
    }

    /**
     * Restricts a number to a minimum and maximum value.
     * @param {number} value Value to restrict.
     * @param {number} minimum Lowest allowed value.
     * @param {number} maximum Highest allowed value.
     * @returns {number} Restricted value.
     */
    clamp(value, minimum, maximum) {
        return Math.min(Math.max(value, minimum), maximum);
    }
}
