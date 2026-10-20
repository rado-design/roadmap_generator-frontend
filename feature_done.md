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

### 2026-10-20 — Finition du parcours de session et des gabarits du tableau de bord

- La restauration de session affiche un état d'attente de marque au lieu d'une page vide; l'animation respecte la préférence de réduction de mouvement.
- Les emplacements des graphiques sans données backend affichent désormais un état « Visualisation à connecter » sans barres décoratives pouvant être prises pour des données.

### 2026-10-20 — Ajustement du shell partagé selon les maquettes

- La barre supérieure occupe maintenant toute la largeur au-dessus du contenu; elle contient la marque, la recherche et les actions d'interface.
- La sidebar se place sous cette barre, à gauche du contenu, avec les entrées de navigation et les actions en bas comme sur les maquettes des pages principales.
- Les mentions d'offre, d'identité utilisateur et de création qui n'étaient pas appuyées par les données ou le dessin de référence ont été retirées. La déconnexion utilise l'endpoint backend existant.

### 2026-10-20 — Ajustement du centrage de la recherche et du titre du tableau de bord

- Le champ de recherche est centré dans la barre supérieure sur écran large, indépendamment de la largeur de la marque et des actions.
- L'emoji a été retiré du titre d'accueil du tableau de bord.

### 2026-10-20 — Alignement de la largeur du contenu sur la maquette

- Le contenu applicatif utilise maintenant toute la largeur disponible après le padding de 40 px du layout desktop, conformément au `.main` de la maquette du tableau de bord; le plafond de largeur de 1280 px qui ajoutait des marges n'est plus appliqué.

### 2026-10-20 — Liste paginée des roadmaps

- La route protégée `/roadmaps` reprend la maquette « Toutes les roadmaps » et charge les résumés depuis `GET /api/v1/roadmaps`, avec pagination backend de 20 éléments.
- La progression affichée est calculée depuis `completed_steps / total_steps`; les statuts reprennent les valeurs réellement fournies (`generating`, `ready`, `failed`).
- Recherche, filtre de statut et tri fonctionnent sur la page chargée. Le filtre de catégorie et les actions d'export/création restent désactivés tant que leur intégration n'est pas disponible; l'absence de catégorie et de recherche globale a été ajoutée à `../roadmap_generator-backend/DASHBOARD_BACKEND_REQUIREMENTS.md`.
- Les états de chargement, erreur avec reprise, liste vide et filtres sans résultat sont implémentés.

### 2026-10-20 — Défilement limité au contenu des pages

- Le shell applicatif occupe la hauteur de la fenêtre; le contenu principal porte le défilement vertical, tandis que l'en-tête, la sidebar et le footer restent dans leur emplacement fixe.
- La sidebar garde sa hauteur dans le shell et ne grandit plus avec le contenu des pages; le panneau mobile conserve son comportement hors-canvas.

### 2026-10-20 — Ajustement des actions et filtres de la liste des roadmaps

- Les actions « Exporter » et « Créer une roadmap » restent côte à côte, y compris dans la mise en page mobile.
- Le padding des boutons d'action et la hauteur/typographie des champs de recherche et sélection ont été réduits.
