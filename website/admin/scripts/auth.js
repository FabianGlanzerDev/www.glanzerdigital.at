import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import {
  browserSessionPersistence,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { ALLOWED_ADMIN_UIDS, FIREBASE_CONFIG } from './config.js?v=20260827-endpoint2';

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
let currentAdmin = null;



/** Returns element. @param {string} selector - The selector value. @returns {Element|null} The operation result. */
function getElement(selector) {
  return document.querySelector(selector);
}



/** Updates auth message. @param {string} message - The message value. @param {string} state - The state value. @returns {void} The operation result. */
function setAuthMessage(message = '', state = '') {
  const target = getElement('[data-auth-message]');
  if (!target) return;
  target.textContent = message;
  target.dataset.state = state;
}



/** Updates loading. @param {boolean} isLoading - The is loading value. @returns {void} The operation result. */
function setLoading(isLoading) {
  const button = getElement('[data-auth-submit]');
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Anmeldung wird geprüft …' : 'Sicher anmelden';
}



/** Shows login. @returns {void} The operation result. */
function showLogin() {
  getElement('[data-admin-app]')?.setAttribute('hidden', '');
  getElement('[data-auth-gate]')?.removeAttribute('hidden');
  getElement('[data-auth-email]')?.focus();
}



/** Shows dashboard. @param {Object} user - The user value. @returns {void} The operation result. */
function showDashboard(user) {
  getElement('[data-auth-gate]')?.setAttribute('hidden', '');
  getElement('[data-admin-app]')?.removeAttribute('hidden');
  renderAdminIdentity(user);
}



/** Renders admin identity. @param {Object} user - The user value. @returns {void} The operation result. */
function renderAdminIdentity(user) {
  const status = getElement('[data-auth-status]');
  const label = getElement('[data-auth-user]');
  const logout = getElement('[data-auth-action="logout"]');
  if (status) status.innerHTML = '<span aria-hidden="true"></span> Firebase geschützt';
  if (status) status.className = 'admin-site-state is-online';
  if (label) label.textContent = user.email || 'Admin angemeldet';
  const sidebar = getElement('[data-auth-sidebar]');
  const sidebarText = sidebar?.querySelector('small');
  if (sidebar) sidebar.querySelector('.admin-status-dot')?.classList.replace('is-warning', 'is-ok');
  if (sidebarText) sidebarText.textContent = 'Firebase geschützt';
  if (logout) logout.disabled = false;
}



/** Checks whether allowed admin. @param {Object} user - The user value. @returns {boolean} The operation result. */
function isAllowedAdmin(user) {
  return Boolean(user?.uid && ALLOWED_ADMIN_UIDS.includes(user.uid));
}



/** Returns friendly error. @param {unknown} error - The error value. @returns {string} The operation result. */
function getFriendlyError(error) {
  const code = String(error?.code || '');
  if (code.includes('invalid-credential')) return 'E-Mail-Adresse oder Passwort ist falsch.';
  if (code.includes('too-many-requests')) return 'Zu viele Versuche. Bitte später erneut probieren.';
  if (code.includes('network-request-failed')) return 'Firebase ist gerade nicht erreichbar.';
  if (code.includes('invalid-email')) return 'Bitte eine gültige E-Mail-Adresse eingeben.';
  if (code.includes('user-disabled')) return 'Dieser Adminzugang wurde deaktiviert.';
  if (code.includes('unauthorized-domain')) return 'Diese Domain ist in Firebase Authentication noch nicht freigegeben.';
  return 'Anmeldung konnte nicht durchgeführt werden.';
}



/** Handles login. @param {Event} event - The event value. @returns {Promise<void>} The operation result. */
async function handleLogin(event) {
  event.preventDefault();
  const email = String(getElement('[data-auth-email]')?.value || '').trim();
  const password = String(getElement('[data-auth-password]')?.value || '');
  if (!email || !password) return setAuthMessage('Bitte E-Mail-Adresse und Passwort eingeben.', 'error');
  setLoading(true);
  setAuthMessage('Zugang wird mit Firebase geprüft …', 'info');
  try { await signInWithEmailAndPassword(auth, email, password); }
  catch (error) { setAuthMessage(getFriendlyError(error), 'error'); }
  finally { setLoading(false); }
}



/** Handles password reset. @returns {Promise<void>} The operation result. */
async function handlePasswordReset() {
  const email = String(getElement('[data-auth-email]')?.value || '').trim();
  if (!email) return setAuthMessage('Trage zuerst deine Admin-E-Mail-Adresse ein.', 'error');
  try {
    await sendPasswordResetEmail(auth, email);
    setAuthMessage('Passwort-Reset wurde an deine E-Mail-Adresse gesendet.', 'success');
  } catch (error) {
    setAuthMessage(getFriendlyError(error), 'error');
  }
}



/** Handles logout. @returns {Promise<void>} The operation result. */
async function handleLogout() {
  await signOut(auth);
}



/** Returns id token. @param {boolean} forceRefresh - The force refresh value. @returns {Promise<string>} The operation result. */
async function getIdToken(forceRefresh = false) {
  if (!currentAdmin) return '';
  return currentAdmin.getIdToken(forceRefresh);
}



/** Checks whether authenticated. @returns {boolean} The operation result. */
function isAuthenticated() {
  return currentAdmin !== null;
}



/** Dispatches auth event. @param {string} name - The name value. @param {Object} detail - The detail value. @returns {void} The operation result. */
function dispatchAuthEvent(name, detail = {}) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}



/** Rejects unauthorized admin. @returns {Promise<unknown>} The operation result. */
async function rejectUnauthorizedAdmin() {
  setAuthMessage('Dieser Firebase-Nutzer besitzt keinen Adminzugang.', 'error');
  await signOut(auth);
}



/** Handles auth state. @param {Object} user - The user value. @returns {Promise<void>} The operation result. */
async function handleAuthState(user) {
  if (!user) {
    currentAdmin = null;
    showLogin();
    return dispatchAuthEvent('glanzer:auth-signed-out');
  }
  if (!isAllowedAdmin(user)) return rejectUnauthorizedAdmin();
  currentAdmin = user;
  showDashboard(user);
  dispatchAuthEvent('glanzer:auth-ready', { uid: user.uid, email: user.email || '' });
}



/** Initializes firebase auth. @returns {Promise<void>} The operation result. */
async function initializeFirebaseAuth() {
  await setPersistence(auth, browserSessionPersistence);
  getElement('[data-auth-form]')?.addEventListener('submit', handleLogin);
  getElement('[data-auth-reset]')?.addEventListener('click', handlePasswordReset);
  getElement('[data-auth-action="logout"]')?.addEventListener('click', handleLogout);
  onAuthStateChanged(auth, handleAuthState);
}


window.GlanzerAdminAuth = { getIdToken, isAuthenticated, handleLogout };
initializeFirebaseAuth().catch(() => setAuthMessage('Firebase konnte nicht initialisiert werden.', 'error'));
