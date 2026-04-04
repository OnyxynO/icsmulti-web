"use client";

import { type Evenement, genererICS, type Occurrence } from "@icsmulti/core";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./FormulaireICS.module.css";

// ─── Types internes au formulaire ─────────────────────────────────────────────

/** Résultat brut retourné par l'API Nominatim */
interface SuggestionNominatim {
  place_id: number;
  display_name: string;
}

/** Événement dans l'état du formulaire — les dates sont des strings (inputs HTML) */
interface EvenementFormulaire {
  id: string;
  titre: string;
  notes: string;
  dateDebut: string; // "2024-06-20T14:00"
  dateFin: string; // "2024-06-20T16:00"
  lieu: string;
  touteLaJournee: boolean;
  rappelMinutes: string; // "" = aucun rappel
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

/** Génère un identifiant unique simple */
function genererIdEvenement(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Slugifie une chaîne pour en faire un nom de fichier sûr */
function slugifier(texte: string): string {
  return (
    texte
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // supprimer les diacritiques
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "evenement"
  );
}

/** Formate une Date en "YYYY-MM-DDTHH:MM" en heure locale (sans conversion UTC) */
function formaterDateTimeLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Événement formulaire vide avec des valeurs par défaut raisonnables */
function evenementVide(): EvenementFormulaire {
  const maintenant = new Date();
  // Arrondir à l'heure suivante
  maintenant.setMinutes(0, 0, 0);
  maintenant.setHours(maintenant.getHours() + 1);
  const debut = formaterDateTimeLocal(maintenant);

  const fin = new Date(maintenant);
  fin.setHours(fin.getHours() + 1);
  const finStr = formaterDateTimeLocal(fin);

  return {
    id: genererIdEvenement(),
    titre: "",
    notes: "",
    dateDebut: debut,
    dateFin: finStr,
    lieu: "",
    touteLaJournee: false,
    rappelMinutes: "",
  };
}

// ─── Composant autocomplétion lieu ───────────────────────────────────────────

interface AutocompletionLieuProps {
  valeur: string;
  onChange: (valeur: string) => void;
  id: string;
  placeholder: string;
}

function AutocompletionLieu({ valeur, onChange, id, placeholder }: AutocompletionLieuProps) {
  const [suggestions, setSuggestions] = useState<SuggestionNominatim[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const minuteurRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minuteurBlurRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (minuteurRef.current) clearTimeout(minuteurRef.current);
      if (minuteurBlurRef.current) clearTimeout(minuteurBlurRef.current);
    };
  }, []);

