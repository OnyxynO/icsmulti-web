// Page /app — affiche le formulaire ICS.
// Server Component léger : wrapp le composant Client FormulaireICS.

import { getTranslations } from "next-intl/server";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import FormulaireICS from "@/app/components/FormulaireICS";
import styles from "./page.module.css";

export default async function PageApp() {
	const t = await getTranslations("app_page");

	return (
		<div className={styles.page}>
			<Nav />
			<main className={styles.main}>
				<header className={styles.entete}>
					<h1 className={styles.titre}>{t("titre")}</h1>
					<p className={styles.sousTitre}>{t("sous_titre")}</p>
				</header>
				<FormulaireICS />
			</main>
			<Footer />
		</div>
	);
}
