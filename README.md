# Glanzer Digital

Lokale Projektstruktur für die Website von Glanzer Digital.

## Aufbau

```text
GlanzerDigital FTP/
├── .git/
├── .vscode/
├── website/
│   ├── assets/
│   ├── demos/
│   ├── scripts/
│   ├── styles/
│   ├── subpages/
│   ├── templates/
│   ├── index.html
│   ├── robots.txt
│   └── sitemap.xml
├── .gitignore
└── README.md
```

Auf den Webserver gehört ausschließlich der Inhalt von `website/`.

`Backup/` und `GlanzerDigital Intern/` liegen außerhalb dieses Git-Arbeitsverzeichnisses und sind nicht für den Webserver bestimmt.

Die Hauptwebsite verwendet nur `subpages/`; der alte parallele `pages/`-Ordner ist nicht mehr vorhanden.
