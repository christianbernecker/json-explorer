# Deployment Guide

This guide outlines the deployment process for the JSON Explorer application.

**Branches:**

*   `main`: Production branch. Deploys to `adtech-toolbox.com` via Vercel (manual trigger or merge from staging).
*   `staging`: Staging branch. Deploys to `staging.adtech-toolbox.com` via Vercel (automatic trigger on push).

**Environments:**

*   **Staging:** `staging.adtech-toolbox.com` - Used for testing new features and fixes before they go live.
*   **Production:** `adtech-toolbox.com` - The live application.

## Staging Deployment (ALWAYS do this first!)

**Goal:** Deploy changes to `staging.adtech-toolbox.com` for testing.

**Method:** Use the provided script. This ensures consistency and includes necessary checks.

**Steps:**

1.  **Ensure you are on the `staging` branch:**
    ```bash
    git checkout staging
    git pull origin staging # Get latest changes
    ```
2.  **Make your code changes.**
3.  **Test locally (Optional but Recommended):**
    ```bash
    npm start
    ```
4.  **Run the staging deployment script:**
    *   This script performs the following actions:
        *   Runs `npm run build` locally. **Important: This build now treats all ESLint warnings as errors (`CI=true`) and will fail if there are any warnings. Fix all warnings before committing.**
        *   Runs pre-commit hooks (if configured, e.g., for linting or formatting).
        *   Commits your changes with the provided message.
        *   Pushes the `staging` branch to GitHub.
        *   Vercel automatically detects the push and starts a new deployment.
    ```bash
    ./deploy-staging.sh "Your descriptive commit message"
    ```
5.  **Monitor the Vercel Deployment:** Check the status link provided by the script or go to the [Vercel Project](https://vercel.com/christianberneckers-projects/adtech-toolbox-staging/deployments).
6.  **Thoroughly Test on Staging URL:** Once deployed, test ALL changes and affected functionality on `https://staging.adtech-toolbox.com`. **DO NOT rely on localhost testing.** Check:
    *   Core functionality.
    *   Layout (different screen sizes).
    *   Responsiveness.
    *   Dark Mode.
    *   Console for errors.

## Production Deployment

**Goal:** Deploy tested changes from `staging` to `adtech-toolbox.com`.

**Method 1: Merge `staging` into `main` (Recommended for standard releases)**

1.  **Ensure Staging is stable and fully tested.**
2.  **Checkout `main` branch and pull latest changes:**
    ```bash
    git checkout main
    git pull origin main
    ```
3.  **Merge `staging` into `main`:**
    ```bash
    git merge staging --no-ff -m "Merge staging into main for production release"
    ```
    *   Using `--no-ff` creates a merge commit, keeping the history clearer.
4.  **Resolve any merge conflicts.**
5.  **Push `main` branch to GitHub:**
    ```bash
    git push origin main
    ```
6.  **Trigger Production Deployment on Vercel:**
    *   Go to the [Vercel Project Production Deployments](https://vercel.com/christianberneckers-projects/adtech-toolbox/production).
    *   Usually, Vercel is configured to automatically deploy pushes to `main`. If not, trigger it manually.
7.  **Verify Production:** Perform smoke tests on `https://adtech-toolbox.com` to ensure the deployment was successful.

**Method 2: Manual Production Deployment via Vercel CLI (Use for specific commits/hotfixes if needed)**

*   **Not the standard workflow.** Use merging for regular releases.
*   Ensure you have the Vercel CLI installed and logged in (`npm i -g vercel && vercel login`).
*   Checkout the specific commit you want to deploy.
*   Run:
    ```bash
    vercel --prod
    ```
*   Follow the CLI prompts.
*   **Verify Production** carefully.

## Important Notes

*   **NEVER push directly to `main`** unless it's a trivial documentation change or a merge commit.
*   **ALWAYS test on the `staging` URL**, not just `localhost`.
*   Communicate deployments to the team if applicable.

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