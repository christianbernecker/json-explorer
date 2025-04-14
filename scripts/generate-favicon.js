const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

console.log('Generating favicon assets...');

const inputSvg = path.join(__dirname, '../public/img/favicon.svg');

// Check if SVG exists
if (!fs.existsSync(inputSvg)) {
  console.error('SVG file does not exist:', inputSvg);
  process.exit(1);
}

// Generate PNGs for different sizes
const outputPng192 = path.join(__dirname, '../public/logo192.png');
const outputPng512 = path.join(__dirname, '../public/logo512.png');

// Generate favicons in different sizes
const faviconSizes = [16, 32, 48, 64];
const faviconDir = path.join(__dirname, '../public/img/favicons');

// Create favicons directory if it doesn't exist
if (!fs.existsSync(faviconDir)) {
  fs.mkdirSync(faviconDir, { recursive: true });
}

// Generate PNG favicons in various sizes
Promise.all(
  faviconSizes.map((size) => {
    const outputPath = path.join(faviconDir, `favicon-${size}x${size}.png`);
    return sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(outputPath)
      .then(() => {
        console.log(`✅ favicon-${size}x${size}.png generated!`);
        return { size, path: outputPath };
      })
      .catch((error) => {
        console.error(`Error generating favicon-${size}x${size}.png:`, error);
        return null;
      });
  })
)
  .then(() => {
    console.log('✅ All favicon sizes generated!');
    console.log('Please use a tool like https://www.favicon-generator.org/ to create the final favicon.ico');
  })
  .catch((error) => {
    console.error('Error generating favicons:', error);
  });

// Generate 192x192 PNG
sharp(inputSvg)
  .resize(192, 192)
  .png()
  .toFile(outputPng192)
  .then(() => {
    console.log('✅ logo192.png generated!');
  })
  .catch((error) => {
    console.error('Error generating logo192.png:', error);
  });

// Generate 512x512 PNG
sharp(inputSvg)
  .resize(512, 512)
  .png()
  .toFile(outputPng512)
  .then(() => {
    console.log('✅ logo512.png generated!');
  })
  .catch((error) => {
    console.error('Error generating logo512.png:', error);
  }); 