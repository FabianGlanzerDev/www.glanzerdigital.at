Glanzer Digital – Website

Die offizielle Website von Glanzer Digital.

Dieses Repository enthält den Quellcode der gewerblichen Homepage von GlanzerDigital. Die Website dient als zentrale Anlaufstelle für Leistungen, Projekte, Referenzen, Kontaktmöglichkeiten und Informationen über den Entwickler hinter GlanzerDigital.

Die Seite wurde als individuell entwickelte, responsive Website umgesetzt und legt besonderen Wert auf:

klare und semantische HTML-Strukturen

responsive Darstellung auf Desktop, Tablet und Smartphone

gute Bedienbarkeit und Barrierefreiheit

technische Suchmaschinenoptimierung

datenschutzbewusste Analytics-Einbindung

saubere und nachvollziehbare Projektstruktur

sichere Trennung zwischen öffentlichen und privaten Serverdateien

wartbaren HTML-, CSS- und JavaScript-Code

Live-Website

https://glanzerdigital.at

Die öffentliche Website verwendet saubere URLs wie:

/

/leistungen

/portfolio

/ueber-mich

/kontakt

/impressum

/datenschutz

Die tatsächlichen HTML-Dateien der Unterseiten liegen intern im Verzeichnis subpages/ und werden serverseitig über .htaccess auf die öffentlichen URLs abgebildet.

Zweck der Website

Glanzer Digital ist eine gewerbliche Website zur Präsentation von digitalen Dienstleistungen und bereits umgesetzten Projekten.

Die Website soll Besuchern schnell vermitteln:

welche Leistungen angeboten werden

welche Technologien eingesetzt werden

welche Projekte bereits umgesetzt wurden

wie eine Zusammenarbeit ablaufen kann

wer hinter Glanzer Digital steht

wie direkt Kontakt aufgenommen werden kann

Ein besonderer Fokus liegt darauf, technische Themen verständlich und nachvollziehbar darzustellen.

Seitenübersicht

Startseite

Die Startseite vermittelt einen schnellen Überblick über Glanzer Digital.

Enthalten sind unter anderem:

Hero-Bereich

Leistungsübersicht

ausgewählte Projekte

Lösungs- bzw. Branchenorientierung

Vorteile der Zusammenarbeit

Ablauf eines Projekts

Call-to-Action-Bereiche

direkter Einstieg zu Leistungen, Portfolio und Kontakt

Leistungen

Die Leistungsseite beschreibt die angebotenen Bereiche ausführlicher.

Dazu gehören unter anderem:

Websites

Landingpages

Web-Apps

digitale Tools

Windows-Anwendungen

Weiterentwicklung bestehender Projekte

technische Betreuung

Zusätzlich wird erklärt, welche Bestandteile eine moderne Website oder Anwendung enthalten kann.

Portfolio

Das Portfolio zeigt reale und ausgewählte Projekte.

Die Seite unterscheidet zwischen:

Kundenprojekten

eigenen Softwareprojekten

Ausbildungsprojekten

Code- und Technologiebeispielen

Zu den dargestellten Projekten gehören unter anderem Websites, Web-Anwendungen, TypeScript-Projekte, Browsergames und eine lokal installierbare Windows-Anwendung.

Live-Demos und GitHub-Repositories werden dort verlinkt, wo sie für das jeweilige Projekt vorgesehen sind.

Über mich

Die Seite beschreibt:

den technischen Schwerpunkt

den Ausbildungsweg

die laufende Fullstack-Developer-Ausbildung

bisherige Praxiserfahrung

eigene Projekte

persönliche Grundsätze bei Entwicklung und Umsetzung

Die Seite ist zusätzlich mit strukturierten Daten für eine ProfilePage und Person versehen.

Kontakt

Die Kontaktseite enthält einen interaktiven Projektfragebogen.

Besucher können unter anderem auswählen:

Projektart

aktuellen Projektstand

gewünschten Zeitraum

eine kurze Projektbeschreibung

Die Angaben werden auf der Website nicht direkt gespeichert oder versendet. Stattdessen wird eine vorbereitete WhatsApp-Nachricht erzeugt, die der Besucher anschließend selbst versenden kann.

Zusätzlich stehen weitere direkte Kontaktmöglichkeiten zur Verfügung.

Rechtliche Seiten

Die Website enthält eigene Seiten für:

Impressum

