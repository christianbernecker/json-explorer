/**
 * Pre-commit hook script
 * This script automatically runs before each commit
 * to ensure the sitemap is up to date
 */

console.log('Running pre-commit hook...');

// Run the sitemap update script
try {
  require('./update-sitemap.js');
  console.log('Pre-commit hook completed successfully.');
  process.exit(0);
} catch (error) {
  console.error('Error in pre-commit hook:', error.message);
  process.exit(1);
} 