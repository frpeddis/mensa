import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, '..', 'cache');

function todayKey() {
  // Usa il timezone Europe/Rome per determinare la data del giorno
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' }); // formato YYYY-MM-DD
}

function cachePath() {
  return path.join(CACHE_DIR, `${todayKey()}.json`);
}

export async function getTodayCache() {
  try {
    const raw = await fs.readFile(cachePath(), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveTodayCache(data) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(cachePath(), JSON.stringify(data, null, 2), 'utf-8');
}
