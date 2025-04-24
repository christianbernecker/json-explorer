# Deployment Process

This document outlines the deployment process for the AdTech Toolbox application.

## IMPORTANT: Always Deploy to Staging First

**Never deploy directly to production without testing on staging first.**

The staging environment is set up to mirror production as closely as possible, allowing you to catch and fix issues before they affect real users.

## Deployment Workflow

### 1. Staging Deployment

```bash
# Run the staging deployment script with a commit message
./deploy-staging.sh "Your descriptive commit message"
```

This script will:
- Build the application
- Commit your changes (if run locally)
- Push to the staging branch
- Trigger automatic deployment on Vercel

The staging application will be available at: **[https://staging.adtech-toolbox.com](https://staging.adtech-toolbox.com)**

### 2. Testing on Staging

After deploying to staging, thoroughly test your changes:

- Verify all features work as expected
- Check both light and dark modes
- Test on different browsers and devices
- Validate all critical user flows

### 3. Production Deployment

Only after successful testing on staging:

```bash
# Run the production deployment script
npm run deploy
```

## Deployment Checklist

Before any deployment, ensure:

- All code changes are committed
- All tests pass
- The application builds successfully
- You have proper permissions to deploy

## Troubleshooting

If you encounter issues during deployment:

1. Check the Vercel deployment logs
2. Verify your branch is up to date
3. Ensure environment variables are correctly set

## Rollback Procedure

If a deployment causes issues:

1. Immediately deploy the previous stable version to staging
2. Verify it resolves the issue
3. Deploy the stable version to production 