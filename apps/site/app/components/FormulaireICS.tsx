"use client";

import { type Evenement, genererICS, type Occurrence } from "@icsmulti/core";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./FormulaireICS.module.css";

// ─── Types internes au formulaire ─────────────────────────────────────────────

/** Résultat brut retourné par l'API Nominatim */
interface SuggestionNominatim {
  place_id: number;
  display_name: string;
}

/** Occurrence dans l'état du formulaire — les dates sont des strings (inputs HTML) */
interface OccurrenceFormulaire {
  id: string;
  dateDebut: string; // "2024-06-20T14:00"
  dateFin: string; // "2024-06-20T16:00"
  lieu: string;
  touteLaJournee: boolean;
  rappelMinutes: string; // "" = aucun rappel
}

// ─── Options de rappel ────────────────────────────────────────────────────────

const OPTIONS_RAPPEL: { valeur: string; libelle: string }[] = [
  { valeur: "", libelle: "Aucun rappel" },
  { valeur: "5", libelle: "5 minutes avant" },
  { valeur: "10", libelle: "10 minutes avant" },
  { valeur: "15", libelle: "15 minutes avant" },
  { valeur: "30", libelle: "30 minutes avant" },
  { valeur: "60", libelle: "1 heure avant" },
  { valeur: "120", libelle: "2 heures avant" },
  { valeur: "1440", libelle: "1 jour avant" },
];

// ─── Utilitaires ──────────────────────────────────────────────────────────────

