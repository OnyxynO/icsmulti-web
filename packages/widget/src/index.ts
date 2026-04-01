// Point d'entrée du widget ICSMulti intégrable
// Bundle IIFE — exposé globalement via window.ICSMulti

import { genererICS } from "@icsmulti/core";
import type { Evenement, Occurrence } from "@icsmulti/core";

// ── Types ──────────────────────────────────────────────────────────────────

export interface OptionsWidget {
  /** Sélecteur CSS du conteneur (défaut : #icsmulti-widget) */
  container?: string;
  /** Thème visuel (défaut : auto) */
  theme?: "light" | "dark" | "auto";
  /** Langue de l'interface (défaut : langue du navigateur) */
  lang?: "fr" | "en";
}

// ── CSS inline ─────────────────────────────────────────────────────────────
// Injecté dans <head> via un <style> — aucun fichier .css séparé généré.

const CSS = `
.icsmulti-widget {
  box-sizing: border-box;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  max-width: 100%;
  font-family: inherit;
  font-size: 14px;
  color: #111827;
}

.icsmulti-widget *,
.icsmulti-widget *::before,
.icsmulti-widget *::after {
  box-sizing: border-box;
}

.icsmulti-titre-form {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 16px;
  color: #111827;
}

.icsmulti-groupe {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.icsmulti-ligne {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.icsmulti-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.icsmulti-input,
.icsmulti-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  color: #111827;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
}

.icsmulti-input:focus,
.icsmulti-select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

.icsmulti-input.icsmulti-erreur {
  border-color: #ef4444;
}

.icsmulti-checkbox-groupe {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.icsmulti-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #6366f1;
  cursor: pointer;
}

.icsmulti-checkbox-label {
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  user-select: none;
}

.icsmulti-msg-erreur {
  font-size: 12px;
  color: #ef4444;
  margin-top: 2px;
}

.icsmulti-bouton {
  width: 100%;
  padding: 10px 16px;
  background: #6366f1;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  margin-top: 4px;
  transition: background 0.15s ease;
}

.icsmulti-bouton:hover {
  background: #4f46e5;
}

.icsmulti-bouton:active {
  background: #4338ca;
}

.icsmulti-attribution {
  margin-top: 12px;
  font-size: 11px;
  color: #9ca3af;
  text-align: right;
}

.icsmulti-attribution a {
  color: #6366f1;
  text-decoration: none;
}

/* Thème sombre */
.icsmulti-dark .icsmulti-widget {
  background: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}

.icsmulti-dark .icsmulti-titre-form {
  color: #f9fafb;
}

.icsmulti-dark .icsmulti-label,
.icsmulti-dark .icsmulti-checkbox-label {
  color: #d1d5db;
}

.icsmulti-dark .icsmulti-input,
.icsmulti-dark .icsmulti-select {
  background: #111827;
  border-color: #4b5563;
  color: #f9fafb;
}

.icsmulti-dark .icsmulti-input:focus,
.icsmulti-dark .icsmulti-select:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.2);
}

.icsmulti-dark .icsmulti-attribution {
  color: #6b7280;
}
`;

// ── Libellés i18n ──────────────────────────────────────────────────────────

interface Libelles {
  titreForme: string;
  labelTitre: string;
  placeholderTitre: string;
  labelDebut: string;
  labelFin: string;
  labelJournee: string;
  labelLieu: string;
  placeholderLieu: string;
  labelRappel: string;
  rappelAucun: string;
  rappelOptions: Array<{ valeur: number; texte: string }>;
  bouton: string;
  erreurTitre: string;
  erreurDateDebut: string;
  erreurDateFin: string;
  erreurDatesOrdre: string;
}

const LIBELLES_FR: Libelles = {
  titreForme: "Créer un événement .ics",
  labelTitre: "Titre *",
  placeholderTitre: "Nom de l'événement",
  labelDebut: "Début",
  labelFin: "Fin",
  labelJournee: "Journée entière",
  labelLieu: "Lieu",
  placeholderLieu: "Adresse ou lieu (optionnel)",
  labelRappel: "Rappel",
  rappelAucun: "Aucun rappel",
  rappelOptions: [
    { valeur: 5, texte: "5 minutes avant" },
    { valeur: 10, texte: "10 minutes avant" },
    { valeur: 15, texte: "15 minutes avant" },
    { valeur: 30, texte: "30 minutes avant" },
    { valeur: 60, texte: "1 heure avant" },
    { valeur: 1440, texte: "1 jour avant" },
  ],
  bouton: "Télécharger .ics",
  erreurTitre: "Le titre est obligatoire.",
  erreurDateDebut: "La date de début est requise.",
  erreurDateFin: "La date de fin est requise.",
  erreurDatesOrdre: "La date de fin doit être après le début.",
};

