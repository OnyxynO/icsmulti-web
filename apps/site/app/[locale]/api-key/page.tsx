// Page /api-key — Server Component
// Affiche les instructions d'utilisation et intègre le formulaire Client.

import { getTranslations } from "next-intl/server";
import { URL_API_BASE } from "@/lib/config";
import styles from "./page.module.css";
import FormulaireCleAPI from "./FormulaireCleAPI";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Clés API — ICSMulti",
	description:
		"Générez une clé API pour accéder à l'endpoint POST /api/generate depuis vos applications.",
};

export default async function PageCleAPI() {
	const t = await getTranslations("api_key_page");

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				minHeight: "100vh",
				background: "var(--background, #0a0a0a)",
			}}
		>
			<Nav />
			<main className={styles.conteneur}>
				<div className={styles.entete}>
					<h1 className={styles.titre}>{t("titre")}</h1>
					<p className={styles.sousTitre}>{t("sous_titre")}</p>
				</div>

				{/* Formulaire Client — useActionState pour afficher la clé générée */}
				<FormulaireCleAPI />

				<section className={styles.sectionInfo}>
					<h2 className={styles.titreSectionInfo}>{t("section_utilisation")}</h2>
					<p className={styles.texteInfo}>{t("texte_utilisation")}</p>
					<pre className={styles.bloc}>{`curl -X POST ${URL_API_BASE}/api/generate \\
  -H "X-API-Key: votre-cle-api" \\
  -H "Content-Type: application/json" \\
  -d '{"evenement": {"titre": "...", "notes": "", "occurrences": [...]}}'`}</pre>
				</section>
			</main>
			<Footer />
		</div>
	);
}
