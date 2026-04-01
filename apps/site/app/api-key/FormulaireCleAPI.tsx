"use client";

// Composant Client minimal — nécessaire uniquement pour useActionState
// qui permet d'afficher le résultat de la Server Action (clé générée ou erreur).

import { useActionState } from "react";
import { creerCleAPI, type ResultatCreation } from "./actions";
import styles from "./page.module.css";

const etatInitial: ResultatCreation = {};

export default function FormulaireCleAPI() {
  const [etat, actionFormulaire, enCours] = useActionState(
    creerCleAPI,
    etatInitial,
  );

  return (
    <section className={styles.section}>
      {/* ── Résultat : clé générée ── */}
      {etat.cleGeneree && (
        <div className={styles.avertissement} role="alert">
          <p className={styles.avertissementTitre}>
            ⚠ Copiez cette clé maintenant — elle ne sera plus affichée
          </p>
          <code className={styles.cleGeneree}>{etat.cleGeneree}</code>
        </div>
      )}

      {/* ── Résultat : erreur ── */}
      {etat.erreur && (
        <div className={styles.erreur} role="alert">
          {etat.erreur}
        </div>
      )}

      {/* ── Formulaire de génération ── */}
      <form action={actionFormulaire} className={styles.formulaire}>
        <div className={styles.groupe}>
          <label htmlFor="label" className={styles.labelChamp}>
            Label <span className={styles.optionnel}>(optionnel)</span>
          </label>
          <input
            id="label"
            name="label"
            type="text"
            placeholder="Ex : Mon application, Script de prod…"
            className={styles.champ}
            maxLength={80}
            autoComplete="off"
          />
        </div>

        <button
          type="submit"
          disabled={enCours}
          className={styles.boutonGenerer}
        >
          {enCours ? "Génération…" : "Générer une clé API"}
        </button>
      </form>
    </section>
  );
}
