# Roadmap Generator — Frontend

Application frontend du générateur de roadmaps d'apprentissage IA. Génère des roadmaps personnalisées et suit la progression de l'utilisateur.

Projet personnel / pièce de portfolio. Pas d'intention commerciale actuelle, mais les choix d'architecture anticipent une future commercialisation.

## Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite** — bundler et dev server
- **React Compiler** (stable, activé via `babel-plugin-react-compiler`) — mémoïsation automatique, pas de `useMemo`/`useCallback` manuels sauf cas particuliers
- **TanStack Query** — data fetching serveur (cache, retry, invalidation) *(à installer)*
- **Zustand** — état client partagé (UI, session auth) *(à installer)*
- **React Router** — routing *(à installer)*
- **Axios** — client HTTP *(à installer)*
- **Vitest + React Testing Library** — tests *(à installer)*

## Structure du projet

```
src/
├── app/                    # Bootstrap de l'app
│   ├── App.tsx
│   └── providers.tsx       # Providers globaux (Query, Theme, ErrorBoundary...)
│
├── pages/                  # Une page = composition de features
│
├── features/               # Logique métier isolée par domaine
│   └── <feature>/
│       ├── api/            # Appels API + hooks TanStack Query
│       ├── components/     # Composants spécifiques à la feature
│       ├── hooks/
│       ├── store/          # Zustand slice si besoin
│       ├── types.ts
│       └── index.ts        # Exports publics uniquement
│
├── shared/                 # Réutilisable partout, sans logique métier
│   ├── components/         # Un composant = un dossier (Component.tsx + styles + test colocalisés)
│   ├── hooks/
│   ├── lib/                # Instance axios, utilitaires
│   └── types/
│
├── config/                 # Variables d'environnement, constantes
└── styles/                 # Styles globaux uniquement (tokens, thème, reset)
```

### Pourquoi cette structure

- **Feature-based, pas type-based** : on groupe par domaine métier (`auth`, `roadmaps`) plutôt que par type de fichier. Ça isole les régressions et ça scale mieux qu'un dossier `components/` fourre-tout.
- **Exports publics contrôlés** : chaque feature n'expose que son `index.ts`. Interdit d'importer un fichier interne d'une feature depuis l'extérieur.
- **`styles/` limité au global** : variables CSS, thème, reset. Le style d'un composant est **colocalisé** avec lui (`Component.tsx` + `Component.module.css` dans le même dossier), pas centralisé — évite les styles orphelins et garde la cohésion composant/style.
- **Data fetching via TanStack Query** : pas de `fetch` + `useEffect` manuel.
- **État global minimal** : Zustand pour l'état client partagé ; `useState`/`useReducer` local tant que ça reste local à une feature.
- **React Compiler dès l'init** : évite la mémoïsation manuelle, code plus lisible ; nécessite de respecter les *Rules of React* (pas de mutation d'état, pas d'effets de bord dans le rendu).

## Conventions

- TypeScript strict, pas de `any` implicite.
- Un composant = un dossier (`Component.tsx`, styles, test colocalisés).
- Tests colocalisés (`Component.test.tsx` à côté du composant), pas de dossier `__tests__` séparé.
- Path aliases (`@/features`, `@/shared`) à configurer dans `tsconfig` + `vite.config.ts`.
- Error boundaries par route/feature.

## Démarrage

```bash
npm install
npm run dev
```
