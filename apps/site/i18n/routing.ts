// Configuration du routing i18n : locales supportées et préfixes d'URL.
// - fr = locale par défaut, sans préfixe (/,  /app, /api-docs…)
// - en = avec préfixe (/en, /en/app, /en/api-docs…)

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
	locales: ["fr", "en"],
	defaultLocale: "fr",
	localePrefix: "as-needed", // fr sans préfixe, en avec /en
});
