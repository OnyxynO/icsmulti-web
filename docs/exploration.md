# ICSMulti — Exploration produit multi-modules

> Document de travail temporaire — phase de conception.
> À archiver ou supprimer une fois le développement lancé.

---

## Vision

Transformer ICSMulti en un **produit modulaire** : un cœur partagé décliné en 4 modules selon le contexte d'usage.

---

## Architecture cible

```
ICSMulti (produit)
├── core/          ← logique ICS en TypeScript (partagée entre tous les modules web)
│
├── desktop/       ← app macOS Swift (existante ✅)
├── web/           ← formulaire web, usage direct dans un navigateur
├── api/           ← REST API, pour intégrations tierces
├── widget/        ← script intégrable dans n'importe quel site
│
└── site/          ← landing page Vercel qui présente les 4 modules
```

---

## Modules

### Module desktop ✅ (existant)
App macOS native Swift. Distribution DMG non signé via GitHub Releases.
Logique ICS en Swift pur (RFC 5545), indépendante du core TypeScript.

### Module core (à créer)
Bibliothèque TypeScript partagée entre web, api et widget.
- Portage de `ICSGenerator.swift` en TypeScript (~100 lignes)
- Types : `Evenement`, `Occurrence`, `OptionsExport`
- Fonction principale : `genererICS(evenement) → string`
- Zéro dépendance externe (RFC 5545 = manipulation de texte)

### Module web (à créer)
Formulaire web complet, génération et téléchargement côté client.
- Pas de backend — tout se passe dans le navigateur
- Utilise le core TypeScript
- Autocomplétion adresses : Nominatim OSM (gratuit, pas de clé API)
- Hébergeable en statique (Vercel, GitHub Pages, Netlify)

### Module API (à créer)
Endpoint REST pour intégrations tierces.
- `POST /api/generate` → reçoit JSON, retourne fichier `.ics`
- Vercel Functions (zéro serveur)
- Utilise le core TypeScript
- Cas d'usage : site e-commerce après achat billet, système de réservation, outil interne

### Module widget (à créer)
Script intégrable dans n'importe quel site existant.
- `<script src="...">` + un élément HTML cible
- Affiche un formulaire léger ou un bouton "Générer le calendrier"
- Utilise le core TypeScript (bundle autonome)
- Cas d'usage : site d'association, agenda de festival, planning de tournée

### Site de présentation (à créer)
Landing page Vercel qui présente les 4 modules.
- Démo interactive du module web directement sur la page
- Documentation des modules API et widget
- Lien de téléchargement du module desktop
- Stack : Next.js sur Vercel

---

## Questions ouvertes

- [ ] Monorepo (Turborepo) ou repos séparés ?
- [ ] Autocomplétion adresses : Nominatim OSM suffisant ou besoin Google Places ?
- [ ] Module API : authentification par clé ou accès libre (rate limiting Vercel) ?
- [ ] Widget : CSS intégré ou laissé à l'intégrateur ?
- [ ] Nom de domaine dédié ?

---

## Étapes suggérées

1. Écrire le `core` TypeScript + tests
2. Module web (valide le core en situation réelle)
3. Module API (réutilise le core, ajoute le endpoint)
4. Site de présentation avec démo live
5. Module widget (bundle isolé)