/** Génère un identifiant unique simple pour les occurrences côté formulaire */
function genererIdOccurrence(): string {
  return `occ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

/** Occurrence formulaire vide avec des valeurs par défaut raisonnables */
function occurrenceVide(): OccurrenceFormulaire {
  const maintenant = new Date();
  // Arrondir à l'heure suivante
  maintenant.setMinutes(0, 0, 0);
  maintenant.setHours(maintenant.getHours() + 1);
  const debut = formaterDateTimeLocal(maintenant);

  const fin = new Date(maintenant);
  fin.setHours(fin.getHours() + 1);
  const finStr = formaterDateTimeLocal(fin);

  return {
    id: genererIdOccurrence(),
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
}

function AutocompletionLieu({ valeur, onChange, id }: AutocompletionLieuProps) {
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
        placeholder="Adresse ou lieu (optionnel)"
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

// ─── Composant occurrence ─────────────────────────────────────────────────────

interface CartOccurrenceProps {
  occurrence: OccurrenceFormulaire;
  index: number;
  peutSupprimer: boolean;
  onChange: (id: string, champ: keyof OccurrenceFormulaire, valeur: string | boolean) => void;
  onSupprimer: (id: string) => void;
  erreurs: Partial<Record<keyof OccurrenceFormulaire, string>>;
}

function CarteOccurrence({ occurrence, index, peutSupprimer, onChange, onSupprimer, erreurs }: CartOccurrenceProps) {
  const prefixId = `occ-${occurrence.id}`;

  return (
    <fieldset className={styles.carteOccurrence}>
      <legend className={styles.legendeOccurrence}>
        Occurrence {index + 1}
        {peutSupprimer && (
          <button
            type="button"
            onClick={() => onSupprimer(occurrence.id)}
            className={styles.boutonSupprimer}
            aria-label={`Supprimer l'occurrence ${index + 1}`}
          >
            ✕
          </button>
        )}
      </legend>

      {/* Journée entière */}
      <div className={styles.ligneCheckbox}>
        <input
          id={`${prefixId}-journee`}
          type="checkbox"
          checked={occurrence.touteLaJournee}
          onChange={(e) => onChange(occurrence.id, "touteLaJournee", e.target.checked)}
        />
        <label htmlFor={`${prefixId}-journee`}>Journée entière</label>
      </div>

      {/* Dates */}
      <div className={styles.ligneDeuxColonnes}>
        <div className={styles.groupe}>
          <label htmlFor={`${prefixId}-debut`}>
            {occurrence.touteLaJournee ? "Date de début" : "Début"} <span className={styles.obligatoire}>*</span>
          </label>
          <input
            id={`${prefixId}-debut`}
            type={occurrence.touteLaJournee ? "date" : "datetime-local"}
            value={occurrence.touteLaJournee ? occurrence.dateDebut.slice(0, 10) : occurrence.dateDebut}
            onChange={(e) => onChange(occurrence.id, "dateDebut", e.target.value)}
            className={`${styles.champ} ${erreurs.dateDebut ? styles.champErreur : ""}`}
            aria-describedby={erreurs.dateDebut ? `erreur-${prefixId}-debut` : undefined}
            aria-invalid={!!erreurs.dateDebut}
            required
          />
          {erreurs.dateDebut && <span id={`erreur-${prefixId}-debut`} className={styles.messageErreur}>{erreurs.dateDebut}</span>}
        </div>

        <div className={styles.groupe}>
          <label htmlFor={`${prefixId}-fin`}>
            {occurrence.touteLaJournee ? "Date de fin" : "Fin"} <span className={styles.obligatoire}>*</span>
          </label>
          <input
            id={`${prefixId}-fin`}
            type={occurrence.touteLaJournee ? "date" : "datetime-local"}
            value={occurrence.touteLaJournee ? occurrence.dateFin.slice(0, 10) : occurrence.dateFin}
            onChange={(e) => onChange(occurrence.id, "dateFin", e.target.value)}
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
        <label htmlFor={`${prefixId}-lieu`}>Lieu</label>
        <AutocompletionLieu
          id={`${prefixId}-lieu`}
          valeur={occurrence.lieu}
          onChange={(v) => onChange(occurrence.id, "lieu", v)}
        />
      </div>

      {/* Rappel */}
      <div className={styles.groupe}>
        <label htmlFor={`${prefixId}-rappel`}>Rappel</label>
        <select
          id={`${prefixId}-rappel`}
          value={occurrence.rappelMinutes}
          onChange={(e) => onChange(occurrence.id, "rappelMinutes", e.target.value)}
          className={styles.champ}
        >
          {OPTIONS_RAPPEL.map((opt) => (
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
  titre?: string;
  occurrences: Record<string, Partial<Record<keyof OccurrenceFormulaire, string>>>;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function FormulaireICS() {
  const [titre, setTitre] = useState("");
  const [notes, setNotes] = useState("");
  const [occurrences, setOccurrences] = useState<OccurrenceFormulaire[]>([occurrenceVide()]);
  const [erreurs, setErreurs] = useState<ErreursFormulaire>({
    occurrences: {},
  });
  const [exportReussi, setExportReussi] = useState(false);
  const tacheDisparitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (tacheDisparitionRef.current) clearTimeout(tacheDisparitionRef.current);
    };
  }, []);

  // ─── Gestion des occurrences ────────────────────────────────────────────────

  const ajouterOccurrence = () => {
    setOccurrences((prev) => [...prev, occurrenceVide()]);
  };

  const supprimerOccurrence = (id: string) => {
    setOccurrences((prev) => prev.filter((o) => o.id !== id));
  };

  const modifierOccurrence = (id: string, champ: keyof OccurrenceFormulaire, valeur: string | boolean) => {
    setOccurrences((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;

        const nvOcc = { ...o, [champ]: valeur };

        // Quand on bascule "journée entière", adapter les valeurs de date
        if (champ === "touteLaJournee") {
          if (valeur === true) {
            // datetime-local → date seule (conserver les 10 premiers caractères)
            nvOcc.dateDebut = o.dateDebut.slice(0, 10);
            nvOcc.dateFin = o.dateFin.slice(0, 10);
          } else {
            // date seule → datetime-local : ajouter T00:00 si besoin
            if (nvOcc.dateDebut.length === 10) {
              nvOcc.dateDebut = `${nvOcc.dateDebut}T00:00`;
            }
            if (nvOcc.dateFin.length === 10) {
              nvOcc.dateFin = `${nvOcc.dateFin}T01:00`;
            }
          }
        }

        return nvOcc;
      }),
    );
  };

  // ─── Validation ─────────────────────────────────────────────────────────────

  const valider = (): ErreursFormulaire | null => {
    const nvErreurs: ErreursFormulaire = { occurrences: {} };
    let valide = true;

    if (!titre.trim()) {
      nvErreurs.titre = "Le titre est obligatoire.";
      valide = false;
    }

    for (const occ of occurrences) {
      const erreursOcc: Partial<Record<keyof OccurrenceFormulaire, string>> = {};

      if (!occ.dateDebut) {
        erreursOcc.dateDebut = "La date de début est obligatoire.";
        valide = false;
      }
      if (!occ.dateFin) {
        erreursOcc.dateFin = "La date de fin est obligatoire.";
        valide = false;
      }

      if (occ.dateDebut && occ.dateFin) {
        const debut = new Date(occ.dateDebut);
        const fin = new Date(occ.dateFin);
        if (fin < debut) {
          erreursOcc.dateFin = "La date de fin doit être après le début.";
          valide = false;
        }
      }

      if (Object.keys(erreursOcc).length > 0) {
        nvErreurs.occurrences[occ.id] = erreursOcc;
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
    setErreurs({ occurrences: {} });

    // Construire l'objet Evenement pour @icsmulti/core
    const evenement: Evenement = {
      titre: titre.trim(),
      notes: notes.trim(),
      occurrences: occurrences.map(
        (occ): Occurrence => ({
          id: occ.id,
          dateDebut: new Date(occ.dateDebut),
          dateFin: new Date(occ.dateFin),
          lieu: occ.lieu.trim(),
          touteLaJournee: occ.touteLaJournee,
          rappelMinutes: occ.rappelMinutes ? Number(occ.rappelMinutes) : undefined,
        }),
      ),
    };

    // Générer le contenu ICS via @icsmulti/core
    const contenuICS = genererICS(evenement);

    // Créer un Blob et déclencher le téléchargement
    const blob = new Blob([contenuICS], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `${slugifier(titre)}.ics`;
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
      <header className={styles.entete}>
        <h1 className={styles.titre}>Générateur de fichier .ics</h1>
        <p className={styles.sousTitre}>
          Créez un événement compatible avec tous les calendriers (Apple, Google, Outlook…)
        </p>
      </header>

      <form
        className={styles.formulaire}
        onSubmit={(e) => {
          e.preventDefault();
          telecharger();
        }}
        noValidate
      >
        {/* Titre */}
        <div className={styles.groupe}>
          <label htmlFor="titre-evenement">
            Titre <span className={styles.obligatoire}>*</span>
          </label>
          <input
            id="titre-evenement"
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Nom de l'événement"
            className={`${styles.champ} ${erreurs.titre ? styles.champErreur : ""}`}
            aria-describedby={erreurs.titre ? "erreur-titre-evenement" : undefined}
            aria-invalid={!!erreurs.titre}
            required
          />
          {erreurs.titre && <span id="erreur-titre-evenement" className={styles.messageErreur}>{erreurs.titre}</span>}
        </div>

        {/* Notes */}
        <div className={styles.groupe}>
          <label htmlFor="notes-evenement">Notes</label>
          <textarea
            id="notes-evenement"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Description, informations complémentaires… (optionnel)"
            rows={3}
            className={styles.champ}
          />
        </div>

        {/* Occurrences */}
        <div className={styles.sectionOccurrences}>
          <h2 className={styles.titreSectionOccurrences}>Occurrences</h2>

          {occurrences.map((occ, index) => (
            <CarteOccurrence
              key={occ.id}
              occurrence={occ}
              index={index}
              peutSupprimer={occurrences.length > 1}
              onChange={modifierOccurrence}
              onSupprimer={supprimerOccurrence}
              erreurs={erreurs.occurrences[occ.id] ?? {}}
            />
          ))}

          <button type="button" onClick={ajouterOccurrence} className={styles.boutonAjouter}>
            + Ajouter une occurrence
          </button>
        </div>

        {/* Bouton export */}
        <div className={styles.zoneTelecharger}>
          <button type="submit" className={styles.boutonTelecharger}>
            ↓ Télécharger le .ics
          </button>
          {exportReussi && <output className={styles.feedbackReussi}>Fichier généré !</output>}
        </div>
      </form>

      {/* Attribution OSM obligatoire */}
      <footer className={styles.attribution}>
        Autocomplétion des adresses :{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          © OpenStreetMap contributors
        </a>
      </footer>
    </div>
  );
}
