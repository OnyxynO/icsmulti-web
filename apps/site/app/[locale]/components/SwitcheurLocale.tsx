"use client";

// SwitcheurLocale — Client Component nécessaire pour accéder à usePathname
// et déclencher la navigation vers la locale opposée.

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import styles from "./SwitcheurLocale.module.css";

export default function SwitcheurLocale() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const localeCible = locale === "fr" ? "en" : "fr";

  function basculer() {
    // Navigue vers le même chemin dans l'autre locale
    router.replace(pathname, { locale: localeCible });
  }

  return (
    <button
      type="button"
      onClick={basculer}
      className={styles.bouton}
      aria-label={`Passer en ${localeCible.toUpperCase()}`}
    >
      {locale === "fr" ? "EN" : "FR"}
    </button>
  );
}
