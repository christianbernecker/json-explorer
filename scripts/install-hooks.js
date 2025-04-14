/**
 * Git hooks installer script
 * 
 * This script installs custom git hooks to enforce the deployment process
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the git hooks directory
const gitHooksPath = path.resolve('.git', 'hooks');
const scriptsPath = path.resolve('scripts');

// Create hooks directory if it doesn't exist
if (!fs.existsSync(gitHooksPath)) {
  console.log('Creating .git/hooks directory...');
  fs.mkdirSync(gitHooksPath, { recursive: true });
}

// Install the pre-push hook
console.log('Installing pre-push hook...');
const prePushHookPath = path.join(gitHooksPath, 'pre-push');
fs.writeFileSync(
  prePushHookPath,
  `#!/bin/sh
# Store the git command being executed
export GIT_PUSH_COMMAND="$*"
node "${path.join(scriptsPath, 'pre-push-hook.js')}"
`,
  { mode: 0o755 }
);

// Install the pre-commit hook if not already present
console.log('Checking pre-commit hook...');
const preCommitHookPath = path.join(gitHooksPath, 'pre-commit');
if (!fs.existsSync(preCommitHookPath)) {
  console.log('Installing pre-commit hook...');
  fs.writeFileSync(
    preCommitHookPath,
    `#!/bin/sh
node "${path.join(scriptsPath, 'pre-commit-hook.js')}"
`,
    { mode: 0o755 }
  );
}

console.log('Git hooks installed successfully!');
console.log('');
console.log('Hooks installed:');
console.log('- pre-push: reminds about deployment process when pushing to staging or main');
console.log('- pre-commit: updates sitemap dates and runs other checks');
console.log('');
console.log('To use these hooks, make sure to follow the deployment guide in DEPLOYMENT.md'); 