const TRANSLATIONS = {
  it: {
    appTitle:   'Menu del Giorno',
    appSubtitle:'Mensa Angelini',
    kcal:       'kcal',
    gCarb:      'g carb',
    gProt:      'g prot',
    gFat:       'g gras',
    carbShort:  'Carb',
    protShort:  'Prot',
    fatShort:   'Grassi',
    carbIcon:   '🌾',
    protIcon:   '💪',
    fatIcon:    '🫒',
    piatto:     'piatto sel.',
    piatti:     'piatti sel.',
    errorTitle: 'Menu non disponibile',
    errorText:  'Impossibile recuperare il menu di oggi. Riprova tra qualche minuto.',
    retryBtn:   'Riprova',
    footerText: 'Valori stimati da AI per porzioni standard da ristorazione.',
    footerSub:  'Non sostituiscono una consulenza nutrizionale professionale.',
  },
  en: {
    appTitle:   "Today's Menu",
    appSubtitle:'Angelini Canteen',
    kcal:       'kcal',
    gCarb:      'g carbs',
    gProt:      'g prot',
    gFat:       'g fat',
    carbShort:  'Carbs',
    protShort:  'Prot',
    fatShort:   'Fat',
    carbIcon:   '🌾',
    protIcon:   '💪',
    fatIcon:    '🫒',
    piatto:     'dish sel.',
    piatti:     'dishes sel.',
    errorTitle: 'Menu unavailable',
    errorText:  "Unable to load today's menu. Please try again in a few minutes.",
    retryBtn:   'Try again',
    footerText: 'Nutritional values estimated by AI for standard restaurant portions.',
    footerSub:  'Not a substitute for professional nutritional advice.',
  },
};

let currentLang = localStorage.getItem('lang') || 'it';
let currentMenu = [];
let selectedIndices = new Set();

function t(key) { return TRANSLATIONS[currentLang][key] ?? TRANSLATIONS.it[key] ?? key; }

// ── i18n ─────────────────────────────────────────────────────────────────────

function applyLang() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = TRANSLATIONS[currentLang][el.dataset.i18n];
    if (val !== undefined) el.textContent = val;
  });
  updateDate();
  document.querySelectorAll('.lang-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.lang === currentLang)
  );
}

function updateDate() {
  const el = document.getElementById('today-date');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString(
    currentLang === 'it' ? 'it-IT' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  );
}

// ── Animations ───────────────────────────────────────────────────────────────

// Slow entrance counter (card load)
function animateNumber(el, target, duration = 950) {
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  }
  requestAnimationFrame(tick);
}

// Fast smooth counter (totals update)
function animateTo(el, newVal, duration = 240) {
  const oldVal = parseInt(el.textContent) || 0;
  if (oldVal === newVal) return;
  const start = performance.now();
  const range = newVal - oldVal;
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(oldVal + range * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = newVal;
  }
  requestAnimationFrame(tick);
}

