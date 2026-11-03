# RoadmapAI — Frontend

Application web de RoadmapAI : elle permet de créer un compte, de générer des parcours personnalisés, de suivre leur progression et de retrouver les ressources associées. Le frontend se trouve dans [`roadmap_generator/`](./roadmap_generator/); ce README décrit son fonctionnement, ses fonctionnalités, sa structure et son mode de développement.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Architecture](#architecture)
- [Routes de l’application](#routes-de-lapplication)
- [Communication avec le backend](#communication-avec-le-backend)
- [Installation et démarrage](#installation-et-démarrage)
- [Commandes disponibles](#commandes-disponibles)
- [Design et maquettes](#design-et-maquettes)
- [Documents de suivi](#documents-de-suivi)
- [Limites connues](#limites-connues)

## Fonctionnalités

### Compte et session

- Inscription, vérification du compte par code OTP, renvoi du code et connexion.
- Restauration de session au chargement de l’application à partir du cookie `refresh_token` HttpOnly.
- Renouvellement automatique de l’access token après une réponse `401`, puis nouvelle tentative de la requête.
- Déconnexion avec confirmation stylisée.
- Les pages de l’espace personnel sont protégées; les utilisateurs connectés sont redirigés vers le tableau de bord depuis les pages publiques d’entrée.

### Tableau de bord

- Affiche les totaux, la progression et les répartitions par catégorie et par état renvoyés par le backend.
- Présente les roadmaps récentes; leur ouverture mène au détail correspondant.
- Les roadmaps archivées sont exclues des données du tableau de bord par le backend.

### Roadmaps

- Création à partir d’un objectif, d’une catégorie, du niveau, du temps disponible, d’une échéance et d’un contexte facultatif.
- Génération progressive via Server-Sent Events : le formulaire laisse place à l’avancement et affiche le titre, les étapes et leurs ressources au fur et à mesure de leur réception.
- Liste avec recherche, filtres par catégorie et état, tri, et chargement progressif des résultats.
- Vues séparées pour les roadmaps actives et archivées. L’état de la vue est conservé dans l’URL avec `?archived=true`.
- Chaque carte permet d’archiver ou de restaurer une roadmap. Une roadmap archivée reste consultable, mais sa progression est en lecture seule jusqu’à sa restauration.
- Le détail montre les étapes, la progression, les objectifs d’apprentissage et les ressources; les ressources d’une étape s’ouvrent dans un aperçu navigable.

### Ressources

- Liste paginée au fil du défilement, avec recherche, roadmap, catégorie, type, état de l’étape, tri et filtre des favoris.
- Ajout et retrait des favoris via le backend.
- Aperçu isolé de la ressource sélectionnée : intégration vidéo lorsque le fournisseur est pris en charge, ou aperçu intégré quand le site l’autorise, avec lien d’ouverture externe.
- Les ressources d’une roadmap archivée sont retirées de cette liste par le backend; elles restent consultables depuis le détail de la roadmap archivée.

### Paramètres

- Modification du prénom, du nom et du profil d’apprenant (langue des ressources, style d’apprentissage et ton des explications).
- Changement du mot de passe avec vérification de l’actuel.
- Les actions de changement d’adresse e-mail, de photo de profil et de suppression du compte restent désactivées tant que leurs endpoints ne sont pas disponibles.

### Pages publiques

- Page d’accueil, inscription, connexion et vérification OTP.
- La page « mot de passe oublié » affiche actuellement un état de confirmation côté frontend; elle n’est pas reliée à un endpoint de réinitialisation.
- Une page dédiée est affichée pour les routes inconnues.

## Technologies

| Besoin | Outil |
| --- | --- |
| Interface | React 19, TypeScript strict |
| Développement et compilation | Vite 8 |
| Styles | Sass / SCSS Modules et tokens CSS |
| Navigation | React Router 7 |
| Requêtes, cache et mutations | TanStack Query 5 |
| État de session | Zustand 5 |
| Requêtes HTTP | Axios |
| Validation de formulaires | React Hook Form et Zod |
| Optimisation React | React Compiler |
| Qualité statique | ESLint et TypeScript |

## Architecture

Le code applicatif est dans `roadmap_generator/src/`.

```text
src/
├── app/                 # Démarrage, providers, routes, guards et layouts
├── config/              # Lecture de la configuration frontend
├── features/            # Domaines métier et accès API
│   ├── auth/
│   ├── dashboard/
│   ├── resources/
│   ├── roadmaps/
│   └── users/
├── pages/               # Composition des écrans routés
├── shared/
│   ├── components/      # Composants réutilisés entre les pages
│   ├── lib/             # Axios, session, stores et QueryClient
│   └── types/
└── styles/              # Styles globaux et tokens visuels
```

Une feature regroupe ses appels API, ses hooks et ses types; son `index.ts` définit l’interface publique pour le reste de l’application. Les pages assemblent ces features avec les layouts communs (`AppLayout`, `PageHeader`). Les styles propres à une page ou un composant sont conservés dans des fichiers `.module.scss` proches du code concerné.

### Données et session

- TanStack Query gère les données serveur, la pagination et l’invalidation du cache après les mutations.
- Zustand conserve l’access token uniquement en mémoire. Il n’est pas écrit dans `localStorage`.
- Le refresh token est un cookie HttpOnly géré par le backend et n’est jamais lu par JavaScript.
- Axios ajoute le bearer token aux requêtes, envoie les cookies avec `withCredentials`, et centralise le renouvellement silencieux de session.
- L’application attend la fin de la restauration de session avant d’afficher les routes afin d’éviter un flash d’écran déconnecté.

## Routes de l’application

| Route | Accès | Écran |
| --- | --- | --- |
| `/` | Public | Accueil |
| `/register` | Public | Création de compte |
| `/verify-otp` et `/activate-account` | Public | Vérification du compte |
| `/login` | Public | Connexion |
| `/forgot-password` | Public | Demande de réinitialisation (présentation frontend uniquement à ce stade) |
| `/dashboard` | Session requise | Tableau de bord |
| `/roadmaps` | Session requise | Roadmaps actives ou archivées |
| `/roadmaps/generate` | Session requise | Formulaire et génération en streaming |
| `/roadmaps/:roadmapId` | Session requise | Détail, étapes, progression et ressources |
| `/resources` | Session requise | Liste, filtres, favoris et aperçu des ressources |
| `/settings` | Session requise | Informations et préférences du compte |
| Toute autre route | Public | Page introuvable |

## Communication avec le backend

L’URL racine de l’API est configurée avec `VITE_API_BASE_URL`. Le client Axios construit ensuite les routes sous `api/v1/`.

| Domaine | Endpoints utilisés |
| --- | --- |
| Authentification | `POST /api/v1/auth/register`, `/verify-otp`, `/resend-otp`, `/login`, `/refresh`, `/logout` |
| Compte et préférences | `GET/PATCH /api/v1/users/me`, `GET/PUT /api/v1/users/me/learner-profile`, `PUT /api/v1/users/me/password` |
| Tableau de bord | `GET /api/v1/dashboard` |
| Roadmaps | `GET /api/v1/roadmaps`, `GET /api/v1/roadmaps/{id}`, `POST /api/v1/roadmaps/generate/stream`, `POST /api/v1/roadmaps/{id}/archive`, `POST /api/v1/roadmaps/{id}/unarchive`, `PUT /api/v1/roadmaps/{id}/steps/{step_id}/progress` |
| Ressources | `GET /api/v1/resources`, `PUT/DELETE /api/v1/resources/{id}/favorite` |

Le filtre `archived=true` de `GET /api/v1/roadmaps` renvoie les roadmaps archivées; sans ce paramètre, seules les roadmaps actives sont listées. L’archivage est une opération sur la roadmap : il la rend non modifiable et masque ses ressources de la liste générale. Le frontend invalide les caches des roadmaps, du tableau de bord et des ressources après archivage ou restauration.

Le contrat détaillé et les règles métier vivent dans le dépôt backend. Pour les démarrer ou vérifier leurs prérequis, consulter le [README backend](../roadmap_generator-backend/README.md).

## Installation et démarrage

Prérequis : Node.js compatible avec Vite 8 et npm.

```powershell
cd roadmap_generator
npm install
```

Créer un fichier `.env.local` dans `roadmap_generator/` :

```env
VITE_API_BASE_URL=http://localhost:8000/
```

L’URL doit pointer vers le backend local ou l’environnement voulu. Démarrer ensuite le frontend :

```powershell
npm run dev
```

Vite affiche l’adresse locale dans le terminal. Le backend doit être démarré séparément et autoriser les requêtes du frontend, y compris les cookies de session.

## Commandes disponibles

À exécuter depuis `roadmap_generator/` :

| Commande | Effet |
| --- | --- |
| `npm run dev` | Lance le serveur de développement Vite |
| `npm run build` | Vérifie les projets TypeScript puis construit le frontend dans `dist/` |
| `npm run lint` | Lance ESLint |
| `npm run preview` | Sert localement la dernière compilation |

Le `package.json` ne définit pas actuellement de commande `test`.

## Design et maquettes

- Les écrans s’alignent sur les maquettes fournies pour le projet. Ne pas inventer de nouveaux styles lorsque la maquette définit déjà la présentation.
- Le skill Impeccable est installé dans `.agents/skills/impeccable/` et référencé par `skills-lock.json`; il est à utiliser lors des travaux d’interface.
- Les principes produit sont dans [`PRODUCT.md`](./PRODUCT.md), les tokens et règles visuelles dans [`DESIGN.md`](./DESIGN.md), et les tokens globaux actifs dans `roadmap_generator/src/styles/index.scss`.
- Les layouts de l’espace connecté partagent une barre latérale fixe et une barre supérieure; le contenu principal porte le défilement.
- Les composants interactifs doivent garder des libellés accessibles, des états de chargement/erreur et un focus clavier visible.

## Documents de suivi

- [`feature_done.md`](./feature_done.md) — fonctionnalités frontend terminées, ajoutées chronologiquement avec leur date.
- [`next_steps.md`](./next_steps.md) — prochaines actions; chaque nouvelle reprise est ajoutée en bas.
- [`PRODUCT.md`](./PRODUCT.md) — objectif, public et principes du produit.
- [`DESIGN.md`](./DESIGN.md) — système visuel et règles de conception.
- [`roadmap_generator/README.md`](./roadmap_generator/README.md) — informations spécifiques au package applicatif.
- [`roadmap_generator-backend/`](../roadmap_generator-backend/) — dépôt backend, ses endpoints et son suivi.

## Limites connues

- Le changement d’adresse e-mail, le téléversement d’avatar et la suppression de compte ne sont pas encore disponibles dans le backend; les actions correspondantes sont inactives dans Paramètres.
- Le formulaire « mot de passe oublié » n’envoie pas encore de demande au backend.
- Les ressources sont archivées avec leur roadmap; il n’existe pas d’action d’archivage indépendante par ressource dans le contrat actuellement consommé par le frontend.
- L’export des roadmaps reste désactivé.
