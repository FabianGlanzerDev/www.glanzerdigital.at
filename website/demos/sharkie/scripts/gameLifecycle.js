/** @file Controls game start, reset, home and result transitions. */

/**
 * Initializes interface events and starts the render loop.
 */
function initializeGame() {
    bindInterfaceEvents();
    bindMobileControls();
    showHomeScreen();
    drawGame();
}


/**
 * Starts or restarts the game without reloading the page.
 */
function startGame() {
    if (!canStartGame()) return;
    prepareNewRound();
    startRoundActors();
    resetRoundObjects();
    audioManager.startMusic();
    releaseInterfaceFocus();
    updateScreenVisibility();
}


/**
 * Prepares global state for a new round.
 */
function prepareNewRound() {
    clearTransitionTimers();
    gameState = 'playing';
    keyboard.reset();
    sharkie.reset();
}


/**
 * Starts enemies, boss and decorative fish.
 */
function startRoundActors() {
    enemies.forEach((enemy) => enemy.start(0));
    endboss.start(0);
    startAmbientLife(0);
}


/**
 * Checks whether the current interface state may start a new round.
 * @returns {boolean} Whether the game may start.
 */
function canStartGame() {
    return ['controls', 'gameover', 'win'].includes(gameState);
}


/**
 * Resets collectibles, projectiles and HUD values for a new round.
 */
function resetRoundObjects() {
    resetCollectibles();
    clearProjectiles();
    resetStatusDisplays();
    updateWorldPositions(0);
    updateBackground(0);
}


/**
 * Returns to the start screen without reloading the page.
 */
function showHomeScreen() {
    if (!canShowHomeScreen()) return;
    prepareHomeState();
    resetHomeActors();
    resetRoundObjects();
    audioManager.stopAll();
    updateScreenVisibility();
}


/**
 * Prepares global state for the home screen.
 */
function prepareHomeState() {
    clearTransitionTimers();
    gameState = 'home';
    keyboard.reset();
    sharkie.resetForHome();
}


/**
 * Resets enemies, boss and decorative fish for the home screen.
 */
function resetHomeActors() {
    enemies.forEach((enemy) => enemy.resetForHome());
    endboss.resetForHome();
    resetAmbientLife();
}


/**
 * Prevents gameplay from returning home without an explicit result action.
 * @returns {boolean} Whether the home screen may be entered.
 */
function canShowHomeScreen() {
    return ['home', 'controls', 'gameover', 'win'].includes(gameState);
}


/**
 * Stops gameplay while Sharkie's death animation is playing.
 */
function startGameOverSequence() {
    if (gameState !== 'playing') return;
    gameState = 'dying';
    stopEnemiesAndProjectiles();
    audioManager.stopMusic();
    audioManager.playSound('gameOver');
    updateScreenVisibility();
    gameOverTimer = setTimeout(showGameOverScreen, 1650);
}


/**
 * Starts the win transition after the boss death animation.
 */
function startWinSequence() {
    if (gameState !== 'playing') return;
    gameState = 'winning';
    stopActiveGameplay();
    audioManager.stopMusic();
    audioManager.playSound('win');
    updateScreenVisibility();
    winTimer = setTimeout(showWinScreen, 1300);
}


/**
 * Stops player input, enemies and projectiles during result transitions.
 */
function stopActiveGameplay() {
    keyboard.reset();
    sharkie.stop();
    stopEnemiesAndProjectiles();
}


/**
 * Stops enemies and projectiles while Sharkie's death animation continues.
 */
function stopEnemiesAndProjectiles() {
    keyboard.reset();
    enemies.forEach((enemy) => enemy.stop());
    endboss.stop();
    stopAmbientLife();
    clearProjectiles();
}


/**
 * Checks whether the boss encounter has been completed.
 */
function checkWinCondition() {
    if (endboss.isDefeated) startWinSequence();
}


/**
 * Cancels pending game-over and win transitions.
 */
function clearTransitionTimers() {
    clearTimeout(gameOverTimer);
    clearTimeout(winTimer);
    gameOverTimer = null;
    winTimer = null;
}
