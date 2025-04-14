/**
 * Sitemap updater script
 * 
 * This script automatically updates the sitemap.xml file with the current date
 * to ensure search engines always have the most recent information.
 */

const fs = require('fs');
const path = require('path');

// Path to sitemap.xml
const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');

// Check if the sitemap.xml exists
if (!fs.existsSync(sitemapPath)) {
  console.error('❌ sitemap.xml not found at path:', sitemapPath);
  process.exit(1);
}

try {
  // Read the sitemap content
  let sitemapContent = fs.readFileSync(sitemapPath, 'utf8');
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Replace all lastmod dates with the new format that matches the sitemap
  const updatedContent = sitemapContent.replace(
    /<lastmod>([0-9]{4}-[0-9]{2}-[0-9]{2})<\/lastmod>/g,
    `<lastmod>${today}</lastmod>`
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(sitemapPath, updatedContent, 'utf8');
  
  console.log(`✅ Sitemap updated with date: ${today}`);
} catch (error) {
  console.error('❌ Error updating sitemap:', error.message);
  process.exit(1);
} 