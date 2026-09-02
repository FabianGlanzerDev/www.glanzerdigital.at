'use strict';

window.GlanzerTemplateLibrary = window.GlanzerTemplateLibrary || {};
window.GlanzerTemplateLibrary.consent = `
<div class="consent-copy">
  <strong id="consent-title">Datenschutz-Einstellungen</strong>
  <p>Mit deiner Zustimmung aktivieren wir unsere eigene Reichweitenmessung und Google Analytics 4 für Seitenaufrufe und ausgewählte Interaktionen.</p>
  <small>Google Analytics wird erst nach deiner Zustimmung geladen. Es werden keine Werbetracker aktiviert.</small>
</div>
<div class="consent-actions">
  <a href="{{PRIVACY_URL}}" class="consent-link">Datenschutz ansehen</a>
  <button class="button button--secondary" type="button" data-consent-action="reject">Ablehnen</button>
  <button class="button button--primary" type="button" data-consent-action="accept">Statistik erlauben</button>
</div>
`;
