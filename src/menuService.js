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
        const dishes = await fetchMenu();
        itData = await getNutrition(dishes, 'it');
        await saveTodayCache(itData, 'it');
      }
      const translated = await translateDishes(itData);
      await saveTodayCache(translated, lang);
      return translated;
    }

    const dishes = await fetchMenu();
    const nutrition = await getNutrition(dishes, 'it');
    await saveTodayCache(nutrition, 'it');
    return nutrition;
  } catch (err) {
    throw new MenuUnavailableError(err);
  }
}
