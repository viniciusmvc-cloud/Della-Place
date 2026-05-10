import sharp from 'sharp';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'public/icons/dellapace-icon.png');
const OUT = path.join(ROOT, 'public/icons/dellapace-admin-icon.png');

const SIZE = 1024;
const BADGE_W = 520;
const BADGE_H = 140;
const BADGE_X = (SIZE - BADGE_W) / 2;
const BADGE_Y = SIZE - BADGE_H - 60;

const badgeSvg = Buffer.from(`
<svg width="${BADGE_W}" height="${BADGE_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E8C77A"/>
      <stop offset="100%" stop-color="#B8923E"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect x="6" y="6" width="${BADGE_W - 12}" height="${BADGE_H - 12}"
        rx="${(BADGE_H - 12) / 2}" ry="${(BADGE_H - 12) / 2}"
        fill="url(#gold)"
        stroke="#0F1C2F" stroke-width="6"
        filter="url(#shadow)"/>
  <text x="50%" y="50%"
        text-anchor="middle" dominant-baseline="central"
        font-family="Helvetica, Arial, sans-serif"
        font-size="78"
        font-weight="900"
        letter-spacing="14"
        fill="#0F1C2F">ADMIN</text>
</svg>
`);

await sharp(SRC)
  .composite([{
    input: badgeSvg,
    top: Math.round(BADGE_Y),
    left: Math.round(BADGE_X),
  }])
  .png()
  .toFile(OUT);

console.log('OK:', OUT);
