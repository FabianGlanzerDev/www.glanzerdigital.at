'use strict';

let maintenanceEnabled = false;
let maintenancePendingState = null;
let maintenanceReturnFocus = null;


/**
 * Returns the maintenance API endpoint.
 *
 * @returns {string} Maintenance endpoint.
 */
function getMaintenanceEndpoint() {
  return window.GlanzerAdminConfig?.endpoints?.maintenance || './api/maintenance.php';
}


/**
 * Returns the current Firebase ID token.
 *
 * @returns {Promise<string>} Firebase ID token.
 */
async function getMaintenanceToken() {
  return window.GlanzerAdminAuth?.getIdToken?.() || '';
}


/**
 * Updates the visible maintenance state.
 *
 * @param {boolean} enabled - Whether maintenance mode is active.
 * @returns {void}
 */
function setMaintenanceUi(enabled) {
  maintenanceEnabled = Boolean(enabled);
  const card = document.querySelector('.admin-maintenance-card');
  const state = document.querySelector('[data-maintenance-state]');
  const button = document.querySelector('[data-maintenance-toggle]');
  if (state) state.textContent = enabled ? 'Wartungsmodus aktiv' : 'Website online';
  if (card) card.classList.toggle('is-active', enabled);
  updateMaintenanceButton(button, enabled);
}



/**
 * Updates the maintenance toggle button.
 *
 * @param {HTMLElement|null} button - Toggle button.
 * @param {boolean} enabled - Whether maintenance mode is active.
 * @returns {void}
 */
function updateMaintenanceButton(button, enabled) {
  if (!button) return;
  button.disabled = false;
  button.className = `admin-button ${enabled ? 'admin-button--success' : 'admin-button--danger'}`;
  button.textContent = enabled ? 'Website wieder online schalten' : 'Wartungsmodus aktivieren';
}



/**
 * Sends a request to the maintenance API.
 *
 * @param {RequestInit} options - Fetch options.
 * @returns {Promise<object>} API response.
 */
async function requestMaintenance(options = {}) {
  const token = await getMaintenanceToken();
  if (!token) throw new Error('Firebase-ID-Token fehlt.');
  const response = await fetch(getMaintenanceEndpoint(), buildRequestOptions(options, token));
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Wartungsstatus konnte nicht geladen werden.');
  return data;
}



/**
 * Builds authenticated request options.
 *
 * @param {RequestInit} options - Existing fetch options.
 * @param {string} token - Firebase ID token.
 * @returns {RequestInit} Complete fetch options.
 */
function buildRequestOptions(options, token) {
  return {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-Firebase-ID-Token': token, ...(options.headers || {}) },
    cache: 'no-store',
  };
}



/**
 * Loads the current maintenance state.
 *
 * @returns {Promise<void>}
 */
async function loadMaintenanceState() {
  try {
    setMaintenanceUi((await requestMaintenance()).enabled === true);
    window.GlanzerAdminUi?.setSystemState('maintenanceApi', 'is-ok', 'Token geprüft / Steuerung bereit');
  } catch (error) {
    showMaintenanceError(error.message);
    window.GlanzerAdminUi?.setSystemState('maintenanceApi', 'is-pending', error.message || 'API nicht erreichbar');
  }
}



/**
 * Displays a maintenance error.
 *
 * @param {string} message - Error text.
 * @returns {void}
 */
function showMaintenanceError(message) {
  const state = document.querySelector('[data-maintenance-state]');
  if (state) state.textContent = message || 'nicht verfügbar';
}



/**
 * Opens the custom maintenance confirmation dialog.
 *
 * @returns {void}
 */
function handleMaintenanceToggle() {
  maintenancePendingState = !maintenanceEnabled;
  maintenanceReturnFocus = document.querySelector('[data-maintenance-toggle]');
  configureMaintenanceDialog(maintenancePendingState);
  document.querySelector('[data-maintenance-dialog]')?.showModal();
}



/**
 * Configures the confirmation dialog for the requested state.
 *
 * @param {boolean} enabling - Whether maintenance mode will be enabled.
 * @returns {void}
 */
function configureMaintenanceDialog(enabling) {
  const dialog = document.querySelector('[data-maintenance-dialog]');
  if (!dialog) return;
  dialog.classList.toggle('is-danger', enabling);
  dialog.classList.toggle('is-success', !enabling);
  setDialogText(enabling);
}



/**
 * Sets state-specific dialog copy.
 *
 * @param {boolean} enabling - Whether maintenance mode will be enabled.
 * @returns {void}
 */
function setDialogText(enabling) {
  setMaintenanceText('[data-maintenance-dialog-eyebrow]', enabling ? 'Wartungsmodus aktivieren' : 'Website veröffentlichen');
  setMaintenanceText('[data-maintenance-dialog-title]', enabling ? 'Website wirklich offline schalten?' : 'Website wieder online schalten?');
  setMaintenanceText('[data-maintenance-dialog-description]', maintenanceDescription(enabling));
  setMaintenanceText('[data-maintenance-dialog-note]', maintenanceNote(enabling));
  setMaintenanceText('[data-maintenance-dialog-confirm]', enabling ? 'Wartungsmodus aktivieren' : 'Website online schalten');
}



/**
 * Returns the dialog description.
 *
 * @param {boolean} enabling - Whether maintenance mode will be enabled.
 * @returns {string} Dialog description.
 */
function maintenanceDescription(enabling) {
  return enabling
    ? 'Besucher sehen anschließend die Wartungsseite. Der geschützte Adminbereich bleibt weiterhin erreichbar.'
    : 'Die Wartungsseite wird deaktiviert. Besucher können Glanzer Digital anschließend sofort wieder normal aufrufen.';
}



