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
1. Run build checks
2. Commit changes
3. Push to the staging branch
4. Trigger the staging deployment webhook

### Production Deployment

For deploying to the production environment:

```bash
# Deploy with an informative commit message
./deploy-prod.sh "Your meaningful commit message"
```

This script will:
1. Run lint and build checks
2. Switch to the main branch
3. Merge changes from staging
4. Push to the main branch
5. Trigger the production deployment webhook

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