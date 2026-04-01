// Layout racine localisé — remplace l'ancien app/layout.tsx.
// Charge les polices Geist, applique la locale, fournit NextIntlClientProvider.

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "ICSMulti — Générateur de fichier .ics",
	description:
		"Créez des fichiers .ics (RFC 5545) compatibles avec Apple Calendrier, Google Calendar et Outlook. Support des occurrences multiples, rappels et fuseaux horaires.",
};

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params;

	// Affiche 404 si la locale n'est pas supportée
	if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
		notFound();
	}

	// Les messages sont chargés côté serveur et passés au Provider côté client
	const messages = await getMessages();

	return (
		<html
			lang={locale}
			className={`${geistSans.variable} ${geistMono.variable}`}
		>
			<body>
				<NextIntlClientProvider messages={messages}>
					{children}
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
