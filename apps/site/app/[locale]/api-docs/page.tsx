// Page /api-docs — documentation complète de l'API REST ICSMulti.
// Server Component statique.

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { URL_API_BASE } from "@/lib/config";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import styles from "./page.module.css";

export default async function PageApiDocs() {
  const t = await getTranslations("api_docs");

  const urlEndpoint = `${URL_API_BASE}/api/generate`;

  return (
    <div className={styles.page}>
      <Nav />
      <main className={styles.main}>
        <header className={styles.entete}>
          <h1 className={styles.titre}>{t("titre")}</h1>
          <p className={styles.sousTitre}>{t("sous_titre")}</p>
        </header>

        {/* ── Endpoint ── */}
        <section className={styles.section}>
          <h2 className={styles.titreSec}>{t("endpoint_titre")}</h2>
          <pre className={styles.bloc}>POST {urlEndpoint}</pre>
        </section>

        {/* ── Authentification ── */}
        <section className={styles.section}>
          <h2 className={styles.titreSec}>{t("auth_titre")}</h2>
          <p className={styles.texte}>{t("auth_desc")}</p>
          <pre className={styles.bloc}>X-API-Key: votre-cle-api</pre>
          <Link href="/api-key" className={styles.lienCleApi}>
            {t("cle_api_lien")}
          </Link>
        </section>

        {/* ── Schéma du corps ── */}
        <section className={styles.section}>
          <h2 className={styles.titreSec}>{t("schema_titre")}</h2>
          <pre className={styles.bloc}>{`{
  "evenement": {                        // ${t("schema_obligatoire")}
    "occurrences": [                    // ${t("schema_obligatoire")} — au moins un événement
      {
        "id":             string,       // ${t("schema_obligatoire")} — identifiant unique
        "titre":          string,       // ${t("schema_obligatoire")} — titre de l'événement
        "notes":          string,       // ${t("schema_optionnel")}  — description / notes
        "dateDebut":      string,       // ${t("schema_obligatoire")} — ISO 8601 (ex : "2026-05-12T10:00:00Z")
        "dateFin":        string,       // ${t("schema_obligatoire")} — ISO 8601
        "lieu":           string,       // ${t("schema_optionnel")}  — adresse ou lieu
        "touteLaJournee": boolean,      // ${t("schema_optionnel")}  — défaut : false
        "rappelMinutes":  number        // ${t("schema_optionnel")}  — ex : 15, 30, 60, 1440
      }
    ]
  },
  "options": {                          // ${t("schema_optionnel")}
    "fuseau": string                    // ${t("schema_optionnel")}  — IANA (défaut : "Europe/Paris")
  }
}`}</pre>
        </section>

        {/* ── Réponse ── */}
        <section className={styles.section}>
          <h2 className={styles.titreSec}>{t("reponse_titre")}</h2>

          <h3 className={styles.titreTertaire}>{t("reponse_succes")}</h3>
          <pre className={styles.bloc}>{`Content-Type: text/calendar; charset=utf-8
Content-Disposition: attachment; filename="titre_premiere_occurrence.ics"

BEGIN:VCALENDAR
VERSION:2.0
...`}</pre>

          <h3 className={styles.titreTertaire}>{t("reponse_erreurs")}</h3>
          <table className={styles.tableau}>
            <thead>
              <tr>
                <th className={styles.th}>Code</th>
                <th className={styles.th}>{"error"}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.td}>
                  <code className={styles.code}>400</code>
                </td>
                <td className={styles.td}>Corps JSON invalide / champ manquant ou incorrect</td>
              </tr>
              <tr>
                <td className={styles.td}>
                  <code className={styles.code}>401</code>
                </td>
                <td className={styles.td}>Clé API manquante (header X-API-Key absent)</td>
              </tr>
              <tr>
                <td className={styles.td}>
                  <code className={styles.code}>403</code>
                </td>
                <td className={styles.td}>Clé API invalide ou révoquée</td>
              </tr>
              <tr>
                <td className={styles.td}>
                  <code className={styles.code}>503</code>
                </td>
                <td className={styles.td}>Service non configuré (KV indisponible)</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── Exemple de requête ── */}
        <section className={styles.section}>
          <h2 className={styles.titreSec}>{t("exemple_titre")}</h2>
          <pre className={styles.bloc}>{`curl -X POST ${urlEndpoint} \\
  -H "X-API-Key: votre-cle-api" \\
  -H "Content-Type: application/json" \\
  -o reunion.ics \\
  -d '{
    "evenement": {
      "occurrences": [
        {
          "id": "evt-1",
          "titre": "Réunion hebdomadaire",
          "notes": "Ordre du jour à confirmer",
          "dateDebut": "2026-05-12T10:00:00Z",
          "dateFin": "2026-05-12T11:00:00Z",
          "lieu": "Salle A, Paris",
          "touteLaJournee": false,
          "rappelMinutes": 15
        }
      ]
    },
    "options": {
      "fuseau": "Europe/Paris"
    }
  }'`}</pre>
        </section>
      </main>
      <Footer />
    </div>
  );
}
