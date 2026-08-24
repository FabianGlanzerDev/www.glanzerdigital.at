'use strict';

let maintenanceEnabled = false;


function getEndpoint() {
  return window.GlanzerAdminConfig?.endpoints?.maintenance || './api/maintenance.php';
}


async function getToken() {
  return window.GlanzerAdminAuth?.getIdToken?.() || '';
}


function setMaintenanceUi(enabled) {
  maintenanceEnabled = Boolean(enabled);
  const card = document.querySelector('.admin-maintenance-card');
  const state = document.querySelector('[data-maintenance-state]');
  const button = document.querySelector('[data-maintenance-toggle]');
  if (state) state.textContent = enabled ? 'Wartungsmodus aktiv' : 'Website online';
  if (card) card.classList.toggle('is-active', enabled);
  updateMaintenanceButton(button, enabled);
}


function updateMaintenanceButton(button, enabled) {
  if (!button) return;
  button.disabled = false;
  button.className = `admin-button ${enabled ? 'admin-button--success' : 'admin-button--danger'}`;
  button.textContent = enabled ? 'Website wieder online schalten' : 'Wartungsmodus aktivieren';
}


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


async function loadMaintenanceState() {
  try {
    setMaintenanceUi((await requestMaintenance()).enabled === true);
    window.GlanzerAdminUi?.setSystemState('maintenanceApi', 'is-ok', 'Token geprüft / Steuerung bereit');
  } catch (error) {
    showMaintenanceError(error.message);
    window.GlanzerAdminUi?.setSystemState('maintenanceApi', 'is-pending', error.message || 'API nicht erreichbar');
  }
}


function showMaintenanceError(message) {
  const state = document.querySelector('[data-maintenance-state]');
  if (state) state.textContent = message || 'nicht verfügbar';
}


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
