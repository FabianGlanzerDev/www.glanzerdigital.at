# Glanzer Digital – Website & vorbereiteter Adminbereich

## Ordner

- `website/` – öffentliche Website, Demos und die vorbereitete Adminoberfläche
- `server-private/` – private Laufzeitdaten; soll außerhalb des öffentlichen Webroots liegen

## Adminbereich

Aufruf: `https://www.glanzerdigital.at/admin/`

Der Adminbereich ist bewusst bereits als `index.html` vorbereitet. Es gibt aktuell **keinen Übergangslogin und keine erfundenen Zugangsdaten**.

Vorbereitet sind:
- Dashboard-Übersicht
- Analytics-Bereich
- Wartungsmodus-Oberfläche
- Systemstatus
- getrennte JavaScript-Module für Auth, Analytics und Wartung

## Firebase später verbinden

Sobald Firebase eingerichtet ist, werden folgende Punkte ergänzt:
1. Firebase Authentication im Browser
2. erlaubte Admin-Benutzer
3. Firebase ID-Token an die Admin-API senden
4. serverseitige Prüfung des ID-Tokens
5. erst danach Analytics-Ausgabe und Wartungsänderungen freischalten

`admin/api/analytics.php` und `admin/api/maintenance.php` antworten bis dahin absichtlich mit HTTP 503. Dadurch kann niemand die vorbereiteten Admin-Funktionen ohne Authentifizierung verwenden.

## Analytics

Das bestehende cookielose Tracking bleibt vorbereitet. Es speichert nur aggregierte Seitenaufrufe, Geräteklassen und Klick-Zähler. Die private Ausgabe im Dashboard wird erst nach Firebase-Tokenprüfung freigeschaltet.

## Wartungsmodus

Der technische 503-Wartungsmodus und die Wartungsseite bleiben vorhanden. Der Admin-Schalter ist bis zur Firebase-Absicherung deaktiviert.