const LIBELLES_EN: Libelles = {
  titreForme: "Create an .ics event",
  labelTitre: "Title *",
  placeholderTitre: "Event name",
  labelDebut: "Start",
  labelFin: "End",
  labelJournee: "All day",
  labelLieu: "Location",
  placeholderLieu: "Address or location (optional)",
  labelRappel: "Reminder",
  rappelAucun: "No reminder",
  rappelOptions: [
    { valeur: 5, texte: "5 minutes before" },
    { valeur: 10, texte: "10 minutes before" },
    { valeur: 15, texte: "15 minutes before" },
    { valeur: 30, texte: "30 minutes before" },
    { valeur: 60, texte: "1 hour before" },
    { valeur: 1440, texte: "1 day before" },
  ],
  bouton: "Download .ics",
  erreurTitre: "Title is required.",
  erreurDateDebut: "Start date is required.",
  erreurDateFin: "End date is required.",
  erreurDatesOrdre: "End date must be after start.",
};

// ── Utilitaires ────────────────────────────────────────────────────────────

/** Détecte la langue à utiliser selon les options ou le navigateur. */
function detecterLang(lang?: "fr" | "en"): "fr" | "en" {
  if (lang === "fr" || lang === "en") return lang;
  const nav = (navigator.language ?? "fr").toLowerCase();
  return nav.startsWith("fr") ? "fr" : "en";
}

