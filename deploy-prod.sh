#!/bin/bash
set -e  # Exit on error

# Prüfen, ob eine Commit-Nachricht angegeben wurde
if [ -z "$1" ]; then
    echo "Fehler: Keine Commit-Nachricht angegeben"
    echo "Verwendung: ./deploy-prod.sh \"Deine Commit-Nachricht\""
    exit 1
fi

# Bestätigung vom Benutzer einholen
echo "⚠️ ACHTUNG: Du bist dabei, auf PRODUCTION zu deployen!"
echo "Alle Änderungen werden von staging nach master-r6p9cm0bf gemergt."
read -p "Bist du sicher, dass du fortfahren möchtest? (j/n): " confirm

if [ "$confirm" != "j" ]; then
    echo "Deployment abgebrochen."
    exit 0
fi

# 1. Build und Lint überprüfen
echo "✅ Running lint and build checks..."
npm run lint || echo "Lint complete with warnings"
npm run build:production

# 2. Zum Production-Branch wechseln und mergen
echo "✅ Switching to production branch..."
git checkout master-r6p9cm0bf

echo "✅ Merging from staging..."
git merge staging -m "Merge staging into production: $1"

# 3. Nach Production pushen
echo "✅ Pushing to production branch..."
git push origin master-r6p9cm0bf

# 4. Webhook für Production auslösen
echo "✅ Triggering deployment webhook..."
RESPONSE=$(curl -s -X POST https://api.vercel.com/v1/integrations/deploy/prj_j18jOo7H76ge7XNlqQtNUCwqrIfe/M8sHj7yBFj)
JOB_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

echo "✅ Deployment initiated with Job ID: $JOB_ID"

# 5. Zurück zum Staging-Branch
git checkout staging

echo "✅ Deployment vorbereitet. Production-Branch wurde aktualisiert."
echo ""
echo "✅ Deployment status URL: https://vercel.com/christianberneckers-projects/adtech-toolbox/deployments"
echo "✅ Production URL: https://www.adtech-toolbox.com/json-explorer"
echo ""
echo "⏱️ Bitte warte ca. 1-2 Minuten, bis das Deployment abgeschlossen ist."
