// Page /widget — documentation + démo live du widget embarquable ICSMulti.
// Server Component statique.

import { getLocale, getTranslations } from "next-intl/server";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import DemoWidget from "./DemoWidget";
import styles from "./page.module.css";

export default async function PageWidget() {
  const t = await getTranslations("widget_page");
  const locale = await getLocale();
  const lang = locale === "en" ? "en" : "fr";

  return (
    <div className={styles.page}>
      <Nav />
      <main className={styles.main}>
        <header className={styles.entete}>
          <h1 className={styles.titre}>{t("titre")}</h1>
          <p className={styles.sousTitre}>{t("sous_titre")}</p>
        </header>

        {/* ── Démo live ── */}
        <section className={styles.section}>
          <h2 className={styles.titreSec}>{t("demo_titre")}</h2>
          <div className={styles.conteneurDemo}>
            <DemoWidget lang={lang} />
          </div>
        </section>

        {/* ── Étape 1 : conteneur ── */}
        <section className={styles.section}>
          <h2 className={styles.titreSec}>{t("etape1_titre")}</h2>
          <pre className={styles.bloc}>{`<div id="icsmulti-widget"></div>`}</pre>
        </section>

        {/* ── Étape 2 : script ── */}
        <section className={styles.section}>
          <h2 className={styles.titreSec}>{t("etape2_titre")}</h2>
          <pre className={styles.bloc}>{`<script src="https://icsmulti-web.vercel.app/widget.js"></script>`}</pre>
        </section>

        {/* ── Étape 3 : initialisation ── */}
        <section className={styles.section}>
          <h2 className={styles.titreSec}>{t("etape3_titre")}</h2>
          <pre className={styles.bloc}>{`<script>
  ICSMulti.init({
    container: "#icsmulti-widget",
    theme: "auto",
    lang: "fr"
  });
</script>`}</pre>
        </section>

        {/* ── Options ── */}
        <section className={styles.section}>
          <h2 className={styles.titreSec}>{t("options_titre")}</h2>
          <ul className={styles.listeOptions}>
            <li className={styles.option}>
              <code className={styles.code}>{t("option_container")}</code>
            </li>
            <li className={styles.option}>
              <code className={styles.code}>{t("option_theme")}</code>
            </li>
            <li className={styles.option}>
              <code className={styles.code}>{t("option_lang")}</code>
            </li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
