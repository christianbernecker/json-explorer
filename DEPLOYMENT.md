# JSON Explorer Deployment Guide

This document describes the deployment process for the JSON Explorer application.

## Branch Structure

- **`main`**: Production branch. All changes to production must be deployed from this branch.
- **`staging`**: Staging branch for pre-production testing.
- Other feature branches should be created as needed and merged into `staging` first.

## Environment Setup

The application has two environments:

1. **Production**: https://www.adtech-toolbox.com/json-explorer
   - Deployed from the `main` branch
   - Production webhook: [REDACTED - stored in GitHub Secrets]

2. **Staging**: https://staging.adtech-toolbox.com/json-explorer
   - Deployed from the `staging` branch
   - Staging webhook: [REDACTED - stored in GitHub Secrets]

## Deployment Process

### Staging Deployment

**Important:** Use the provided script for staging deployments. The script has been optimized to prevent double deployments, which can occur when both GitHub Actions and the deployment script try to trigger the webhook simultaneously.

For deploying to the staging environment:

```bash
# Deploy with an informative commit message
./deploy-staging.sh "Your meaningful commit message"
```

This script will:
1. Display a pre-deployment checklist
2. Run build checks
3. Commit changes (if running locally)
4. Push to the staging branch (if running locally)
5. Trigger the staging deployment webhook **exactly once**

### Production Deployment

For deploying to the production environment:

```bash
# Deploy with an informative commit message
./deploy-prod.sh "Your meaningful commit message"
```

This script will:
1. Display a pre-deployment checklist and require confirmation
2. Run lint and build checks
3. Switch to the main branch
4. Merge changes from staging
5. Push to the main branch
6. Trigger the production deployment webhook

## Automatic Deployment Safeguards

Several safeguards have been implemented to ensure proper deployment:

1. **Double Deployment Prevention**: The deployment script now checks if it's running in a CI environment and prevents duplicate webhook calls.

2. **Pre-deployment Checklists**: Both deployment scripts show checklists to remind you of key steps.

3. **Required Confirmation**: The production deployment script requires explicit confirmation that you've read the guide.

4. **Git Hooks**: 
   - The `pre-push` hook reminds you about the deployment process when pushing to staging or main branches.
   - The `pre-commit` hook updates the sitemap with current dates.

5. **NPM Scripts**:
   - `npm run install-hooks`: Installs the git hooks (runs automatically after `npm install`)
   - `npm run prepare-deploy`: Shows a summary of the deployment guide

## Version Management

1.  **Production Version (`APP_VERSION`):** Update the `APP_VERSION` constant in `src/constants.ts` before a production deployment. This version number is displayed on the production site.
2.  **Staging/Preview Version:** The staging environment (`staging.adtech-toolbox.com` and `*.vercel.app` URLs) automatically displays "v[Next Version]-preview" (e.g., "v1.1.5-preview") in the footer. This is determined by checking the browser's hostname directly in `src/components/shared/Footer.tsx` and does not require manual updates for staging.
3.  **(Optional) `APP_VERSION_NEXT`:** The `APP_VERSION_NEXT` constant in `src/constants.ts` can still be used for internal tracking or documentation of the next planned version but is not currently displayed in the UI.

## Pre-deployment Checklist

Before deploying to production, ensure:

- All features are tested on staging
- Version numbers are updated
- SEO elements are in place (meta tags, sitemap.xml, etc.)
- Automated tests pass
- Performance check completed

## Sitemap Updates

The sitemap is automatically updated during build:

```bash
# Manual update
npm run update-sitemap
```

The sitemap date is also updated as part of the pre-commit hook and deploy scripts.

## Troubleshooting

If deployment issues occur:

1. Verify you are on the correct branch
2. **Double deployments:** If you notice double deployments being triggered, check that you are not manually triggering a deployment while GitHub Actions is already doing so. The script has been updated to prevent this in most cases.
3. **Deployment does not appear in Vercel UI:**
   - Check the `curl` command in `./deploy-staging.sh` uses the correct **Staging webhook URL** from GitHub Secrets.
   - Verify this URL matches the active **Deploy Hook** for the `staging` branch in Vercel project settings (Settings -> Git -> Deploy Hooks).
   - Manually trigger the hook URL in your browser to see if it works. If it does, the issue might be with the environment executing the script.
4. Check webhook responses (if the script fails during the `curl` command).
5. Verify Vercel project settings (especially Git connection, Build settings, Domain assignments).
6. Check build errors in Vercel deployment logs (if the deployment starts but fails).

## Rollback Process

To rollback a production deployment:

```bash
# Checkout the previous working version tag (example: v1.1.1)
git checkout v1.1.1

# Create a rollback branch
git checkout -b rollback-to-v1.1.1

# Deploy the rollback
./deploy-prod.sh "Rollback to v1.1.1 due to [reason]"
``` 