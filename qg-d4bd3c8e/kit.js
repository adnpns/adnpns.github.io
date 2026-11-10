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
  function avecCode(u, ancre) {
    var a = document.createElement("a"); a.href = u; var c = C.codes && C.codes[a.host];
    if (!c || a.host === location.host) return u + (ancre ? "#" + ancre : "");
    return u.split("#")[0] + "#c=" + encodeURIComponent(c) + (ancre ? "&" + ancre : "");
  }
  function urlTache(t) { var p = C.projets[t.projet]; return avecCode(t.page || (p && p.url) || C.qg, "t-" + t.id); }
  function dateCourte(s) { if (!s) return ""; var p = String(s).split("-"); return p.length === 3 ? p[2] + "/" + p[1] : s; }

  // ---------- API (POST text/plain : pas de pré-vol CORS) ----------
  function appel(corps) {
    corps.jeton = C.jeton;
    return fetch(C.api, { method: "POST", body: JSON.stringify(corps) }).then(function (r) { return r.json(); })
      .then(function (r) { if (!r.ok) throw new Error(r.erreur); return r; });
  }
  function fileAttente() { return lsGet("file_" + C.cle) || []; }
  function envoyer(op) { var f = fileAttente(); f.push(op); lsSet("file_" + C.cle, f); vider(); }
  var enCours = false, premier = false, muet = false;
  function vider() {
    if (enCours) return; var f = fileAttente(); if (!f.length) { charger(); return; }
    enCours = true; indic("…");
    appel(f[0]).then(function (r) {
      var g = fileAttente(); g.shift(); lsSet("file_" + C.cle, g);
      if (r.tache) { majLocale(r.tache); }
      if (!g.length && !muet) toast("Enregistré ✓");
      muet = false;
      enCours = false; vider();
    }).catch(function () { enCours = false; indic("hors ligne", true); toast("Pas de réseau : gardé ici, envoyé dès le retour du réseau", true); });
  }
  function charger() {
    if (fileAttente().length) return vider();
    appel({ action: "lire" }).then(function (r) {
      ETAT = { taches: r.taches, etat: r.etat }; lsSet("cache_" + C.cle, ETAT); indic("à jour");
      if (!premier) { premier = true; visee = null; } rendre();
    }).catch(function () { indic("hors ligne", true); });
  }
  var DOCS = null, docsEnCours = false;
  function chargerDocs() {
    if (docsEnCours) return; docsEnCours = true;
    appel({ action: "docs" }).then(function (r) { DOCS = r.docs; lsSet("docs_" + C.cle, DOCS); docsEnCours = false; rendre(); })
      .catch(function () { docsEnCours = false; });
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
  var tmToast;
  function toast(txt, alerte, action) {
    var t = $("#qk-toast"); if (!t) { t = el("div"); t.id = "qk-toast"; document.body.appendChild(t); }
    t.textContent = txt; t.className = "on" + (alerte ? " off" : "");
    if (action) { var b = el("button", "", esc(action.label)); b.onclick = function () { t.className = ""; action.fn(); }; t.appendChild(b); t.classList.add("act"); }
    clearTimeout(tmToast); tmToast = setTimeout(function () { t.className = ""; }, action ? 6000 : 2600);
  }
  function indic(txt, alerte) { var i = $("#qk-sync"); if (i) { i.textContent = alerte ? txt : ""; i.title = txt; i.classList.toggle("qk-off", !!alerte); } }

  // ---------- barre du haut : un seul bouton retour, rien d'autre (10/11 : le menu de 10 onglets dispersait) ----------
  var EMO = { argent: "💶", boutique: "🧥", mc: "🐾", stylisme: "✂️", emploi: "💼", sport: "🏃", idees: "💡", creuser: "🔭", docs: "📄" };
  var JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"], MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  function dateLongue() { var n = new Date(); return JOURS[n.getDay()] + " " + n.getDate() + " " + MOIS[n.getMonth()]; }
  function nav(main) {
    var b = el("div", "qk-bar"), p = C.projets[C.projet] || {}, mc = String(C.page).indexOf("mc/") === 0;
    if (C.vue === "qg") b.innerHTML = '<span class="qk-jour">' + dateLongue() + "</span>";
    else if (mc && memePage(C.projets.mc.url)) b.innerHTML = '<span class="qk-ici">🐾 Mauvais Cabots</span>';
    else {
      var sous = C.titre && p.url && !memePage(p.url), dest = mc ? C.projets.mc.url : sous ? avecCode(p.url) : C.qg;
      b.innerHTML = '<a class="qk-retour" href="' + dest + '">← ' + esc(mc ? "Accueil" : sous ? p.nom : "QG") + "</a>"
        + '<span class="qk-ici">' + (C.vue === "docs" ? "📄 Documents" : (EMO[C.projet] || "") + " " + esc(sous ? C.titre : p.nom || C.titre || "")) + "</span>";
    }
    b.innerHTML += '<span id="qk-sync" class="qk-sync" title="à jour"></span>';
    main.insertBefore(b, main.firstChild);
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
  var CHS = [["fait", "✓ Fait"], ["attente", "⏳ J'attends"], ["bloque", "✋ Bloqué"], ["a_faire", "↺ À faire"], ["congele", "🧊 Au congélateur"]];
  function fiche(t, surQG) {
    var d = el("details", "qk-fiche" + (t.statut === "fait" ? " fait" : ""));
    d.id = "t-" + t.id; d.dataset.id = t.id;
    var p = C.projets[t.projet] || { nom: t.projet };
    var meta = [];
    if (t.statut !== "a_faire") meta.push(NOMS_STATUT[t.statut] || t.statut);
    if (t.echeance) meta.push("pour le " + dateCourte(t.echeance));
    if (t.resume) meta.push(esc(t.resume));
    var s = '<summary><input type="checkbox" class="qk-fait"' + (t.statut === "fait" ? " checked" : "") + ' aria-label="Fait">'
      + '<span class="qk-tt"><b>' + esc(t.titre) + "</b>" + (meta.length || surQG ? "<small>" + (surQG ? esc(p.nom) + (meta.length ? " · " : "") : "") + meta.join(" · ") + "</small>" : "") + "</span></summary>";
    d.innerHTML = s + '<div class="qk-corps">' + corpsFiche(t, surQG) + "</div>";
    brancherFiche(d, t);
    return d;
  }
  function ficheVide(t) { var f = t.fiche || {}; return !["pourquoi", "gain", "deja", "etapes", "materiel", "html", "textes", "liens"].some(function (k) { return f[k] && f[k].length; }); }
  function liste(x) { return x == null || x === "" ? [] : [].concat(x); }
  function corpsFiche(t, surQG) {
    var f0 = t.fiche || {}, f = {}, p = C.projets[t.projet] || { nom: t.projet };
    for (var k in f0) f[k] = f0[k];
    ["deja", "etapes", "materiel", "textes", "liens"].forEach(function (k) { f[k] = liste(f0[k]); });
    var c = "";
    if (f.mini) c += '<p class="qk-pq qk-mini"><b>Juste ça pour commencer</b> ' + esc(f.mini) + "</p>";
    if (f.pourquoi) c += '<p class="qk-pq"><b>Pourquoi</b> ' + esc(f.pourquoi) + "</p>";
    if (f.gain) c += '<p class="qk-pq"><b>Ce que ça rapporte</b> ' + esc(f.gain) + "</p>";
    if (f.deja && f.deja.length) c += '<p class="qk-st">Déjà fait</p><ul class="qk-mat">' + f.deja.map(function (e) { return "<li>" + e + "</li>"; }).join("") + "</ul>";
    if (f.etapes && f.etapes.length) c += '<ol class="qk-etapes">' + f.etapes.map(function (e) { return "<li>" + e + "</li>"; }).join("") + "</ol>";
    if (f.materiel && f.materiel.length) c += '<p class="qk-st">Matériel</p><ul class="qk-mat">' + f.materiel.map(function (e) { return "<li>" + e + "</li>"; }).join("") + "</ul>";
    if (f.html) c += '<div class="qk-html">' + f.html + "</div>";
    (f.textes || []).forEach(function (x) { c += (x.titre ? '<p class="qk-st">' + esc(x.titre) + "</p>" : "") + '<pre class="qk-texte">' + esc(x.texte) + '</pre><div class="qk-acts">' + boutonsTexte(x) + "</div>"; });
    var lk = (f.liens || []).map(function (l) { return '<a class="qk-btn" href="' + esc(l.url) + '">' + esc(l.label) + "</a>"; });
    (t.liens || []).forEach(function (k) { var pp = C.projets[k]; if (pp && k !== t.projet) lk.push('<a class="qk-btn" href="' + pp.url + '">Fait avancer : ' + esc(pp.nom) + " →</a>"); });
    if (String(C.page).indexOf("mc/")) lk.unshift('<a class="qk-btn plein" target="_blank" rel="noopener" href="' + esc(urlClaude(t)) + '">🤝 Faire avec Claude</a>');
    if (surQG && p.url) lk.push('<a class="qk-btn" href="' + urlTache(t) + '">' + (EMO[t.projet] || "") + " Page " + esc(p.nom) + " →</a>");
    if (lk.length) c += '<div class="qk-acts">' + lk.join("") + "</div>";
    if (!c) c = p.url ? '<div class="qk-acts"><a class="qk-btn plein" href="' + urlTache(t) + '">Ouvrir le mode d\'emploi →</a></div>' : '<p class="qk-vide">Pas de mode d\'emploi pour celle-ci. Fais-la à ta façon.</p>';
    c += '<div class="qk-suivi"><div class="qk-chs">' + CHS.map(function (x) { return '<button type="button" data-s="' + x[0] + '"' + (x[0] === t.statut || x[0] === "congele" && congele(t) ? ' class="on"' : "") + ">" + x[1] + "</button>"; }).join("") + "</div>"
      + '<textarea class="qk-note" placeholder="Une note ? (réponse reçue, payé le…). Enregistrée toute seule.">' + esc(t.note) + "</textarea></div>";
    return c;
  }
  function brancherFiche(d, t, apres) {
    var cb = $(".qk-fait", d); if (cb) { cb.onclick = function (e) { e.stopPropagation(); };
      cb.onchange = function () { changerTache(t, { statut: cb.checked ? "fait" : "a_faire" }); if (cb.checked) bravoPetit(); }; }
    $$(".qk-chs button", d).forEach(function (b) {
      b.onclick = function (e) {
        e.preventDefault(); var s = b.dataset.s;
        if (apres) { apres(s); return; }
        appliquer(t, s);
      };
    });
    var no = $(".qk-note", d), tm;
    var envoiNote = function () { clearTimeout(tm); if (no.value === (t.note || "")) { toast("Enregistré ✓"); return; } t.note = no.value; majLocale(t); envoyer({ action: "tache", tache: { id: t.id, note: no.value }, par: "page " + C.page }); };
    if (no) { no.oninput = function () { clearTimeout(tm); tm = setTimeout(envoiNote, 1500); }; no.onblur = envoiNote; }
  }

  // ---------- copier / boutons d'action (délégation) ----------
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-qk-copier],[data-qk-copie]"); if (!b) return;
    var pre = b.closest(".qk-acts") && b.closest(".qk-acts").previousElementSibling;
    if (!pre || !pre.classList.contains("qk-texte")) return;
    navigator.clipboard && navigator.clipboard.writeText(pre.innerText);
    if (b.hasAttribute("data-qk-copier")) { b.textContent = "Copié ✓"; setTimeout(function () { b.textContent = "Copier"; }, 1500); }
  });

  var TYPES = { doc: "Doc", sheet: "Tableur", form: "Formulaire", presentation: "Diapos", page: "Page", outil: "Outil" };
  function ligneDoc(d) {
    return '<a class="qk-doc" href="' + esc(avecCode(d.url)) + '" target="_blank" rel="noopener"><span class="qk-type t-' + esc(d.type) + '">' + (TYPES[d.type] || "Lien") + "</span>"
      + '<span class="qk-dt"><b>' + esc(d.titre) + "</b><small>" + [d.note, d.dossier, d.date ? dateCourte(String(d.date).slice(0, 10)) : ""].filter(Boolean).map(esc).join(" · ") + "</small></span></a>";
  }
  function blocDocs(liste, titre, max, lienTout) {
    var b = el("section", "qk-sec qk-docsbloc");
    var vus = max ? liste.slice(0, max) : liste;
    b.innerHTML = "<h2>" + titre + " <small>" + liste.length + "</small></h2>" + vus.map(ligneDoc).join("")
      + (max && liste.length > max ? '<a class="qk-btn" href="' + lienTout + '">Tout voir (' + liste.length + ")</a>" : "");
    return b;
  }
  function vueDocs(zone) {
    var D = DOCS || [], q0 = (zone.querySelector("#qk-cherche") || {}).value || "";
    zone.innerHTML = '<input id="qk-cherche" class="qk-cherche" type="search" placeholder="Chercher un document, une page, un outil…">';
    var champ = $("#qk-cherche", zone); champ.value = q0;
    var res = el("div"); zone.appendChild(res);
    function dessiner() {
      var q = champ.value.trim().toLowerCase(), f = function (d) { return !q || (d.titre + " " + (d.dossier || "") + " " + (d.note || "")).toLowerCase().indexOf(q) >= 0; };
      res.innerHTML = "";
      if (!DOCS) { res.appendChild(el("p", "qk-vide", "Chargement de tes documents…")); return; }
      ["qg"].concat(C.ordre, ["autres"]).forEach(function (k) {
        var l = D.filter(function (d) { return d.projet === k && f(d); }); if (!l.length) return;
        var nom = k === "qg" ? "QG et organisation" : k === "autres" ? "Autres" : C.projets[k].nom;
        var b = blocDocs(l, nom); b.id = "p-" + k; res.appendChild(b);
      });
      var ar = D.filter(function (d) { return d.projet === "archive" && f(d); });
      if (ar.length) { var de = el("details", "qk-archives", "<summary>Anciennes versions et archives (" + ar.length + ")</summary>" + ar.map(ligneDoc).join("")); if (q) de.open = true; res.appendChild(de); }
    }
    champ.oninput = dessiner; dessiner();
  }
  // ---------- petites joies : un retour immédiat quand une chose est faite ----------
  var BRAVO = ["Bien joué.", "Une de moins.", "C'est fait. Respire.", "Bravo.", "Joli.", "C'est derrière toi."];
  function bravoMot() { return BRAVO[Math.floor(Math.random() * BRAVO.length)]; }
  function vibre() { try { navigator.vibrate && navigator.vibrate(25); } catch (e) {} }
  function bravoPetit() { vibre(); toast("✓ " + bravoMot()); }
  function sansBalises(s) { var d = document.createElement("div"); d.innerHTML = s; return d.textContent || ""; }
  function couper(s, n) { s = String(s || "").trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; }

  // ---------- feuille : un panneau qui monte du bas (fiche, idée, projets, choix) ----------
  var OV = null;
  function feuille(contenu, apres) {
    fermer();
    OV = el("div", "qk-ov"); OV.innerHTML = '<div class="qk-pn" role="dialog" aria-modal="true"><button class="qk-x" aria-label="Fermer">✕</button><div class="qk-pc"></div></div>';
    var pc = $(".qk-pc", OV); if (typeof contenu === "string") pc.innerHTML = contenu; else pc.appendChild(contenu);
    OV.onclick = function (e) { if (e.target === OV) fermer(); }; $(".qk-x", OV).onclick = fermer;
    document.body.appendChild(OV); document.documentElement.classList.add("qk-bloque");
    requestAnimationFrame(function () { if (OV) OV.classList.add("on"); });
    if (apres) apres(pc);
    return pc;
  }
  function fermer() {
    if (!OV) return; OV.remove(); OV = null; document.documentElement.classList.remove("qk-bloque");
    if (C && C.vue === "qg" && /^#t-/.test(location.hash)) try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fermer(); });

  // ---------- vue QG : un écran calme, une seule chose à la fois ----------
  // 10/11 (réponses d'Adrien) : bloque pour démarrer, choisir, et sur les sujets stressants.
  // → on demande l'énergie du jour, on montre UN petit geste (fiche.mini), un minuteur de 15 min, l'aide de Claude,
  //   et un congélateur (fiche.congele) pour que le stock ne pèse plus.
  var FETE = 0, DUREE = 15 * 60e3;
  var ENERGIES = [["forme", "🔋", "En forme"], ["moyen", "🙂", "Moyen"], ["plat", "🪫", "À plat"]];
  var OK_ENERGIE = { plat: ["facile"], moyen: ["facile", "moyen"], forme: ["facile", "moyen", "dur"] };
  function congele(t) { return !!(t.fiche && t.fiche.congele); }
  function ouverte(t) { return t.statut === "a_faire" || t.statut === "en_cours"; }
  function vivante(t) { return ouverte(t) && !congele(t); }
  function effort(t) { return (t.fiche && t.fiche.effort) || "moyen"; }
  function stressant(t) { return t.projet === "argent" || !!(t.fiche && t.fiche.stress); }
  function tri(a, b) { return (b.statut === "en_cours") - (a.statut === "en_cours") || a.priorite - b.priorite || String(a.echeance || "9").localeCompare(String(b.echeance || "9")); }
  function pourAuj(t, auj) { return t.aujourdhui || (t.echeance && t.echeance <= auj); }
  function miniPas(t) { var f = t.fiche || {}; return f.mini ? { lab: "Juste ça", txt: f.mini } : liste(f.etapes)[0] ? { lab: "Pour commencer", txt: sansBalises(liste(f.etapes)[0]) } : null; }
  function choix() {
    var auj = jour(), T = ETAT.taches, passe = lsGet("passe_" + auj) || [], pris = lsGet("choix_" + auj), en = lsGet("energie_" + auj);
    var ok = OK_ENERGIE[en] || OK_ENERGIE.forme;
    var libre = function (t) { return vivante(t) && passe.indexOf(t.id) < 0; };
    var va = function (t) { return ok.indexOf(effort(t)) >= 0; };
    var tous = T.filter(libre);
    var r = { passe: passe, t: null, mode: "", energie: en,
      dj: tous.filter(function (t) { return va(t) && pourAuj(t, auj); }).sort(tri),
      autres: tous.filter(function (t) { return va(t) && !pourAuj(t, auj); }).sort(tri),
      trop: tous.filter(function (t) { return !va(t); }).length,
      faits: T.filter(function (t) { return t.statut === "fait" && String(t.maj).slice(0, 10) === auj && !/^test/.test(t.id); }) };
    var pt = pris && T.filter(function (t) { return t.id === pris && ouverte(t); })[0];
    if (pt) { r.t = pt; r.mode = "Ton choix"; }
    else if (r.dj.length) { r.t = r.dj[0]; r.mode = "Pour aujourd'hui"; }
    else if (r.faits.length && !lsGet("encore_" + auj)) r.mode = "fini";
    else if (r.autres.length) { r.t = r.autres[0]; r.mode = "Si tu as l'énergie"; }
    else r.mode = r.trop ? "repos" : passe.length ? "passe" : "rien";
    return r;
  }
  function vueQG(zone) {
    if (Date.now() < FETE) return;
    var auj = jour(), m = lsGet("minuteur"), tm = m && ETAT.taches.filter(function (t) { return t.id === m.id && ouverte(t); })[0];
    if (m && !tm && premier) { lsSet("minuteur", null); m = null; }
    zone.innerHTML = "";
    if (tm) { zone.appendChild(heroMinuteur(tm, m)); gestes(zone, choix()); return; }
    if (!lsGet("energie_" + auj)) { zone.appendChild(heroEnergie()); gestes(zone, null); return; }
    if (!premier && !ETAT.taches.length) { zone.appendChild(el("section", "qk-hero calme", '<div class="qk-emo">☕</div><h1 class="qk-quoi">Je regarde…</h1>')); return; }
    var r = choix(), hero = el("section", "qk-hero"), en = ENERGIES.filter(function (e) { return e[0] === r.energie; })[0];
    var bEn = en ? '<button class="qk-enb" title="Changer mon énergie">' + en[1] + "</button>" : "";
    if (r.t) {
      var t = r.t, p = C.projets[t.projet] || { nom: t.projet }, mp = miniPas(t), aide = mp ? mp.txt : t.resume || (t.fiche || {}).pourquoi || "";
      hero.innerHTML = '<p class="qk-kick"><span>' + (EMO[t.projet] || "•") + "</span>" + esc(p.nom) + " · " + esc(r.mode) + bEn + "</p>"
        + '<h1 class="qk-quoi">' + esc(t.titre) + "</h1>"
        + (aide ? '<p class="qk-pas">' + (mp ? "<b>" + mp.lab + "</b>" : "") + esc(couper(aide, 160)) + "</p>" : "")
        + (stressant(t) ? '<p class="qk-rassure">Ça stresse, c\'est normal. Tu n\'as que ce petit geste à faire.</p>' : "")
        + '<button class="qk-go">▶ Je commence · 15 min</button>'
        + '<div class="qk-2"><button class="qk-ok">✓ Fait</button><button class="qk-voir">Comment faire</button><button class="qk-passe">Plus tard</button></div>';
      $(".qk-go", hero).onclick = function () { lsSet("minuteur", { id: t.id, debut: Date.now() }); vibre(); rendre(); };
      $(".qk-ok", hero).onclick = function () { faire(t, hero); };
      $(".qk-voir", hero).onclick = function () { if (ficheVide(t) && p.url) location.href = urlTache(t); else feuilleFiche(t); };
      $(".qk-passe", hero).onclick = function () { passer(t, hero); };
    } else {
      var n = r.faits.length, msg = {
        fini: ["🌿", "C'est bon pour aujourd'hui.", n + " chose" + (n > 1 ? "s faites" : " faite") + ". Le reste peut attendre."],
        repos: ["🪫", "Rien de léger en ce moment.", "Alors repos. Se reposer, c'est aussi avancer."],
        passe: ["☁️", "Tout est mis de côté.", "C'est ok. Reviens quand tu veux."],
        rien: ["🌿", "Rien à faire.", "Profite. Si une idée arrive, note-la en dessous."] }[r.mode];
      hero.className += " calme";
      hero.innerHTML = (bEn ? '<p class="qk-kick qk-kd">' + bEn + "</p>" : "") + '<div class="qk-emo">' + msg[0] + '</div><h1 class="qk-quoi">' + msg[1] + '</h1><p class="qk-pas">' + msg[2] + "</p>"
        + (r.mode === "fini" && (r.autres.length || r.dj.length) ? '<button class="qk-go qk-encore">Une de plus ?</button>' : "")
        + (r.mode === "repos" ? '<button class="qk-go qk-quand">Montre-moi quand même</button>' : "")
        + (r.mode === "passe" ? '<button class="qk-go qk-revoir">Revoir ce que j\'ai mis de côté</button>' : "");
      var e1 = $(".qk-encore", hero); if (e1) e1.onclick = function () { lsSet("encore_" + jour(), true); rendre(); };
      var e2 = $(".qk-revoir", hero); if (e2) e2.onclick = function () { lsSet("passe_" + jour(), []); rendre(); };
      var e3 = $(".qk-quand", hero); if (e3) e3.onclick = function () { lsSet("energie_" + jour(), "forme"); rendre(); };
    }
    var be = $(".qk-enb", hero); if (be) be.onclick = function () { lsSet("energie_" + jour(), null); rendre(); };
    zone.appendChild(hero);
    gestes(zone, r);
  }
  function heroEnergie() {
    var h = el("section", "qk-hero calme");
    h.innerHTML = '<h1 class="qk-quoi">Comment tu te sens ?</h1><p class="qk-pas">Je te propose une chose qui va avec.</p><div class="qk-en">'
      + ENERGIES.map(function (e) { return '<button data-e="' + e[0] + '"><span>' + e[1] + "</span>" + e[2] + "</button>"; }).join("") + "</div>";
    $$("[data-e]", h).forEach(function (b) { b.onclick = function () { lsSet("energie_" + jour(), b.dataset.e); vibre(); rendre(); }; });
    return h;
  }
  function gestes(zone, r) {
    var mins = lsGet("minutes_" + jour()) || 0, nf = r ? r.faits.length : 0, bits = [];
    if (nf) bits.push("<i>" + r.faits.slice(0, 10).map(function () { return "●"; }).join("") + "</i> " + nf + " faite" + (nf > 1 ? "s" : ""));
    if (mins >= 1) bits.push("⏱ " + Math.round(mins) + " min");
    if (bits.length) zone.appendChild(el("p", "qk-faits", bits.join(" · ") + " aujourd'hui"));
    if (r && r.t && r.dj.length + r.autres.length > 1) { var cb = el("button", "qk-lienbtn", "Choisir moi-même"); cb.onclick = feuilleChoix; zone.appendChild(cb); }
    var g = el("div", "qk-gestes");
    g.innerHTML = '<button data-g="tete"><span>💭</span>Noter une idée</button><button data-g="projets"><span>🗂</span>Mes projets</button>'
      + '<a href="' + C.qg + 'documents.html"><span>📄</span>Documents</a>';
    $('[data-g="tete"]', g).onclick = feuilleTete; $('[data-g="projets"]', g).onclick = feuilleProjets;
    zone.appendChild(g);
    var seul = navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
    if (/iPhone|iPad|iPod/.test(navigator.userAgent) && !seul && !lsGet("pwa_vu")) {
      var ins = el("div", "qk-install", '<span>📲</span><p>Mets le QG sur ton écran d\'accueil : touche <b>Partager</b> puis <b>Sur l\'écran d\'accueil</b>. Tu tapes le code une dernière fois.</p><button aria-label="Fermer">✕</button>');
      $("button", ins).onclick = function () { lsSet("pwa_vu", true); ins.remove(); };
      zone.appendChild(ins);
    }
  }
  // ---------- minuteur : 15 minutes, un cercle qui se vide, on peut s'arrêter ----------
  function heroMinuteur(t, m) {
    var h = el("section", "qk-hero qk-chrono"), mp = miniPas(t);
    h.innerHTML = '<p class="qk-kick"><span>' + (EMO[t.projet] || "•") + "</span>" + esc(t.titre) + "</p>"
      + '<div class="qk-rond"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="f"/><circle cx="60" cy="60" r="52" class="v" pathLength="100"/></svg><b class="qk-temps">15:00</b></div>'
      + (mp ? '<p class="qk-pas"><b>' + mp.lab + "</b>" + esc(couper(mp.txt, 160)) + "</p>" : "")
      + '<p class="qk-rassure">Tu n\'as pas à finir. Quand le cercle est vide, tu peux t\'arrêter.</p>'
      + '<button class="qk-go">✓ C\'est fait</button>'
      + '<div class="qk-2">' + (String(C.page).indexOf("mc/") ? '<a class="qk-claude" target="_blank" rel="noopener" href="' + esc(urlClaude(t)) + '">🤝 Avec Claude</a>' : "")
      + '<button class="qk-voir">Comment faire</button><button class="qk-stop">J\'arrête</button></div>';
    $(".qk-go", h).onclick = function () { finMinuteur(); faire(t, h); };
    $(".qk-voir", h).onclick = function () { if (ficheVide(t) && (C.projets[t.projet] || {}).url) location.href = urlTache(t); else feuilleFiche(t); };
    $(".qk-stop", h).onclick = function () { var mn = finMinuteur(); rendre(); toast(mn >= 1 ? "Tu t'y es mis " + Math.round(mn) + " min. C'est ça qui compte 🌱" : "Pas grave. Tu réessaies quand tu veux 🌱"); };
    tic(h, m);
    return h;
  }
  function finMinuteur() {
    var m = lsGet("minuteur"); if (!m) return 0;
    var mn = Math.min(Date.now() - m.debut, (m.duree || DUREE)) / 60e3, k = "minutes_" + jour();
    lsSet(k, (lsGet(k) || 0) + mn); lsSet("minuteur", null); return mn;
  }
  function tic(h, m) {
    var d = m.duree || DUREE, reste = Math.max(0, d - (Date.now() - m.debut));
    var v = $(".v", h); if (v) v.style.strokeDashoffset = String(100 * (1 - reste / d));
    var s = Math.ceil(reste / 1000), tp = $(".qk-temps", h);
    if (tp) tp.textContent = reste ? Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2) : "🎉";
    if (!reste && !h.classList.contains("fini")) {
      h.classList.add("fini"); if (!m.sonne) { vibre(); m.sonne = 1; lsSet("minuteur", m); }
      $(".qk-rassure", h).textContent = Math.round(d / 60e3) + " minutes ! Bravo. Tu continues ou tu t'arrêtes, les deux sont bien.";
      var plus = el("button", "qk-plus15", "+15 min"); plus.onclick = function () { var k = "minutes_" + jour(); lsSet(k, (lsGet(k) || 0) + d / 60e3); lsSet("minuteur", { id: m.id, debut: Date.now() }); rendre(); };
      $(".qk-stop", h).textContent = "Je m'arrête là"; var vo = $(".qk-voir", h); if (vo) vo.remove(); $(".qk-2", h).insertBefore(plus, $(".qk-2", h).firstChild);
    }
  }
  setInterval(function () { var h = document.querySelector(".qk-chrono"), m = lsGet("minuteur"); if (h && m && !document.hidden) tic(h, m); }, 1000);
  // ---------- faire avec Claude : la tâche déjà expliquée, une étape à la fois ----------
  function urlClaude(t) {
    var f = t.fiche || {}, p = C.projets[t.projet] || {}, l = [
      "Fais cette tâche avec moi, pas à pas : une toute petite étape à la fois, une seule question à la fois, en français très simple. "
      + "J'ai du mal à démarrer et je stresse vite : rassure-moi, commence par le plus petit geste possible, et prépare toi-même ce qui peut l'être (messages, calculs).",
      "", "Tâche : " + t.titre + " (" + (p.nom || t.projet) + ")"];
    if (f.mini) l.push("Premier petit geste prévu : " + f.mini);
    if (f.pourquoi) l.push("Pourquoi : " + sansBalises(f.pourquoi));
    if (liste(f.deja).length) l.push("Déjà fait : " + liste(f.deja).map(sansBalises).join(" ; "));
    if (liste(f.etapes).length) l.push("Étapes prévues : " + liste(f.etapes).map(sansBalises).join(" ; "));
    if (t.note) l.push("Ma note : " + t.note);
    return "https://claude.ai/new?q=" + encodeURIComponent(couper(l.join("\n"), 1800));
  }
  function geler(t, oui) { var f = {}; for (var k in (t.fiche || {})) f[k] = t.fiche[k]; if (oui) f.congele = true; else delete f.congele; changerTache(t, { fiche: f }); }
  function appliquer(t, s) {
    if (s === "congele") { var oui = !congele(t); geler(t, oui); toast(oui ? "Au congélateur 🧊 Rien ne se perd." : "Réveillée ✓"); return; }
    if (s === "fait") t.maj = jour();
    changerTache(t, { statut: s });
    if (s === "fait") bravoPetit(); else toast(s === "a_faire" ? "Remise à faire ✓" : NOMS_STATUT[s] + " ✓ Elle sort de ta vue en attendant.");
  }
  function faire(t, hero) {
    var avant = t.statut, auj = jour(); FETE = Date.now() + 1900; vibre();
    var etaitChoix = lsGet("choix_" + auj) === t.id; t.maj = auj; if (etaitChoix) lsSet("choix_" + auj, null);
    muet = true; changerTache(t, { statut: "fait" });
    hero.className = "qk-hero bravo"; hero.innerHTML = '<div class="qk-coche">✓</div><h1 class="qk-quoi">' + bravoMot() + "</h1>";
    toast("Fait ✓", false, { label: "Annuler", fn: function () { FETE = 0; if (etaitChoix) lsSet("choix_" + auj, t.id); changerTache(t, { statut: avant }); } });
    setTimeout(function () { FETE = 0; rendre(); window.scrollTo(0, 0); }, 1900);
  }
  function passer(t, hero) {
    var auj = jour(), l = lsGet("passe_" + auj) || []; l.push(t.id); lsSet("passe_" + auj, l);
    if (lsGet("choix_" + auj) === t.id) lsSet("choix_" + auj, null);
    hero.classList.add("part"); setTimeout(rendre, 230);
    toast("Mis de côté pour aujourd'hui. Pas de souci.", false, { label: "Annuler", fn: function () {
      lsSet("passe_" + auj, (lsGet("passe_" + auj) || []).filter(function (x) { return x !== t.id; })); rendre(); } });
  }
  function feuilleFiche(t) {
    var p = C.projets[t.projet] || { nom: t.projet }, box = el("div", "qk-ff");
    box.innerHTML = '<p class="qk-kick"><span>' + (EMO[t.projet] || "•") + "</span>" + esc(p.nom) + "</p><h3>" + esc(t.titre) + "</h3>" + corpsFiche(t, true);
    feuille(box);
    brancherFiche(box, t, function (s) {
      fermer();
      var c = choix(), hero = $(".qk-hero", ZONE);
      if (s === "fait" && c.t && c.t.id === t.id && hero && !hero.classList.contains("qk-chrono")) { faire(t, hero); return; }
      if (s === "fait" && lsGet("minuteur") && lsGet("minuteur").id === t.id && hero) { finMinuteur(); faire(t, hero); return; }
      appliquer(t, s);
    });
  }
  function feuilleTete() {
    var box = el("form", "qk-tete"), proj = "creuser";
    box.innerHTML = '<h3>💭 Noter une idée</h3><p class="qk-sub">Écris, puis oublie. C\'est gardé au frais 🧊, rien ne se perd.</p>'
      + '<textarea name="titre" rows="3" placeholder="Une idée, un truc à ne pas oublier…"></textarea>'
      + '<p class="qk-lbl">Ranger ailleurs ? (pas obligé)</p><div class="qk-chips">' + C.ordre.map(function (k) { return '<button type="button" data-p="' + k + '"' + (k === proj ? ' class="on"' : "") + ">" + (EMO[k] || "") + " " + esc(C.projets[k].nom) + "</button>"; }).join("") + "</div>"
      + '<label class="qk-auj"><input type="checkbox" name="auj"> À faire aujourd\'hui</label><button class="qk-go">Noter</button>';
    feuille(box, function () { setTimeout(function () { box.titre.focus(); }, 120); });
    $$(".qk-chips button", box).forEach(function (b) { b.onclick = function () { proj = b.dataset.p; $$(".qk-chips button", box).forEach(function (x) { x.classList.toggle("on", x === b); }); }; });
    box.onsubmit = function (e) {
      e.preventDefault(); var titre = box.titre.value.trim(); if (!titre) { box.titre.focus(); return; }
      var auj = box.auj.checked, t = { id: proj + "-" + Math.random().toString(36).slice(2, 8), projet: proj, titre: titre, statut: "a_faire", priorite: auj ? 2 : 3, aujourdhui: auj, fiche: auj ? {} : { congele: true }, liens: [], note: "" };
      majLocale(t); muet = true; envoyer({ action: "tache", tache: t, par: "QG" }); fermer(); vibre();
      toast(auj ? "Noté ✓ C'est pour aujourd'hui." : "Noté ✓ Gardé au frais, tu peux l'oublier."); rendre();
    };
  }
  function feuilleProjets() {
    var T = ETAT.taches, nf = T.filter(function (t) { return ouverte(t) && congele(t); }).length;
    var pc = feuille('<h3>🗂 Mes projets</h3><div class="qk-tuiles">' + C.ordre.map(function (k) {
      var p = C.projets[k], n = T.filter(function (t) { return t.projet === k && vivante(t); }).sort(tri)[0];
      return '<a class="qk-tuile" href="' + esc(avecCode(p.url)) + '"><span class="e">' + (EMO[k] || "•") + "</span><b>" + esc(p.nom) + "</b><small>" + (n ? esc(n.titre) : "Rien en ce moment") + "</small></a>";
    }).join("") + '<button class="qk-tuile" data-frigo><span class="e">🧊</span><b>Congélateur</b><small>' + nf + " chose" + (nf > 1 ? "s" : "") + " au frais</small></button>"
      + '<a class="qk-tuile" href="' + C.qg + 'documents.html"><span class="e">📄</span><b>Documents</b><small>Tous tes Docs, pages et outils</small></a></div>');
    $("[data-frigo]", pc).onclick = feuilleFrigo;
  }
  function feuilleFrigo() {
    var l = ETAT.taches.filter(function (t) { return ouverte(t) && congele(t); }).sort(tri), box = el("div");
    box.innerHTML = '<h3>🧊 Congélateur</h3><p class="qk-sub">Tout est gardé ici, au frais. Rien ne se perd. Une fois par semaine, réveille 1 ou 2 choses, pas plus.</p>';
    if (!l.length) box.appendChild(el("p", "qk-vide", "Vide pour l'instant."));
    l.forEach(function (t) {
      var r = el("div", "qk-choix qk-frigo", '<span class="e">' + (EMO[t.projet] || "•") + "</span><span><b>" + esc(t.titre) + "</b><small>" + esc((C.projets[t.projet] || {}).nom || "") + "</small></span><button>Réveiller</button>");
      $("button", r).onclick = function () { geler(t, false); r.remove(); toast("Réveillée ✓ Elle revient dans ta liste."); };
      box.appendChild(r);
    });
    feuille(box);
  }
  function feuilleChoix() {
    var r = choix(), box = el("div");
    box.innerHTML = '<h3>Choisir moi-même</h3><p class="qk-sub">Prends celle qui te tente. Les autres attendent sans problème.</p>';
    r.dj.concat(r.autres).slice(0, 7).forEach(function (t) {
      var b = el("button", "qk-choix", '<span class="e">' + (EMO[t.projet] || "•") + "</span><span><b>" + esc(t.titre) + "</b><small>" + esc((C.projets[t.projet] || {}).nom || "") + "</small></span>");
      b.onclick = function () { lsSet("choix_" + jour(), t.id); fermer(); rendre(); window.scrollTo(0, 0); };
      box.appendChild(b);
    });
    feuille(box);
  }

  // ---------- page projet : la prochaine tâche en avant, le reste replié ----------
  var replis = {};
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
    var mesDocs = (DOCS || []).filter(function (d) { return d.projet === C.projet; });
    if (!libres.length && !mesDocs.length) { zone.hidden = true; return; }
    zone.hidden = false;
    var mk = function (t) {
      var d; try { d = fiche(t, false); } catch (e) { d = el("details", "qk-fiche", "<summary><span class=\"qk-tt\"><b>" + esc(t.titre) + "</b></span></summary>"); d.id = "t-" + t.id; }
      if (ouverts[d.id]) d.open = true; return d; };
    var pli = function (cle, titre) { var de = el("details", "qk-plus", "<summary>" + titre + "</summary>"); de.open = !!replis[cle]; de.ontoggle = function () { replis[cle] = de.open; }; return de; };
    var actifs = libres.filter(vivante).sort(tri), frigo = libres.filter(function (t) { return ouverte(t) && congele(t); }).sort(tri);
    var attente = libres.filter(function (t) { return t.statut === "attente" || t.statut === "bloque"; }).sort(tri);
    var faites = libres.filter(function (t) { return t.statut === "fait"; });
    if (actifs.length) { zone.appendChild(el("p", "qk-lab2", "La prochaine ici")); var d0 = mk(actifs[0]); d0.classList.add("qk-premiere"); zone.appendChild(d0); }
    else if (libres.length) zone.appendChild(el("p", "qk-lab2", "Rien à faire ici pour l'instant 🌿"));
    var reste = actifs.slice(1).concat(attente);
    if (reste.length) { var de = pli("reste", "Voir les " + reste.length + " autre" + (reste.length > 1 ? "s" : "")); reste.forEach(function (t) { de.appendChild(mk(t)); }); zone.appendChild(de); }
    if (frigo.length) { var dg = pli("frigo", "🧊 Au congélateur (" + frigo.length + ")"); frigo.forEach(function (t) { dg.appendChild(mk(t)); }); zone.appendChild(dg); }
    if (faites.length) { var df = pli("faites", "✓ Déjà faite" + (faites.length > 1 ? "s" : "") + " (" + faites.length + ")"); faites.forEach(function (t) { df.appendChild(mk(t)); }); zone.appendChild(df); }
    if (mesDocs.length) {
      var dd = pli("docs", "📄 Documents (" + mesDocs.length + ")");
      dd.insertAdjacentHTML("beforeend", mesDocs.slice(0, 8).map(ligneDoc).join("") + (mesDocs.length > 8 && String(C.page).indexOf("mc/") !== 0 ? '<a class="qk-btn" href="' + C.qg + "documents.html#p-" + C.projet + '">Tout voir</a>' : ""));
      zone.appendChild(dd);
    }
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
    if (C.vue === "qg") { var m = h.match(/^t-(.+)$/), tq = m && ETAT.taches.filter(function (y) { return y.id === m[1]; })[0]; if (tq) { visee = h; feuilleFiche(tq); } return; }
    var x = document.getElementById(h); if (!x) return;
    if (!DOCS && C.vue === "docs") return; // on attend la liste complète pour viser juste
    visee = h;
    for (var p = x; p; p = p.parentElement) { if (p.tagName === "DETAILS") p.open = true; if (p.classList && p.classList.contains("ferme")) p.classList.remove("ferme"); if (p.hidden && p.id !== "qk-zone") p.hidden = false; }
    var vise = Date.now(); window.__qkVise = vise;
    setTimeout(function () { x.scrollIntoView({ block: "start" }); x.classList.remove("qk-flash"); void x.offsetWidth; x.classList.add("qk-flash"); }, 60);
  }
  window.addEventListener("hashchange", function () { visee = null; allerA(); });

  // ---------- rendu ----------
  var MAIN, ZONE;
  function rendre() {
    if (!PRET) return;
    var a = document.activeElement; if (a && ZONE.contains(a) && (a.tagName === "TEXTAREA" || a.tagName === "INPUT" && a.type !== "checkbox")) return;
    var y = window.scrollY; ZONE.style.minHeight = ZONE.offsetHeight + "px"; // la page ne saute pas pendant la mise à jour
    if (C.vue === "qg") vueQG(ZONE); else if (C.vue === "docs") vueDocs(ZONE); else vueProjet(ZONE, MAIN);
    ZONE.style.minHeight = ""; if (Math.abs(window.scrollY - y) > 2 && !(window.__qkVise && Date.now() - window.__qkVise < 2000)) window.scrollTo(0, y);
    appliquerEtat(MAIN); allerA();
  }
  var NOEUD = null, UNEFOIS = false;
  function demarrer(cfgEl) {
    NOEUD = cfgEl;
    C = JSON.parse(cfgEl.textContent); C.cle = C.page;
    MAIN = cfgEl.closest("main") || cfgEl.parentElement;
    document.documentElement.classList.add("qk"); if (C.sombre) document.documentElement.classList.add("qk-sombre");
    var css = C.kit.replace(/kit\.js.*$/, "kit.css");
    if (!$('link[href="' + css + '"]')) { var st = el("link"); st.rel = "stylesheet"; st.href = css; document.head.appendChild(st); }
    if (window.__qkCode) lsSet("code", window.__qkCode); else if (!lsGet("code")) try { var ap = localStorage.getItem("ap_code"); if (ap) lsSet("code", ap); } catch (e) {}
    $$(".qk-nav,.qk-bar,#qk-zone[data-qk-auto],.qk-ov").forEach(function (x) { x.remove(); });
    nav(MAIN);
    ZONE = document.getElementById("qk-zone");
    if (!ZONE) { ZONE = el("div"); ZONE.id = "qk-zone"; ZONE.dataset.qkAuto = "1"; var b = $(".qk-bar", MAIN); b.parentNode.insertBefore(ZONE, b.nextSibling); }
    ETAT = lsGet("cache_" + C.cle) || ETAT; DOCS = lsGet("docs_" + C.cle); PRET = true;
    if (!MAIN.__qk) { MAIN.__qk = 1; suivreChamps(MAIN); }
    visee = null; rendre(); vider(); chargerDocs();
    if (UNEFOIS) return; UNEFOIS = true;
    document.addEventListener("visibilitychange", function () { if (!document.hidden) vider(); });
    window.addEventListener("online", vider);
    setInterval(function () { if (!document.hidden) vider(); }, 45000);
  }
  // Un seul code par appareil : on retient le code qui a ouvert une page, et on le propose aux autres pages du même site.
  function codeDansLien() {
    var m = location.hash.match(/(?:^#|&)c=([^&]+)/); if (!m) return null;
    var c = decodeURIComponent(m[1]), reste = location.hash.replace(/(?:^#|&)c=[^&]+/, "").replace(/^&/, "").replace(/^#?/, "");
    try { history.replaceState(null, "", location.pathname + location.search + (reste ? "#" + reste : "")); } catch (e) {}
    lsSet("code", c); try { localStorage.setItem("ap_code", c); } catch (e) {}
    return c;
  }
  function codeMemorise() {
    var lien = codeDansLien();
    var i = $("input[type=password]"); if (!i) return;
    var memo = function () { window.__qkCode = i.value.trim(); };
    i.addEventListener("input", memo); i.addEventListener("change", memo);
    var c = lsGet("code"); if (!c) try { c = localStorage.getItem("ap_code"); } catch (e) {} if (!c) return;
    // La page s'ouvre-t-elle déjà toute seule avec ce code ? (selon ce que son propre script mémorise)
    var src = $$("script:not([src])").map(function (x) { return x.textContent; }).join(" "), seule = false;
    try {
      if (src.indexOf('getItem("ap_code")') >= 0 && localStorage.getItem("ap_code") === c) seule = true;
      if (src.indexOf('getItem("tres-code")') >= 0 && sessionStorage.getItem("tres-code") === c) seule = true;
    } catch (e) {}
    if (seule && !lien) return;
    setTimeout(function () {
      if (document.getElementById("qg-cfg") || !document.body.contains(i) || i.value) return;
      i.value = c; window.__qkCode = c;
      var f = i.form, b = f ? $("button", f) : $("#gate button, #go");
      if (f && f.requestSubmit) f.requestSubmit(b || undefined); else if (b) b.click();
    }, lien ? 50 : 1200);
  }
  function guetter() {
    var c = document.getElementById("qg-cfg"); if (c) demarrer(c); else codeMemorise();
    // Toujours à l'écoute : si la page remet son contenu (2e déchiffrement), on rebranche le menu et les fiches.
    var o = new MutationObserver(function () { var c2 = document.getElementById("qg-cfg"); if (c2 && c2 !== NOEUD) demarrer(c2); });
    o.observe(document.documentElement, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", guetter); else guetter();
})();
