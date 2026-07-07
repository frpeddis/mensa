// Mostra la data di oggi in italiano nell'header
(function setDate() {
  const el = document.getElementById('today-date');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
})();

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

function macroBar(carb, prot, fat) {
  const total = carb + prot + fat || 1;
  const pCarb = (carb / total * 100).toFixed(1);
  const pProt = (prot / total * 100).toFixed(1);
  const pFat  = (fat  / total * 100).toFixed(1);

  return `
    <div class="macro-bar">
      <div class="macro-bar-segment seg-carb" style="width:${pCarb}%"></div>
      <div class="macro-bar-segment seg-prot" style="width:${pProt}%"></div>
      <div class="macro-bar-segment seg-fat"  style="width:${pFat}%"></div>
    </div>`;
}

function renderCard(item, index) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.animationDelay = `${index * 80}ms`;

  card.innerHTML = `
    <div class="card-name">${escapeHtml(item.piatto)}</div>
    <div class="calorie-badge"><span>🔥</span> ${item.calorie} kcal</div>
    ${macroBar(item.carboidrati_g, item.proteine_g, item.grassi_g)}
    <div class="macro-chips">
      <span class="chip chip-carb">🌾 ${item.carboidrati_g}g carb</span>
      <span class="chip chip-prot">💪 ${item.proteine_g}g prot</span>
      <span class="chip chip-fat">🫒 ${item.grassi_g}g gras</span>
    </div>`;

  return card;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadMenu() {
  const container = document.getElementById('menu-container');

  showSkeletons();

  // Rimuove card precedenti (in caso di retry)
  container.querySelectorAll('.card').forEach(c => c.remove());

  try {
    const res = await fetch('/api/menu');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    hideSkeletons();

    data.forEach((item, i) => {
      const card = renderCard(item, i);
      container.appendChild(card);
      // Trigger reflow per garantire l'animazione
      requestAnimationFrame(() => card.classList.add('visible'));
    });

  } catch {
    hideSkeletons();
    showError();
  }
}

loadMenu();
