const TRANSLATIONS = {
  it: {
    appTitle:   'Menu del Giorno',
    appSubtitle:'Mensa Angelini',
    kcalLabel:  'kcal',
    carbShort:  'Carb',
    protShort:  'Prot',
    fatShort:   'Grassi',
    carbIcon:   '🌾',
    protIcon:   '💪',
    fatIcon:    '🫒',
    errorTitle: 'Menu non disponibile',
    errorText:  'Impossibile recuperare il menu di oggi. Riprova tra qualche minuto.',
    retryBtn:   'Riprova',
    footerText: 'Valori stimati da AI per porzioni standard da ristorazione.',
    footerSub:  'Non sostituiscono una consulenza nutrizionale professionale.',
  },
  en: {
    appTitle:   "Today's Menu",
    appSubtitle:'Angelini Canteen',
    kcalLabel:  'kcal',
    carbShort:  'Carbs',
    protShort:  'Prot',
    fatShort:   'Fat',
    carbIcon:   '🌾',
    protIcon:   '💪',
    fatIcon:    '🫒',
    errorTitle: 'Menu unavailable',
    errorText:  "Unable to load today's menu. Please try again in a few minutes.",
    retryBtn:   'Try again',
    footerText: 'Nutritional values estimated by AI for standard restaurant portions.',
    footerSub:  'Not a substitute for professional nutritional advice.',
  },
};

let currentLang = localStorage.getItem('lang') || 'it';

function t(key) {
  return TRANSLATIONS[currentLang][key] ?? TRANSLATIONS.it[key] ?? key;
}

// ── i18n ──────────────────────────────────────────────────

function applyLang() {
  document.documentElement.lang = currentLang;

  // Static elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = TRANSLATIONS[currentLang][el.dataset.i18n];
    if (val !== undefined) el.textContent = val;
  });

  updateDate();

  // Sync lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.lang === currentLang)
  );

  // Update labels inside already-rendered cards (no re-render needed)
  document.querySelectorAll('.macro-item.carb .macro-label').forEach(el => el.textContent = t('carbShort'));
  document.querySelectorAll('.macro-item.prot .macro-label').forEach(el => el.textContent = t('protShort'));
  document.querySelectorAll('.macro-item.fat  .macro-label').forEach(el => el.textContent = t('fatShort'));
  document.querySelectorAll('.cal-unit').forEach(el => el.textContent = t('kcalLabel'));
}

function updateDate() {
  const el = document.getElementById('today-date');
  if (!el) return;
  const locale = currentLang === 'it' ? 'it-IT' : 'en-GB';
  el.textContent = new Date().toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Animations ────────────────────────────────────────────

function animateNumber(el, target, duration = 950) {
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 4); // ease-out-quart
    el.textContent = Math.round(target * eased);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function animateMacroBar(card, carb, prot, fat) {
  const total = (carb + prot + fat) || 1;
  setTimeout(() => {
    const set = (sel, val) => {
      const el = card.querySelector(sel);
      if (el) el.style.width = `${(val / total * 100).toFixed(1)}%`;
    };
    set('.seg-carb', carb);
    set('.seg-prot', prot);
    set('.seg-fat',  fat);
  }, 320); // after card entrance
}

// ── Card rendering ─────────────────────────────────────────

function safeNum(n) { return Math.max(0, Math.round(Number(n) || 0)); }

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderCard(item, index) {
  const carb = safeNum(item.carboidrati_g);
  const prot = safeNum(item.proteine_g);
  const fat  = safeNum(item.grassi_g);
  const cal  = safeNum(item.calorie);

  const card = document.createElement('div');
  card.className = 'card';
  card.style.animationDelay = `${index * 88}ms`;

  card.innerHTML = `
    <div class="card-header">
      <span class="dish-name">${escapeHtml(item.piatto)}</span>
      <div class="calorie-badge">
        <span class="cal-icon">🔥</span>
        <span class="cal-value">0</span>
        <span class="cal-unit">${t('kcalLabel')}</span>
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

    requestAnimationFrame(() => {
      card.classList.add('visible');
      const calEl = card.querySelector('.cal-value');
      setTimeout(() => animateNumber(calEl, cal), i * 88 + 180);
      animateMacroBar(card, carb, prot, fat);
    });
  });
}

// ── Skeleton / Error ───────────────────────────────────────

function showSkeletons() {
  ['sk1', 'sk2', 'sk3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
  });
  document.getElementById('error-screen').classList.remove('visible');
}

function hideSkeletons() {
  ['sk1', 'sk2', 'sk3'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}

function showError() {
  document.getElementById('error-screen').classList.add('visible');
}

// ── Fetch ─────────────────────────────────────────────────

async function loadMenu() {
  const container = document.getElementById('menu-container');
  showSkeletons();
  container.querySelectorAll('.card').forEach(c => c.remove());

  try {
    const res = await fetch('/api/menu');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    hideSkeletons();
    renderMenu(data);
  } catch {
    hideSkeletons();
    showError();
  }
}

// ── Language toggle ────────────────────────────────────────

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.lang === currentLang) return;
    currentLang = btn.dataset.lang;
    localStorage.setItem('lang', currentLang);
    applyLang();
  });
});

// ── Init ──────────────────────────────────────────────────

applyLang();
loadMenu();
