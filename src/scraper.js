import axios from 'axios';
import * as cheerio from 'cheerio';

const MENU_URL = 'https://menuangelini.ear-srl.com/';

export async function fetchMenu() {
  const response = await axios.get(MENU_URL, {
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MenuBot/1.0)' },
  });

  const $ = cheerio.load(response.data);
  const dishes = [];

  // Estrae tutti i testi dei piatti mantenendo l'ordine della pagina.
  // I selettori coprono le strutture più comuni dei menu web (lista, tabella, paragrafi dedicati).
  $('li, td, .piatto, .dish, .menu-item, .food-item').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 3 && text.length < 200) {
      dishes.push(text);
    }
  });

  // Fallback: se i selettori specifici non trovano nulla, usa tutti i paragrafi
  if (dishes.length === 0) {
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 3 && text.length < 200) {
        dishes.push(text);
      }
    });
  }

  if (dishes.length === 0) {
    throw new Error('Nessun piatto trovato nella pagina del menu');
  }

  return [...new Set(dishes)]; // rimuove duplicati mantenendo l'ordine
}