/**
 * Returns the dialog status note.
 *
 * @param {boolean} enabling - Whether maintenance mode will be enabled.
 * @returns {string} Dialog note.
 */
function maintenanceNote(enabling) {
  return enabling
    ? 'Die öffentliche Website antwortet währenddessen mit HTTP 503.'
    : 'Die öffentliche Website wird wieder regulär ausgeliefert.';
}



/**
 * Updates text content for one element.
 *
 * @param {string} selector - Element selector.
 * @param {string} value - New text value.
 * @returns {void}
 */
function setMaintenanceText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}



/**
 * Verifies the public website response after a maintenance change.
 *
 * @param {boolean} expected - Expected maintenance state.
 * @returns {Promise<void>} Resolves when the public response matches the state.
 */
async function verifyPublicMaintenanceState(expected) {
  const response = await fetch(`/?maintenance-check=${Date.now()}`, { cache: 'no-store' });
  const active = response.status === 503;
  if (active !== expected) throw new Error('Wartungsstatus wurde gespeichert, aber die öffentliche Website hat nicht umgeschaltet.');
}



/**
 * Applies the pending maintenance state and refreshes the UI.
 *
 * @returns {Promise<void>}
 */
async function applyMaintenanceChange() {
  const requestedState = maintenancePendingState;
  const data = await requestMaintenance(buildMaintenanceRequest(requestedState));
  await verifyPublicMaintenanceState(requestedState);
  setMaintenanceUi(data.enabled === true);
  closeMaintenanceDialog();
}


/**
 * Confirms the selected maintenance state.
 *
 * @returns {Promise<void>}
 */
async function confirmMaintenanceChange() {
  if (maintenancePendingState === null) return;
  setDialogBusy(true);
  try {
    await applyMaintenanceChange();
  } catch (error) {
    showDialogError(error.message);
  } finally {
    setDialogBusy(false);
  }
}



/**
 * Builds the maintenance update request.
 *
 * @param {boolean} enabled - Requested state.
 * @returns {RequestInit} Fetch options.
 */
function buildMaintenanceRequest(enabled) {
  return { method: 'POST', body: JSON.stringify({ enabled }) };
}



/**
 * Toggles the dialog busy state.
 *
 * @param {boolean} busy - Whether the request is running.
 * @returns {void}
 */
function setDialogBusy(busy) {
  const confirm = document.querySelector('[data-maintenance-dialog-confirm]');
  const cancel = document.querySelector('[data-maintenance-dialog-cancel]');
  if (confirm) confirm.disabled = busy;
  if (cancel) cancel.disabled = busy;
  document.querySelector('[data-maintenance-dialog]')?.classList.toggle('is-busy', busy);
}



/**
 * Shows an error inside the confirmation dialog.
 *
 * @param {string} message - Error message.
 * @returns {void}
 */
function showDialogError(message) {
  const note = document.querySelector('[data-maintenance-dialog-note]');
  if (note) note.textContent = message || 'Aktion konnte nicht ausgeführt werden.';
  document.querySelector('[data-maintenance-dialog]')?.classList.add('has-error');
}



/**
 * Closes the maintenance confirmation dialog.
 *
 * @returns {void}
 */
function closeMaintenanceDialog() {
  const dialog = document.querySelector('[data-maintenance-dialog]');
  maintenancePendingState = null;
  dialog?.classList.remove('has-error');
  dialog?.close();
}



/**
 * Restores focus after the dialog closes.
 *
 * @returns {void}
 */
function restoreMaintenanceFocus() {
  maintenanceReturnFocus?.focus();
  maintenanceReturnFocus = null;
}



/**
 * Handles clicks on the dialog backdrop.
 *
 * @param {MouseEvent} event - Dialog click event.
 * @returns {void}
 */
function handleDialogBackdrop(event) {
  const dialog = event.currentTarget;
  if (event.target === dialog) closeMaintenanceDialog();
}



/**
 * Binds all maintenance dialog controls.
 *
 * @returns {void}
 */
function bindMaintenanceDialog() {
  const dialog = document.querySelector('[data-maintenance-dialog]');
  dialog?.querySelector('[data-maintenance-dialog-cancel]')?.addEventListener('click', closeMaintenanceDialog);
  dialog?.querySelector('[data-maintenance-dialog-confirm]')?.addEventListener('click', confirmMaintenanceChange);
  dialog?.addEventListener('click', handleDialogBackdrop);
  dialog?.addEventListener('close', restoreMaintenanceFocus);
}



/**
 * Initializes the maintenance panel.
 *
 * @returns {void}
 */
function initializeMaintenancePanel() {
  if (!window.GlanzerAdminAuth?.isAuthenticated()) return;
  bindMaintenanceToggle();
  bindMaintenanceDialogOnce();
  loadMaintenanceState();
}



/**
 * Binds the main maintenance toggle once.
 *
 * @returns {void}
 */
function bindMaintenanceToggle() {
  const button = document.querySelector('[data-maintenance-toggle]');
  if (!button || button.dataset.bound === 'true') return;
  button.dataset.bound = 'true';
  button.addEventListener('click', handleMaintenanceToggle);
}



/**
 * Binds the dialog controls once.
 *
 * @returns {void}
 */
function bindMaintenanceDialogOnce() {
  const dialog = document.querySelector('[data-maintenance-dialog]');
  if (!dialog || dialog.dataset.bound === 'true') return;
  dialog.dataset.bound = 'true';
  bindMaintenanceDialog();
}


window.GlanzerAdminMaintenance = { initializeMaintenancePanel, loadMaintenanceState };
