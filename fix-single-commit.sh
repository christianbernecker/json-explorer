#!/bin/bash

# Setze das Skript so, dass es bei Fehlern abbricht
set -e

echo "🔍 Starte die Bereinigung des API-Schlüssels aus dem Commit a1bc1a8e5178ababbe59e07ff7064660337784a6"

# Zum problematischen Commit wechseln und das File bearbeiten
git checkout a1bc1a8e5178ababbe59e07ff7064660337784a6 -- src/services/llmService.ts
sed -i "" 's/const CLAUDE_API_KEY = '\''sk-ant-api03-.*'\'';/const CLAUDE_API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY || '\'''\''';/' src/services/llmService.ts
git add src/services/llmService.ts

# Commit mit dem gleichen Commit-Text aber ohne API-Schlüssel erstellen
COMMIT_MSG=$(git log --format=%B -n 1 a1bc1a8e5178ababbe59e07ff7064660337784a6)
git commit --amend -m "$COMMIT_MSG"

# Speichere die neue Commit-ID
NEW_COMMIT_ID=$(git rev-parse HEAD)
echo "✅ Neuer bereinigter Commit erstellt: $NEW_COMMIT_ID"

# Rebase der nachfolgenden Commits auf den neuen Commit
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
git rebase --onto $NEW_COMMIT_ID a1bc1a8e5178ababbe59e07ff7064660337784a6 $CURRENT_BRANCH

echo "✅ Rebase auf den bereinigten Commit abgeschlossen"
echo "⚠️  Wichtig: Du musst jetzt mit 'git push -f origin $CURRENT_BRANCH' die Änderungen zum Remote-Repository pushen" 