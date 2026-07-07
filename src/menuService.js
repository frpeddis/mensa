import { fetchMenu } from './scraper.js';
import { getNutrition } from './nutritionEngine.js';
import { getTodayCache, saveTodayCache } from './cacheManager.js';

export class MenuUnavailableError extends Error {
  constructor(cause) {
    super('Menu non disponibile');
    this.name = 'MenuUnavailableError';
    this.cause = cause;
  }
}

export async function getMenu() {
  const cached = await getTodayCache();
  if (cached) return cached;

  try {
    const dishes = await fetchMenu();
    const nutrition = await getNutrition(dishes);
    await saveTodayCache(nutrition);
    return nutrition;
  } catch (err) {
    throw new MenuUnavailableError(err);
  }
}
