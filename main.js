/*
  main.js — logique pure. Aucun texte de contenu ici : tout vient de
  fragments.js (variables globales FRAGMENTS et FRAGMENT_LAYOUT), chargé
  avant ce script sur chaque page qui en a besoin.

  Fonctions publiques utilisées par les pages :
    initConstellation()   — appelée par espace.html
    initFragmentPage()    — appelée par fragment.html, lit ?key= dans l'URL
*/

function getFragmentByKey(key) {
  return FRAGMENTS.find(f => f.key === key);
}

// Position par défaut si un fragment n'a pas d'entrée dans FRAGMENT_LAYOUT
// (permet d'ajouter un fragment à FRAGMENTS sans devoir toucher au layout).
function getLayoutFor(key, index, total) {
  if (FRAGMENT_LAYOUT[key]) return FRAGMENT_LAYOUT[key];
  const angle = (index / total) * Math.PI * 2;
  return {
    x: 50 + Math.cos(angle) * 32,
    y: 50 + Math.sin(angle) * 32,
    width: 150,
    rot: (index % 2 === 0 ? -1 : 1) * (1 + (index % 3))
  };
}

/* ---------- ESPACE / CONSTELLATION (espace.html) ---------- */

function initConstellation() {
  renderField();
  renderStarWords();
  renderLines();
  window.addEventListener('resize', renderLines);
}

function renderField() {
  const field = document.getElementById('field');
  if (!field) return;
  field.innerHTML = '';
  FRAGMENTS.forEach((f, i) => {
    const pos = getLayoutFor(f.key, i, FRAGMENTS.length);
    const el = document.createElement('div');
    el.className = 'fragment enter';
    el.dataset.key = f.key;
    el.dataset.shape = f.shape;
    el.style.left = pos.x + '%';
    el.style.top = pos.y + '%';
    el.style.width = pos.width + 'px';
    el.style.setProperty('--rot', pos.rot + 'deg');
    el.style.setProperty('--delay', (i * 0.15) + 's');
    el.innerHTML =
      '<div class="fragment-surface"><img src="' + f.image + '" alt="" loading="lazy"></div>' +
      '<div class="fragment-caption">' + f.title + '</div>';
    el.addEventListener('click', () => {
      window.location.href = 'pages/fragment.html?key=' + encodeURIComponent(f.key);
    });
    field.appendChild(el);
  });
}

function renderStarWords() {
  const el = document.getElementById('star-words');
  if (!el) return;
  const allWords = [...new Set(FRAGMENTS.flatMap(f => f.words))];
  el.innerHTML = '';
  allWords.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'star-word';
    span.textContent = word;
    span.style.left = (6 + (i * 37) % 88) + '%';
    span.style.top = (8 + (i * 53) % 84) + '%';
    span.style.animationDelay = ((i % 5) * 1.2) + 's';
    el.appendChild(span);
  });
}

// Lignes fines et permanentes entre fragments qui partagent au moins un mot.
function renderLines() {
  const svg = document.getElementById('lines');
  if (!svg) return;
  svg.innerHTML = '';
  const w = window.innerWidth;
  const h = document.querySelector('.space').offsetHeight || window.innerHeight;
  svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);

  const seen = new Set();
  FRAGMENTS.forEach((a, i) => {
    FRAGMENTS.forEach((b, j) => {
      if (j <= i) return;
      const shared = a.words.some(word => b.words.includes(word));
      if (!shared) return;
      const key = a.key + '-' + b.key;
      if (seen.has(key)) return;
      seen.add(key);

      const posA = getLayoutFor(a.key, i, FRAGMENTS.length);
      const posB = getLayoutFor(b.key, j, FRAGMENTS.length);
      const x1 = (posA.x / 100) * w, y1 = (posA.y / 100) * h;
      const x2 = (posB.x / 100) * w, y2 = (posB.y / 100) * h;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      svg.appendChild(line);
    });
  });
}

/* ---------- PAGE FRAGMENT INDIVIDUELLE (fragment.html) ---------- */

function initFragmentPage() {
  const params = new URLSearchParams(window.location.search);
  const key = params.get('key');
  const f = getFragmentByKey(key);

  if (!f) {
    document.getElementById('nb-title').textContent = 'Fragment introuvable';
    document.getElementById('nb-text').textContent = "Retournez à l'espace pour en choisir un autre.";
    return;
  }

  document.getElementById('nb-num').textContent = f.num;
  document.getElementById('nb-title').textContent = f.title;
  document.getElementById('nb-text').textContent = f.text;
  document.title = f.title + ' — Adrien Pons';

  const img = document.getElementById('nb-image');
  const shapeRatio = { square: '1/1', tall: '3/5', wide: '4/5', long: '5/3' };
  const shapeWidth = { square: '50%', tall: '42%', wide: '58%', long: '62%' };
  img.style.aspectRatio = shapeRatio[f.shape];
  img.style.width = shapeWidth[f.shape];
  img.innerHTML = '<img src="../' + f.image + '" alt="">';

  const marginEl = document.getElementById('nb-margin');
  marginEl.innerHTML = '';
  f.words.forEach(word => {
    const btn = document.createElement('button');
    btn.className = 'notebook-margin-word';
    btn.textContent = word;
    btn.addEventListener('click', () => {
      window.location.href = '../espace.html?highlight=' + encodeURIComponent(word);
    });
    marginEl.appendChild(btn);
  });
}

/* Sur espace.html, si on arrive avec ?highlight=mot (venant d'une page
   fragment), on atténue les objets qui ne partagent pas ce mot pendant
   quelques secondes, comme un écho ponctuel plutôt qu'un filtre permanent. */
function applyHighlightFromURL() {
  const params = new URLSearchParams(window.location.search);
  const word = params.get('highlight');
  if (!word) return;

  setTimeout(() => {
    document.querySelectorAll('.fragment').forEach(el => {
      const f = getFragmentByKey(el.dataset.key);
      el.style.opacity = f.words.includes(word) ? '1' : '0.35';
    });
    setTimeout(() => {
      document.querySelectorAll('.fragment').forEach(el => { el.style.opacity = ''; });
    }, 2500);
  }, 600);
}
