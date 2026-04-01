// Configuration Next.js — enveloppée par le plugin next-intl pour l'i18n.
// Le plugin injecte automatiquement createNextIntlPlugin dans le pipeline de build.

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {};

// Pointe vers notre fichier getRequestConfig (chemin relatif depuis apps/site/)
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
