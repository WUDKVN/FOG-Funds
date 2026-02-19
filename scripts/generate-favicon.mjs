import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const logoPath = './public/images/vonamawu-logo.png';
const appDir = './app';

async function generateFavicons() {
  try {
    // Generate favicon.ico (32x32) - saved as PNG since browsers accept it
    await sharp(logoPath)
      .resize(32, 32, { fit: 'cover' })
      .png()
      .toFile(`${appDir}/favicon.ico`);
    console.log('Generated favicon.ico (32x32)');

    // Generate icon.png (192x192 for modern browsers)
    await sharp(logoPath)
      .resize(192, 192, { fit: 'cover' })
      .png()
      .toFile(`${appDir}/icon.png`);
    console.log('Generated icon.png (192x192)');

    // Generate apple-icon.png (180x180 for Apple devices)
    await sharp(logoPath)
      .resize(180, 180, { fit: 'cover' })
      .png()
      .toFile(`${appDir}/apple-icon.png`);
    console.log('Generated apple-icon.png (180x180)');

    console.log('All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons();
