const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const staticCssDir = path.join(buildDir, 'static', 'css');
const contactHtmlPath = path.join(buildDir, 'contact.html');
const placeholder = '<!-- CSS_PATH_PLACEHOLDER -->';

// 1. Finde die Haupt-CSS-Datei
let cssFileName = '';
try {
  const files = fs.readdirSync(staticCssDir);
  cssFileName = files.find(file => file.startsWith('main.') && file.endsWith('.css'));
} catch (err) {
  console.error('Error finding CSS file:', err);
  process.exit(1);
}

if (!cssFileName) {
  console.error('Could not find main.*.css file in', staticCssDir);
  process.exit(1);
}

const cssPath = `/static/css/${cssFileName}`;
const cssLinkTag = `<link rel="stylesheet" href="${cssPath}">`;

console.log(`Found CSS file: ${cssPath}`);
console.log(`Injecting into: ${contactHtmlPath}`);

// 2. Lese contact.html aus dem build-Ordner
let htmlContent = '';
try {
  htmlContent = fs.readFileSync(contactHtmlPath, 'utf8');
} catch (err) {
  console.error(`Error reading ${contactHtmlPath}:`, err);
  process.exit(1);
}

// 3. Ersetze den Platzhalter
const newHtmlContent = htmlContent.replace(placeholder, cssLinkTag);

if (newHtmlContent === htmlContent) {
    console.warn(`Placeholder "${placeholder}" not found in ${contactHtmlPath}. CSS link not injected.`);
} else {
    // 4. Schreibe die geänderte Datei zurück
    try {
      fs.writeFileSync(contactHtmlPath, newHtmlContent, 'utf8');
      console.log(`Successfully injected CSS link into ${contactHtmlPath}`);
    } catch (err) {
      console.error(`Error writing ${contactHtmlPath}:`, err);
      process.exit(1);
    }
} 