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

# Always emphasize staging deployment
echo "⚠️ REMEMBER: ALWAYS deploy to STAGING before production!"
echo "⚠️ WORKFLOW: Git Staging → Vercel → Test on Staging URL (NOT localhost)"
echo "This script will deploy your changes to the staging environment."
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
CI=false npm run build

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

# 3. Create a simple status file to track deployment
echo "✅ Creating deployment marker..."
echo "{\"deployment\": \"staging\", \"timestamp\": \"$(date)\", \"commit\": \"$COMMIT_MSG\"}" > deployment-status.json

# Deployment Info - Vercel builds are triggered automatically by the push to staging
echo ""
echo "✅ Deployment triggered via Git push. Vercel will automatically start building."
echo "✅ Deployment status URL: https://vercel.com/christianberneckers-projects/adtech-toolbox-staging/deployments"
echo "✅ Application URL: https://staging.adtech-toolbox.com"
echo ""
echo "⏱️ Please wait approximately 1-2 minutes for the deployment to complete."
echo "⚠️ ALWAYS test thoroughly on staging before deploying to production!"
echo "⚠️ NEVER test on localhost - ALWAYS use the staging URL for testing!"

echo ""
echo "✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨"
echo "✨ REMINDER: Perform thorough VISUAL CHECKS on the staging URL! ✨"
echo "✨ Check layout, responsiveness, dark mode, and functionality.   ✨"
echo "✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨"
