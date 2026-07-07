import 'dotenv/config';
import express from 'express';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMenu, MenuUnavailableError } from './src/menuService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/menu', async (req, res) => {
  const lang = ['it', 'en'].includes(req.query.lang) ? req.query.lang : 'it';
  try {
    const menu = await getMenu(lang);
    res.json(menu);
  } catch (err) {
    if (err instanceof MenuUnavailableError) {
      console.error('[menu] Non disponibile:', err.cause?.message ?? err.message);
      res.status(503).json({ error: 'unavailable' });
    } else {
      console.error('[menu] Errore inatteso:', err);
      res.status(500).json({ error: 'internal' });
    }
  }
});

// Pre-fetch both languages at 08:00
cron.schedule('0 8 * * *', async () => {
  console.log('[cron] Pre-fetch menu mattutino IT+EN...');
  try {
    await getMenu('it');
    await getMenu('en');
    console.log('[cron] Menu aggiornati');
  } catch (err) {
    console.error('[cron] Pre-fetch fallito:', err.message);
  }
});

app.listen(PORT, () => console.log(`Server avviato su http://localhost:${PORT}`));
