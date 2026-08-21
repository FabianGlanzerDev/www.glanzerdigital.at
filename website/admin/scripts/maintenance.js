'use strict';


/**
 * Keeps maintenance controls disabled until Firebase token verification exists.
 */
function initializeMaintenancePanel() {
  const button = document.querySelector('[data-maintenance-toggle]');
  if (!button || !window.GlanzerAdminAuth?.isFirebaseConfigured()) return;
}


window.GlanzerAdminMaintenance = { initializeMaintenancePanel };
