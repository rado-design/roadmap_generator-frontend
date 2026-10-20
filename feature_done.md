# Fonctionnalités terminées — Frontend RoadmapAI

Ce fichier décrit ce qui est réellement implémenté côté frontend (composants d'interface et fonctions reliées au backend). À relire au début de chaque session et à compléter à la fin d'une fonctionnalité. Vérifier les contrats dans `../roadmap_generator-backend/features_done.md` avant toute intégration.

## Conventions d'intégration

- Préfixe API : `/api/v1` (configuré via `VITE_API_BASE_URL`).
- Routes protégées : `Authorization: Bearer <access_token>`.
- Erreurs backend RFC 7807 : afficher `detail` et conserver `type` comme code.
- Access token conservé en mémoire seulement; refresh token exclusivement en cookie HttpOnly. Axios utilise `withCredentials`.
- Le backend est la source de vérité des routes, schémas, statuts et règles métier. Ne pas présenter une interface comme connectée si l'endpoint correspondant n'existe pas.

## Fondation frontend

- React 19, TypeScript strict et Vite.
- React Router, TanStack Query, React Hook Form, Zod, Axios et Zustand installés.
- Organisation par pages, fonctionnalités et composants partagés.
- Design system Material 3 RoadmapAI décrit dans `DESIGN.md`.

## Authentification — éléments intégrés

- Formulaires et appels API intégrés pour l'inscription (`POST /auth/register`), la vérification OTP (`POST /auth/verify-otp`), le renvoi OTP (`POST /auth/resend-otp`) et la connexion (`POST /auth/login`).
- Restauration de session au démarrage via `POST /auth/refresh`.
- Client Axios configuré avec `withCredentials`, ajout de l'access token conservé en mémoire et tentative de renouvellement après un `401` sur une route non-auth.

## Règle de mise à jour

Une fonctionnalité ne passe ici à « terminée » qu'après vérification de son parcours frontend et de son contrat backend. Ajouter chaque nouvelle réalisation tout en bas de l'historique avec sa date; ne pas remplacer les entrées précédentes par une date de mise à jour globale. Mettre aussi `next_steps.md` à jour dans le même changement. Ne pas ajouter ici les domaines qui n'ont pas encore été implémentés côté frontend.

## Historique des réalisations

### 2026-10-20 — Base de layouts partagés

- `AppLayout` fournit le cadre des pages applicatives : en-tête de marque avec emplacement d'actions, zone principale centrée et responsive, et pied de page partagé.
- `PageHeader` fournit un titre, une description et un emplacement d'actions adaptatif.
- Ces composants sont disponibles dans `src/app/layouts/`. Leur raccordement aux pages métier se fera lors de l'implémentation de ces pages.

### 2026-10-20 — Sidebar et barre supérieure partagées

- `Sidebar` dans `src/shared/components/Sidebar/` fournit les liens communs vers le tableau de bord, les roadmaps, les ressources et les paramètres, ainsi que l'action de création. Sur mobile, elle s'ouvre en panneau latéral et se ferme par sélection, clic sur le fond ou touche Échap.
- `AppTopBar` dans `src/shared/components/AppTopBar/` fournit le champ de recherche et un emplacement pour les actions de page; son bouton menu contrôle l'ouverture de la sidebar mobile.
- `AppLayout` assemble ces composants autour du contenu. La recherche reçoit un callback de la page; le backend ne propose pas d'endpoint de recherche globale.

### 2026-10-20 — Tableau de bord, première intégration

- La route `/dashboard` utilise `AppLayout` et `PageHeader`.
- Le nombre total et les roadmaps récentes proviennent de `GET /api/v1/roadmaps`; la progression de chaque carte est calculée avec les nombres d'étapes fournis par le backend.
- Les statistiques d'achèvement, le taux de réussite et les graphiques de catégories/états sont affichés comme gabarits signalés, sans chiffres fictifs présentés comme réels.
- La recherche du haut filtre les roadmaps chargées par cette page; elle n'effectue pas de recherche globale côté serveur.

### 2026-10-20 — Redirection et protection de session

- Après login et validation OTP, l'utilisateur arrive au tableau de bord (ou reprend la route protégée demandée avant le login).
- Une session déjà restaurée redirige les routes publiques d'entrée vers `/dashboard`; le tableau de bord renvoie une session déconnectée vers `/login`.
