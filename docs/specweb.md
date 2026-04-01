# ICSMulti Web — Spécifications techniques

> Document de travail — à affiner avant de créer le repo.

---

## Contexte

ICSMulti existe déjà en version desktop macOS (Swift, DMG, repo `icsmulti`).
Ce document spécifie l'extension web : même fonctionnalité, déclinée en 3 nouveaux modules partageant un core TypeScript commun.

**Repo dédié :** `icsmulti-web` (distinct du repo Swift, npm workspaces natif)
**Déploiement :** Vercel

---

## Architecture monorepo

```
icsmulti-web/
├── apps/
│   └── site/              ← Next.js — landing page + module web + API routes
├── packages/
│   ├── core/              ← ICS generator TypeScript (partagé)
│   └── widget/            ← bundle JS intégrable (Vite lib mode)
├── biome.json             ← lint + format pour tous les packages
├── tsconfig.base.json     ← config TypeScript partagée, étendue par chaque package
└── package.json           ← workspaces: ["apps/*", "packages/*"]
```

`apps/site` regroupe le site de présentation, le formulaire web et les endpoints API dans une seule app Next.js → un seul déploiement Vercel.

### Choix : npm workspaces natif (pas Turborepo)

Leçon tirée de `pi-mono` (7 packages, npm workspaces sans Turborepo) :
- Turborepo apporte cache de build et détection de dépendances automatique — utile pour 10+ packages en CI intensive
- Pour 2 packages + 1 app, npm workspaces natif est suffisant et plus simple
- L'ordre de build est explicite dans les scripts racine :

```json
"build": "npm run build -w packages/core && npm run build -w packages/widget && npm run build -w apps/site",
"dev": "concurrently \"npm run dev -w packages/core\" \"npm run dev -w apps/site\""
```

---

## Tooling (leçons pi-mono)

### Biome — lint + format en un seul outil
Remplace ESLint + Prettier. Config unique `biome.json` à la racine, appliquée à tous les packages.
```json
{
  "formatter": { "indentStyle": "space", "indentWidth": 2, "lineWidth": 120 },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "files": { "includes": ["packages/*/src/**/*.ts", "apps/*/src/**/*.ts", "apps/*/**/*.tsx"] }
}
```
Commande unique depuis la racine : `biome check --write .`

