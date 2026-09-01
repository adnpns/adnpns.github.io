/*
  forms.js — logique partagée par les 3 pages de formulaire
  (contact.html, brief-style.html, piece-juste.html).

  Envoie les réponses vers le Google Apps Script Web App branché sur le
  Google Sheet "Adrien Pons — Formulaires site".
*/

const FORM_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqrv_CLbWuABHutqiR5IpA1epfEpTx_h-KHJjPhBH9uPUBhKizwQAjt1e560CPE4wCbQ/exec";

function submitToSheet(formType, data) {
  const body = new URLSearchParams();
  body.append("formType", formType);
  body.append("timestamp", new Date().toISOString());
  Object.keys(data).forEach((key) => {
    const v = data[key];
    body.append(key, v == null ? "" : v);
  });

  // mode "no-cors" : Apps Script ne renvoie pas d'en-têtes CORS lisibles
  // depuis un site externe. On ne peut donc pas lire la réponse, mais la
  // promesse se résout bien quand la requête est partie côté réseau.
  return fetch(FORM_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    body,
  });
}

// Ajoute la classe .is-checked sur les .field-option (radio/checkbox stylées)
function wireFieldOptions(root) {
  root.querySelectorAll(".field-option").forEach((label) => {
    const input = label.querySelector("input");
    if (!input) return;
    const sync = () => {
      if (input.type === "radio") {
        root.querySelectorAll(`input[name="${input.name}"]`).forEach((i) => {
          const l = i.closest(".field-option");
          if (l) l.classList.toggle("is-checked", i.checked);
        });
      } else {
        label.classList.toggle("is-checked", input.checked);
      }
    };
    input.addEventListener("change", sync);
    sync();
  });
}
