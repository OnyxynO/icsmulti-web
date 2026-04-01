// Footer — Server Component, traductions via getTranslations.

import { getTranslations } from "next-intl/server";
import styles from "./Footer.module.css";

export default async function Footer() {
	const t = await getTranslations("footer");

	return (
		<footer className={styles.footer}>
			<div className={styles.interieur}>
				<span className={styles.copyright}>{t("copyright")}</span>
				<a
					href="https://github.com/OnyxynO/icsmulti-web"
					target="_blank"
					rel="noopener noreferrer"
					className={styles.lien}
				>
					{t("github")}
				</a>
			</div>
		</footer>
	);
}