  const rechercherLieux = useCallback(async (requete: string) => {
    if (requete.length < 3) {
      setSuggestions([]);
      setOuvert(false);
      return;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(requete)}&format=json&limit=5&accept-language=fr`;
      const reponse = await fetch(url, {
        headers: { "Accept-Language": "fr" },
      });
      if (!reponse.ok) return;
      const donnees: SuggestionNominatim[] = await reponse.json();
      setSuggestions(donnees);
      setOuvert(donnees.length > 0);
    } catch {
      // Erreur réseau : ignorer silencieusement, pas de crash
    }
  }, []);

  const gererChangement = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nvValeur = e.target.value;
    onChange(nvValeur);

    if (minuteurRef.current) clearTimeout(minuteurRef.current);
    minuteurRef.current = setTimeout(() => {
      rechercherLieux(nvValeur);
    }, 300);
  };

  const choisirSuggestion = (suggestion: SuggestionNominatim) => {
    onChange(suggestion.display_name);
    setSuggestions([]);
    setOuvert(false);
  };

  const gererBlur = () => {
    // Délai pour permettre le clic sur une suggestion avant de fermer
    minuteurBlurRef.current = setTimeout(() => setOuvert(false), 150);
  };

  return (
    <div className={styles.autocompleteConteneur}>
      <input
        id={id}
        type="text"
        value={valeur}
        onChange={gererChangement}
        onBlur={gererBlur}
        onFocus={() => suggestions.length > 0 && setOuvert(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={styles.champ}
      />
      {ouvert && (
        <div className={styles.suggestions} role="listbox">
          {suggestions.map((s) => (
            <div
              key={s.place_id}
              role="option"
              aria-selected={false}
              tabIndex={0}
              onMouseDown={() => choisirSuggestion(s)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") choisirSuggestion(s);
              }}
              className={styles.suggestion}
            >
              {s.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Composant carte événement ────────────────────────────────────────────────

interface CarteEvenementProps {
  evenement: EvenementFormulaire;
  index: number;
  peutSupprimer: boolean;
  onChange: (id: string, champ: keyof EvenementFormulaire, valeur: string | boolean) => void;
  onSupprimer: (id: string) => void;
  erreurs: Partial<Record<keyof EvenementFormulaire, string>>;
  t: ReturnType<typeof useTranslations<"formulaire">>;
  optionsRappel: { valeur: string; libelle: string }[];
}

function CarteEvenement({ evenement, index, peutSupprimer, onChange, onSupprimer, erreurs, t, optionsRappel }: CarteEvenementProps) {
  const prefixId = `evt-${evenement.id}`;

  return (
    <fieldset className={styles.carteOccurrence}>
      <legend className={styles.legendeOccurrence}>
        {t("evenement_numero", { num: index + 1 })}
        {peutSupprimer && (
          <button
            type="button"
            onClick={() => onSupprimer(evenement.id)}
            className={styles.boutonSupprimer}
            aria-label={t("supprimer_label", { num: index + 1 })}
          >
            ✕
          </button>
        )}
      </legend>

      {/* Titre */}
      <div className={styles.groupe}>
        <label htmlFor={`${prefixId}-titre`}>
          {t("titre_label")} <span className={styles.obligatoire}>*</span>
        </label>
        <input
          id={`${prefixId}-titre`}
          type="text"
          value={evenement.titre}
          onChange={(e) => onChange(evenement.id, "titre", e.target.value)}
          placeholder={t("titre_placeholder")}
          className={`${styles.champ} ${erreurs.titre ? styles.champErreur : ""}`}
          aria-describedby={erreurs.titre ? `erreur-${prefixId}-titre` : undefined}
          aria-invalid={!!erreurs.titre}
          required
        />
        {erreurs.titre && <span id={`erreur-${prefixId}-titre`} className={styles.messageErreur}>{erreurs.titre}</span>}
      </div>

      {/* Notes */}
      <div className={styles.groupe}>
        <label htmlFor={`${prefixId}-notes`}>{t("notes_label")}</label>
        <textarea
          id={`${prefixId}-notes`}
          value={evenement.notes}
          onChange={(e) => onChange(evenement.id, "notes", e.target.value)}
          placeholder={t("notes_placeholder")}
          rows={2}
          className={styles.champ}
        />
      </div>

      {/* Journée entière */}
      <div className={styles.ligneCheckbox}>
        <input
          id={`${prefixId}-journee`}
          type="checkbox"
          checked={evenement.touteLaJournee}
          onChange={(e) => onChange(evenement.id, "touteLaJournee", e.target.checked)}
        />
        <label htmlFor={`${prefixId}-journee`}>{t("journee_entiere")}</label>
      </div>

      {/* Dates */}
      <div className={styles.ligneDeuxColonnes}>
        <div className={styles.groupe}>
          <label htmlFor={`${prefixId}-debut`}>
            {evenement.touteLaJournee ? t("date_debut") : t("heure_debut")} <span className={styles.obligatoire}>*</span>
          </label>
          <input
            id={`${prefixId}-debut`}
            type={evenement.touteLaJournee ? "date" : "datetime-local"}
            value={evenement.touteLaJournee ? evenement.dateDebut.slice(0, 10) : evenement.dateDebut}
            onChange={(e) => onChange(evenement.id, "dateDebut", e.target.value)}
            className={`${styles.champ} ${erreurs.dateDebut ? styles.champErreur : ""}`}
            aria-describedby={erreurs.dateDebut ? `erreur-${prefixId}-debut` : undefined}
            aria-invalid={!!erreurs.dateDebut}
            required
          />
          {erreurs.dateDebut && <span id={`erreur-${prefixId}-debut`} className={styles.messageErreur}>{erreurs.dateDebut}</span>}
        </div>

        <div className={styles.groupe}>
          <label htmlFor={`${prefixId}-fin`}>
            {evenement.touteLaJournee ? t("date_fin") : t("heure_fin")} <span className={styles.obligatoire}>*</span>
          </label>
          <input
            id={`${prefixId}-fin`}
            type={evenement.touteLaJournee ? "date" : "datetime-local"}
            value={evenement.touteLaJournee ? evenement.dateFin.slice(0, 10) : evenement.dateFin}
            onChange={(e) => onChange(evenement.id, "dateFin", e.target.value)}
            className={`${styles.champ} ${erreurs.dateFin ? styles.champErreur : ""}`}
            aria-describedby={erreurs.dateFin ? `erreur-${prefixId}-fin` : undefined}
            aria-invalid={!!erreurs.dateFin}
            required
          />
          {erreurs.dateFin && <span id={`erreur-${prefixId}-fin`} className={styles.messageErreur}>{erreurs.dateFin}</span>}
        </div>
      </div>

      {/* Lieu avec autocomplétion */}
      <div className={styles.groupe}>
        <label htmlFor={`${prefixId}-lieu`}>{t("lieu_label")}</label>
        <AutocompletionLieu
          id={`${prefixId}-lieu`}
          valeur={evenement.lieu}
          onChange={(v) => onChange(evenement.id, "lieu", v)}
          placeholder={t("lieu_placeholder")}
        />
      </div>

      {/* Rappel */}
      <div className={styles.groupe}>
        <label htmlFor={`${prefixId}-rappel`}>{t("rappel_label")}</label>
        <select
          id={`${prefixId}-rappel`}
          value={evenement.rappelMinutes}
          onChange={(e) => onChange(evenement.id, "rappelMinutes", e.target.value)}
          className={styles.champ}
        >
          {optionsRappel.map((opt) => (
            <option key={opt.valeur} value={opt.valeur}>
              {opt.libelle}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}

// ─── Types erreurs formulaire ─────────────────────────────────────────────────

interface ErreursFormulaire {
  evenements: Record<string, Partial<Record<keyof EvenementFormulaire, string>>>;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function FormulaireICS() {
  const t = useTranslations("formulaire");
  const [evenements, setEvenements] = useState<EvenementFormulaire[]>([evenementVide()]);
  const [erreurs, setErreurs] = useState<ErreursFormulaire>({ evenements: {} });
  const [exportReussi, setExportReussi] = useState(false);
  const tacheDisparitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const optionsRappel = [
    { valeur: "", libelle: t("rappel_aucun") },
    { valeur: "5", libelle: t("rappel_5min") },
    { valeur: "10", libelle: t("rappel_10min") },
    { valeur: "15", libelle: t("rappel_15min") },
    { valeur: "30", libelle: t("rappel_30min") },
    { valeur: "60", libelle: t("rappel_1h") },
    { valeur: "120", libelle: t("rappel_2h") },
    { valeur: "1440", libelle: t("rappel_1j") },
  ];

  useEffect(() => {
    return () => {
      if (tacheDisparitionRef.current) clearTimeout(tacheDisparitionRef.current);
    };
  }, []);

  // ─── Gestion des événements ──────────────────────────────────────────────

  const ajouterEvenement = () => {
    setEvenements((prev) => [...prev, evenementVide()]);
  };

  const supprimerEvenement = (id: string) => {
    setEvenements((prev) => prev.filter((e) => e.id !== id));
  };

  const modifierEvenement = (id: string, champ: keyof EvenementFormulaire, valeur: string | boolean) => {
    setEvenements((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;

        const nvEvt = { ...e, [champ]: valeur };

        // Quand on bascule "journée entière", adapter les valeurs de date
        if (champ === "touteLaJournee") {
          if (valeur === true) {
            // datetime-local → date seule (conserver les 10 premiers caractères)
            nvEvt.dateDebut = e.dateDebut.slice(0, 10);
            nvEvt.dateFin = e.dateFin.slice(0, 10);
          } else {
            // date seule → datetime-local : ajouter T00:00 si besoin
            if (nvEvt.dateDebut.length === 10) {
              nvEvt.dateDebut = `${nvEvt.dateDebut}T00:00`;
            }
            if (nvEvt.dateFin.length === 10) {
              nvEvt.dateFin = `${nvEvt.dateFin}T01:00`;
            }
          }
        }

        return nvEvt;
      }),
    );
  };

  // ─── Validation ─────────────────────────────────────────────────────────────

  const valider = (): ErreursFormulaire | null => {
    const nvErreurs: ErreursFormulaire = { evenements: {} };
    let valide = true;

    for (const evt of evenements) {
      const erreursEvt: Partial<Record<keyof EvenementFormulaire, string>> = {};

      if (!evt.titre.trim()) {
        erreursEvt.titre = t("titre_erreur");
        valide = false;
      }

      if (!evt.dateDebut) {
        erreursEvt.dateDebut = t("erreur_debut_obligatoire");
        valide = false;
      }
      if (!evt.dateFin) {
        erreursEvt.dateFin = t("erreur_fin_obligatoire");
        valide = false;
      }

      if (evt.dateDebut && evt.dateFin) {
        const debut = new Date(evt.dateDebut);
        const fin = new Date(evt.dateFin);
        if (fin < debut) {
          erreursEvt.dateFin = t("erreur_fin_avant_debut");
          valide = false;
        }
      }

      if (Object.keys(erreursEvt).length > 0) {
        nvErreurs.evenements[evt.id] = erreursEvt;
      }
    }

    return valide ? null : nvErreurs;
  };

  // ─── Export ─────────────────────────────────────────────────────────────────

  const telecharger = () => {
    const erreursValidation = valider();
    if (erreursValidation) {
      setErreurs(erreursValidation);
      return;
    }
    setErreurs({ evenements: {} });

    // Construire l'objet Evenement pour @icsmulti/core
    const evenement: Evenement = {
      occurrences: evenements.map(
        (evt): Occurrence => ({
          id: evt.id,
          titre: evt.titre.trim(),
          notes: evt.notes.trim(),
          dateDebut: new Date(evt.dateDebut),
          dateFin: new Date(evt.dateFin),
          lieu: evt.lieu.trim(),
          touteLaJournee: evt.touteLaJournee,
          rappelMinutes: evt.rappelMinutes ? Number(evt.rappelMinutes) : undefined,
        }),
      ),
    };

    // Générer le contenu ICS via @icsmulti/core
    const contenuICS = genererICS(evenement);

    // Nom de fichier basé sur le titre du premier événement
    const nomFichier = `${slugifier(evenements[0].titre || "export")}.ics`;

    // Créer un Blob et déclencher le téléchargement
    const blob = new Blob([contenuICS], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = nomFichier;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    setTimeout(() => URL.revokeObjectURL(url), 100);

    // Feedback visuel temporaire
    setExportReussi(true);
    if (tacheDisparitionRef.current) clearTimeout(tacheDisparitionRef.current);
    tacheDisparitionRef.current = setTimeout(() => setExportReussi(false), 3000);
  };

  // ─── Rendu ──────────────────────────────────────────────────────────────────

  return (
    <div className={styles.conteneur}>
      <form
        className={styles.formulaire}
        onSubmit={(e) => {
          e.preventDefault();
          telecharger();
        }}
        noValidate
      >
        {/* Événements */}
        <div className={styles.sectionOccurrences}>
          {evenements.map((evt, index) => (
            <CarteEvenement
              key={evt.id}
              evenement={evt}
              index={index}
              peutSupprimer={evenements.length > 1}
              onChange={modifierEvenement}
              onSupprimer={supprimerEvenement}
              erreurs={erreurs.evenements[evt.id] ?? {}}
              t={t}
              optionsRappel={optionsRappel}
            />
          ))}

          <button type="button" onClick={ajouterEvenement} className={styles.boutonAjouter}>
            {t("ajouter_evenement")}
          </button>
        </div>

        {/* Bouton export */}
        <div className={styles.zoneTelecharger}>
          <button type="submit" className={styles.boutonTelecharger}>
            {t("telecharger")}
          </button>
          {exportReussi && <output className={styles.feedbackReussi}>{t("export_reussi")}</output>}
        </div>
      </form>

      {/* Attribution OSM obligatoire */}
      <footer className={styles.attribution}>
        {t("attribution_texte")}{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          {t("attribution_lien")}
        </a>
      </footer>
    </div>
  );
}
