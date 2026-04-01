// Nav — barre de navigation principale.
// Server Component : lit les traductions côté serveur.
// Le switcher de langue est un Client Component séparé (accès à usePathname).

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SwitcheurLocale from "./SwitcheurLocale";
import styles from "./Nav.module.css";

export default async function Nav() {
	const t = await getTranslations("nav");

	return (
		<nav className={styles.nav}>
			<div className={styles.interieur}>
				{/* Logo / nom du produit */}
				<Link href="/" className={styles.logo}>
					ICSMulti
				</Link>

				{/* Liens principaux */}
				<ul className={styles.liens}>
					<li>
						<Link href="/app" className={styles.lien}>
							{t("app")}
						</Link>
					</li>
					<li>
						<Link href="/api-docs" className={styles.lien}>
							{t("api")}
						</Link>
					</li>
					<li>
						<Link href="/widget" className={styles.lien}>
							{t("widget")}
						</Link>
					</li>
					<li>
						<Link href="/desktop" className={styles.lien}>
							{t("desktop")}
						</Link>
					</li>
				</ul>

				{/* Switcher FR / EN */}
				<SwitcheurLocale />
			</div>
		</nav>
	);
}
