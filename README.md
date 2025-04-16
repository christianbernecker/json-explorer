# JSON Explorer

Eine Web-Anwendung zum Analysieren und Vergleichen von JSON-Daten.

## Features

- JSON Validierung und Formatierung
- Vergleich von JSON-Objekten mit Hervorhebung von Unterschieden
- VAST AdTag Explorer für die AdTech-Branche
- Kopieren und Teilen von JSON-Daten

## Deployment

**Wichtig:** Eine detaillierte Dokumentation zum Deployment-Prozess findet sich in der [DEPLOYMENT.md](./DEPLOYMENT.md) Datei.

### Voraussetzungen

- Node.js 16+
- npm 7+
- Git
- Vercel-Konto mit entsprechenden Berechtigungen

### Deployment auf Staging

Wir haben einen automatisierten Deployment-Prozess eingerichtet:

1. Verwende das Skript `deploy-staging.sh`:
   ```bash
   ./deploy-staging.sh "Deine Commit-Nachricht"
   ```

Das Skript führt folgende Schritte aus:
- Lint- und Build-Checks
- Commit der Änderungen
- Push zum staging-Branch
- Auslösen des Vercel-Webhooks für das Deployment

Nach dem Deployment ist die Anwendung unter [https://staging.adtech-toolbox.com/json-explorer](https://staging.adtech-toolbox.com/json-explorer) verfügbar.

### Deployment auf Production

Für das Production-Deployment ist ein separates Skript vorhanden:

```bash
./deploy-prod.sh "Deine Deployment-Beschreibung"
```

Dieser Prozess erfordert eine Bestätigung und führt dann:
- Überprüfung von Lint und Build
- Merge von staging in den main Branch
- Push zum Remote-Repository
- Die Anwendung ist nach dem Deployment unter [https://www.adtech-toolbox.com/json-explorer](https://www.adtech-toolbox.com/json-explorer) verfügbar

### Fehlerbehebung beim Deployment

#### Häufige Fehler

1. **TypeScript isolatedModules Fehler**
   - **Lösung**: Füge `export {};` zu leeren TypeScript-Dateien hinzu

2. **Vercel-Konfigurationsfehler**
   - **Lösung**: Überprüfe die vercel.json - `headers` und `routes` können nicht gemeinsam verwendet werden

3. **Leere Seite nach erfolgreicher Deployment**
   - **Lösung**: Überprüfe die Routing-Konfiguration in vercel.json, insbesondere für Client-seitiges Routing

4. **Import-Pfad-Fehler**
   - **Lösung**: Überprüfe die Pfade in Import-Anweisungen, insbesondere bei Komponenten mit ähnlichen Namen

5. **Änderungen nicht in Produktion sichtbar**
   - **Lösung**: Überprüfe, ob du den main Branch aktualisiert hast, da dies der Branch für Production-Deployments ist

#### Korrekte vercel.json-Konfiguration

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json", 
      "use": "@vercel/static-build",
      "config": { "distDir": "build" }
    }
  ],
  "routes": [
    { "src": "^/$", "status": 307, "headers": { "Location": "/json-explorer" } },
    { "handle": "filesystem" },
    { "src": "/json-explorer", "dest": "/" },
    { "src": "/json-explorer/(.*)", "dest": "/$1" },
    { 
      "src": "/(.*)", 
      "dest": "/index.html",
      "headers": { "Cache-Control": "s-maxage=0" }
    }
  ]
}
```

## Entwicklung

### Setup

```bash
git clone https://github.com/christianbernecker/json-explorer.git
cd json-explorer
npm install
npm start
```

### Versionierung und Tag-Strategie

Wir verwenden Git-Tags, um wichtige Versionen zu markieren und eine einfache Wiederherstellung zu ermöglichen:

#### Version-Tags

- **Produktion**: Jede in Produktion befindliche Version erhält ein Tag (z.B. `v1.1.3`)
- **Meilensteine**: Wichtige Entwicklungsmeilensteine werden ebenfalls getaggt

#### Zugriff auf spezifische Versionen

Um jederzeit zu einer spezifischen Version zurückzukehren:

```bash
# Temporärer Checkout einer Version (nur zum Ansehen)
git checkout v1.1.3

# Neuen Branch auf Basis einer Version erstellen
git checkout -b hotfix-branch v1.1.3

# Staging-Branch auf eine bestimmte Version zurücksetzen
git checkout staging
git reset --hard v1.1.3
git push --force origin staging
```

#### Neue Tags erstellen

Wenn eine Version in Produktion geht oder ein wichtiger Entwicklungsmeilenstein erreicht ist:

```bash
# Tag erstellen
git tag -a v1.1.x -m "Beschreibung der Version"

# Tag zum Remote-Repository pushen
git push origin v1.1.x
```

### Branch-Strategie

- `main`: Production-Branch
- `staging`: Staging/Vorproduktions-Branch
- Feature-Branches sollten auf Basis von `staging` erstellt werden

## Lizenz

Copyright © 2025 Christian Bernecker. Alle Rechte vorbehalten. 