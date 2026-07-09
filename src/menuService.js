import { fetchMenu } from './scraper.js';
import { getNutrition, translateDishes } from './nutritionEngine.js';
import { getTodayCache, saveTodayCache } from './cacheManager.js';

export class MenuUnavailableError extends Error {
  constructor(cause) {
    super('Menu non disponibile');
    this.name = 'MenuUnavailableError';
    this.cause = cause;
  }
}

export async function getMenu(lang = 'it') {
  const cached = await getTodayCache(lang);
  if (cached) return cached;

  try {
    if (lang !== 'it') {
      // Reuse Italian data to avoid re-scraping; only translate dish names
      let itData = await getTodayCache('it');
      if (!itData) {
        const dishData = await fetchMenu();
        const names = dishData.map(d => d.nome);
        const nutrition = await getNutrition(names, 'it');
        itData = nutrition.map((item, i) => ({ ...item, categoria: dishData[i]?.categoria || 'altro' }));
        await saveTodayCache(itData, 'it');
      }
      const translated = await translateDishes(itData); // spreads ...item, preserves categoria
      await saveTodayCache(translated, lang);
      return translated;
    }

    const dishData = await fetchMenu();
    const names = dishData.map(d => d.nome);
    const nutrition = await getNutrition(names, 'it');
    const result = nutrition.map((item, i) => ({ ...item, categoria: dishData[i]?.categoria || 'altro' }));
    await saveTodayCache(result, 'it');
    return result;
  } catch (err) {
    throw new MenuUnavailableError(err);
  }
}
