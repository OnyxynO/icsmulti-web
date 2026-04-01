// Landing page — Server Component.
// Présente les 3 modules : Formulaire web, API REST, App macOS.

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import styles from "./page.module.css";

export default async function PageAccueil() {
	const t = await getTranslations("landing");

	return (
		<div className={styles.page}>
			<Nav />

			<main className={styles.main}>
				{/* ── Hero ── */}
				<section className={styles.hero}>
					<h1 className={styles.heroTitre}>{t("hero_titre")}</h1>
					<p className={styles.heroSousTitre}>{t("hero_sous_titre")}</p>
					<Link href="/app" className={styles.heroCta}>
						{t("hero_cta")}
					</Link>
				</section>

				{/* ── 3 cards modules ── */}
				<section className={styles.grille}>
					{/* Module Web */}
					<div className={styles.carte}>
						<div className={styles.carteIcone}>🗓</div>
						<h2 className={styles.carteTitre}>{t("module_web_titre")}</h2>
						<p className={styles.carteDesc}>{t("module_web_desc")}</p>
						<Link href="/app" className={styles.carteLien}>
							{t("module_web_cta")}
						</Link>
					</div>

					{/* Module API */}
					<div className={styles.carte}>
						<div className={styles.carteIcone}>⚡</div>
						<h2 className={styles.carteTitre}>{t("module_api_titre")}</h2>
						<p className={styles.carteDesc}>{t("module_api_desc")}</p>
						<Link href="/api-docs" className={styles.carteLien}>
							{t("module_api_cta")}
						</Link>
					</div>

					{/* Module Widget */}
					<div className={styles.carte}>
						<div className={styles.carteIcone}>🧩</div>
						<h2 className={styles.carteTitre}>{t("module_widget_titre")}</h2>
						<p className={styles.carteDesc}>{t("module_widget_desc")}</p>
						<Link href="/widget" className={styles.carteLien}>
							{t("module_widget_cta")}
						</Link>
					</div>

					{/* Module Desktop */}
					<div className={styles.carte}>
						<div className={styles.carteIcone}>🖥</div>
						<h2 className={styles.carteTitre}>{t("module_desktop_titre")}</h2>
						<p className={styles.carteDesc}>{t("module_desktop_desc")}</p>
						<Link href="/desktop" className={styles.carteLien}>
							{t("module_desktop_cta")}
						</Link>
					</div>
				</section>
			</main>

			<Footer />
		</div>
	);
}
