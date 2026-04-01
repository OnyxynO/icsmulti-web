// Page /api-key — Server Component
// Affiche les instructions d'utilisation et intègre le formulaire Client.

import styles from "./page.module.css";
import FormulaireCleAPI from "./FormulaireCleAPI";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clés API — ICSMulti",
  description:
    "Générez une clé API pour accéder à l'endpoint POST /api/generate depuis vos applications.",
};

export default function PageCleAPI() {
  return (
    <main className={styles.conteneur}>
      <div className={styles.entete}>
        <h1 className={styles.titre}>Clés API</h1>
        <p className={styles.sousTitre}>
          Générez une clé API pour accéder à{" "}
          <code className={styles.code}>POST /api/generate</code> depuis vos
          applications.
        </p>
      </div>

      {/* Formulaire Client — useActionState pour afficher la clé générée */}
      <FormulaireCleAPI />

      <section className={styles.sectionInfo}>
        <h2 className={styles.titreSectionInfo}>Utilisation</h2>
        <p className={styles.texteInfo}>
          Ajoutez votre clé dans le header{" "}
          <code className={styles.code}>X-API-Key</code> de chaque requête :
        </p>
        <pre className={styles.bloc}>{`curl -X POST https://icsmulti-web.vercel.app/api/generate \\
  -H "X-API-Key: votre-cle-api" \\
  -H "Content-Type: application/json" \\
  -d '{"evenement": {"titre": "...", "notes": "", "occurrences": [...]}}'`}</pre>
      </section>
    </main>
  );
}
