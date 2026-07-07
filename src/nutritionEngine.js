import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function getNutrition(dishes) {
  const prompt = `Sei un nutrizionista esperto. Per ciascuno dei seguenti piatti di un menu da mensa aziendale italiana, stima i valori nutrizionali per una porzione standard da ristorazione.

Piatti:
${dishes.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Rispondi ESCLUSIVAMENTE con un array JSON valido, senza testo aggiuntivo, markdown o backtick. Il formato deve essere esattamente:
[
  {"piatto": "Nome Piatto", "calorie": 450, "carboidrati_g": 45, "proteine_g": 20, "grassi_g": 15},
  ...
]

L'array deve avere esattamente ${dishes.length} elementi nello stesso ordine dei piatti forniti.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim();

  // Estrae il JSON anche se ci sono caratteri extra attorno
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Risposta Claude non contiene un array JSON valido');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (!Array.isArray(parsed) || parsed.length !== dishes.length) {
    throw new Error('Array nutrizionale non corrisponde al numero di piatti');
  }

  return parsed;
}
