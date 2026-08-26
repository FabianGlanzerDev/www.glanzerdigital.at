const GA4_MEASUREMENT_ID = 'G-KNVBS6MJY7';
const GA4_SCRIPT_ID = 'gd-ga4-script';

let ga4Initialized = false;


/** Queues a gtag command in the Google data layer. @param {...unknown} args - gtag command values. @returns {void} */
function queueGtag(...args) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag(...args);
}



/** Loads the Google Analytics library after consent. @returns {void} */
function loadGoogleAnalyticsScript() {
  if (document.getElementById(GA4_SCRIPT_ID)) return;
  const script = document.createElement('script');
  script.id = GA4_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
  document.head.append(script);
}



/** Enables GA4 measurement after explicit statistics consent. @returns {void} */
export function initializeGoogleAnalytics() {
  window[`ga-disable-${GA4_MEASUREMENT_ID}`] = false;
  if (ga4Initialized) {
    queueGtag('consent', 'update', { analytics_storage: 'granted' });
    return;
  }
  ga4Initialized = true;
  queueGtag('consent', 'default', {
    analytics_storage: 'granted', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied',
  });
  queueGtag('js', new Date());
  queueGtag('config', GA4_MEASUREMENT_ID, {
    send_page_view: true, allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  loadGoogleAnalyticsScript();
}



/** Sends a custom GA4 event without duplicating automatic page views. @param {string} name - Event name. @param {string} label - Event label. @returns {void} */
export function trackGoogleAnalyticsEvent(name, label = '') {
  if (!ga4Initialized || name === 'page_view') return;
  queueGtag('event', name, {
    event_label: String(label || '').slice(0, 100),
    page_path: window.location.pathname,
  });
}



/** Removes first-party GA cookies that are accessible from this site. @returns {void} */
function deleteGoogleAnalyticsCookies() {
  const cookies = document.cookie.split(';').map((value) => value.trim().split('=')[0]);
  cookies.filter((name) => name.startsWith('_ga')).forEach(expireGoogleAnalyticsCookie);
}



/** Expires a GA cookie for relevant domain variants. @param {string} name - Cookie name. @returns {void} */
function expireGoogleAnalyticsCookie(name) {
  const domains = ['', window.location.hostname, '.glanzerdigital.at'];
  domains.forEach((domain) => {
    const domainPart = domain ? `; domain=${domain}` : '';
    document.cookie = `${name}=; Max-Age=0; path=/${domainPart}; SameSite=Lax; Secure`;
  });
}



/** Disables future GA4 measurement after consent withdrawal. @returns {void} */
export function disableGoogleAnalytics() {
  window[`ga-disable-${GA4_MEASUREMENT_ID}`] = true;
  if (ga4Initialized) queueGtag('consent', 'update', { analytics_storage: 'denied' });
  deleteGoogleAnalyticsCookies();
}
