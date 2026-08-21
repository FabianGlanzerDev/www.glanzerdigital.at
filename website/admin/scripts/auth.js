'use strict';


/**
 * Returns whether Firebase Authentication is configured.
 * @returns {boolean} Current authentication configuration state.
 */
function isFirebaseConfigured() {
  return window.GLANZER_ADMIN_CONFIG?.firebaseConfigured === true;
}


/**
 * Updates the visible authentication state without exposing credentials.
 */
function renderAuthState() {
  const status = document.querySelector('[data-auth-status]');
  if (!status || isFirebaseConfigured()) return;
  status.className = 'admin-site-state is-pending';
  status.lastChild.textContent = ' Firebase noch nicht verbunden';
}


window.GlanzerAdminAuth = {
  isFirebaseConfigured,
  renderAuthState,
};
