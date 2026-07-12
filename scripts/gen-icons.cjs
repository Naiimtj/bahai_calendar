const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateIcons() {
  const svgFile = path.join(__dirname, '../public/favicon.svg');
  const outDir = path.join(__dirname, '../public/static/icons');

  const svgBuf = fs.readFileSync(svgFile);

  // Render full SVG with white background at 1024×1024
  const rendered1024 = await sharp(svgBuf, { density: 144 })
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255 },
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer();

  const sizes = [1024, 512, 192, 180, 152, 120];
  for (const size of sizes) {
    const outPath = path.join(outDir, `icon-${size}.png`);
    await sharp(rendered1024)
      .resize(size, size, { fit: 'fill' })
      .toFile(outPath);
    console.log(`Generated icon-${size}.png`);
  }
}

generateIcons().catch(console.error);
