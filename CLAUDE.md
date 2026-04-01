# CLAUDE.md — icsmulti-web

## Contexte projet

Extension web de l'app macOS ICSMulti (Swift, repo `icsmulti`).
Générateur de fichiers `.ics` (RFC 5545) décliné en 3 modules web partageant un core TypeScript commun.

**Repo :** `icsmulti-web` — npm workspaces natif (pas Turborepo)
**Déploiement :** Vercel (`icsmulti-web.vercel.app`)

## Architecture

```
icsmulti-web/
├── apps/
│   └── site/              ← Next.js 16 + React 19 — landing + /app + /api/generate
├── packages/
│   ├── core/              ← @icsmulti/core — ICS generator TypeScript, zéro dépendance
│   └── widget/            ← bundle IIFE Vite, intégrable dans tout site
├── biome.json             ← lint + format (remplace ESLint + Prettier)
├── tsconfig.base.json     ← config TS partagée
└── package.json           ← workspaces: ["apps/*", "packages/*"]
```

## Stack

| Outil | Usage |
|---|---|
| Next.js 16.2 + React 19 | `apps/site` |
| Biome 2.x | lint + format — `npm run check` depuis la racine |
| Vitest | tests `packages/core` |
| Vite (lib mode IIFE) | build `packages/widget` |
| next-intl | i18n FR + EN (à intégrer en phase 5) |
| Upstash KV | stockage clés API (à intégrer en phase 4) |
| Vercel Analytics | événements custom export/usage |

## Ordre de build

```json
"build": "npm run build -w packages/core && npm run build -w packages/widget && npm run build -w apps/site"
```

Toujours builder `core` en premier — `site` et `widget` en dépendent.

## Phases de développement

- [x] **Phase 1** — Setup monorepo (npm workspaces + Biome + tsconfig.base.json)
- [x] **Phase 2** — `packages/core` : portage TypeScript de `ICSGenerator.swift` + tests Vitest
- [x] **Phase 3** — Module web : formulaire Next.js + Nominatim + export client
- [x] **Phase 4** — Module API : `POST /api/generate` + clés API (Upstash KV) + page `/api-key`
- [ ] **Phase 5** — Site landing : i18n next-intl + pages `/app`, `/api-docs`, `/widget`, `/desktop`
- [ ] **Phase 6** — Module widget : bundle Vite IIFE → `apps/site/public/widget.js`

## Contraintes RFC 5545 (core)

- CRLF (`\r\n`) obligatoire sur toutes les lignes
- Line folding à 75 octets (continuation CRLF + espace)
- Échappement : `\` → `\\`, `;` → `\;`, `,` → `\,`, newline → `\n`
- Journée entière : `VALUE=DATE`, format `YYYYMMDD`, fin = J+1
- Rappels : bloc `VALARM` avec `TRIGGER:-PTxM`
- `DTSTAMP` et `UID` uniques par occurrence
- Fuseau horaire explicite dans `DTSTART`/`DTEND` (défaut `Europe/Paris`)

## Conventions

- **Français** : noms de variables, commentaires, commits (Conventional Commits)
- **Biome** seul pour lint + format, pas d'ESLint ni Prettier
- **Pas de `'use client'`** sauf nécessité absolue (interactivité ou API navigateur)
- **Autocomplétion adresses** : Nominatim OSM uniquement (gratuit, sans clé, RGPD-friendly)
  - `GET https://nominatim.openstreetmap.org/search?q=...&format=json&limit=5`
  - Déclenchement après 3 caractères, debounce 300 ms
  - Attribution OSM obligatoire dans l'UI

## Pièges connus

- `packages/core` doit être buildé avant `apps/site` — sinon erreur d'import
- Le champ `exports` dans `package.json` est obligatoire pour que TypeScript trouve les types (leçon pi-mono)
- Next.js 16 : toutes les APIs request sont async — `await cookies()`, `await headers()`, `await params`
- Widget : CSS scopé avec préfixe `icsmulti-` pour éviter les collisions dans les sites hôtes
