/**
 * Connects interface controls with game actions.
 */
function bindInterfaceEvents() {
    startButton.addEventListener('click', showControlsScreen);
    continueButton.addEventListener('click', startGame);
    controlsCloseButton.addEventListener('click', showHomeScreen);
    controlsScreen.addEventListener('click', handleControlsBackdropClick);
    bindResultButtons();
    bindUtilityButtons();
}


/**
 * Connects restart and home buttons on result screens.
 */
function bindResultButtons() {
    restartButton.addEventListener('click', startGame);
    homeButton.addEventListener('click', showHomeScreen);
    winRestartButton.addEventListener('click', startGame);
    winHomeButton.addEventListener('click', showHomeScreen);
}


/**
 * Connects mute and fullscreen buttons.
 */
function bindUtilityButtons() {
    muteButton.addEventListener('click', toggleMute);
    fullscreenButton.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    window.addEventListener('resize', updateScreenVisibility);
    if (!gameShell.requestFullscreen) fullscreenButton.hidden = true;
    updateMuteButton();
}


/**
 * Opens the control instructions before the game starts.
 */
function showControlsScreen() {
    if (gameState !== 'home') return;
    gameState = 'controls';
    keyboard.reset();
    updateScreenVisibility();
    continueButton.focus();
}


/**
 * Closes the control dialog when its backdrop is clicked.
 * @param {MouseEvent} event Click event on the overlay.
 */
function handleControlsBackdropClick(event) {
    if (gameState !== 'controls') return;
    if (event.target === controlsScreen) showHomeScreen();
}


/**
 * Displays the final game-over interface.
 */
function showGameOverScreen() {
    if (gameState !== 'dying') return;
    gameState = 'gameover';
    sharkie.stop();
    updateScreenVisibility();
    restartButton.focus();
}


/**
 * Displays the successful end-of-level interface.
 */
function showWinScreen() {
    if (gameState !== 'winning') return;
    gameState = 'win';
    updateScreenVisibility();
    winRestartButton.focus();
}


/**
 * Removes focus from hidden interface buttons after gameplay starts.
 */
function releaseInterfaceFocus() {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) activeElement.blur();
}


/**
 * Updates the visibility of every interface layer.
 */
function updateScreenVisibility() {
    applyTouchCapabilityClass();
    setElementVisibility(startScreen, gameState === 'home');
    setElementVisibility(controlsScreen, gameState === 'controls');
    setElementVisibility(gameOverScreen, gameState === 'gameover');
    setElementVisibility(winScreen, gameState === 'win');
    setElementVisibility(gameHud, isHudVisible());
    setElementVisibility(mobileControls, gameState === 'playing' && isTouchControlDevice());
    syncGameShellState();
}


/**
 * Applies state classes used by responsive interface styles.
 */
function syncGameShellState() {
    gameShell.classList.toggle('is-playing', gameState === 'playing');
}


/**
 * Checks whether the in-game HUD should be visible.
 * @returns {boolean} Whether the HUD is visible.
 */
function isHudVisible() {
    return ['playing', 'dying', 'winning'].includes(gameState);
}


/**
 * Checks whether active game objects should be rendered.
 * @returns {boolean} Whether the game scene is visible.
 */
function isGameSceneVisible() {
    return ['playing', 'dying', 'gameover', 'winning', 'win'].includes(gameState);
}


/**
 * Checks whether the current device should use mobile touch controls.
 * @returns {boolean} Whether touch controls should be enabled.
 */
function isTouchControlDevice() {
    return isTouchCapable();
}


/**
 * Shows or hides an interface element accessibly.
 * @param {HTMLElement} element Element to update.
 * @param {boolean} isVisible Whether the element should be visible.
 */
function setElementVisibility(element, isVisible) {
    if (!isVisible) releaseFocusInside(element);
    element.hidden = !isVisible;
    element.inert = !isVisible;
    element.setAttribute('aria-hidden', String(!isVisible));
}


/**
 * Removes focus before an interface layer becomes hidden.
 * @param {HTMLElement} element Interface layer that will be hidden.
 */
function releaseFocusInside(element) {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && element.contains(activeElement)) activeElement.blur();
}


/**
 * Toggles all game audio and persists the choice.
 */
function toggleMute() {
    audioManager.toggleMute();
    updateMuteButton();
    if (!audioManager.muted && gameState === 'playing') audioManager.startMusic();
}


/**
 * Updates the mute button label and pressed state.
 */
function updateMuteButton() {
    muteButton.textContent = audioManager.muted ? 'Muted' : 'Sound On';
    muteButton.setAttribute('aria-pressed', String(audioManager.muted));
}


/**
 * Toggles fullscreen mode for the game shell.
 */
function toggleFullscreen() {
    if (document.fullscreenElement) return document.exitFullscreen();
    const result = gameShell.requestFullscreen?.();
    if (result?.catch) result.catch(() => {});
}


/**
 * Updates the fullscreen button label.
 */
function updateFullscreenButton() {
    fullscreenButton.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
}
