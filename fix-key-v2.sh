#!/bin/bash

# Setze das Skript so, dass es bei Fehlern abbricht
set -e

echo "🔄 Starte die Bereinigung des API-Schlüssels aus der Git-Historie"

# Sichere den aktuellen Branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
echo "ℹ️ Aktueller Branch: $CURRENT_BRANCH"

# Neuen temporären Branch erstellen
git checkout -b temp-cleaning-branch
echo "✅ Temporärer Branch erstellt"

# BFG Repo Cleaner ist ein schnelleres Tool als filter-branch
# aber wir können auch mit filter-branch arbeiten
git filter-branch --force --tree-filter '
    if [ -f src/services/llmService.ts ]; then
        sed -i "" "s/const CLAUDE_API_KEY = \x27sk-ant-api03-.*\x27;/const CLAUDE_API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY || \x27\x27;/" src/services/llmService.ts
    fi
' --tag-name-filter cat -- --all

echo "✅ Bereinigung abgeschlossen, API-Schlüssel entfernt"

# Alle Branches und Tags aktualisieren
git checkout $CURRENT_BRANCH
git reset --hard temp-cleaning-branch
echo "✅ $CURRENT_BRANCH aktualisiert"

# Staging Branch aktualisieren
git checkout staging
git reset --hard temp-cleaning-branch
echo "✅ staging Branch aktualisiert"

# Main Branch aktualisieren
git checkout main
git reset --hard temp-cleaning-branch
echo "✅ main Branch aktualisiert"

# Temporären Branch löschen
git checkout $CURRENT_BRANCH
git branch -D temp-cleaning-branch
echo "✅ Temporärer Branch gelöscht"

# Bereinige Referenz-Logs
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ API-Schlüssel erfolgreich aus der Git-Historie entfernt"
echo "⚠️ Wichtig: Du musst jetzt mit 'git push -f origin staging main' die Änderungen zum Remote-Repository pushen" 