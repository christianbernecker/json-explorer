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

echo ""

# Prüfen, ob eine Commit-Nachricht angegeben wurde
COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
    # Use a default message if running in CI and no message provided
    if [ "$CI" = "true" ]; then
        COMMIT_MSG="Deploy via CI"
    else
        echo "Fehler: Keine Commit-Nachricht angegeben (local run)"
        echo "Verwendung: ./deploy-staging.sh \"Deine Commit-Nachricht\""
        exit 1
    fi
fi

# 1. Build
echo "✅ Running build check..."
npm run build

# 2. Git Actions - Only run if NOT in CI environment
if [ "$CI" != "true" ]; then
  echo "✅ Committing changes (local run only)..."
  git add .
  # Use the specific commit message passed or defaulted
  git commit -m "$COMMIT_MSG" || echo "No changes to commit (local run only)"

  echo "✅ Pushing to staging branch (local run only)..."
  git push origin staging
else
  echo "ℹ️ Skipping git commit and push in CI environment."
fi

# 3. Webhook auslösen
echo "✅ Triggering deployment webhook..."
# Check if VERCEL_DEPLOY_HOOK_URL is set (passed from GH Action)
if [ -z "$VERCEL_DEPLOY_HOOK_URL" ]; then
  echo "❌ Error: VERCEL_DEPLOY_HOOK_URL environment variable is not set."
  exit 1
fi

RESPONSE=$(curl -s -X POST "$VERCEL_DEPLOY_HOOK_URL")
JOB_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

# Check if JOB_ID was extracted successfully
if [ -z "$JOB_ID" ]; then
    echo "❌ Fehler: Konnte keine Job-ID vom Vercel Webhook extrahieren. Antwort war:"
    echo "$RESPONSE"
    exit 1
fi

echo "✅ Deployment initiated with Job ID: $JOB_ID"
echo ""
echo "✅ Deployment status URL: https://vercel.com/christianberneckers-projects/adtech-toolbox-staging/deployments"
echo "✅ Application URL: https://staging.adtech-toolbox.com/json-explorer"
echo ""
echo "⏱️ Bitte warte ca. 1-2 Minuten, bis das Deployment abgeschlossen ist."