Datenschutz

Diese Seiten sind über saubere öffentliche URLs erreichbar und Bestandteil der Sitemap.

Semantisches HTML

Die Website wurde mit semantischen HTML5-Elementen aufgebaut.

Je nach Seite kommen unter anderem folgende Elemente zum Einsatz:

<header>
<nav>
<main>
<section>
<article>
<aside>
<footer>
<form>
<fieldset>
<legend>
<dialog>

Ziel ist es, Inhalte nicht nur optisch, sondern auch strukturell korrekt abzubilden.

Wichtige Grundsätze:

pro Seite eine klare Hauptüberschrift

sinnvolle Überschriftenhierarchie

echte Buttons für Aktionen

echte Links für Navigation

fieldset und legend für zusammengehörige Formularfelder

aussagekräftige Labels für Eingabefelder

dekorative Bilder und Icons werden für Screenreader ausgeblendet

funktionale Bilder erhalten passende Alternativtexte

Barrierefreiheit

Die Website wurde mit Blick auf eine WCAG-2.2-AA-taugliche Grundlage entwickelt.

Umgesetzt wurden unter anderem:

Skip-Link zum Hauptinhalt

klarer Fokus für Tastaturbedienung

semantische HTML-Struktur

beschriftete Formularelemente

aria-describedby für Fehlermeldungen und Hinweise

aria-live für dynamische Formularmeldungen

sinnvolle Alternativtexte

dekorative Icons mit leerem alt bzw. aria-hidden

native HTML-Elemente wie dialog und details

responsive Reflow-Darstellung

sichtbare Zustände bei Auswahlfeldern

ausreichende Klick- und Touch-Flächen

Berücksichtigung von prefers-reduced-motion an geeigneten Stellen

Barrierefreiheit ist kein einmaliger Zustand. Vor einem größeren Release sollten zusätzlich manuelle Tests durchgeführt werden, insbesondere:

vollständige Tastaturbedienung

Zoom bei 200 % und 400 %

mobile Darstellung

Screenreader-Test

Farbkontrast

Fokusreihenfolge

Formulare und Fehlermeldungen

SEO

Die Website enthält eine technische SEO-Grundlage.

Dazu gehören:

individuelle Seitentitel

individuelle Meta-Descriptions

Canonical-URLs

robots-Meta-Tags

Open-Graph-Daten

Twitter-Card-Daten

Social-Preview-Bild

robots.txt

sitemap.xml

saubere öffentliche URLs

Weiterleitungen von alten HTML-URLs

strukturierte Daten über Schema.org

sprechende Seitentitel und Überschriften

semantische Seitenstruktur

Je nach Seite werden strukturierte Daten wie folgende verwendet:

Organization
WebSite
WebPage
CollectionPage
ProfilePage
Person
ContactPage
Service
OfferCatalog
ItemList
BreadcrumbList
SoftwareApplication
CreativeWork

Nicht jede Seite benötigt jedes Schema. Die strukturierten Daten werden daher seitenbezogen eingesetzt.

404-Seite

Für nicht vorhandene URLs existiert eine eigene Fehlerseite:

/404.html

Die .htaccess verwendet:

ErrorDocument 404 /404.html

Die Seite selbst ist für Suchmaschinen mit noindex gekennzeichnet.

Wichtig ist, dass der Webserver bei nicht vorhandenen Seiten weiterhin tatsächlich den HTTP-Statuscode 404 Not Found zurückgibt.

Analytics und Datenschutz

Analytics wird datenschutzbewusst eingebunden.

Die Website verwendet ein eigenes Consent-System. Statistik-Tracking wird erst nach entsprechender Auswahl des Besuchers aktiviert.

Zu den technischen Bestandteilen gehören unter anderem:

Consent-Banner

Speicherung der Consent-Auswahl

Google Analytics

eigene Tracking-Endpunkte

geschützter Adminbereich zur Auswertung

Private Serverkonfigurationen und Zugangsdaten werden nicht im öffentlichen Webroot gespeichert und nicht in Git versioniert.

Adminbereich

Die Website besitzt einen geschützten Adminbereich.

Dieser wird für interne Verwaltungs- und Analysefunktionen verwendet.

Der Adminbereich ist:

nicht Bestandteil der Sitemap

über robots.txt für Suchmaschinen ausgeschlossen

nicht für normale Besucher vorgesehen