### tsconfig.base.json partagé
Chaque package l'étend via `"extends": "../../tsconfig.base.json"`.
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  }
}
```

### Vitest — tests unitaires
Remplace Jest. Natif ESM, config minimale, très rapide.
```ts
// vitest.config.ts dans chaque package
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } })
```

### `package.json` exports — obligatoire pour les packages partagés
Leçon pi-mono : sans le champ `exports`, TypeScript et les bundlers ne trouvent pas les bons fichiers.
```json
{
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

---

## Package core (`packages/core`)

Portage de `ICSGenerator.swift` en TypeScript. Zéro dépendance externe.

### Types

```typescript
interface Occurrence {
  id: string
  dateDebut: Date
  dateFin: Date
  lieu: string
  touteLaJournee: boolean
  rappelMinutes?: number   // undefined = pas de rappel
}

interface Evenement {
  titre: string
  notes: string
  occurrences: Occurrence[]
}

interface OptionsExport {
  fuseau?: string          // défaut : "Europe/Paris"
}
```

### API publique

```typescript
genererICS(evenement: Evenement, options?: OptionsExport): string
```

### Contraintes RFC 5545 à respecter (déjà validées côté Swift)

- Encodage CRLF (`\r\n`) sur toutes les lignes
- Line folding à 75 octets (continuation avec CRLF + espace)
- Échappement : `\` → `\\`, `;` → `\;`, `,` → `\,`, `\n` → `\n`
- Événements journée entière : `VALUE=DATE`, format `YYYYMMDD`, fin = J+1
- Rappels : bloc `VALARM` avec `TRIGGER:-PTxM`
- `DTSTAMP` et `UID` uniques par occurrence
- Fuseau horaire explicite dans `DTSTART`/`DTEND`

### Tests (Vitest)

- Fichier généré parseable par un parser ICS tiers (ex: `ical.js`)
- Chaque contrainte RFC ci-dessus couverte par un test unitaire
- Cas limites : titre vide, occurrence sans lieu, événement journée entière multi-jours
- Tests exécutables depuis la racine : `npm test -w packages/core`

---

## Module web (`apps/site` — route `/`)

Formulaire web complet. Génération et téléchargement côté client (pas de backend).

### Fonctionnalités

- Champs métadonnées : titre (obligatoire), description (facultative)
- Liste d'occurrences : ajout, suppression, réordonnancement
- Par occurrence : date début, date fin, lieu, option journée entière, rappel
- Autocomplétion adresses : **Nominatim OSM** (gratuit, sans clé API)
- Bouton export → génère le `.ics` via `core` et déclenche le téléchargement navigateur
- Validation : titre non vide, fin >= début

### Autocomplétion Nominatim

```
GET https://nominatim.openstreetmap.org/search?q=...&format=json&limit=5&countrycodes=fr
```

- Déclenché après 3 caractères, debounce 300ms
- Pas de clé API nécessaire
- Mention attribution OSM requise dans l'UI (licence)

### Téléchargement côté client

```typescript
const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
const url = URL.createObjectURL(blob)
// → <a download="evenement.ics"> déclenché programmatiquement
```

---

## Module API (`apps/site` — route `/api/generate`)

Endpoint REST pour intégrations tierces. Vercel Functions, pas de serveur dédié.

### Endpoint

```
POST /api/generate
Content-Type: application/json
```

**Corps de la requête :**
```json
{
  "titre": "Tournée printemps 2026",
  "notes": "Description facultative",
  "fuseau": "Europe/Paris",
  "occurrences": [
    {
      "dateDebut": "2026-04-15T20:00:00",
      "dateFin": "2026-04-15T22:00:00",
      "lieu": "Le Bataclan, Paris",
      "touteLaJournee": false,
      "rappelMinutes": 60
    }
  ]
}
```

**Réponse (succès) :**
```
HTTP 200
Content-Type: text/calendar
Content-Disposition: attachment; filename="evenement.ics"

[contenu du fichier .ics]
```

**Réponse (erreur) :**
```json
HTTP 400
{ "erreur": "Le titre est obligatoire" }
```

### Contraintes

- Validation du JSON entrant (titre obligatoire, au moins une occurrence, fin >= début)
- **Authentification par clé API** (`X-Api-Key: sk_...` dans le header)
- Clé générée et gérée côté site (page `/dashboard` ou simple page `/api-key`)
- Stockage des clés : KV Upstash (hash SHA-256, jamais la clé en clair)
- Rate limiting par clé : ex. 100 appels/jour sur le plan gratuit
- Pas de persistance du contenu — stateless, génération à la volée
- Taille max payload : 1 Mo (suffisant pour ~1000 occurrences)

---

## Module widget (`packages/widget`)

Script JS intégrable dans n'importe quel site existant. Bundle autonome (CSS inclus).

### Intégration côté site hôte

```html
<div id="icsmulti-widget"></div>
<script src="https://icsmulti-web.vercel.app/widget.js"></script>
<script>
  ICSMulti.init({
    container: '#icsmulti-widget',
    titre: 'Mon événement',       // pré-remplissage optionnel
    theme: 'auto'                 // 'light' | 'dark' | 'auto'
  })
</script>
```

### Comportement

- Formulaire complet : titre, description, toutes les occurrences (identique au module web)
- Bouton "Télécharger le calendrier" → génère et télécharge le `.ics` côté client
- Pré-remplissage optionnel via options `init()` (titre, occurrences initiales)
- Langue détectée automatiquement depuis `navigator.language` (FR/EN), overridable via option `lang`
- CSS scopé (préfixe `icsmulti-`) pour ne pas polluer les styles du site hôte
- Zéro dépendance externe dans le bundle

### Build (Vite en mode `lib`)

Leçon pi-mono (`web-ui`) : le CSS est buildé séparément et exporté indépendamment du JS.

```ts
// vite.config.ts dans packages/widget
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ICSMulti',
      fileName: 'widget',
      formats: ['iife']   // bundle autonome, pas d'import/export
    },
    cssCodeSplit: false    // CSS inline dans le bundle JS (CSS scopé)
  }
})
```

- Output : `dist/widget.iife.js` → copié dans `apps/site/public/widget.js` au build
- CSS scopé avec préfixe `icsmulti-` → pas de collision avec les styles du site hôte
- Taille cible : < 20 Ko gzippé

---

## Site de présentation (`apps/site`)

Landing page qui présente les 4 modules et sert de démo live.

### Pages / routes

| Route | Contenu |
|---|---|
| `/` | Landing page — présentation des 4 modules, CTA |
| `/app` | Module web — formulaire complet |
| `/api-docs` | Documentation de l'API REST avec exemples curl |
| `/widget` | Doc widget + démo intégrée + snippet à copier |
| `/desktop` | Présentation + lien téléchargement DMG GitHub |

### Contenu landing page

- Accroche : problème → solution
- Les 4 modules avec cas d'usage par profil (particulier, développeur, intégrateur)
- Démo rapide en ligne (lien vers `/app`)
- Section "Pour les développeurs" : API + widget

---

## Internationalisation (FR + EN dès le départ)

Toutes les chaînes UI externalisées dès le début — pas de refactoring i18n à mi-chemin.

### Stack

- **next-intl** — intégration Next.js App Router, routing `/fr/...` et `/en/...`
- Fichiers de traduction : `messages/fr.json` et `messages/en.json`
- Détection automatique depuis `Accept-Language`, fallback FR

### Portée

| Élément | Traduit |
|---|---|
| UI site + module web | ✅ |
| Messages d'erreur API | ✅ (header `Accept-Language`) |
| Widget | ✅ (option `lang` ou `navigator.language`) |
| Fichier `.ics` généré | ❌ (contenu saisi par l'utilisateur) |

### Clés à prévoir dès le départ

- Labels formulaire (titre, description, lieu, début, fin, journée entière, rappel)
- Messages de validation
- Landing page (accroche, cas d'usage, CTA)
- Documentation API et widget

---

## Décisions ouvertes

- [x] ~~Nom de domaine~~ → sous-domaine Vercel gratuit pour l'instant (`icsmulti-web.vercel.app`). Domaine dédié possible plus tard sans impact sur le code (variable d'env).
- [x] ~~Autocomplétion~~ → Nominatim OSM (gratuit, sans clé, RGPD-friendly). Google Places écarté.
- [x] ~~Analytics~~ → Vercel Analytics + événements custom : "export réussi", "occurrence ajoutée", "module utilisé" (web / api / widget).
- [x] ~~Gestion clés API~~ → page simple `/api-key` : email → clé générée → affichée une fois → envoyée par email. Pas de compte utilisateur.

---

## Étapes de développement suggérées

1. **Setup monorepo** — npm workspaces + Biome + tsconfig.base.json, structure de base, Vercel linké
2. **Package core** — portage TypeScript + tests Vitest (RFC 5545)
3. **Module web** — formulaire Next.js + autocomplétion Nominatim + export côté client
4. **Module API** — endpoint `/api/generate` + clé API (Upstash KV) + page `/api-key`
5. **Site landing** — i18n next-intl + pages `/app`, `/api-docs`, `/widget`, `/desktop`
6. **Module widget** — bundle Vite IIFE + copie dans `apps/site/public/`
