function updateObstacles(cameraX) {obstacles.forEach((obstacle) => obstacle.update(cameraX));}function drawObstacles() {obstacles.forEach((obstacle) => obstacle.draw(context));}
