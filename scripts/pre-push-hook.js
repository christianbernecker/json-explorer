/**
 * Pre-push hook script
 * This script checks if you're pushing to staging or main branches
 * and reminds you to follow the deployment process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the current branch
function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (error) {
    console.error('Error getting current branch:', error.message);
    return '';
  }
}

// Get the target branch (where we're pushing to)
function getTargetBranch() {
  // The pre-push hook receives the target remote and URL as args
  // We can extract the branch from the git command being executed
  try {
    const gitCommand = process.env.GIT_PUSH_COMMAND || '';
    const match = gitCommand.match(/push\s+[^\s]+\s+([^\s:]+)/);
    return match ? match[1] : '';
  } catch (error) {
    return '';
  }
}

// Main function
function main() {
  const currentBranch = getCurrentBranch();
  const targetBranch = getTargetBranch() || currentBranch;
  
  // Check if we're pushing to staging or main
  if (targetBranch === 'staging' || targetBranch === 'main') {
    console.log('\x1b[33m%s\x1b[0m', '⚠️  DEPLOYMENT GUIDE REMINDER');
    console.log('\x1b[36m%s\x1b[0m', '-------------------------------------------');
    console.log('\x1b[37m%s\x1b[0m', 'You are pushing to the ' + targetBranch + ' branch.');
    console.log('\x1b[37m%s\x1b[0m', 'Please ensure you have read the DEPLOYMENT.md guide');
    console.log('\x1b[37m%s\x1b[0m', 'and are following the proper deployment process.');
    
    if (targetBranch === 'main') {
      console.log('\x1b[31m%s\x1b[0m', '⚠️  PRODUCTION DEPLOYMENT ALERT');
      console.log('\x1b[37m%s\x1b[0m', 'You are pushing directly to the production branch!');
      console.log('\x1b[37m%s\x1b[0m', 'The recommended way is to use ./deploy-prod.sh');
    } else {
      console.log('\x1b[37m%s\x1b[0m', 'For staging deployment, use ./deploy-staging.sh');
    }
    
    console.log('\x1b[36m%s\x1b[0m', '-------------------------------------------');
  }
  
  // Always allow the push to proceed
  process.exit(0);
}

main(); 