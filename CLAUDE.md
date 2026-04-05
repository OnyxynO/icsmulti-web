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
| Vitest | tests `packages/core` (51 tests) + `apps/site` (15 tests) + `packages/widget` (25 tests) |
| Vite (lib mode IIFE) | build `packages/widget` |
| next-intl 4.9 | i18n FR + EN — fr sans préfixe, en avec /en |
| Upstash KV | stockage clés API |

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
- [x] **Phase 5** — Site landing : i18n next-intl + pages `/app`, `/api-docs`, `/widget`, `/desktop`
- [x] **Phase 6** — Module widget : bundle Vite IIFE → `apps/site/public/widget.js`
- [x] **Tests** — 91 tests Vitest (51 core RFC 5545 + 15 route handler + 25 widget jsdom)
- [x] **CI/CD** — `.github/workflows/ci.yml` — `npm test` + `biome check` sur push/PR
- [x] **VTIMEZONE RFC 5545 §3.6.5** — calcul DST dynamique via API Intl, sans dépendance
- [x] **Démo live** — DemoWidget Client Component sur /widget (next/script + ICSMulti.init())
- [x] **Doc API** — /api-docs : schéma complet, codes d'erreur, curl corrigé
- [x] **Refactoring titre/notes par occurrence** — chaque VEVENT est indépendant (web + Swift)

## Modèle de données (core)

```ts
interface Occurrence {
  id: string;
  titre: string;          // propre à chaque occurrence
  notes: string;          // propre à chaque occurrence
  dateDebut: Date;
  dateFin: Date;
  lieu: string;
  touteLaJournee: boolean;
  rappelMinutes?: number;
}

interface Evenement {
  occurrences: Occurrence[];  // titre/notes au niveau occurrence, pas à ce niveau
}
```

Chaque `Occurrence` génère un VEVENT indépendant avec son propre `SUMMARY` et `DESCRIPTION`.
Le nom du fichier `.ics` exporté est basé sur le titre de la première occurrence.

## Contraintes RFC 5545 (core)

- CRLF (`\r\n`) obligatoire sur toutes les lignes
- Line folding à 75 octets (continuation CRLF + espace)
- Échappement : `\` → `\\`, `;` → `\;`, `,` → `\,`, newline → `\n`
- Journée entière : `VALUE=DATE`, format `YYYYMMDD`, fin = J+1
- Rappels : bloc `VALARM` avec `TRIGGER:-PTxM`
- `DTSTAMP` et `UID` uniques par occurrence
- Fuseau horaire explicite dans `DTSTART`/`DTEND` (défaut `Europe/Paris`)
- `VTIMEZONE` généré dynamiquement pour chaque fuseau IANA utilisé (calcul DST via `Intl`)

## Conventions

- **Français** : noms de variables, commentaires, commits (Conventional Commits)
- **Biome** seul pour lint + format, pas d'ESLint ni Prettier
- **Pas de `'use client'`** sauf nécessité absolue (interactivité ou API navigateur)
- **Autocomplétion adresses** : Nominatim OSM uniquement (gratuit, sans clé, RGPD-friendly)
  - `GET https://nominatim.openstreetmap.org/search?q=...&format=json&limit=5`
  - Déclenchement après 3 caractères, debounce 300 ms
  - Attribution OSM obligatoire dans l'UI

## À faire

Rien — projet complet.

## Pièges connus

- `packages/core` doit être buildé avant `apps/site` — sinon erreur d'import
- Le champ `exports` dans `package.json` est obligatoire pour que TypeScript trouve les types
- Next.js 16 : toutes les APIs request sont async — `await cookies()`, `await headers()`, `await params`
- Widget : CSS scopé avec préfixe `icsmulti-` pour éviter les collisions dans les sites hôtes
- **Matcher proxy.ts** : utiliser `api/` (avec slash) et non `api` dans le lookahead négatif — sinon toutes les pages dont le nom commence par "api" (ex: `/api-docs`, `/api-key`) sont exclues du middleware i18n et tombent en 404
- **Tests widget / jsdom** : `matchMedia`, `URL.createObjectURL` et `URL.revokeObjectURL` ne sont pas implémentés dans jsdom — les mocker en tête du fichier de test avec `Object.defineProperty` + `vi.fn()`
