/**
 * Updates every obstacle relative to the current camera position.
 * @param {number} cameraX Current horizontal camera position.
 */
function updateObstacles(cameraX) {
    obstacles.forEach((obstacle) => obstacle.update(cameraX));
}


/**
 * Draws all level obstacles.
 */
function drawObstacles() {
    obstacles.forEach((obstacle) => obstacle.draw(context));
}