von öffentlichen Website-Inhalten getrennt

Wartungsmodus

Die Website unterstützt einen serverseitigen Wartungsmodus.

Dafür wird lokal auf dem Webserver eine Datei verwendet:

website/.maintenance

Existiert diese Datei, wird der öffentliche Seitenaufruf auf die Wartungsseite umgeleitet.

Bestimmte notwendige Bereiche bleiben weiterhin erreichbar, zum Beispiel:

Adminbereich

Assets

bestimmte API-Endpunkte

ACME-/SSL-Challenges

Die Datei .maintenance wird bewusst nicht mit Git versioniert.

Web-App-Manifest

Die Website enthält ein:

site.webmanifest

Es definiert unter anderem:

Namen der Website

Sprache

Start-URL

Scope

Theme-Farbe

Hintergrundfarbe

App-/Favicon-Größen

Dadurch können Browser die Website auf unterstützten Geräten konsistenter behandeln.

Sicherheitsmaßnahmen

Die Webserver-Konfiguration enthält mehrere grundlegende Sicherheitsmaßnahmen.

Unter anderem:

HTTPS-Erzwingung

Weiterleitung von www auf die Hauptdomain

HSTS

X-Content-Type-Options

Referrer-Policy

Permissions-Policy

X-Frame-Options

Deaktivierung von Directory Listing

Sperre sensibler Dateitypen

Schutz versteckter Dateien und Verzeichnisse

Trennung privater Serverdaten vom öffentlichen Webroot

Versteckte Ordner wie .git oder .env sollen niemals öffentlich erreichbar sein.

Caching und Kompression

Die .htaccess definiert Browser-Caching für statische Ressourcen.

Beispiele:

CSS: 7 Tage

JavaScript: 7 Tage

Bilder: 30 Tage

WOFF2-Fonts: 30 Tage

Bei geänderten CSS-Dateien wird bei Bedarf Cache-Busting verwendet:

<link rel="stylesheet" href="/styles/pages/example.css?v=20260827-1">

Zusätzlich werden geeignete Textformate über mod_deflate komprimiert.

Fonts

Die Website verwendet Inter als primäre Schriftart.

Die Schrift wird lokal eingebunden und nicht über einen externen Google-Fonts-CDN geladen.

Die globale Font-Vererbung erfolgt über:

body {
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input,
textarea,
select {
  font: inherit;
}

Lokale Fonts reduzieren externe Abhängigkeiten und verbessern die Kontrolle über Datenschutz und Performance.

Verzeichnisstruktur

Vereinfacht sieht das Projekt so aus:

.
├── .git/
├── .vscode/
├── server-private/
│   ├── data/
│   ├── config.php
│   ├── lib.php
│   ├── search-console.php
│   └── google-service-account.json
│
├── website/
│   ├── admin/
│   ├── api/
│   ├── assets/
│   │   ├── favicons/
│   │   ├── fonts/
│   │   └── images/
│   ├── demos/
│   ├── scripts/
│   ├── styles/
│   │   └── pages/
│   ├── subpages/
│   ├── templates/
│   ├── .htaccess
│   ├── 404.html
│   ├── index.html
│   ├── maintenance.php
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── site.webmanifest
│   └── style.css
│
├── .gitignore
└── README.md

Öffentliche und private Dateien

Die Projektstruktur trennt bewusst öffentliche Website-Dateien und private Serverdateien.

Öffentlich

Der Inhalt von:

website/

wird in den öffentlichen Webroot der Domain geladen.

Privat

server-private/ liegt außerhalb des öffentlichen Webroots.

Dort befinden sich serverseitige Konfigurationen und Laufzeitdaten, die nicht direkt über den Browser erreichbar sein sollen.

Besonders sensible Dateien dürfen niemals öffentlich zugänglich oder Teil eines öffentlichen Repositories sein.

GitIgnore

Unter anderem werden folgende Dateien bzw. Verzeichnisse nicht versioniert:

server-private/google-service-account.json
server-private/data/
website/.maintenance

.env
.env.*

*.log
*.zip

Damit werden insbesondere:

Service-Account-Zugangsdaten

Laufzeitdaten

Wartungsstatus

Umgebungsvariablen

Logs

temporäre ZIP-Dateien

nicht versehentlich committed.

Lokale Entwicklung

Die statischen Seiten können während der Entwicklung beispielsweise über einen lokalen Entwicklungsserver geöffnet werden.

Wichtig:

Einige Funktionen benötigen eine Serverumgebung mit PHP und können über einen reinen statischen Live-Server nicht vollständig getestet werden.

Dazu gehören insbesondere:

Adminfunktionen

PHP-API-Endpunkte

serverseitige Analytics-Auswertung

Wartungsmodus

.htaccess-Rewrite-Regeln

HTTP-Statuscodes

Diese Funktionen sollten zusätzlich auf einer Apache-/PHP-Umgebung oder dem tatsächlichen Hosting getestet werden.

Deployment

Die öffentliche Website wird aus dem Verzeichnis:

website/

in den Webroot der Domain übertragen.

Private Serverdateien aus:

server-private/

werden separat außerhalb des öffentlichen Document Roots abgelegt.

Nach einem Deployment sollten mindestens folgende Punkte geprüft werden:

Startseite erreichbar

alle Navigationselemente funktionieren

saubere URLs funktionieren

alte HTML-URLs leiten korrekt weiter

HTTPS funktioniert

www leitet auf die Hauptdomain weiter

404-Seite liefert echten HTTP-404-Status

Kontaktformular funktioniert

Consent-Banner funktioniert

Analytics wird erst nach Zustimmung geladen

Adminbereich ist geschützt

Sitemap ist erreichbar

robots.txt ist erreichbar

Favicons und Manifest werden geladen

Desktop-, Tablet- und Mobile-Darstellung prüfen

Tastaturbedienung testen

Code-Organisation

Das Projekt soll übersichtlich und wartbar bleiben.

Grundprinzipien:

globale Styles nur einmal definieren

seitenbezogene Styles in eigenen Dateien

Fonts zentral verwalten

Header und Footer zentral über Templates verwalten

wiederverwendbare JavaScript-Funktionen aufteilen

keine unnötigen doppelten CSS-Regeln

klare Dateinamen

private Konfiguration strikt von öffentlichem Code trennen

Zentrale Layout-Komponenten

Header und Footer werden zentral verwaltet.

Dadurch müssen Änderungen an Navigation oder Footer nicht auf jeder HTML-Seite einzeln durchgeführt werden.

Das reduziert:

doppelten Code

Inkonsistenzen

Pflegeaufwand

Fehler bei späteren Änderungen

Responsive Design

Die Website ist für unterschiedliche Bildschirmgrößen ausgelegt.

Berücksichtigt werden unter anderem:

Desktop

Notebook

Tablet

Smartphone

Layouts werden abhängig vom verfügbaren Platz über CSS Grid, Flexbox und Media Queries angepasst.

Dabei wird darauf geachtet:

horizontales Scrollen zu vermeiden

Inhalte sinnvoll umbrechen zu lassen

Touch-Flächen ausreichend groß zu halten

Text lesbar darzustellen

Bilder kontrolliert zu skalieren

Browser und Performance

Zur Performance-Optimierung werden unter anderem eingesetzt:

WebP-Bilder

feste Bilddimensionen

Lazy Loading bei geeigneten Bildern

lokale WOFF2-Fonts

CSS-/JS-Caching

Kompression

möglichst wenige externe Abhängigkeiten

Cache-Busting bei geänderten Assets

Qualitätsanspruch

Die Website wird nicht als einmalig abgeschlossene Datei betrachtet, sondern als langfristig wartbares Projekt.

Bei Weiterentwicklungen soll weiterhin auf folgende Punkte geachtet werden:

Semantik

Barrierefreiheit

Performance

Datenschutz

Sicherheit

SEO

Responsive Design

konsistente Gestaltung

nachvollziehbare Code-Struktur

Repository-Hinweis

Dieses Repository enthält den Quellcode der offiziellen gewerblichen Website von Glanzer Digital.

Es ist kein allgemeines Website-Template und keine frei verfügbare Vorlage zur ungeprüften Weiterverwendung.

Enthaltene Marken, Texte, Designs, Bilder, Logos und projektspezifische Inhalte gehören zu Glanzer Digital bzw. den jeweils genannten Rechteinhabern.

Urheberrecht

© Glanzer Digital / Fabian Glanzer

Alle Rechte vorbehalten.

Eine Verwendung, Vervielfältigung oder Weitergabe projektspezifischer Inhalte ist ohne entsprechende Erlaubnis nicht vorgesehen.