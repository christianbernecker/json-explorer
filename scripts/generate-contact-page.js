const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const contactOutputPath = path.join(buildDir, 'contact.html');

// Stelle sicher, dass das Build-Verzeichnis existiert
if (!fs.existsSync(buildDir)) {
  console.error('Build directory not found. Run the build script first.');
  process.exit(1);
}

// HTML-Template für die Kontaktseite, das dem Imprint-Design entspricht
const contactHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact | JSON Explorer & VAST AdTag Tools</title>
  <meta name="description" content="Contact information for the JSON Explorer and VAST AdTag Tools.">
  <link rel="canonical" href="https://www.adtech-toolbox.com/json-explorer/contact">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
</head>
<body class="bg-white text-gray-700 min-h-screen">
  <div class="w-full max-w-6xl mx-auto px-6 py-8">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <div class="mr-3 bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-lg text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-blue-600">Contact Us</h1>
          <div class="text-sm text-gray-500">Get in touch</div>
        </div>
      </div>
      
      <a 
        href="/json-explorer" 
        class="flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
        </svg>
        Back to App
      </a>
    </div>

    <div class="p-6 rounded-lg shadow-sm bg-gray-50">
      <div class="space-y-6">
        <div>
          <p>If you have any questions or feedback regarding the JSON Explorer tools, please feel free to reach out.</p>
          
          <h2 class="text-lg font-semibold mt-6 mb-3 text-gray-700">Contact Information</h2>
          <p>
            <strong>Email:</strong> <a href="mailto:info@adtech-toolbox.com" class="text-blue-600 hover:underline ml-1">
              info@adtech-toolbox.com
            </a>
          </p>
          
          <h2 class="text-lg font-semibold mt-6 mb-3 text-gray-700">GitHub Repository</h2>
          <p>For technical issues, feature requests, or contributions, please visit our GitHub repository:</p>
          <p>
            <a 
              href="https://github.com/christianbernecker/json-explorer" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="text-blue-600 hover:underline"
            >
              JSON Explorer on GitHub
            </a>
          </p>
          <p>You can open an issue for bugs or start a discussion for feature ideas.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

// Schreibe die HTML-Datei
try {
  fs.writeFileSync(contactOutputPath, contactHtml, 'utf8');
  console.log(`Contact page generated successfully at ${contactOutputPath}`);
} catch (err) {
  console.error('Error writing contact page:', err);
  process.exit(1);
} 