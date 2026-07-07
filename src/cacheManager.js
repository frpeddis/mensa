import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '..', 'cache');

function todayKey() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
}

export async function getTodayCache(lang = 'it') {
  // Try lang-specific file first
  try {
    const raw = await fs.readFile(path.join(CACHE_DIR, `${todayKey()}-${lang}.json`), 'utf-8');
    return JSON.parse(raw);
  } catch {}

  // Backwards compat: old format without lang suffix (Italian only)
  if (lang === 'it') {
    try {
      const raw = await fs.readFile(path.join(CACHE_DIR, `${todayKey()}.json`), 'utf-8');
      return JSON.parse(raw);
    } catch {}
  }

  return null;
}

export async function saveTodayCache(data, lang = 'it') {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(
    path.join(CACHE_DIR, `${todayKey()}-${lang}.json`),
    JSON.stringify(data, null, 2),
    'utf-8'
  );
}
