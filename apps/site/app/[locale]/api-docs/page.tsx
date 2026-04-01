// Page /api-docs — documentation de l'API REST ICSMulti.
// Server Component statique.

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { URL_API_BASE } from "@/lib/config";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import styles from "./page.module.css";

export default async function PageApiDocs() {
	const t = await getTranslations("api_docs");

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
					<pre className={styles.bloc}>POST {URL_API_BASE}/api/generate</pre>
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

				{/* ── Exemple de requête ── */}
				<section className={styles.section}>
					<h2 className={styles.titreSec}>{t("exemple_titre")}</h2>
					<pre className={styles.bloc}>{`curl -X POST ${URL_API_BASE}/api/generate \\
  -H "X-API-Key: votre-cle-api" \\
  -H "Content-Type: application/json" \\
  -d '{
    "evenement": {
      "titre": "Réunion hebdomadaire",
      "notes": "Salle A",
      "occurrences": [
        {
          "debut": "2026-05-12T10:00:00",
          "fin": "2026-05-12T11:00:00",
          "fuseau": "Europe/Paris"
        }
      ]
    }
  }'`}</pre>
				</section>
			</main>
			<Footer />
		</div>
	);
}
