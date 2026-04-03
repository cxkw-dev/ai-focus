const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sourcePath = path.join(__dirname, '../public/icon-source.png')
const publicDir = path.join(__dirname, '../public')

async function generateIcons() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error('Missing icon source at public/icon-source.png')
  }

  const sourceBuffer = fs.readFileSync(sourcePath)

  // All icons - resize to fill full canvas (no padding)
  // macOS applies its own rounded mask for dock icons
  const icons = [
    { size: 512, name: 'icon-512.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 48, name: 'favicon-48.png' },
    { size: 32, name: 'favicon.png' },
  ]

  for (const { size, name } of icons) {
    await sharp(sourceBuffer)
      .resize(size, size, {
        kernel: 'lanczos3',
        fit: 'cover',
      })
      .png()
      .toFile(path.join(publicDir, name))

    console.log(`✓ Generated ${name} (${size}x${size})`)
  }

  // Generate favicon.ico
  await sharp(sourceBuffer)
    .resize(32, 32, {
      kernel: 'lanczos3',
      fit: 'cover',
    })
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'))

  console.log('✓ Generated favicon.ico (32x32)')
  console.log('\n✨ All icons generated successfully!')
}

generateIcons().catch(console.error)
