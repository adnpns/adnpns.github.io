// Kit commun des pages privées d'Adrien (QG + pages projet, adrienpons.com et mauvaiscabots.fr).
// Se branche tout seul dès que le contenu déchiffré contient <script type="application/json" id="qg-cfg">.
// Apporte : menu commun, « ← QG », fil d'Ariane, style commun, liste de tâches partagée (API Apps Script),
// fiches complètes, lien direct vers une fiche (#t-<id>), cases et notes synchronisées entre appareils.
(function () {
  "use strict";
  var NOMS_STATUT = { a_faire: "À faire", en_cours: "En cours", attente: "En attente", bloque: "Bloqué", fait: "Fait" };
  var C, ETAT = { taches: [], etat: {} }, PRET = false, applique = false;

  // ---------- petits outils ----------
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem("qgk_" + k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem("qgk_" + k, JSON.stringify(v)); } catch (e) {} }
  function jour() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function q(s) { return encodeURIComponent(s || ""); }
  function memePage(u) {
    var a = document.createElement("a"); a.href = u;
    var n = function (h, p) { return h + p.replace(/index\.html$/, "").replace(/\/$/, ""); };
    return n(a.host, a.pathname) === n(location.host, location.pathname);
  }
  function urlTache(t) { var p = C.projets[t.projet]; return (t.page || (p && p.url) || C.qg) + "#t-" + t.id; }
  function dateCourte(s) { if (!s) return ""; var p = String(s).split("-"); return p.length === 3 ? p[2] + "/" + p[1] : s; }

  // ---------- API (POST text/plain : pas de pré-vol CORS) ----------
  function appel(corps) {
    corps.jeton = C.jeton;
    return fetch(C.api, { method: "POST", body: JSON.stringify(corps) }).then(function (r) { return r.json(); })
      .then(function (r) { if (!r.ok) throw new Error(r.erreur); return r; });
  }
  function fileAttente() { return lsGet("file_" + C.cle) || []; }
  function envoyer(op) { var f = fileAttente(); f.push(op); lsSet("file_" + C.cle, f); vider(); }
  var enCours = false, premier = false;
  function vider() {
    if (enCours) return; var f = fileAttente(); if (!f.length) { charger(); return; }
    enCours = true; indic("…");
    appel(f[0]).then(function (r) {
      var g = fileAttente(); g.shift(); lsSet("file_" + C.cle, g);
      if (r.tache) { majLocale(r.tache); }
      enCours = false; vider();
    }).catch(function () { enCours = false; indic("hors ligne", true); });
  }
  function charger() {
    if (fileAttente().length) return vider();
    appel({ action: "lire" }).then(function (r) {
      ETAT = { taches: r.taches, etat: r.etat }; lsSet("cache_" + C.cle, ETAT); indic("à jour");
      if (!premier) { premier = true; visee = null; } rendre();
    }).catch(function () { indic("hors ligne", true); });
  }
  function majLocale(t) {
    var i = ETAT.taches.findIndex(function (x) { return x.id === t.id; });
    if (i >= 0) ETAT.taches[i] = t; else ETAT.taches.push(t);
    lsSet("cache_" + C.cle, ETAT);
  }
  function changerTache(t, champs) {
    for (var k in champs) t[k] = champs[k];
    majLocale(t); rendre();
    var o = { id: t.id }; for (var k2 in champs) o[k2] = champs[k2];
    envoyer({ action: "tache", tache: o, par: "page " + C.page });
  }
  function indic(txt, alerte) { var i = $("#qk-sync"); if (i) { i.textContent = txt; i.classList.toggle("qk-off", !!alerte); } }

  // ---------- menu, retour, fil d'Ariane ----------
  function nav(main) {
    var n = el("nav", "qk-nav");
    var liens = '<a href="' + C.qg + '" class="' + (C.vue === "qg" ? "on" : "") + '">QG</a>';
    C.ordre.forEach(function (k) { var p = C.projets[k]; liens += '<a href="' + p.url + '" class="' + (C.projet === k ? "on" : "") + '">' + esc(p.nom) + "</a>"; });
    n.innerHTML = '<div class="qk-menu">' + liens + "</div>";
    var b = el("div", "qk-bar");
    if (C.vue !== "qg") {
      var p = C.projets[C.projet] || {};
      b.innerHTML = '<a class="qk-retour" href="' + C.qg + '">← QG</a><span class="qk-ariane"><a href="' + C.qg + '">QG</a> › '
        + (C.titre && p.url && !memePage(p.url) ? '<a href="' + p.url + '">' + esc(p.nom) + "</a> › " + esc(C.titre) : esc(p.nom || C.titre || "")) + "</span>";
    } else b.innerHTML = '<span class="qk-ariane">Tour de contrôle</span>';
    b.innerHTML += '<span id="qk-sync" class="qk-sync">…</span>';
    main.insertBefore(b, main.firstChild); main.insertBefore(n, main.firstChild);
  }

  // ---------- fiche complète ----------
  function boutonsTexte(x) {
    var t = x.texte || "", h = "";
    if (x.gmail) h += '<a class="qk-btn plein" target="_blank" rel="noopener" href="https://mail.google.com/mail/?authuser=' + q(C.compte) + "&view=cm&fs=1&to=" + q(x.gmail.to) + "&su=" + q(x.gmail.sujet) + "&body=" + q(t) + '">Ouvrir le mail prêt</a>';
    if (x.mail) h += '<a class="qk-btn plein" href="mailto:' + esc(x.mail.to || "") + "?subject=" + q(x.mail.sujet) + "&body=" + q(t) + '">Ouvrir le mail</a>';
    if (x.wa != null) h += '<a class="qk-btn plein" target="_blank" rel="noopener" href="https://wa.me/' + esc(x.wa) + "?text=" + q(t) + '">WhatsApp</a>';
    if (x.sms != null) h += '<a class="qk-btn plein" href="sms:' + esc(x.sms) + "?&body=" + q(t) + '">SMS</a>';
    if (x.ig) h += '<a class="qk-btn plein" target="_blank" rel="noopener" data-qk-copie="1" href="https://ig.me/m/' + esc(x.ig) + '">Instagram (copie + ouvre)</a>';
    (x.boutons || []).forEach(function (b) { h += '<a class="qk-btn plein" target="_blank" rel="noopener" href="' + esc(b.url) + '">' + esc(b.label) + "</a>"; });
    return h + '<button class="qk-btn" data-qk-copier="1">Copier</button>';
  }
  function fiche(t, surQG) {
    var f = t.fiche || {}, d = el("details", "qk-fiche" + (t.statut === "fait" ? " fait" : ""));
    d.id = "t-" + t.id; d.dataset.id = t.id;
    var p = C.projets[t.projet] || { nom: t.projet };
    var meta = [NOMS_STATUT[t.statut] || t.statut];
    if (t.priorite === 1) meta.unshift("Urgent");
    if (t.echeance) meta.push("pour le " + dateCourte(t.echeance));
    if (t.resume) meta.push(esc(t.resume));
    var s = '<summary><input type="checkbox" class="qk-fait"' + (t.statut === "fait" ? " checked" : "") + ' aria-label="Fait">'
      + '<span class="qk-tt"><b>' + esc(t.titre) + "</b><small>" + (surQG ? esc(p.nom) + " · " : "") + meta.join(" · ") + "</small></span></summary>";
    var c = "";
    if (f.pourquoi) c += '<p class="qk-pq"><b>Pourquoi</b> ' + esc(f.pourquoi) + "</p>";
    if (f.gain) c += '<p class="qk-pq"><b>Ce que ça rapporte</b> ' + esc(f.gain) + "</p>";
    if (f.etapes && f.etapes.length) c += '<ol class="qk-etapes">' + f.etapes.map(function (e) { return "<li>" + e + "</li>"; }).join("") + "</ol>";
    if (f.materiel && f.materiel.length) c += '<p class="qk-st">Matériel</p><ul class="qk-mat">' + f.materiel.map(function (e) { return "<li>" + e + "</li>"; }).join("") + "</ul>";
    if (f.html) c += '<div class="qk-html">' + f.html + "</div>";
    (f.textes || []).forEach(function (x) { c += (x.titre ? '<p class="qk-st">' + esc(x.titre) + "</p>" : "") + '<pre class="qk-texte">' + esc(x.texte) + '</pre><div class="qk-acts">' + boutonsTexte(x) + "</div>"; });
    var lk = (f.liens || []).map(function (l) { return '<a class="qk-btn" href="' + esc(l.url) + '">' + esc(l.label) + "</a>"; });
    (t.liens || []).forEach(function (k) { var pp = C.projets[k]; if (pp && k !== t.projet) lk.push('<a class="qk-btn" href="' + pp.url + '">Fait avancer : ' + esc(pp.nom) + " →</a>"); });
    if (surQG && p.url) lk.unshift('<a class="qk-btn plein" href="' + urlTache(t) + '">Ouvrir la fiche</a>');
    if (lk.length) c += '<div class="qk-acts">' + lk.join("") + "</div>";
    c += '<div class="qk-suivi"><label>Statut <select class="qk-statut">' + Object.keys(NOMS_STATUT).map(function (k) { return '<option value="' + k + '"' + (k === t.statut ? " selected" : "") + ">" + NOMS_STATUT[k] + "</option>"; }).join("") + "</select></label>"
      + '<textarea class="qk-note" placeholder="Note (réponse reçue, payé le…)">' + esc(t.note) + "</textarea></div>";
    d.innerHTML = s + '<div class="qk-corps">' + c + "</div>";
    brancherFiche(d, t);
    return d;
  }
  function brancherFiche(d, t) {
    var cb = $(".qk-fait", d); cb.onclick = function (e) { e.stopPropagation(); };
    cb.onchange = function () { changerTache(t, { statut: cb.checked ? "fait" : "a_faire" }); };
    var se = $(".qk-statut", d); if (se) se.onchange = function () { changerTache(t, { statut: se.value }); };
    var no = $(".qk-note", d), tm;
    if (no) no.oninput = function () { clearTimeout(tm); tm = setTimeout(function () { t.note = no.value; majLocale(t); envoyer({ action: "tache", tache: { id: t.id, note: no.value }, par: "page " + C.page }); }, 800); };
  }

  // ---------- copier / boutons d'action (délégation) ----------
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-qk-copier],[data-qk-copie]"); if (!b) return;
    var pre = b.closest(".qk-acts") && b.closest(".qk-acts").previousElementSibling;
    if (!pre || !pre.classList.contains("qk-texte")) return;
    navigator.clipboard && navigator.clipboard.writeText(pre.innerText);
    if (b.hasAttribute("data-qk-copier")) { b.textContent = "Copié ✓"; setTimeout(function () { b.textContent = "Copier"; }, 1500); }
  });

  // ---------- vue QG (tour de contrôle) ----------
  function vueQG(zone) {
    var auj = jour(), T = ETAT.taches, h = "";
    var duJour = T.filter(function (t) { return t.statut !== "fait" && (t.aujourdhui || (t.echeance && t.echeance <= auj)); })
      .sort(function (a, b) { return a.priorite - b.priorite || String(a.echeance || "9").localeCompare(String(b.echeance || "9")); });
    zone.innerHTML = "";
    var s1 = el("section", "qk-sec", "<h2>Aujourd'hui <small>" + duJour.length + " tâche" + (duJour.length > 1 ? "s" : "") + " · par priorité</small></h2>");
    if (!duJour.length) s1.appendChild(el("p", "qk-vide", "Rien de prévu aujourd'hui. Choisis une prochaine action dans un projet ci-dessous."));
    duJour.forEach(function (t) { s1.appendChild(ligne(t, true)); });
    zone.appendChild(s1);
    var s2 = el("section", "qk-sec", "<h2>Projets</h2>"), g = el("div", "qk-grille");
    C.ordre.forEach(function (k) {
      var p = C.projets[k], l = T.filter(function (t) { return t.projet === k; });
      var faits = l.filter(function (t) { return t.statut === "fait"; }).length;
      var ouverts = l.filter(function (t) { return t.statut !== "fait"; }).sort(function (a, b) { return a.priorite - b.priorite; });
      var proch = ouverts.filter(function (t) { return t.statut === "a_faire" || t.statut === "en_cours"; })[0];
      var bloq = ouverts.filter(function (t) { return t.statut === "bloque" || t.statut === "attente"; });
      var pc = l.length ? Math.round(100 * faits / l.length) : 0;
      var c = el("div", "qk-projet");
      c.innerHTML = '<div class="qk-ph"><a href="' + p.url + '"><b>' + esc(p.nom) + "</b></a><small>" + faits + "/" + l.length + "</small></div>"
        + '<div class="qk-barre"><i style="width:' + pc + '%"></i></div>'
        + (p.desc ? '<p class="qk-desc">' + esc(p.desc) + "</p>" : "")
        + '<p class="qk-lab">Prochaine action</p>' + (proch ? '<a class="qk-lien" href="' + urlTache(proch) + '">' + esc(proch.titre) + "</a>" : '<span class="qk-vide">À définir</span>')
        + (bloq.length ? '<p class="qk-lab">Bloqué / en attente</p>' + bloq.map(function (t) { return '<a class="qk-lien qk-bloq" href="' + urlTache(t) + '">' + esc(t.titre) + " <small>" + NOMS_STATUT[t.statut] + (t.note ? " · " + esc(String(t.note).slice(0, 60)) : "") + "</small></a>"; }).join("") : "")
        + '<a class="qk-btn" href="' + p.url + '">Ouvrir ' + esc(p.nom) + "</a>";
      g.appendChild(c);
    });
    s2.appendChild(g); zone.appendChild(s2);
    var s3 = el("section", "qk-sec", "<h2>Noter une idée ou une tâche</h2>");
    var f = el("form", "qk-ajout", '<input name="titre" placeholder="Ex. creuser la sérigraphie, rappeler la banque…" required>'
      + '<div><select name="projet">' + C.ordre.map(function (k) { return '<option value="' + k + '"' + (k === "creuser" ? " selected" : "") + ">" + esc(C.projets[k].nom) + "</option>"; }).join("") + "</select>"
      + '<label><input type="checkbox" name="auj"> Aujourd\'hui</label><button class="qk-btn plein">Ajouter</button></div>');
    f.onsubmit = function (e) {
      e.preventDefault(); var t = { id: f.projet.value + "-" + Math.random().toString(36).slice(2, 8), projet: f.projet.value, titre: f.titre.value.trim(), statut: "a_faire", priorite: 2, aujourdhui: f.auj.checked, fiche: {}, liens: [], note: "" };
      majLocale(t); rendre(); envoyer({ action: "tache", tache: t, par: "QG" }); f.reset();
    };
    s3.appendChild(f); zone.appendChild(s3);
  }
  function ligne(t, surQG) {
    var p = C.projets[t.projet] || { nom: t.projet }, a = el("div", "qk-ligne" + (t.priorite === 1 ? " urgent" : ""));
    a.innerHTML = '<input type="checkbox" aria-label="Fait"' + (t.statut === "fait" ? " checked" : "") + '><a href="' + urlTache(t) + '"><b>' + esc(t.titre) + "</b><small>"
      + esc(p.nom) + (t.priorite === 1 ? " · urgent" : "") + (t.echeance ? " · " + dateCourte(t.echeance) : "") + (t.resume ? " · " + esc(t.resume) : "") + "</small></a><span class=\"qk-fl\">→</span>";
    $("input", a).onchange = function (e) { changerTache(t, { statut: e.target.checked ? "fait" : "a_faire" }); };
    return a;
  }

  // ---------- page projet : fiches de la liste + tâches déjà écrites dans la page ----------
  function vueProjet(zone, main) {
    var ici = ETAT.taches.filter(function (t) { return memePage(urlTache(t).split("#")[0]); });
    var fixes = {}; ETAT.taches.forEach(function (t) { fixes[t.id] = t; });
    // Tâches déjà écrites dans la page (details avec une case data-k dans le titre) : id = t-<page>-<k>, case = statut partagé
    $$("details", main).forEach(function (d) {
      var i = $("summary input[type=checkbox][data-k]", d); if (!i || d.closest(".qk-fiche")) return;
      var id = C.cle + "-" + i.dataset.k; d.dataset.qkTache = id;
      if (!d.id) d.id = "t-" + id; else if (d.id !== "t-" + id && !document.getElementById("t-" + id)) { var ancre = el("span"); ancre.id = "t-" + id; $("summary", d).appendChild(ancre); }
      var t = fixes[id]; if (!t) return;
      if (i.checked !== (t.statut === "fait")) { applique = true; i.checked = t.statut === "fait"; i.dispatchEvent(new Event("change", { bubbles: true })); applique = false; }
    });
    var libres = ici.filter(function (t) { return !$('[data-qk-tache="' + t.id + '"]', main); });
    var ouverts = {}; $$(".qk-fiche[open]", zone).forEach(function (d) { ouverts[d.id] = 1; });
    zone.innerHTML = "";
    if (!libres.length) { zone.hidden = true; return; }
    zone.hidden = false;
    var a = libres.filter(function (t) { return t.statut !== "fait"; }).sort(function (x, y) { return x.priorite - y.priorite; });
    var f = libres.filter(function (t) { return t.statut === "fait"; });
    zone.appendChild(el("h2", "qk-h2", "Tâches <small>" + a.length + " en cours" + (f.length ? " · " + f.length + " faite" + (f.length > 1 ? "s" : "") : "") + "</small>"));
    a.concat(f).forEach(function (t) { var d = fiche(t, false); if (ouverts[d.id]) d.open = true; zone.appendChild(d); });
  }

  // ---------- cases et notes de la page (data-k / data-n) synchronisées ----------
  function cleChamp(x) { return C.cle + "/" + (x.dataset.k || x.dataset.n); }
  function appliquerEtat(main) {
    applique = true;
    $$("input[data-k],textarea[data-k],textarea[data-n],select[data-k]", main).forEach(function (x) {
      if (x.closest(".qk-fiche")) return;
      var d = x.closest("details"); if (d && d.dataset.qkTache && $("summary", d).contains(x) && ETAT.taches.some(function (t) { return t.id === d.dataset.qkTache; })) return;
      var v = ETAT.etat[cleChamp(x)]; if (v == null || x === document.activeElement) return;
      if (x.type === "checkbox") { var c = v === "1"; if (x.checked !== c) { x.checked = c; x.dispatchEvent(new Event("change", { bubbles: true })); } }
      else if (x.value !== v) { x.value = v; x.dispatchEvent(new Event(x.tagName === "SELECT" ? "change" : "input", { bubbles: true })); }
    });
    applique = false;
  }
  var tmChamp = {};
  function suivreChamps(main) {
    function ecoute(e) {
      var x = e.target; if (applique || !x.matches || !x.matches("input[data-k],textarea[data-k],textarea[data-n],select[data-k]") || x.closest(".qk-fiche")) return;
      var d = x.closest("details"), id = d && d.dataset.qkTache;
      if (id && x.type === "checkbox" && $("summary", d).contains(x)) {
        var t = ETAT.taches.filter(function (y) { return y.id === id; })[0];
        if (t) { changerTache(t, { statut: x.checked ? "fait" : "a_faire" }); return; }
      }
      var k = cleChamp(x), v = x.type === "checkbox" ? (x.checked ? "1" : "0") : x.value;
      ETAT.etat[k] = v; lsSet("cache_" + C.cle, ETAT);
      clearTimeout(tmChamp[k]); tmChamp[k] = setTimeout(function () { envoyer({ action: "etat", k: k, v: v }); }, x.type === "checkbox" ? 0 : 800);
    }
    main.addEventListener("change", ecoute, true); main.addEventListener("input", function (e) { if (e.target.type !== "checkbox") ecoute(e); }, true);
  }

  // ---------- aller à la fiche demandée (#t-…) ----------
  var visee = null;
  function allerA() {
    var h = decodeURIComponent(location.hash.slice(1)); if (!h || h === visee) return;
    var x = document.getElementById(h); if (!x) return;
    visee = h;
    for (var p = x; p; p = p.parentElement) { if (p.tagName === "DETAILS") p.open = true; if (p.classList && p.classList.contains("ferme")) p.classList.remove("ferme"); if (p.hidden && p.id !== "qk-zone") p.hidden = false; }
    setTimeout(function () { x.scrollIntoView({ behavior: "smooth", block: "start" }); x.classList.remove("qk-flash"); void x.offsetWidth; x.classList.add("qk-flash"); }, 60);
  }
  window.addEventListener("hashchange", function () { visee = null; allerA(); });

  // ---------- rendu ----------
  var MAIN, ZONE;
  function rendre() {
    if (!PRET) return;
    var a = document.activeElement; if (a && ZONE.contains(a) && (a.tagName === "TEXTAREA" || a.tagName === "INPUT" && a.type !== "checkbox")) return;
    if (C.vue === "qg") vueQG(ZONE); else vueProjet(ZONE, MAIN);
    appliquerEtat(MAIN); allerA();
  }
  function demarrer(cfgEl) {
    C = JSON.parse(cfgEl.textContent); C.cle = C.page;
    MAIN = cfgEl.closest("main") || cfgEl.parentElement;
    document.documentElement.classList.add("qk"); if (C.sombre) document.documentElement.classList.add("qk-sombre");
    var css = C.kit.replace(/kit\.js.*$/, "kit.css");
    if (!$('link[href="' + css + '"]')) { var st = el("link"); st.rel = "stylesheet"; st.href = css; document.head.appendChild(st); }
    if (window.__qkCode) lsSet("code", window.__qkCode);
    nav(MAIN);
    ZONE = document.getElementById("qk-zone");
    if (!ZONE) { ZONE = el("div"); ZONE.id = "qk-zone"; var b = $(".qk-bar", MAIN); b.parentNode.insertBefore(ZONE, b.nextSibling); }
    ETAT = lsGet("cache_" + C.cle) || ETAT; PRET = true;
    suivreChamps(MAIN); rendre(); vider();
    document.addEventListener("visibilitychange", function () { if (!document.hidden) vider(); });
    window.addEventListener("online", vider);
    setInterval(function () { if (!document.hidden) vider(); }, 45000);
  }
  // Un seul code par appareil : on retient le code qui a ouvert une page, et on le propose aux autres pages du même site.
  function codeMemorise() {
    var i = $("input[type=password]"); if (!i) return;
    var memo = function () { window.__qkCode = i.value.trim(); };
    i.addEventListener("input", memo); i.addEventListener("change", memo);
    var c = lsGet("code"); if (!c) return;
    setTimeout(function () {
      if (document.getElementById("qg-cfg") || !document.body.contains(i) || i.value) return;
      i.value = c; window.__qkCode = c;
      var f = i.form, b = f ? $("button", f) : $("#gate button, #go");
      if (f && f.requestSubmit) f.requestSubmit(b || undefined); else if (b) b.click();
    }, 250);
  }
  function guetter() {
    var c = document.getElementById("qg-cfg"); if (c) { demarrer(c); return; }
    codeMemorise();
    var o = new MutationObserver(function () { var c2 = document.getElementById("qg-cfg"); if (c2) { o.disconnect(); demarrer(c2); } });
    o.observe(document.documentElement, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", guetter); else guetter();
})();
