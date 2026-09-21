// Generates responsive WebP variants of the supplied renders.
//   node scripts/optimize-images.mjs
// Sources stay untouched in /public/assets. Output goes to /public/assets/img.
// To add a picture: drop it in /public/assets, add a line to SOURCES, register it in src/config/assets.ts.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'public/assets';
const OUT = 'public/assets/img';

const SOURCES = {
  'shutter-off': 'bike-front-shutter-off.jpg',
  'shutter-on': 'bike-front-shutter-on.jpg',
  front: 'bike-frontview.jpg',
  side: 'bike-side-view.jpg',
  'three-quarter': 'bike-slightly-side-view-with-background.jpg',
  brutalist: 'img/brutalist.jpg',
  'wet-concrete': 'img/wet-concrete.jpg',
  'black-studio': 'img/black-studio.jpg',
  // The exploded views are intentionally NOT processed (creative brief: no exploded view).
};

const WIDTHS = [800, 1400];

await mkdir(OUT, { recursive: true });
for (const [key, file] of Object.entries(SOURCES)) {
  const { width } = await sharp(path.join(SRC, file)).metadata();
  for (const w of [...WIDTHS, width]) {
    const out = path.join(OUT, `${key}-${w}.webp`);
    const info = await sharp(path.join(SRC, file))
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: w === width ? 84 : 78, effort: 5 })
      .toFile(out);
    console.log(out.padEnd(44), `${(info.size / 1024).toFixed(0)} KB`);
  }
}
