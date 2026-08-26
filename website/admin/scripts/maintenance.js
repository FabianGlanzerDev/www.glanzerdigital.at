'use strict';

let maintenanceEnabled = false;



/** Returns endpoint. @returns {string} The operation result. */
function getEndpoint() {
  return window.GlanzerAdminConfig?.endpoints?.maintenance || './api/maintenance.php';
}



/** Returns token. @returns {Promise<unknown>} The operation result. */
async function getToken() {
  return window.GlanzerAdminAuth?.getIdToken?.() || '';
}



/** Updates maintenance ui. @param {boolean} enabled - The enabled value. @returns {void} The operation result. */
function setMaintenanceUi(enabled) {
  maintenanceEnabled = Boolean(enabled);
  const card = document.querySelector('.admin-maintenance-card');
  const state = document.querySelector('[data-maintenance-state]');
  const button = document.querySelector('[data-maintenance-toggle]');
  if (state) state.textContent = enabled ? 'Wartungsmodus aktiv' : 'Website online';
  if (card) card.classList.toggle('is-active', enabled);
  updateMaintenanceButton(button, enabled);
}



/** Updates maintenance button. @param {HTMLElement} button - The button value. @param {boolean} enabled - The enabled value. @returns {void} The operation result. */
function updateMaintenanceButton(button, enabled) {
  if (!button) return;
  button.disabled = false;
  button.className = `admin-button ${enabled ? 'admin-button--success' : 'admin-button--danger'}`;
  button.textContent = enabled ? 'Website wieder online schalten' : 'Wartungsmodus aktivieren';
}



/** Runs the request maintenance operation. @param {unknown} options - The options value. @returns {Promise<unknown>} The operation result. */
async function requestMaintenance(options = {}) {
  const token = await getToken();
  if (!token) throw new Error('Firebase-ID-Token fehlt.');
  const response = await fetch(getEndpoint(), {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Wartungsstatus konnte nicht geladen werden.');
  return data;
}



/** Runs the load maintenance state operation. @returns {Promise<unknown>} The operation result. */
async function loadMaintenanceState() {
  try {
    setMaintenanceUi((await requestMaintenance()).enabled === true);
    window.GlanzerAdminUi?.setSystemState('maintenanceApi', 'is-ok', 'Token geprüft / Steuerung bereit');
  } catch (error) {
    showMaintenanceError(error.message);
    window.GlanzerAdminUi?.setSystemState('maintenanceApi', 'is-pending', error.message || 'API nicht erreichbar');
  }
}



/** Shows maintenance error. @param {string} message - The message value. @returns {void} The operation result. */
function showMaintenanceError(message) {
  const state = document.querySelector('[data-maintenance-state]');
  if (state) state.textContent = message || 'nicht verfügbar';
}



/** Handles maintenance toggle. @returns {Promise<void>} The operation result. */
async function handleMaintenanceToggle() {
  const nextState = !maintenanceEnabled;
  const question = nextState ? 'Website wirklich in den Wartungsmodus setzen?' : 'Website wieder öffentlich online schalten?';
  if (!window.confirm(question)) return;
  const button = document.querySelector('[data-maintenance-toggle]');
  if (button) button.disabled = true;
  try { setMaintenanceUi((await requestMaintenance({ method: 'POST', body: JSON.stringify({ enabled: nextState }) })).enabled === true); }
  catch (error) { showMaintenanceError(error.message); }
  finally { if (button) button.disabled = false; }
}



/** Initializes maintenance panel. @returns {void} The operation result. */
function initializeMaintenancePanel() {
  if (!window.GlanzerAdminAuth?.isAuthenticated()) return;
  const button = document.querySelector('[data-maintenance-toggle]');
  if (button && button.dataset.bound !== 'true') {
    button.dataset.bound = 'true';
    button.addEventListener('click', handleMaintenanceToggle);
  }
  loadMaintenanceState();
}


window.GlanzerAdminMaintenance = { initializeMaintenancePanel, loadMaintenanceState };
