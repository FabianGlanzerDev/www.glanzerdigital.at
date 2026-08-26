export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCysCQIKN4JsKNGte_Lff6vvTth7B10Mco',
  authDomain: 'glanzerdigital.firebaseapp.com',
  projectId: 'glanzerdigital',
  storageBucket: 'glanzerdigital.firebasestorage.app',
  messagingSenderId: '112431411257',
  appId: '1:112431411257:web:684ad6d32934e30b4e9de8',
  measurementId: 'G-KNVBS6MJY7',
};

export const ALLOWED_ADMIN_UIDS = ['8sXo9V8XkAOPs7kqtx6wQsQsCat1'];

export const ADMIN_ENDPOINTS = {
  analytics: './api/analytics.php',
  maintenance: './api/maintenance.php',
  searchConsole: './api/search-console.php',
  health: './api/health.php',
};

export const SEARCH_CONSOLE_CONFIG = {
  configured: true,
  property: 'sc-domain:glanzerdigital.at',
};

window.GlanzerAdminConfig = { endpoints: ADMIN_ENDPOINTS };
window.GLANZER_ADMIN_CONFIG = {
  firebaseConfigured: true,
  analyticsEndpoint: ADMIN_ENDPOINTS.analytics,
  maintenanceEndpoint: ADMIN_ENDPOINTS.maintenance,
  searchConsoleEndpoint: ADMIN_ENDPOINTS.searchConsole,
  searchConsoleConfigured: SEARCH_CONSOLE_CONFIG.configured,
  searchConsoleProperty: SEARCH_CONSOLE_CONFIG.property,
};