/** Résout le thème en "light" ou "dark". */
function resoudreTheme(theme?: "light" | "dark" | "auto"): "light" | "dark" {
  if (theme === "light" || theme === "dark") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Injecte le CSS dans <head> si pas déjà présent. */
function injecterCSS(): void {
  if (document.getElementById("icsmulti-styles")) return;
  const style = document.createElement("style");
  style.id = "icsmulti-styles";
  style.textContent = CSS;
  document.head.appendChild(style);
}

/** Génère un id unique pour les labels/inputs. */
function genId(suffixe: string): string {
  return `icsmulti-${Math.random().toString(36).slice(2, 7)}-${suffixe}`;
}

/** Déclenche le téléchargement d'un fichier texte dans le navigateur. */
function telecharger(contenu: string, nomFichier: string): void {
  const blob = new Blob([contenu], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(url);
}

// ── Construction DOM du formulaire ─────────────────────────────────────────
// innerHTML est utilisé ici avec un template string entièrement statique
// (aucune donnée utilisateur incluse dans la structure HTML).
// Les valeurs utilisateur sont lues via .value après coup — pas de risque XSS.

function creerFormulaire(
  conteneur: HTMLElement,
  libelles: Libelles,
  theme: "light" | "dark"
): void {
  // Application du thème sur le conteneur parent
  conteneur.classList.remove("icsmulti-dark", "icsmulti-light");
  conteneur.classList.add(theme === "dark" ? "icsmulti-dark" : "icsmulti-light");

  // Ids uniques pour l'accessibilité
  const idTitre = genId("titre");
  const idDebut = genId("debut");
  const idFin = genId("fin");
  const idJournee = genId("journee");
  const idLieu = genId("lieu");
  const idRappel = genId("rappel");

  const optionsRappel = libelles.rappelOptions
    .map((opt) => `<option value="${opt.valeur}">${opt.texte}</option>`)
    .join("\n");

  // Tous les contenus string insérés ci-dessous sont des constantes de
  // traduction définies dans ce module — aucune valeur d'entrée utilisateur.
  const html = [
    '<div class="icsmulti-widget">',
    `  <h2 class="icsmulti-titre-form">${libelles.titreForme}</h2>`,
    '  <div class="icsmulti-groupe">',
    `    <label class="icsmulti-label" for="${idTitre}">${libelles.labelTitre}</label>`,
    `    <input id="${idTitre}" class="icsmulti-input" type="text" placeholder="${libelles.placeholderTitre}" autocomplete="off" data-champ="titre" />`,
    '    <span class="icsmulti-msg-erreur" data-erreur="titre" aria-live="polite"></span>',
    "  </div>",
    '  <div class="icsmulti-checkbox-groupe">',
    `    <input id="${idJournee}" class="icsmulti-checkbox" type="checkbox" data-champ="journee" />`,
    `    <label class="icsmulti-checkbox-label" for="${idJournee}">${libelles.labelJournee}</label>`,
    "  </div>",
    '  <div class="icsmulti-ligne">',
    '    <div class="icsmulti-groupe">',
    `      <label class="icsmulti-label" for="${idDebut}">${libelles.labelDebut}</label>`,
    `      <input id="${idDebut}" class="icsmulti-input" type="datetime-local" data-champ="debut" />`,
    '      <span class="icsmulti-msg-erreur" data-erreur="debut" aria-live="polite"></span>',
    "    </div>",
    '    <div class="icsmulti-groupe">',
    `      <label class="icsmulti-label" for="${idFin}">${libelles.labelFin}</label>`,
    `      <input id="${idFin}" class="icsmulti-input" type="datetime-local" data-champ="fin" />`,
    '      <span class="icsmulti-msg-erreur" data-erreur="fin" aria-live="polite"></span>',
    "    </div>",
    "  </div>",
    '  <div class="icsmulti-groupe">',
    `    <label class="icsmulti-label" for="${idLieu}">${libelles.labelLieu}</label>`,
    `    <input id="${idLieu}" class="icsmulti-input" type="text" placeholder="${libelles.placeholderLieu}" data-champ="lieu" />`,
    "  </div>",
    '  <div class="icsmulti-groupe">',
    `    <label class="icsmulti-label" for="${idRappel}">${libelles.labelRappel}</label>`,
    `    <select id="${idRappel}" class="icsmulti-select" data-champ="rappel">`,
    `      <option value="">${libelles.rappelAucun}</option>`,
    optionsRappel,
    "    </select>",
    "  </div>",
    `  <button class="icsmulti-bouton" type="button" data-action="telecharger">${libelles.bouton}</button>`,
    '  <p class="icsmulti-attribution">',
    '    Propulsé par <a href="https://icsmulti-web.vercel.app" target="_blank" rel="noopener">ICSMulti</a>',
    "  </p>",
    "</div>",
  ].join("\n");

  conteneur.innerHTML = html; // nosec — template statique, pas de données utilisateur

  // Synchroniser les inputs date quand "journée entière" change
  const checkboxJournee = conteneur.querySelector<HTMLInputElement>(
    '[data-champ="journee"]'
  );
  const inputDebut = conteneur.querySelector<HTMLInputElement>(
    '[data-champ="debut"]'
  );
  const inputFin = conteneur.querySelector<HTMLInputElement>(
    '[data-champ="fin"]'
  );

  checkboxJournee?.addEventListener("change", () => {
    const estJournee = checkboxJournee.checked;
    if (inputDebut) inputDebut.type = estJournee ? "date" : "datetime-local";
    if (inputFin) inputFin.type = estJournee ? "date" : "datetime-local";
  });

  // Bouton téléchargement
  const bouton = conteneur.querySelector<HTMLButtonElement>(
    '[data-action="telecharger"]'
  );
  bouton?.addEventListener("click", () => {
    gererTelechargement(conteneur, libelles);
  });
}

// ── Validation et téléchargement ───────────────────────────────────────────

function afficherErreur(
  conteneur: HTMLElement,
  champ: string,
  message: string
): void {
  const span = conteneur.querySelector<HTMLElement>(
    `[data-erreur="${champ}"]`
  );
  const input = conteneur.querySelector<HTMLElement>(
    `[data-champ="${champ}"]`
  );
  if (span) span.textContent = message; // textContent — pas de risque XSS
  input?.classList.add("icsmulti-erreur");
}

function effacerErreurs(conteneur: HTMLElement): void {
  conteneur
    .querySelectorAll<HTMLElement>(".icsmulti-msg-erreur")
    .forEach((el) => {
      el.textContent = "";
    });
  conteneur
    .querySelectorAll<HTMLElement>(".icsmulti-erreur")
    .forEach((el) => {
      el.classList.remove("icsmulti-erreur");
    });
}

function gererTelechargement(
  conteneur: HTMLElement,
  libelles: Libelles
): void {
  effacerErreurs(conteneur);

  const valeurTitre =
    conteneur
      .querySelector<HTMLInputElement>('[data-champ="titre"]')
      ?.value.trim() ?? "";
  const valeurDebut =
    conteneur.querySelector<HTMLInputElement>('[data-champ="debut"]')
      ?.value ?? "";
  const valeurFin =
    conteneur.querySelector<HTMLInputElement>('[data-champ="fin"]')?.value ??
    "";
  const estJournee =
    conteneur.querySelector<HTMLInputElement>('[data-champ="journee"]')
      ?.checked ?? false;
  const valeurLieu =
    conteneur
      .querySelector<HTMLInputElement>('[data-champ="lieu"]')
      ?.value.trim() ?? "";
  const valeurRappel =
    conteneur.querySelector<HTMLSelectElement>('[data-champ="rappel"]')
      ?.value ?? "";

  // ── Validation ──
  let valide = true;

  if (!valeurTitre) {
    afficherErreur(conteneur, "titre", libelles.erreurTitre);
    valide = false;
  }

  if (!valeurDebut) {
    afficherErreur(conteneur, "debut", libelles.erreurDateDebut);
    valide = false;
  }

  if (!valeurFin) {
    afficherErreur(conteneur, "fin", libelles.erreurDateFin);
    valide = false;
  }

  if (valeurDebut && valeurFin && !estJournee) {
    const dateDebut = new Date(valeurDebut);
    const dateFin = new Date(valeurFin);
    if (dateFin <= dateDebut) {
      afficherErreur(conteneur, "fin", libelles.erreurDatesOrdre);
      valide = false;
    }
  }

  if (!valide) return;

  // ── Construction de l'événement ──
  let dateDebut: Date;
  let dateFin: Date;

  if (estJournee) {
    // Journée entière : dates en heure locale à minuit
    const [anneeD, moisD, jourD] = valeurDebut.split("-").map(Number);
    dateDebut = new Date(anneeD, moisD - 1, jourD);

    if (valeurFin) {
      const [anneeF, moisF, jourF] = valeurFin.split("-").map(Number);
      dateFin = new Date(anneeF, moisF - 1, jourF);
    } else {
      dateFin = new Date(dateDebut);
      dateFin.setDate(dateFin.getDate() + 1);
    }

    // RFC 5545 : la fin doit être strictement après le début
    if (dateFin.getTime() <= dateDebut.getTime()) {
      dateFin = new Date(dateDebut);
      dateFin.setDate(dateFin.getDate() + 1);
    }
  } else {
    dateDebut = new Date(valeurDebut);
    dateFin = new Date(valeurFin);
  }

  // Garde-fou : dates invalides (valeurs corrompues ou navigateur non-standard)
  if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
    afficherErreur(conteneur, "debut", libelles.erreurDateDebut);
    return;
  }

  // crypto.randomUUID n'est disponible qu'en contexte sécurisé (HTTPS/localhost)
  // → fallback compatible HTTP pour les sites hôtes en intranet ou en test
  const uid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  const occurrence: Occurrence = {
    id: uid,
    dateDebut,
    dateFin,
    lieu: valeurLieu,
    touteLaJournee: estJournee,
    ...(valeurRappel ? { rappelMinutes: parseInt(valeurRappel, 10) } : {}),
  };

  const evenement: Evenement = {
    titre: valeurTitre,
    notes: "",
    occurrences: [occurrence],
  };

  const contenuICS = genererICS(evenement);
  const nomFichier = `${valeurTitre
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()}.ics`;
  telecharger(contenuICS, nomFichier);
}

// ── API publique ───────────────────────────────────────────────────────────

/**
 * Initialise le widget ICSMulti dans le conteneur spécifié.
 *
 * @param options - Options de configuration (container, theme, lang)
 */
export function init(options: OptionsWidget = {}): void {
  const selecteur = options.container ?? "#icsmulti-widget";
  const conteneur = document.querySelector<HTMLElement>(selecteur);

  if (!conteneur) {
    console.warn(
      `[ICSMulti] Conteneur introuvable : "${selecteur}". Assurez-vous que l'élément existe dans le DOM.`
    );
    return;
  }

  const lang = detecterLang(options.lang);
  const theme = resoudreTheme(options.theme);
  const libelles = lang === "fr" ? LIBELLES_FR : LIBELLES_EN;

  injecterCSS();
  creerFormulaire(conteneur, libelles, theme);
}
