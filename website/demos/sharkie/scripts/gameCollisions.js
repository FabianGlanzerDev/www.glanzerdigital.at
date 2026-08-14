/** @file Handles player collisions, collectible pickup and HUD counters. */

/**
 * Checks Sharkie against normal enemies and the final boss.
 */
function checkPlayerCollisions() {
    enemies.forEach((enemy) => handleEnemyCollision(enemy));
    handleBossCollision();
}


/**
 * Applies contact damage after a valid enemy collision.
 * @param {MovableObject} enemy Enemy involved in the collision.
 */
function handleEnemyCollision(enemy) {
    if (enemy.isDead || enemy.isRemoved || !sharkie.isColliding(enemy, 5)) return;
    if (!sharkie.hit(enemy.damage)) return;
    healthBar.setPercentage(sharkie.energy);
    applyKnockback(enemy.worldX);
    if (sharkie.isDead) startGameOverSequence();
}


/**
 * Applies contact damage from the final boss.
 */
function handleBossCollision() {
    if (!endboss.isActive || endboss.isDead || !sharkie.isColliding(endboss, 6)) return;
    if (!sharkie.hit(endboss.damage)) return;
    healthBar.setPercentage(sharkie.energy);
    applyKnockback(endboss.worldX);
    if (sharkie.isDead) startGameOverSequence();
}


/**
 * Pushes Sharkie away from the object that caused damage.
 * @param {number} sourceWorldX Horizontal source position.
 */
function applyKnockback(sourceWorldX) {
    const direction = sourceWorldX > sharkie.worldX ? -1 : 1;
    sharkie.physics.tryMoveWorld(direction * 55);
}


/**
 * Checks Sharkie against every uncollected item.
 */
function checkCollectibleCollisions() {
    collectibles.forEach((item) => handleCollectibleCollision(item));
}


/**
 * Collects an item after a valid collision.
 * @param {CollectibleObject} item Collectible involved in the collision.
 */
function handleCollectibleCollision(item) {
    if (item.collected || !sharkie.isColliding(item, 2)) return;
    if (item.type === 'bubble-energy' && !sharkie.addBubbleEnergy()) return;
    item.collect();
    registerCollectiblePickup();
}


/**
 * Applies shared effects after a collectible was picked up.
 */
function registerCollectiblePickup() {
    sharkie.registerActivity();
    audioManager.playSound('collect');
    updateCollectibleCounters();
}


/**
 * Restores all collectibles for a new round.
 */
function resetCollectibles() {
    collectibles.forEach((item) => item.reset());
    collectibles.forEach((item) => item.update(0));
}


/**
 * Resets health and collectible counters.
 */
function resetStatusDisplays() {
    healthBar.setPercentage(100);
    bossStatusBar.setPercentage(100);
    coinCounter.setValue(0);
    bubbleEnergyCounter.setValue(0);
}


/**
 * Updates collectible counters from the current level state.
 */
function updateCollectibleCounters() {
    coinCounter.setValue(countCollectedItems(coins));
    bubbleEnergyCounter.setValue(sharkie.bubbleEnergy);
}


/**
 * Counts collected objects inside a list.
 * @param {CollectibleObject[]} items Objects to count.
 * @returns {number} Number of collected objects.
 */
function countCollectedItems(items) {
    return items.filter((item) => item.collected).length;
}
