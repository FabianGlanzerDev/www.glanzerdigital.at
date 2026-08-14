/** @file Updates and renders the active game world. */

/**
 * Continuously updates and redraws the game scene.
 */
function drawGame() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    updateGame();
    drawGameObjects();
    requestAnimationFrame(drawGame);
}


/**
 * Updates active gameplay logic before rendering the next frame.
 */
function updateGame() {
    if (gameState !== 'playing') return;
    const cameraX = getCameraX();
    updateBackground(cameraX);
    updateWorldPositions(cameraX);
    updateGameplayInteractions(cameraX);
}


/**
 * Updates combat, collisions and the win condition.
 * @param {number} cameraX Current horizontal camera position.
 */
function updateGameplayInteractions(cameraX) {
    handleCombatInput(cameraX);
    updateProjectiles(cameraX);
    checkPlayerCollisions();
    checkCollectibleCollisions();
    checkWinCondition();
}


/**
 * Draws every visible object in the correct order.
 */
function drawGameObjects() {
    drawBackground();
    if (isGameSceneVisible()) drawWorldObjects();
    lightLayer.draw(context);
    if (isGameSceneVisible()) drawStatusDisplays();
}


/**
 * Draws gameplay objects between background and light layers.
 */
function drawWorldObjects() {
    drawAmbientLife();
    drawObstacles();
    drawCollectibles();
    drawEnemies();
    endboss.draw(context);
    drawProjectiles();
    sharkie.draw(context);
}


/**
 * Updates all background layer positions.
 * @param {number} cameraX Current horizontal camera position.
 */
function updateBackground(cameraX) {
    backgroundLayers.forEach((layer) => layer.updatePosition(cameraX));
    lightLayer.updatePosition(cameraX);
}


/**
 * Updates every world object relative to the camera.
 * @param {number} cameraX Current horizontal camera position.
 */
function updateWorldPositions(cameraX) {
    sharkie.updateScreenPosition(cameraX);
    updateAmbientLife(cameraX);
    updateObstacles(cameraX);
    updateInteractiveObjects(cameraX);
    endboss.update(cameraX, sharkie.worldX, sharkie.y);
}


/**
 * Updates collectibles and normal enemies relative to the camera.
 * @param {number} cameraX Current horizontal camera position.
 */
function updateInteractiveObjects(cameraX) {
    collectibles.forEach((item) => item.update(cameraX));
    enemies.forEach((enemy) => enemy.update(cameraX));
}


/**
 * Draws all standard background layers.
 */
function drawBackground() {
    backgroundLayers.forEach((layer) => layer.draw(context));
}


/**
 * Draws all collectible objects.
 */
function drawCollectibles() {
    collectibles.forEach((item) => item.draw(context));
}


/**
 * Draws all normal enemies.
 */
function drawEnemies() {
    enemies.forEach((enemy) => enemy.draw(context));
}


/**
 * Draws player HUD values and the boss bar when active.
 */
function drawStatusDisplays() {
    healthBar.draw(context);
    coinCounter.draw(context);
    bubbleEnergyCounter.draw(context);
    if (endboss.isActive && !endboss.isDefeated) bossStatusBar.draw(context);
}


/**
 * Calculates the horizontal camera position.
 * @returns {number} Horizontal camera position.
 */
function getCameraX() {
    const desiredX = sharkie.worldX - level.cameraAnchorX;
    const maximumX = level.width - canvas.width;
    return Math.min(Math.max(0, desiredX), maximumX);
}
