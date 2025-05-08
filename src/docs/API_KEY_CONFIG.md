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
4. Füge diese Umgebungsvariable hinzu:
   - Name: `ANTHROPIC_API_KEY` (WICHTIG: Für Vercel-Deployments wird dieser Name benötigt!)
   - Value: Dein Claude API-Key
   - Environment: Wähle die entsprechende Umgebung (Staging/Production)
5. Klicke auf "Save"

## 3. API-Schlüssel für Frontend und Backend

Wichtig zu verstehen:
- Frontend (React-App) verwendet: `REACT_APP_ANTHROPIC_API_KEY`
- Backend (API-Routen) verwendet: `ANTHROPIC_API_KEY`

Für Vercel-Deployments wird empfohlen, **nur** `ANTHROPIC_API_KEY` zu konfigurieren, da:
1. Die API-Route auf dem Server benötigt diese Variable
2. Das Frontend sollte API-Schlüssel nicht direkt verwenden (Sicherheitsrisiko)

Das Backend (api/analyze-data.ts) ist so konfiguriert, dass es beide Variablennamen akzeptiert, aber für Produktionsumgebungen sollte `ANTHROPIC_API_KEY` verwendet werden.

## 4. Überprüfen der Konfiguration

Nach dem Deployment kannst du prüfen, ob der API-Key verfügbar ist:

1. Öffne die Data Visualizer AI-Tab
2. Ein Fehler mit "API-Schlüssel fehlt" bedeutet, dass die Umgebungsvariable nicht korrekt konfiguriert wurde
3. Prüfe die Server-Logs in der Vercel-Konsole für weitere Details

## 5. Sicherheitshinweise

- Commit NIE deinen API-Key direkt in den Quellcode
- Teile die `.env.local` Datei NICHT mit anderen (nicht per E-Mail, Chat, etc.)
- Verwende bei Vercel unterschiedliche API-Keys für Staging und Production
- Rotiere die API-Keys regelmäßig für erhöhte Sicherheit 