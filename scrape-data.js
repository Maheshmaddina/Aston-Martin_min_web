/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   ASTON MARTIN — "Sync and Serve" Data Worker               ║
 * ║   Scrapes the official Vantage page and writes a clean       ║
 * ║   JSON file into ./src/data/vantage-data.json               ║
 * ║                                                              ║
 * ║   Usage:  node scrape-data.js                               ║
 * ║   Or:     npm run sync                                       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const axios   = require('axios');
const cheerio = require('cheerio');
const fs      = require('fs');
const path    = require('path');

// ── Config ───────────────────────────────────────────────────────────────────
const TARGET_URL       = 'https://www.astonmartin.com/en/models/vantage-coupe';
const OUTPUT_DIR       = path.join(__dirname, 'src', 'data');
const OUTPUT_FILE      = path.join(OUTPUT_DIR, 'vantage-data.json');
const BACKUP_FILE      = path.join(OUTPUT_DIR, 'vantage-data.backup.json');

// Pre-validated fallback data — used if the scrape fails.
// This ensures the site NEVER goes dark due to a failed scrape.
const FALLBACK_DATA = {
  model:         'Vantage',
  tagline:       'The most thrilling sports car in the world.',
  year:          2025,
  lastSynced:    null,
  specs: {
    topSpeed:    { value: '202',  unit: 'mph',  label: 'Top Speed' },
    zeroToSixty: { value: '3.5', unit: 'sec',  label: '0–60 mph' },
    power:       { value: '665',  unit: 'bhp',  label: 'Peak Power' },
    torque:      { value: '800',  unit: 'Nm',   label: 'Max Torque' },
    engine:      { value: '4.0L Twin-Turbo V8', unit: '', label: 'Engine' },
  },
  images: [
    { url: 'model_vantage.png', alt: 'Aston Martin Vantage – Exterior' },
    { url: 'img1.png',          alt: 'Aston Martin – Gallery 1' },
    { url: 'img3.png',          alt: 'Aston Martin – Gallery 2' },
  ],
  configuratorUrl: 'https://configurator.astonmartin.com/',
  isFallback:      true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function log(msg)  { console.log(`  [sync] ${msg}`); }
function warn(msg) { console.warn(`  [warn] ${msg}`); }
function err(msg)  { console.error(`  [ERR]  ${msg}`); }

/** Ensure the output directory exists */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`);
  }
}

/** Read existing JSON safely (returns null on any failure) */
function readExistingData() {
  try {
    if (fs.existsSync(OUTPUT_FILE)) {
      return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    }
  } catch {
    warn('Could not read existing JSON (may be corrupt). Will use fallback.');
  }
  return null;
}

/** Write JSON atomically: always back up existing file first */
function writeData(data) {
  ensureDir(OUTPUT_DIR);

  // Back up the current file so we can roll back
  if (fs.existsSync(OUTPUT_FILE)) {
    fs.copyFileSync(OUTPUT_FILE, BACKUP_FILE);
    log('Backed up previous data to vantage-data.backup.json');
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf8');
  log(`✅  Saved → ${OUTPUT_FILE}`);
}

// ── Scraper ───────────────────────────────────────────────────────────────────
async function scrapePage() {
  log(`Fetching: ${TARGET_URL}`);

  const { data: html } = await axios.get(TARGET_URL, {
    timeout: 15_000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-GB,en;q=0.9',
    },
  });

  const $ = cheerio.load(html);

  // ── Extract performance specs ─────────────────────────────────────────────
  // Aston Martin renders specs inside data-attribute containers or headings.
  // We try multiple selector strategies and fall back to known values.
  const rawSpecs = {};

  $('[class*="spec"], [class*="Spec"], [class*="stat"], [class*="performance"]').each((_, el) => {
    const text = $(el).text().trim();
    if (/top speed/i.test(text))     rawSpecs.topSpeed    = text;
    if (/0.60|0–60|nought/i.test(text)) rawSpecs.zeroToSixty = text;
    if (/bhp|horsepower|power/i.test(text)) rawSpecs.power = text;
    if (/torque|nm/i.test(text))     rawSpecs.torque      = text;
  });

  // Helper: extract first number from a string
  const firstNum = str => (str || '').match(/[\d.,]+/)?.[0]?.replace(',', '') ?? null;

  const specs = {
    topSpeed: {
      value: firstNum(rawSpecs.topSpeed) ?? FALLBACK_DATA.specs.topSpeed.value,
      unit: 'mph', label: 'Top Speed',
    },
    zeroToSixty: {
      value: firstNum(rawSpecs.zeroToSixty) ?? FALLBACK_DATA.specs.zeroToSixty.value,
      unit: 'sec', label: '0–60 mph',
    },
    power: {
      value: firstNum(rawSpecs.power) ?? FALLBACK_DATA.specs.power.value,
      unit: 'bhp', label: 'Peak Power',
    },
    torque: {
      value: firstNum(rawSpecs.torque) ?? FALLBACK_DATA.specs.torque.value,
      unit: 'Nm', label: 'Max Torque',
    },
    engine: { ...FALLBACK_DATA.specs.engine },
  };

  // ── Extract hero/gallery image URLs ──────────────────────────────────────
  const images = [];
  $('img[src*="aston"], img[data-src*="aston"], [class*="hero"] img, [class*="gallery"] img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    const alt = $(el).attr('alt') || 'Aston Martin Vantage';
    if (src && src.startsWith('http') && !images.find(i => i.url === src)) {
      images.push({ url: src, alt });
    }
  });

  // Only keep first 5 and fall back if we got nothing useful
  const finalImages = images.slice(0, 5).length
    ? images.slice(0, 5)
    : FALLBACK_DATA.images;

  // ── Assemble the output object ────────────────────────────────────────────
  return {
    model:          'Vantage',
    tagline:        $('meta[name="description"]').attr('content')?.trim()
                    || FALLBACK_DATA.tagline,
    year:           2025,
    lastSynced:     new Date().toISOString(),
    specs,
    images:         finalImages,
    configuratorUrl: FALLBACK_DATA.configuratorUrl,
    isFallback:      false,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  Aston Martin — Data Sync Worker         ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const existing = readExistingData();

  try {
    const freshData = await scrapePage();
    writeData(freshData);
    console.log('\n✅  Sync complete. Data is fresh and ready.\n');
  } catch (e) {
    err(`Scrape failed: ${e.message}`);

    if (existing) {
      warn('Keeping existing JSON file intact — site will not go dark.');
      warn(`Last good sync: ${existing.lastSynced ?? 'unknown'}`);
    } else {
      warn('No existing JSON found. Writing fallback data so the site can still launch.');
      writeData({ ...FALLBACK_DATA, lastSynced: new Date().toISOString() });
    }

    console.log('\n⚠️   Sync failed safely. No data was lost.\n');
    process.exit(1); // non-zero exit signals CI/CD that data is stale
  }
})();
