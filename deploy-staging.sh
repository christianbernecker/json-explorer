#!/bin/bash
set -e  # Exit on error

# Display deployment guide reminder
echo "=============================================================="
echo "                STAGING DEPLOYMENT CHECKLIST                  "
echo "=============================================================="
echo "Before proceeding, ensure you have:"
echo "  ✓ Read the DEPLOYMENT.md guide"
echo "  ✓ Made all necessary code changes and tests"
echo "  ✓ Committed your changes locally"
echo "=============================================================="
echo ""

# Prüfen, ob eine Commit-Nachricht angegeben wurde
if [ -z "$1" ]; then
    echo "Fehler: Keine Commit-Nachricht angegeben"
    echo "Verwendung: ./deploy-staging.sh \"Deine Commit-Nachricht\""
    exit 1
fi

# 1. Build
echo "✅ Running build check..."
npm run build

# 2. Git Actions
echo "✅ Committing changes..."
git add .
git commit -m "$1" || echo "No changes to commit"

echo "✅ Pushing to staging branch..."
git push origin staging

# 3. Webhook auslösen
echo "✅ Triggering deployment webhook..."
# Use the correct, confirmed hook URL
RESPONSE=$(curl -s -X POST https://api.vercel.com/v1/integrations/deploy/prj_aiXcDB1YBSVhM9MdaxCcs6Cg8zq0/t3eH9cSNFN)
JOB_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

echo "✅ Deployment initiated with Job ID: $JOB_ID"
echo ""
echo "✅ Deployment status URL: https://vercel.com/christianberneckers-projects/adtech-toolbox-staging/deployments"
echo "✅ Application URL: https://staging.adtech-toolbox.com/json-explorer"
echo ""
echo "⏱️ Bitte warte ca. 1-2 Minuten, bis das Deployment abgeschlossen ist."
