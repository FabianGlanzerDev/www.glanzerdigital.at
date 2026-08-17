/**
 * Starts all harmless decorative fish for a new round.
 * @param {number} cameraX Initial camera position.
 */
function startAmbientLife(cameraX = 0) {
    level.ambientFish.forEach((fish) => fish.start(cameraX));
}


/**
 * Restores all decorative fish for the home screen.
 */
function resetAmbientLife() {
    level.ambientFish.forEach((fish) => fish.resetForHome());
}


/**
 * Stops all decorative fish during result transitions.
 */
function stopAmbientLife() {
    level.ambientFish.forEach((fish) => fish.stop());
}


/**
 * Updates decorative fish relative to the camera.
 * @param {number} cameraX Current horizontal camera position.
 */
function updateAmbientLife(cameraX) {
    level.ambientFish.forEach((fish) => fish.update(cameraX));
}


/**
 * Draws decorative fish behind interactive game objects.
 */
function drawAmbientLife() {
    level.ambientFish.forEach((fish) => fish.draw(context));
}
