'use strict';


/**
 * Initializes the prepared admin dashboard.
 */
function initializeAdminDashboard() {
  window.GlanzerAdminAuth?.renderAuthState();
  window.GlanzerAdminAnalytics?.initializeAnalyticsPanel();
  window.GlanzerAdminMaintenance?.initializeMaintenancePanel();
}


initializeAdminDashboard();
