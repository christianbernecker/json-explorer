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
npm run lint
npm run build

# 2. Zum Production-Branch wechseln und mergen
echo "✅ Switching to production branch..."
git checkout master-r6p9cm0bf

echo "✅ Merging from staging..."
git merge staging -m "Merge staging into production: $1"

# 3. Nach Production pushen
echo "✅ Pushing to production branch..."
git push origin master-r6p9cm0bf

# Webhook für Production auslösen (hier müsste der korrekte Production-Webhook verwendet werden)
# Da der Hook in diesem Beispiel noch nicht bekannt ist, geben wir eine Anweisung aus
echo "❗ Bitte löse das Production-Deployment manuell aus oder ergänze hier den korrekten Webhook."
echo "❗ Beispiel: curl -X POST https://api.vercel.com/v1/integrations/deploy/[PRODUCTION_HOOK_ID]"

# 4. Zurück zum Staging-Branch
git checkout staging

echo "✅ Deployment vorbereitet. Production-Branch wurde aktualisiert."
echo ""
echo "✅ Production URL: https://www.adtech-toolbox.com/json-explorer"
echo ""
echo "⏱️ Bitte warte ca. 1-2 Minuten, bis das Deployment abgeschlossen ist."
