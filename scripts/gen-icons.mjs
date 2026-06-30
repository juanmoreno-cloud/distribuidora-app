// Genera íconos PNG de la PWA (camión blanco sobre fondo azul de marca)
// sin dependencias externas: dibuja los píxeles a mano y los codifica como PNG.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

const AZUL = [66, 133, 244];
const BLANCO = [255, 255, 255];

// Tabla CRC para PNG
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function generar(size, archivo) {
  const px = (x, y, c) => { const o = y * (size * 4 + 1) + 1 + x * 4; raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2]; raw[o + 3] = 255; };
  // scanlines con byte de filtro (0) al inicio de cada fila
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const r = size * 0.18; // radio esquinas
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Esquinas redondeadas: fuera del radio => transparente (lo dejamos azul igual, simple)
      let dentro = true;
      const cx = Math.min(x, size - 1 - x), cy = Math.min(y, size - 1 - y);
      if (cx < r && cy < r) {
        const dx = r - cx, dy = r - cy;
        if (dx * dx + dy * dy > r * r) dentro = false;
      }
      if (!dentro) { px(x, y, AZUL); continue; }
      px(x, y, AZUL);
    }
  }
  // Camión blanco simple (rectángulos)
  const s = size / 512;
  const rect = (x0, y0, w, h, c) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++)
      if (x >= 0 && x < size && y >= 0 && y < size) px(x, y, c);
  };
  rect(Math.round(110 * s), Math.round(200 * s), Math.round(180 * s), Math.round(120 * s), BLANCO); // caja
  rect(Math.round(290 * s), Math.round(240 * s), Math.round(110 * s), Math.round(80 * s), BLANCO);  // cabina
  // ruedas (círculos)
  const circ = (cx, cy, rad, c) => {
    for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++)
      if (x * x + y * y <= rad * rad) px(cx + x, cy + y, c);
  };
  circ(Math.round(170 * s), Math.round(340 * s), Math.round(28 * s), BLANCO);
  circ(Math.round(340 * s), Math.round(340 * s), Math.round(28 * s), BLANCO);
  circ(Math.round(170 * s), Math.round(340 * s), Math.round(12 * s), AZUL);
  circ(Math.round(340 * s), Math.round(340 * s), Math.round(12 * s), AZUL);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  writeFileSync(join(OUT, archivo), png);
  console.log('Generado', archivo, size + 'x' + size, png.length + ' bytes');
}

generar(192, 'icon-192.png');
generar(512, 'icon-512.png');
