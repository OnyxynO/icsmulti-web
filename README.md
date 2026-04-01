# ICSMulti Web

Générateur de fichiers `.ics` (RFC 5545) décliné en 3 modules : formulaire web, API REST et widget embarquable. Extension web de [l'app macOS ICSMulti](https://github.com/OnyxynO/icsmulti).

🌐 **[icsmulti-web.vercel.app](https://icsmulti-web.vercel.app)**

## Modules

| Module | URL | Description |
|--------|-----|-------------|
| **Formulaire web** | `/app` | Génération directe dans le navigateur, sans installation |
| **API REST** | `/api/generate` | Intégration dans vos applications via HTTP |
| **Widget** | `/widget` | Script embarquable sur n'importe quel site _(à venir)_ |
| **App macOS** | `/desktop` | Application native multi-occurrences |

## Architecture

```
icsmulti-web/
├── apps/
│   └── site/              ← Next.js 16 + React 19 — landing + /app + /api/generate
├── packages/
│   ├── core/              ← @icsmulti/core — générateur ICS TypeScript, zéro dépendance
│   └── widget/            ← bundle IIFE Vite, intégrable dans tout site
├── vercel.json            ← config déploiement monorepo (outputDirectory: apps/site/.next)
└── package.json           ← npm workspaces
```

## Stack

- **Next.js 16.2** + React 19 (App Router, Server Components)
- **next-intl 4.9** — i18n FR / EN
- **CSS Modules** — pas de Tailwind
- **Biome 2.x** — lint + format
- **Vitest** — tests unitaires `packages/core`
- **Vite** (lib mode IIFE) — build `packages/widget`
- **Upstash Redis** — stockage des clés API
- **Vercel** — déploiement

## Développement

```bash
# Installer les dépendances
npm install

# Démarrer en développement (core en watch + site)
npm run dev

# Builder tout (core → widget → site)
npm run build

# Tests
npm test

# Lint + format
npm run check
```

> **Ordre de build obligatoire :** `packages/core` doit être buildé avant `apps/site`.

## API REST

```bash
POST https://icsmulti-web.vercel.app/api/generate
X-API-Key: votre-cle-api
Content-Type: application/json

{
  "evenement": {
    "titre": "Réunion hebdomadaire",
    "notes": "Salle A",
    "occurrences": [
      {
        "id": "occ-1",
        "dateDebut": "2026-05-12T10:00:00",
        "dateFin": "2026-05-12T11:00:00",
        "lieu": "Paris",
        "touteLaJournee": false,
        "rappelMinutes": 30
      }
    ]
  }
}
```

Obtenez une clé API sur [icsmulti-web.vercel.app/api-key](https://icsmulti-web.vercel.app/api-key).

## i18n

- **Français** (défaut) : `/`, `/app`, `/api-docs`, `/widget`, `/desktop`, `/api-key`
- **Anglais** : `/en`, `/en/app`, `/en/api-docs`, etc.

## Contraintes RFC 5545

- CRLF obligatoire sur toutes les lignes
- Line folding à 75 octets
- Journée entière : `VALUE=DATE`, fin = J+1
- Fuseau horaire explicite (défaut `Europe/Paris`)
- Rappels : bloc `VALARM` avec `TRIGGER:-PTxM`
