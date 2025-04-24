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

# Check for a commit message
COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
    # Use a default message if running in CI and no message provided
    if [ "$CI" = "true" ]; then
        COMMIT_MSG="Deploy via CI"
    else
        echo "Error: No commit message provided (local run)"
        echo "Usage: ./deploy-staging.sh \"Your commit message\""
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

# 3. Trigger webhook - Only if not already triggered by GitHub Action
if [ "$CI" = "true" ]; then
  # In CI, check if webhook was already triggered by checking env var
  if [ -n "$WEBHOOK_ALREADY_TRIGGERED" ]; then
    echo "ℹ️ Webhook already triggered. Skipping duplicate webhook call."
    exit 0
  fi
  
  # Mark webhook as triggered to prevent double calls
  export WEBHOOK_ALREADY_TRIGGERED=true
fi

# Only trigger the webhook if VERCEL_DEPLOY_HOOK_URL is set
if [ -z "$VERCEL_DEPLOY_HOOK_URL" ]; then
  echo "❌ Error: VERCEL_DEPLOY_HOOK_URL environment variable is not set."
  exit 1
fi

echo "✅ Triggering deployment webhook..."
RESPONSE=$(curl -s -X POST "$VERCEL_DEPLOY_HOOK_URL")
JOB_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

# Check if JOB_ID was extracted successfully
if [ -z "$JOB_ID" ]; then
    echo "❌ Error: Could not extract Job ID from Vercel webhook response:"
    echo "$RESPONSE"
    exit 1
fi

echo "✅ Deployment initiated with Job ID: $JOB_ID"
echo ""
echo "✅ Deployment status URL: https://vercel.com/christianberneckers-projects/adtech-toolbox-staging/deployments"
echo "✅ Application URL: https://staging.adtech-toolbox.com/json-explorer"
echo ""
echo "⏱️ Please wait approximately 1-2 minutes for the deployment to complete."
