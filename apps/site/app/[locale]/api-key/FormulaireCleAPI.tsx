"use client";

// Composant Client minimal — nécessaire uniquement pour useActionState
// qui permet d'afficher le résultat de la Server Action (clé générée ou erreur).

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { creerCleAPI, type ResultatCreation } from "./actions";
import styles from "./page.module.css";

const etatInitial: ResultatCreation = {};

export default function FormulaireCleAPI() {
  const t = useTranslations("api_key_page");
  const [etat, actionFormulaire, enCours] = useActionState(creerCleAPI, etatInitial);

  return (
    <section className={styles.section}>
      {/* ── Résultat : clé générée ── */}
      {etat.cleGeneree && (
        <div className={styles.avertissement} role="alert">
          <p className={styles.avertissementTitre}>{t("copier_maintenant")}</p>
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
            {t("label_champ")} <span className={styles.optionnel}>{t("optionnel")}</span>
          </label>
          <input
            id="label"
            name="label"
            type="text"
            placeholder={t("placeholder_label")}
            className={styles.champ}
            maxLength={80}
            autoComplete="off"
          />
        </div>

        <button type="submit" disabled={enCours} className={styles.boutonGenerer}>
          {enCours ? t("generer_en_cours") : t("bouton_generer")}
        </button>
      </form>
    </section>
  );
}