function popBadge(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

function animateMacroBar(card, carb, prot, fat) {
  const total = (carb + prot + fat) || 1;
  setTimeout(() => {
    const s = (sel, v) => {
      const e = card.querySelector(sel);
      if (e) e.style.width = `${(v / total * 100).toFixed(1)}%`;
    };
    s('.seg-carb', carb);
    s('.seg-prot', prot);
    s('.seg-fat',  fat);
  }, 320);
}

function ripple(card, e) {
  const rect = card.getBoundingClientRect();
  const r = document.createElement('div');
  r.className = 'ripple';
  r.style.left = `${e.clientX - rect.left}px`;
  r.style.top  = `${e.clientY - rect.top}px`;
  card.appendChild(r);
  setTimeout(() => r.remove(), 750);
}

// ── Selection & Totals ────────────────────────────────────────────────────────

function safeNum(n) { return Math.max(0, Math.round(Number(n) || 0)); }

function updateTotals() {
  const count   = selectedIndices.size;
  const visible = count > 0;

  document.getElementById('totals-top').classList.toggle('visible', visible);
  document.getElementById('totals-bottom').classList.toggle('visible', visible);
  document.body.classList.toggle('has-totals-bottom', visible);

  if (!visible) return;

  const tot = { cal: 0, carb: 0, prot: 0, fat: 0 };
  selectedIndices.forEach(i => {
    const item = currentMenu[i];
    if (!item) return;
    tot.cal  += safeNum(item.calorie);
    tot.carb += safeNum(item.carboidrati_g);
    tot.prot += safeNum(item.proteine_g);
    tot.fat  += safeNum(item.grassi_g);
  });

  ['cal', 'carb', 'prot', 'fat'].forEach(k => {
    animateTo(document.getElementById(`ttop-${k}`), tot[k]);
    animateTo(document.getElementById(`tbot-${k}`), tot[k]);
  });

  const topCount = document.getElementById('ttop-count');
  const botCount = document.getElementById('tbot-count');
  if (topCount && topCount.textContent !== String(count)) {
    topCount.textContent = count; popBadge('ttop-count');
  }
  if (botCount && botCount.textContent !== String(count)) {
    botCount.textContent = count; popBadge('tbot-count');
  }

  const label = count === 1 ? t('piatto') : t('piatti');
  const tl = document.getElementById('ttop-label');
  const bl = document.getElementById('tbot-label');
  if (tl) tl.textContent = label;
  if (bl) bl.textContent = label;
}

// ── Card rendering ────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderCard(item, index) {
  const carb = safeNum(item.carboidrati_g);
  const prot = safeNum(item.proteine_g);
  const fat  = safeNum(item.grassi_g);
  const cal  = safeNum(item.calorie);

  const card = document.createElement('div');
  card.className = 'card';
  card.style.animationDelay = `${index * 88}ms`;

  if (selectedIndices.has(index)) card.classList.add('selected');

  card.innerHTML = `
    <div class="card-check">
      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <div class="card-header">
      <span class="dish-name">${escapeHtml(item.piatto)}</span>
      <div class="calorie-badge">
        <span class="cal-icon">🔥</span>
        <span class="cal-value">0</span>
        <span class="cal-unit">${t('kcal')}</span>
      </div>
    </div>
    <div class="macro-bar">
      <div class="macro-bar-segment seg-carb"></div>
      <div class="macro-bar-segment seg-prot"></div>
      <div class="macro-bar-segment seg-fat"></div>
    </div>
    <div class="macro-grid">
      <div class="macro-item carb">
        <span class="macro-icon">${t('carbIcon')}</span>
        <span class="macro-value">${carb}g</span>
        <span class="macro-label">${t('carbShort')}</span>
      </div>
      <div class="macro-item prot">
        <span class="macro-icon">${t('protIcon')}</span>
        <span class="macro-value">${prot}g</span>
        <span class="macro-label">${t('protShort')}</span>
      </div>
      <div class="macro-item fat">
        <span class="macro-icon">${t('fatIcon')}</span>
        <span class="macro-value">${fat}g</span>
        <span class="macro-label">${t('fatShort')}</span>
      </div>
    </div>`;

  return { card, cal, carb, prot, fat };
}

function renderMenu(data) {
  const container = document.getElementById('menu-container');
  container.querySelectorAll('.card').forEach(c => c.remove());

  data.forEach((item, i) => {
    const { card, cal, carb, prot, fat } = renderCard(item, i);
    container.appendChild(card);

    card.addEventListener('click', e => {
      ripple(card, e);
      if (selectedIndices.has(i)) {
        selectedIndices.delete(i);
        card.classList.remove('selected');
      } else {
        selectedIndices.add(i);
        card.classList.add('selected');
      }
      updateTotals();
    });

    requestAnimationFrame(() => {
      card.classList.add('visible');
      const calEl = card.querySelector('.cal-value');
      setTimeout(() => animateNumber(calEl, cal), i * 88 + 180);
      animateMacroBar(card, carb, prot, fat);
    });
  });
}

// ── Skeleton / Error ──────────────────────────────────────────────────────────

function showSkeletons() {
  ['sk1','sk2','sk3'].forEach(id => { const e = document.getElementById(id); if (e) e.style.display = 'block'; });
  document.getElementById('error-screen').classList.remove('visible');
}

function hideSkeletons() {
  ['sk1','sk2','sk3'].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); });
}

function showError() { document.getElementById('error-screen').classList.add('visible'); }

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function loadMenu() {
  const container = document.getElementById('menu-container');

  // Fade out existing cards before replacing
  const existing = [...container.querySelectorAll('.card')];
  if (existing.length) {
    existing.forEach(c => {
      c.style.transition = 'opacity .18s ease, transform .18s ease';
      c.style.opacity = '0';
      c.style.transform = 'scale(0.96)';
    });
    await new Promise(r => setTimeout(r, 200));
  }

  showSkeletons();
  container.querySelectorAll('.card').forEach(c => c.remove());

  // Reset selection & totals on every load
  selectedIndices.clear();
  updateTotals();

  try {
    const res = await fetch(`/api/menu?lang=${currentLang}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    currentMenu = await res.json();
    hideSkeletons();
    renderMenu(currentMenu);
  } catch {
    hideSkeletons();
    showError();
  }
}

// ── Language toggle ───────────────────────────────────────────────────────────

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.lang === currentLang) return;
    currentLang = btn.dataset.lang;
    localStorage.setItem('lang', currentLang);
    applyLang();
    loadMenu(); // full re-fetch with translated dish names
  });
});

// ── Init ──────────────────────────────────────────────────────────────────────

applyLang();
loadMenu();
