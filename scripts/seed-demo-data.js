const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const API = 'http://localhost:3001';
const TOTAL = 100;

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const jwtSecret = envContent.match(/^JWT_SECRET=(.*)$/m)[1].trim();
const token = jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: '1h' });

function crc32(buf) {
  if (!crc32.table) {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
      table[n] = c >>> 0;
    }
    crc32.table = table;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crc32.table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(width, height, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2;
  const ihdr = chunk('IHDR', ihdrData);

  const rowBytes = width * 3;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowBytes + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }
  const idat = chunk('IDAT', zlib.deflateSync(raw));
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

const COLORS = {
  boy: [[125, 168, 201], [100, 149, 190], [80, 130, 180]],
  girl: [[232, 146, 124], [240, 170, 150], [220, 120, 140]],
  unisex: [[184, 215, 190], [210, 200, 150], [230, 210, 160]],
};

const TYPES = ['bodysuit', 'winter_suit', 'sweatshirt', 'tshirt', 'shorts', 'pants'];
const TYPE_LABELS = {
  bodysuit: 'Комбинезон',
  winter_suit: 'Зимний комбинезон',
  sweatshirt: 'Кофта',
  tshirt: 'Футболка',
  shorts: 'Шорты',
  pants: 'Штаны',
};
const CONDITIONS = ['new', 'like_new', 'used'];
const GENDERS = ['boy', 'girl', 'unisex'];
const SEASONS = ['summer', 'winter', 'demi', 'all'];
const SIZES = [56, 62, 68, 74, 80, 86, 92, 98, 104, 110, 116, 122, 128, 134, 140, 146, 152];
const BRANDS = ['H&M', 'Zara Baby', 'Mothercare', "Carter's", 'Reima', 'Lupilu', 'Cool Club', 'Bembi', 'Little Mania', null, null];
const ADJ = ['тёплый', 'лёгкий', 'нарядный', 'повседневный', 'мягкий', 'яркий', 'стильный', 'практичный'];
const PRINTS = ['с мишками', 'в горошек', 'с динозаврами', 'однотонный', 'в полоску', 'с цветочным принтом', 'со звёздами'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function ageRangeForSize(size) {
  if (size <= 62) return '0-3 месяца';
  if (size <= 74) return '3-9 месяцев';
  if (size <= 86) return '9-18 месяцев';
  if (size <= 98) return '1.5-3 года';
  if (size <= 116) return '3-5 лет';
  if (size <= 134) return '5-8 лет';
  return '8-12 лет';
}

async function createProduct(i) {
  const type = pick(TYPES);
  const gender = pick(GENDERS);
  const size = pick(SIZES);
  const condition = pick(CONDITIONS);
  const season = pick(SEASONS);
  const brand = pick(BRANDS);
  const price = randInt(8, 75);
  const originalPrice = Math.random() < 0.3 ? price + randInt(5, 25) : undefined;

  const dto = {
    name: `${TYPE_LABELS[type]} ${pick(ADJ)}${brand ? ' ' + brand : ''}`,
    description: Math.random() < 0.6 ? `${pick(PRINTS)}.` : undefined,
    price,
    originalPrice,
    type,
    condition,
    gender,
    season,
    size,
    ageRange: ageRangeForSize(size),
    brand: brand || undefined,
  };

  const res = await fetch(`${API}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    console.error(`\ncreate #${i} failed:`, await res.text());
    return null;
  }
  const product = await res.json();

  const palette = COLORS[gender];
  const imageCount = randInt(1, 3);
  for (let k = 0; k < imageCount; k++) {
    const png = makePng(600, 600, palette[k % palette.length]);
    const form = new FormData();
    form.append('image', new Blob([png], { type: 'image/png' }), `product-${i}-${k}.png`);
    const uploadRes = await fetch(`${API}/products/${product.id}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!uploadRes.ok) console.error(`\nupload #${i}/${k} failed:`, await uploadRes.text());
  }

  return product;
}

async function main() {
  for (let i = 0; i < TOTAL; i++) {
    await createProduct(i);
    process.stdout.write(`\r${i + 1}/${TOTAL} товаров создано`);
  }
  console.log('\nГотово.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
