# JSON Explorer & Diff Tool

This tool provides several features for working with JSON:
- JSON validation and formatting
- JSON diff comparison
- VAST ad tag exploration

## Features

- JSON validation and formatting
- Search functionality
- Copy to clipboard
- Error highlighting

## Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/json-explorer.git
cd json-explorer
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm start
```

## Deployment Process

The application uses a two-branch strategy:
- `main` branch for production (www.adtech-toolbox.com)
- `staging` branch for staging (staging.adtech-toolbox.com)

### Deployment Options

1. **Manual Production Deployment**
   ```
   npm run deploy
   ```

2. **Manual Staging Deployment**
   ```
   npm run deploy:staging
   ```

3. **Automated Deployments**
   - Pushing to `staging` branch automatically deploys to staging environment
   - Pushing to `main` branch updates the production environment

## Configuration

- The app is configured with the base path `/json-explorer`
- Routing is handled by React Router with the appropriate base path
- Vercel configuration is in `vercel.json` with proper routes for SPA

## Project Structure

- `src/components/` - React components
- `src/pages/` - Page components for routes
- `public/` - Static assets

## Technologies

- React
- TypeScript
- Tailwind CSS 