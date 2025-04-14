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
   - Production webhook: `https://api.vercel.com/v1/integrations/deploy/prj_j18jOo7H76ge7XNlqQtNUCwqrIfe/M8sHj7yBFj`

2. **Staging**: https://staging.adtech-toolbox.com/json-explorer
   - Deployed from the `staging` branch
   - Staging webhook: `https://api.vercel.com/v1/integrations/deploy/prj_aiXcDB1YBSVhM9MdaxCcs6Cg8zq0/WhSr1Ws0SO`

## Deployment Process

### Staging Deployment

For deploying to the staging environment:

```bash
# Deploy with an informative commit message
./deploy-staging.sh "Your meaningful commit message"
```

This script will:
1. Display a pre-deployment checklist
2. Run build checks
3. Commit changes
4. Push to the staging branch
5. Trigger the staging deployment webhook

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

1. **Pre-deployment Checklists**: Both deployment scripts show checklists to remind you of key steps.

2. **Required Confirmation**: The production deployment script requires explicit confirmation that you've read the guide.

3. **Git Hooks**: 
   - The `pre-push` hook reminds you about the deployment process when pushing to staging or main branches.
   - The `pre-commit` hook updates the sitemap with current dates.

4. **NPM Scripts**:
   - `npm run install-hooks`: Installs the git hooks (runs automatically after `npm install`)
   - `npm run prepare-deploy`: Shows a summary of the deployment guide

## Version Management

1. Update the version number in `package.json` before deployment
2. Update the version constants in `src/components/shared/Footer.tsx`:
   - `APP_VERSION`: Current production version
   - `APP_VERSION_NEXT`: Next version in development

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
2. Check webhook responses
3. Verify Vercel project settings
4. Check build errors in deployment logs

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