#!/bin/bash

# Setze das Skript so, dass es bei Fehlern abbricht
set -e

# Klone das Repository temporär
git clone --mirror . ../temp-repo-clean
cd ../temp-repo-clean

# Verwende filter-branch, um den API-Schlüssel zu ersetzen
git filter-branch --force --tree-filter '
    if [ -f src/services/llmService.ts ]; then
        sed -i "" "s/const CLAUDE_API_KEY = \x27sk-ant-api03-.*\x27;/const CLAUDE_API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY || \x27\x27;/" src/services/llmService.ts
    fi
' --tag-name-filter cat -- --all

# Zurück zum ursprünglichen Verzeichnis
cd ../json-explorer

# Alte Refs löschen
git remote remove origin
git remote add origin https://github.com/christianbernecker/json-explorer.git

# Hole das gereinigte Repository
git fetch ../temp-repo-clean refs/heads/*:refs/heads/*
git fetch ../temp-repo-clean refs/tags/*:refs/tags/*

# Bereinige alle Logs und temporären Dateien
rm -rf ../temp-repo-clean
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ API-Schlüssel erfolgreich aus der Git-Historie entfernt"
echo "⚠️  Wichtig: Du musst jetzt mit 'git push -f origin --all' die Änderungen zum Remote-Repository pushen" 