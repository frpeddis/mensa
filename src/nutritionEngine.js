import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function getNutrition(dishes, lang = 'it') {
  const prompt = lang === 'en'
    ? `You are an expert nutritionist. For each Italian canteen dish below, provide:
1. The dish name translated to natural English
2. Estimated nutritional values for a standard restaurant portion

Dishes:
${dishes.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Respond ONLY with a valid JSON array, no markdown or extra text:
[{"piatto": "English name", "calorie": 450, "carboidrati_g": 45, "proteine_g": 20, "grassi_g": 15}, ...]

Exactly ${dishes.length} elements, same order.`
    : `Sei un nutrizionista esperto. Per ciascuno dei seguenti piatti da mensa aziendale italiana, stima i valori nutrizionali per una porzione standard da ristorazione.

Piatti:
${dishes.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Rispondi ESCLUSIVAMENTE con un array JSON valido, senza testo aggiuntivo:
[{"piatto": "Nome Piatto", "calorie": 450, "carboidrati_g": 45, "proteine_g": 20, "grassi_g": 15}, ...]

Esattamente ${dishes.length} elementi nello stesso ordine.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim();
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Claude response contains no valid JSON array');

  const parsed = JSON.parse(match[0]);
  if (!Array.isArray(parsed) || parsed.length !== dishes.length) {
    throw new Error('Nutritional array length mismatch');
  }
  return parsed;
}

// Translates dish names from Italian data; reuses nutritional values (cheaper than full re-call)
export async function translateDishes(italianData) {
  const names = italianData.map(item => item.piatto);
  const prompt = `Translate these Italian canteen dish names to natural English. Keep them concise.

${names.map((n, i) => `${i + 1}. ${n}`).join('\n')}

Respond ONLY with a JSON array of translated names, same order:
["name 1", "name 2", ...]`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim();
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Translation response is not valid JSON');

  const translated = JSON.parse(match[0]);
  return italianData.map((item, i) => ({ ...item, piatto: translated[i] || item.piatto }));
}
