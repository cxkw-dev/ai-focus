const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/icon.svg');
const publicDir = path.join(__dirname, '../public');

// Dark background color matching app theme
const darkBg = { r: 10, g: 10, b: 11, alpha: 1 }; // #0A0A0B
const transparentBg = { r: 0, g: 0, b: 0, alpha: 0 };

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  // PWA icons with dark background and padding (smaller icon appearance)
  const pwaIcons = [
    { size: 192, iconSize: 128, name: 'icon-192.png' },
    { size: 512, iconSize: 340, name: 'icon-512.png' },
    { size: 180, iconSize: 120, name: 'apple-touch-icon.png' },
  ];

  for (const { size, iconSize, name } of pwaIcons) {
    // Create icon at smaller size
    const iconBuffer = await sharp(svgBuffer)
      .resize(iconSize, iconSize, {
        kernel: 'nearest',
        fit: 'contain',
        background: transparentBg
      })
      .png()
      .toBuffer();

    // Composite on dark background with padding
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: darkBg
      }
    })
      .composite([{ input: iconBuffer, gravity: 'center' }])
      .png()
      .toFile(path.join(publicDir, name));
    
    console.log(`✓ Generated ${name} (${size}x${size} with ${iconSize}px icon)`);
  }

  // Browser favicons - keep transparent and full size
  const faviconSizes = [
    { size: 48, name: 'favicon-48.png' },
    { size: 32, name: 'favicon.png' },
  ];

  for (const { size, name } of faviconSizes) {
    await sharp(svgBuffer)
      .resize(size, size, {
        kernel: 'nearest',
        fit: 'contain',
        background: transparentBg
      })
      .png()
      .toFile(path.join(publicDir, name));
    
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  // Generate favicon.ico
  await sharp(svgBuffer)
    .resize(32, 32, {
      kernel: 'nearest',
      fit: 'contain',
      background: transparentBg
    })
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  
  console.log('✓ Generated favicon.ico (32x32)');
  console.log('\n✨ All icons generated successfully!');
}

generateIcons().catch(console.error);
