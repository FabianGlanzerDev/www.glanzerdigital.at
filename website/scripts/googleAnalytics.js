const GA4_MEASUREMENT_ID = 'G-KNVBS6MJY7';
const GA4_SCRIPT_ID = 'gd-ga4-script';
let ga4Initialized = false;


/** Queues one command in the Google data layer. */
function queueGtag(...args) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag(...args);
}


/** Loads the Google Analytics library after consent. */
function loadGoogleAnalyticsScript() {
  if (document.getElementById(GA4_SCRIPT_ID)) return;
  const script = document.createElement('script');
  script.id = GA4_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
  document.head.append(script);
}


/** Applies the privacy-focused GA4 consent and signal settings. */
function configureGoogleAnalytics() {
  queueGtag('consent', 'default', getGoogleConsentSettings());
  queueGtag('js', new Date());
  queueGtag('config', GA4_MEASUREMENT_ID, getGoogleConfigSettings());
}


/** Returns the analytics consent settings used after opt-in. */
function getGoogleConsentSettings() {
  return {
    analytics_storage: 'granted', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied',
  };
}


/** Returns GA4 configuration without advertising signals. */
function getGoogleConfigSettings() {
  return {
    send_page_view: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  };
}


/** Enables GA4 measurement after explicit statistics consent. */
export function initializeGoogleAnalytics() {
  window[`ga-disable-${GA4_MEASUREMENT_ID}`] = false;
  if (ga4Initialized) return grantGoogleAnalyticsConsent();
  ga4Initialized = true;
  configureGoogleAnalytics();
  loadGoogleAnalyticsScript();
}


/** Re-enables analytics storage after renewed consent. */
function grantGoogleAnalyticsConsent() {
  queueGtag('consent', 'update', { analytics_storage: 'granted' });
}


/** Sends a custom GA4 event without duplicating automatic page views. */
export function trackGoogleAnalyticsEvent(name, label = '') {
  if (!ga4Initialized || name === 'page_view') return;
  queueGtag('event', name, {
    event_label: String(label || '').slice(0, 100),
    page_path: window.location.pathname,
  });
}


/** Removes first-party GA cookies accessible from this site. */
function deleteGoogleAnalyticsCookies() {
  const names = document.cookie.split(';').map((value) => value.trim().split('=')[0]);
  names.filter((name) => name.startsWith('_ga')).forEach(expireGoogleAnalyticsCookie);
}


/** Expires one GA cookie for relevant domain variants. */
function expireGoogleAnalyticsCookie(name) {
  ['', window.location.hostname, '.glanzerdigital.at'].forEach((domain) => {
    const domainPart = domain ? `; domain=${domain}` : '';
    document.cookie = `${name}=; Max-Age=0; path=/${domainPart}; SameSite=Lax; Secure`;
  });
}


/** Disables future GA4 measurement after consent withdrawal. */
export function disableGoogleAnalytics() {
  window[`ga-disable-${GA4_MEASUREMENT_ID}`] = true;
  if (ga4Initialized) queueGtag('consent', 'update', { analytics_storage: 'denied' });
  deleteGoogleAnalyticsCookies();
}
