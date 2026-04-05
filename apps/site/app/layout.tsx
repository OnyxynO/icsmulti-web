// Layout racine minimal — requis par Next.js pour les routes hors [locale]
// (ex : /api/generate). Ne contient pas de provider i18n ni de polices.
// Le vrai layout localisé est dans app/[locale]/layout.tsx.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
