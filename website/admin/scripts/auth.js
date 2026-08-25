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
import { ALLOWED_ADMIN_UIDS, FIREBASE_CONFIG } from './config.js';

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
let currentAdmin = null;


function getElement(selector) {
  return document.querySelector(selector);
}


function setAuthMessage(message = '', state = '') {
  const target = getElement('[data-auth-message]');
  if (!target) return;
  target.textContent = message;
  target.dataset.state = state;
}


function setLoading(isLoading) {
  const button = getElement('[data-auth-submit]');
  if (!button) return;
  button.disabled = isLoading;
  button.textContent = isLoading ? 'Anmeldung wird geprüft …' : 'Sicher anmelden';
}


function showLogin() {
  getElement('[data-admin-app]')?.setAttribute('hidden', '');
  getElement('[data-auth-gate]')?.removeAttribute('hidden');
  getElement('[data-auth-email]')?.focus();
}


function showDashboard(user) {
  getElement('[data-auth-gate]')?.setAttribute('hidden', '');
  getElement('[data-admin-app]')?.removeAttribute('hidden');
  renderAdminIdentity(user);
}


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


function isAllowedAdmin(user) {
  return Boolean(user?.uid && ALLOWED_ADMIN_UIDS.includes(user.uid));
}


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


async function handleLogout() {
  await signOut(auth);
}


async function getIdToken(forceRefresh = false) {
  if (!currentAdmin) return '';
  return currentAdmin.getIdToken(forceRefresh);
}


function isAuthenticated() {
  return currentAdmin !== null;
}


function dispatchAuthEvent(name, detail = {}) {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}


async function handleAuthState(user) {
  if (!user) {
    currentAdmin = null;
    showLogin();
    return dispatchAuthEvent('glanzer:auth-signed-out');
  }
  if (!isAllowedAdmin(user)) {
    setAuthMessage('Dieser Firebase-Nutzer besitzt keinen Adminzugang.', 'error');
    await signOut(auth);
    return;
  }
  currentAdmin = user;
  showDashboard(user);
  dispatchAuthEvent('glanzer:auth-ready', { uid: user.uid, email: user.email || '' });
}


async function initializeFirebaseAuth() {
  await setPersistence(auth, browserSessionPersistence);
  getElement('[data-auth-form]')?.addEventListener('submit', handleLogin);
  getElement('[data-auth-reset]')?.addEventListener('click', handlePasswordReset);
  getElement('[data-auth-action="logout"]')?.addEventListener('click', handleLogout);
  onAuthStateChanged(auth, handleAuthState);
}


window.GlanzerAdminAuth = { getIdToken, isAuthenticated, handleLogout };
initializeFirebaseAuth().catch(() => setAuthMessage('Firebase konnte nicht initialisiert werden.', 'error'));
