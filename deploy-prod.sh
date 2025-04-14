#!/bin/bash
set -e  # Exit on error

# Display deployment guide reminder
echo "=============================================================="
echo "               PRODUCTION DEPLOYMENT CHECKLIST                "
echo "=============================================================="
echo "Before proceeding, ensure you have:"
echo "  ✓ Read the DEPLOYMENT.md guide"
echo "  ✓ Tested all changes on staging"
echo "  ✓ Updated version numbers in package.json and Footer.tsx"
echo "  ✓ Verified SEO elements are in place"
echo "  ✓ Checked that you're deploying to the main branch"
echo "=============================================================="
echo ""

# Prüfen, ob eine Commit-Nachricht angegeben wurde
if [ -z "$1" ]; then
    echo "Fehler: Keine Commit-Nachricht angegeben"
    echo "Verwendung: ./deploy-prod.sh \"Deine Commit-Nachricht\""
    exit 1
fi

# Automatische Prüfung der Versionsnummern
echo "✅ Checking version numbers..."
PACKAGE_VERSION=$(grep -o '"version": "[^"]*"' package.json | cut -d'"' -f4)
FOOTER_VERSION=$(grep -o "APP_VERSION = 'v[^']*'" src/components/shared/Footer.tsx | cut -d"'" -f2)

if [ "v$PACKAGE_VERSION" != "$FOOTER_VERSION" ]; then
    echo "❌ Error: Version mismatch between package.json ($PACKAGE_VERSION) and Footer.tsx ($FOOTER_VERSION)"
    exit 1
fi

echo "✅ Version numbers are consistent: $FOOTER_VERSION"

# Deployment-Info anzeigen
echo "⚠️ DEPLOYMENT INFO: Production deployment is starting"
echo "All changes will be merged from staging to main."

# 1. Build und Lint überprüfen
echo "✅ Running lint and build checks..."
npm run lint || echo "Lint complete with warnings"
npm run build:production

# 2. Zum Production-Branch wechseln und mergen
echo "✅ Switching to production branch..."
git checkout main

echo "✅ Merging from staging..."
git merge staging -m "Merge staging into production: $1"

# 3. Nach Production pushen
echo "✅ Pushing to production branch..."
git push origin main

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
