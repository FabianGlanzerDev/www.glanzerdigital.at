/**
 * Handles all pending player attacks.
 * @param {number} cameraX Current horizontal camera position.
 */
function handleCombatInput(cameraX) {
    handleBubbleAttack(cameraX);
    handleFinSlapAttack();
}


/**
 * Handles a pending bubble attack from the keyboard.
 * @param {number} cameraX Current horizontal camera position.
 */
function handleBubbleAttack(cameraX) {
    if (!keyboard.consumeAttack()) return;
    sharkie.registerActivity();
    if (!sharkie.useBubbleEnergy()) return;
    sharkie.startBubbleAttack();
    projectiles.push(createBubbleProjectile(cameraX));
    bubbleEnergyCounter.setValue(sharkie.bubbleEnergy);
    audioManager.playSound('bubble');
}


/**
 * Creates a projectile in Sharkie's current facing direction.
 * @param {number} cameraX Current horizontal camera position.
 * @returns {BubbleProjectile} Newly created bubble projectile.
 */
function createBubbleProjectile(cameraX) {
    const direction = sharkie.otherDirection ? -1 : 1;
    const projectile = new BubbleProjectile(getBubbleStartX(direction), getBubbleStartY(), direction);
    projectile.updateScreenPosition(cameraX);
    return projectile;
}


/**
 * Calculates the projectile horizontal start position.
 * @param {number} direction Current horizontal facing direction.
 * @returns {number} Horizontal projectile start position.
 */
function getBubbleStartX(direction) {
    return direction < 0 ? sharkie.worldX + 30 : sharkie.worldX + sharkie.width - 75;
}


/**
 * Calculates the projectile vertical start position.
 * @returns {number} Vertical projectile start position.
 */
function getBubbleStartY() {
    return sharkie.y + sharkie.height * 0.46;
}


/**
 * Handles a pending fin-slap attack.
 */
function handleFinSlapAttack() {
    if (!keyboard.consumeSlap()) return;
    sharkie.startFinSlap();
    audioManager.playSound('finSlap');
    enemies.forEach((enemy) => applyFinSlapToEnemy(enemy));
    applyFinSlapToBoss();
}


/**
 * Defeats a nearby jellyfish with the fin slap.
 * @param {MovableObject} enemy Enemy to test.
 */
function applyFinSlapToEnemy(enemy) {
    if (!(enemy instanceof JellyFish) || enemy.isDead || enemy.isRemoved) return;
    if (!isInsideFinSlapRange(enemy)) return;
    if (enemy.takeHit()) audioManager.playSound('enemyHit');
}


/**
 * Damages the boss when it is close enough to the fin slap.
 */
function applyFinSlapToBoss() {
    if (!endboss.isActive || endboss.isDead) return;
    if (!isInsideFinSlapRange(endboss)) return;
    if (!endboss.takeHit()) return;
    bossStatusBar.setPercentage(endboss.health);
    audioManager.playSound('bossHit');
}


/**
 * Checks whether an object is inside Sharkie's fin-slap range.
 * @param {DrawableObject} object Object to test.
 * @returns {boolean} Whether the object can be hit.
 */
function isInsideFinSlapRange(object) {
    const reach = 95;
    const left = sharkie.getLeftEdge() - reach;
    const right = sharkie.getRightEdge() + reach;
    return right > object.getLeftEdge() && left < object.getRightEdge()
        && sharkie.getBottomEdge() > object.getTopEdge()
        && sharkie.getTopEdge() < object.getBottomEdge();
}


/**
 * Updates all active projectiles.
 * @param {number} cameraX Current horizontal camera position.
 */
function updateProjectiles(cameraX) {
    projectiles.forEach((projectile) => projectile.update(cameraX, level.width));
    checkProjectileCollisions();
    removeInactiveProjectiles();
}


/**
 * Checks every projectile against enemies and the boss.
 */
function checkProjectileCollisions() {
    projectiles.forEach((projectile) => {
        enemies.forEach((enemy) => handleProjectileEnemyHit(projectile, enemy));
        handleProjectileBossHit(projectile);
    });
}


/**
 * Applies a projectile hit to a normal enemy.
 * @param {BubbleProjectile} projectile Active projectile.
 * @param {MovableObject} enemy Enemy to test.
 */
function handleProjectileEnemyHit(projectile, enemy) {
    if (!projectile.active || enemy.isDead || enemy.isRemoved) return;
    if (!projectile.isColliding(enemy, 2)) return;
    projectile.deactivate();
    if (enemy.takeHit()) audioManager.playSound('enemyHit');
}


/**
 * Applies a projectile hit to the active final boss.
 * @param {BubbleProjectile} projectile Active projectile.
 */
function handleProjectileBossHit(projectile) {
    if (!projectile.active || !endboss.isActive || endboss.isDead) return;
    if (!projectile.isColliding(endboss, 4)) return;
    if (!endboss.takeHit()) return;
    projectile.deactivate();
    bossStatusBar.setPercentage(endboss.health);
    audioManager.playSound('bossHit');
}


/**
 * Removes inactive projectiles from the active list.
 */
function removeInactiveProjectiles() {
    projectiles = projectiles.filter((projectile) => projectile.active);
}


/**
 * Draws all active bubble projectiles.
 */
function drawProjectiles() {
    projectiles.forEach((projectile) => projectile.draw(context));
}


/**
 * Removes every projectile when a round changes state.
 */
function clearProjectiles() {
    projectiles = [];
}
