import axios from 'axios';
import * as cheerio from 'cheerio';

const MENU_URL = 'https://menuangelini.ear-srl.com/';

// Dishes are shown as "NOME ITALIANO / English name" or "IT1 / IT2 - EN1 / EN2".
// Extracts and title-cases the Italian portion only.
function extractItalianName(fullText) {
  let italianBlock;

  if (fullText.includes(' - ')) {
    // " - " separates the Italian block from the English block
    italianBlock = fullText.split(' - ')[0];
  } else {
    const parts = fullText.split(' / ');
    const allCapsParts = parts.filter(p => {
      const t = p.trim();
      return t.length > 0 && t === t.toUpperCase();
    });

    if (allCapsParts.length < parts.length) {
      // Some parts are mixed-case (English) — keep only all-caps (Italian)
      italianBlock = allCapsParts.join(' / ');
    } else {
      // Everything is all-caps — take the first half (IT options before EN options)
      italianBlock = parts.slice(0, Math.ceil(parts.length / 2)).join(' / ');
    }
  }

  return italianBlock
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

export async function fetchMenu() {
  const response = await axios.get(MENU_URL, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MenuBot/1.0)' },
  });

  const $ = cheerio.load(response.data);
  const dishes = [];

  $('span.piatto-nome').each((_, el) => {
    const fullText = $(el).text().trim();
    if (fullText.length > 3) {
      dishes.push(extractItalianName(fullText));
    }
  });

  if (dishes.length === 0) {
    throw new Error('Nessun piatto trovato nella pagina del menu');
  }

  return [...new Set(dishes)];
}
