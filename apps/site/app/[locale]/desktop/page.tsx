// Page /desktop — présentation de l'app macOS + lien GitHub releases.
// Server Component statique.

import { getTranslations } from "next-intl/server";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import styles from "./page.module.css";

export default async function PageDesktop() {
	const t = await getTranslations("desktop_page");

	return (
		<div className={styles.page}>
			<Nav />
			<main className={styles.main}>
				<header className={styles.entete}>
					<div className={styles.icone}>🖥</div>
					<h1 className={styles.titre}>{t("titre")}</h1>
					<p className={styles.sousTitre}>{t("sous_titre")}</p>
				</header>

				<p className={styles.description}>{t("description")}</p>

				<a
					href={t("github_url")}
					target="_blank"
					rel="noopener noreferrer"
					className={styles.boutonTelechargement}
				>
					{t("telecharger")}
				</a>
			</main>
			<Footer />
		</div>
	);
}
