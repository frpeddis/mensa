import axios from 'axios';
import * as cheerio from 'cheerio';

const MENU_URL = 'https://menuangelini.ear-srl.com/';

// Dishes appear as "NOME ITALIANO / English name" or "IT1 / IT2 - EN1 / EN2".
// Extracts and title-cases the Italian portion only.
function extractItalianName(fullText) {
  let italianBlock;

  if (fullText.includes(' - ')) {
    italianBlock = fullText.split(' - ')[0];
  } else {
    const parts = fullText.split(' / ');
    const allCapsParts = parts.filter(p => {
      const t = p.trim();
      return t.length > 0 && t === t.toUpperCase();
    });

    if (allCapsParts.length < parts.length) {
      italianBlock = allCapsParts.join(' / ');
    } else {
      italianBlock = parts.slice(0, Math.ceil(parts.length / 2)).join(' / ');
    }
  }

  return italianBlock
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function normalizeCategory(text) {
  const t = text.toLowerCase().trim();
  if (t === 'primi') return 'primi';
  if (t === 'secondi') return 'secondi';
  if (t.includes('contorn')) return 'contorni';
  return null;
}

export async function fetchMenu() {
  const response = await axios.get(MENU_URL, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MenuBot/1.0)' },
  });

  const $ = cheerio.load(response.data);
  const dishes = [];

  // Each section header (.bg-success-subtle) is immediately followed by a div
  // containing the ul.list-group of dishes for that course.
  $('.bg-success-subtle').each((_, sectionEl) => {
    const categoria = normalizeCategory($(sectionEl).text().trim());
    if (!categoria) return;

    $(sectionEl).next('div').find('span.piatto-nome').each((_, el) => {
      const fullText = $(el).text().trim();
      if (fullText.length > 3) {
        dishes.push({ nome: extractItalianName(fullText), categoria });
      }
    });
  });

  // Fallback: scrape all piatto-nome without category info
  if (dishes.length === 0) {
    $('span.piatto-nome').each((_, el) => {
      const fullText = $(el).text().trim();
      if (fullText.length > 3) {
        dishes.push({ nome: extractItalianName(fullText), categoria: 'altro' });
      }
    });
  }

  if (dishes.length === 0) {
    throw new Error('Nessun piatto trovato nella pagina del menu');
  }

  return dishes;
}
