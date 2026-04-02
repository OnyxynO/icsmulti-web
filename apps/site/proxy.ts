// Proxy next-intl : détecte la locale depuis l'URL et redirige si nécessaire.
// Renommé de middleware.ts → proxy.ts (convention Next.js 16).
// Exclut les routes API, assets statiques et fichiers Next.js internes.

import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// La fonction doit s'appeler `proxy` en Next.js 16 (anciennement `middleware`)
export default createMiddleware(routing);

export const config = {
	// Appliquer le proxy à toutes les routes sauf :
	// - /api/*, /_next/*, /_vercel/*
	// - les fichiers avec extension (favicon.ico, images…)
	matcher: "/((?!api/|_next|_vercel|.*\\..*).*)",
};
