/*
  da.js — interactions partagées de la refonte :
  - aperçu flottant au survol des lignes d'index (attribut data-peek)
  - visionneuse plein écran (attribut data-gallery sur un conteneur)
*/
(function () {
  // Aperçu au survol
  var peek = document.createElement('div');
  peek.className = 'peek';
  peek.innerHTML = '<img alt="">';
  document.body.appendChild(peek);
  document.addEventListener('mousemove', function (e) {
    var row = e.target.closest && e.target.closest('[data-peek]');
    if (!row) { peek.style.opacity = 0; return; }
    var src = row.getAttribute('data-peek');
    if (peek.firstChild.getAttribute('src') !== src) peek.firstChild.setAttribute('src', src);
    peek.style.left = e.clientX + 'px';
    peek.style.top = e.clientY + 'px';
    peek.style.opacity = 1;
  });
  document.addEventListener('mouseleave', function () { peek.style.opacity = 0; });

  // Écran tactile : une vignette remplace l'aperçu au survol
  if (window.matchMedia && matchMedia('(hover: none)').matches) {
    document.querySelectorAll('.index .row[data-peek]').forEach(function (row) {
      var img = document.createElement('img');
      img.className = 'thumb'; img.alt = ''; img.loading = 'lazy';
      img.src = row.getAttribute('data-peek');
      row.insertBefore(img, row.firstChild);
      row.classList.add('has-thumb');
    });
  }

  // Visionneuse
  var viewer = null, list = [], idx = 0, caption = '';
  function build() {
    viewer = document.createElement('div');
    viewer.className = 'viewer';
    viewer.hidden = true;
    viewer.innerHTML = '<button class="v-x mono" type="button">Fermer</button><img class="v-img" alt=""><div class="v-bar mono"><button type="button" class="v-prev">←</button><span class="v-cap"></span><button type="button" class="v-next">→</button></div>';
    document.body.appendChild(viewer);
    viewer.querySelector('.v-x').onclick = close;
    viewer.querySelector('.v-next').onclick = function () { go(1); };
    viewer.querySelector('.v-prev').onclick = function () { go(-1); };
    viewer.addEventListener('click', function (e) { if (e.target === viewer) close(); });
  }
  function show() {
    var item = list[idx];
    viewer.querySelector('.v-img').src = item.src;
    viewer.querySelector('.v-cap').textContent = caption + ' · ' + (item.label ? item.label + ' · ' : '') + (idx + 1) + ' / ' + list.length;
  }
  function go(d) { idx = (idx + d + list.length) % list.length; show(); }
  function close() { viewer.hidden = true; }
  window.openGallery = function (items, start, cap) {
    if (!viewer) build();
    list = items; idx = start || 0; caption = cap || '';
    show(); viewer.hidden = false;
  };
  document.addEventListener('keydown', function (e) {
    if (!viewer || viewer.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });
})();
