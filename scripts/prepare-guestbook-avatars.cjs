/** Web delivery only: preserve the complete artwork and alpha, export a 512px WebP.
 * Optional build dependency: sharp. The Node server does not need it.
 * Use TERRAMAP_SHARP_PATH to point to an existing installation if necessary.
 */
const sharp = require(process.env.TERRAMAP_SHARP_PATH || 'sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const ids = ['amiya', 'kaltsit', 'chen', 'texas', 'exusiai', 'skadi', 'silverash', 'surtr', 'eyjafjalla', 'w'];
(async () => {
  for (const id of ids) {
    const source = path.join(root, 'material/guestbook-art-v2', `avatar-${id}.png`);
    const output = path.join(root, 'dist/assets/guestbook', `avatar-${id}.webp`);
    await sharp(source).resize({width: 512, height: 512, fit: 'inside', withoutEnlargement: true})
      .webp({quality: 90, alphaQuality: 100, effort: 6}).toFile(output);
    const stats = await fs.stat(output);
    console.log(`${id}: ${Math.round(stats.size / 1024)} KiB`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
