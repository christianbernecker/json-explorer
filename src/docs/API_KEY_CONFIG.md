# Sichere API-Key-Konfiguration

Diese Anleitung beschreibt, wie Claude API-Keys sicher für den Data Visualizer konfiguriert werden.

## 1. Lokale Entwicklung

1. Erstelle eine `.env.local` Datei im Projektroot (nicht zu Git hinzufügen):
   ```
   # Lokale Umgebungsvariablen (werden nicht zu Git hinzugefügt)
   REACT_APP_ANTHROPIC_API_KEY=dein-claude-api-key-hier-eintragen
   ```

2. Starte die Anwendung neu, um die Umgebungsvariable zu laden.

3. Die `.env.local` Datei ist bereits in der `.gitignore` aufgeführt und wird nicht zum Repository hinzugefügt.

## 2. Vercel Environment Variablen für Deployments

Für Staging und Production:

1. Gehe zum [Vercel Dashboard](https://vercel.com)
2. Wähle das entsprechende Projekt:
   - "adtech-toolbox-staging" für Staging
   - "adtech-toolbox" für Production
3. Navigiere zu "Settings" > "Environment Variables"
4. Füge einen neuen Eintrag hinzu:
   - Name: `REACT_APP_ANTHROPIC_API_KEY`
   - Value: Dein Claude API-Key
   - Environment: Wähle die entsprechende Umgebung (Staging/Production)
5. Klicke auf "Save"

## 3. Überprüfen der Konfiguration

Nach dem Deployment kannst du prüfen, ob der API-Key verfügbar ist:

1. Öffne in deinem Browser die Developer Console
2. Prüfe die Logs - ein Hinweis wie "Anthropic API-Key: vorhanden" sollte zu sehen sein

Wenn stattdessen "Anthropic API-Key: fehlt" erscheint, wurde die Environment Variable nicht korrekt konfiguriert.

## 4. Sicherheitshinweise

- Commit NIE deinen API-Key direkt in den Quellcode
- Teile die `.env.local` Datei NICHT mit anderen (nicht per E-Mail, Chat, etc.)
- Verwende bei Vercel unterschiedliche API-Keys für Staging und Production
- Rotiere die API-Keys regelmäßig für erhöhte Sicherheit 