// Page /widget — présentation du widget embarquable.
// Server Component statique.

import { getTranslations } from "next-intl/server";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import styles from "./page.module.css";

export default async function PageWidget() {
	const t = await getTranslations("widget_page");

	return (
		<div className={styles.page}>
			<Nav />
			<main className={styles.main}>
				<header className={styles.entete}>
					<h1 className={styles.titre}>{t("titre")}</h1>
					<p className={styles.sousTitre}>{t("sous_titre")}</p>
				</header>

				<div className={styles.badge}>{t("disponible_bientot")}</div>
			</main>
			<Footer />
		</div>
	);
}
