# Glanzer Digital – Website & Adminbereich

## Struktur

- `website/` – öffentliche Website, Portfolio-Demos und geschütztes Admin-Dashboard
- `server-private/` – private Serverlogik, lokale Analytics-Daten und Search-Console-Anbindung; muss außerhalb des öffentlichen Webroots liegen

## Adminbereich

Aufruf: `https://glanzerdigital.at/admin/`

Der Adminbereich verwendet Firebase Authentication. Nur ausdrücklich freigegebene Firebase-UIDs erhalten Zugriff. Das Firebase-ID-Token wird zusätzlich serverseitig geprüft, bevor Analytics-, Search-Console- oder Wartungsfunktionen ausgeführt werden.

Enthalten sind:
- lokale cookielose Analytics
- Google-Search-Console-Auswertung
- Wartungsmodus
- Systemcheck
- JSON-Export der lokalen Analytics

## Search Console

Die Google Search Console API wird serverseitig über `server-private/google-service-account.json` angesprochen. Diese Datei enthält einen privaten Schlüssel und darf niemals in ein öffentliches Repository gelangen. Sie ist in `.gitignore` ausgeschlossen.

## Deployment

`website/` wird als öffentlicher Webroot bereitgestellt. `server-private/` bleibt daneben außerhalb des öffentlichen Webroots. Vor dem finalen Upload sollten HTTPS, PHP-Zugriff auf die privaten Dateien sowie Firebase und Search Console einmal live geprüft werden.
