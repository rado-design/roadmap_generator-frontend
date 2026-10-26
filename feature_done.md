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

### 2026-10-20 — Détail d'une roadmap en lecture

- La route protégée `/roadmaps/:roadmapId` reprend le résumé et la disposition deux colonnes de la maquette, et consomme `GET /api/v1/roadmaps/{roadmap_id}`.
- Les étapes, leur progression persistée, leurs objectifs et ressources viennent de la réponse backend; les roadmaps sont accessibles depuis les cartes de la liste.
- Les indicateurs Momentum/badges et les participants restent identifiés comme gabarits. Les contrôles de progression restent en lecture seule tant que la validation backend de la phase correspondante n'est pas confirmée.
- Les besoins backend de cette page et de la liste ont des fichiers dédiés : `ROADMAP_DETAIL_BACKEND_REQUIREMENTS.md` et `ROADMAPS_LIST_BACKEND_REQUIREMENTS.md`.

### 2026-10-20 — Navigation vers le détail depuis le tableau de bord et retour à l'origine

- Les cartes des roadmaps récentes du tableau de bord ouvrent leur page détail.
- La liste et le tableau de bord transmettent leur route d'origine à la page détail; le lien de retour ramène à la bonne page, avec `/roadmaps` comme destination de secours pour une ouverture directe.

### 2026-10-20 — Formulaire de génération d'une roadmap

- La page `/roadmaps/generate` reprend la maquette du formulaire et ses aides latérales; les champs objectif, catégorie, durée hebdomadaire, échéance, niveau et contexte sont validés selon le contrat backend.
- L'action « Créer une roadmap » de la liste ouvre ce formulaire; la soumission appelle `POST /api/v1/roadmaps/generate` et ouvre le détail créé en cas de succès, avec un retour vers le formulaire.
- La fiche backend dédiée est `ROADMAP_GENERATE_BACKEND_REQUIREMENTS.md`; le contrat actuel suffit. La génération en flux SSE reste une évolution frontend séparée.

### 2026-10-20 — Accès à la création depuis la liste des roadmaps

- La tuile « Nouvelle roadmap » de la liste ouvre maintenant le formulaire de génération; l'état vide de la liste propose aussi cette action.

### 2026-10-20 — Mise à jour de la progression des étapes

- Le détail permet de modifier une étape entre « À faire », « En cours » et « Terminée » via `PUT /api/v1/roadmaps/{roadmap_id}/steps/{step_id}/progress`.
- Le statut et les agrégats sont mis à jour optimistement; une erreur restaure les données précédentes. Les requêtes liste, dashboard et détail sont invalidées après la mutation.
- L'endpoint existe déjà, sans besoin backend additionnel. La migration `a9d3f5b27c64` et la suite backend complète restent à valider; voir `../roadmap_generator-backend/ROADMAP_DETAIL_BACKEND_REQUIREMENTS.md`.

### 2026-10-21 — Intégration des données dashboard et des filtres de roadmaps

- Le tableau de bord utilise `GET /api/v1/dashboard` pour les compteurs, le taux de complétion, les répartitions par catégorie/statut et les roadmaps récentes; le nom d'affichage vient aussi de l'API.
- La liste `/roadmaps` transmet la recherche (max. 100 caractères), le statut, la catégorie, le tri et la pagination à `GET /api/v1/roadmaps`; filtres et compteurs couvrent maintenant tous les résultats côté serveur.
- Les fiches backend des deux pages précisent les contrats consommés. Les tendances mensuelles du dashboard ne sont pas encore exposées par l'API et restent à spécifier dans la fiche dashboard.
- Vérification: `git diff --check`, le contrôle TypeScript (`tsc -p tsconfig.app.json --ignoreDeprecations 6.0 --noEmit`), le build Vite et le lint ciblé des fichiers modifiés réussissent. `npm run build` complet reste bloqué par l'option `baseUrl` dépréciée de `tsconfig.app.json` avec TypeScript 6; le lint complet signale aussi une erreur préexistante dans `OtpShieldBadge.tsx`.

### 2026-10-22 — Génération progressive d'une roadmap par SSE

- Le formulaire utilise maintenant `POST /api/v1/roadmaps/generate/stream` et affiche le titre, les étapes et les ressources au fil des événements SSE valides.
- L'aperçu est réinitialisé sur `reset`; l'événement terminal `done` confirme la persistance, invalide les données de liste/dashboard puis ouvre le détail. Les erreurs pré-flux restent visibles dans le formulaire et les erreurs SSE dans l'aperçu.
- La fiche backend de génération confirme que le contrat existant suffit; aucune modification de logique backend n'a été nécessaire.
- Vérification: contrôle TypeScript ciblé, lint ciblé, build Vite et `git diff --check` réussis. Le build Vite signale seulement l'avertissement existant de chunk principal supérieur à 500 kB.

### 2026-10-22 — Aperçu des ressources depuis les étapes du détail

- Chaque étape indique le nombre de ressources associées et propose un bouton pour ouvrir leur aperçu dans un modal, sans perdre le contexte de l'étape.
- Le modal affiche le titre et le type, permet de parcourir les ressources précédentes/suivantes et d'ouvrir la source dans un nouvel onglet. Les vidéos MP4/WebM/OGG s'ouvrent dans un lecteur; YouTube/Vimeo utilisent leur lecteur intégré; les articles et autres pages s'affichent dans un cadre intégré lorsque le site l'autorise.
- La fiche backend du détail confirme que `steps[].resources` fournit déjà les données nécessaires; aucun endpoint supplémentaire n'est requis.
- Vérification: contrôle TypeScript, lint ciblé, build Vite et `git diff --check` réussis. Le build Vite signale seulement l'avertissement existant de chunk principal supérieur à 500 kB.

### 2026-10-22 — Alignement des icônes de redirection dans les ressources clés

- La liste des ressources utilise maintenant une grille à trois colonnes avec un emplacement fixe pour l'icône de type, le texte et l'action externe; les titres longs ne décalent plus l'icône de redirection.
- Un emplacement vide est conservé lorsqu'une ressource n'a pas d'URL afin que l'alignement reste identique entre les lignes.
- Vérification: contrôle TypeScript, lint ciblé, build Vite et `git diff --check` réussis.

### 2026-10-22 — Alignement des premières cartes du détail d'une roadmap

- La première carte de la colonne droite est alignée avec la première carte d'étape, que des étapes terminées soient présentes ou non.
- Le décalage est retiré sur les écrans où les colonnes sont empilées.
- Vérification: contrôle TypeScript, lint ciblé et `git diff --check` réussis.

### 2026-10-23 — Page Ressources et favoris

- La page `/resources` affiche les ressources réelles avec leur type, date, roadmap et étape; les filtres de recherche, roadmap, catégorie, type, dates, tri et favoris sont transmis à `GET /api/v1/resources` avec pagination.
- Les boutons étoile utilisent `PUT`/`DELETE /api/v1/resources/{resource_id}/favorite`; les liens permettent d'ouvrir la ressource et de revenir à sa roadmap.
- L'API ne fournit pas encore le statut de progression des étapes. Le filtre reste désactivé et le manque est documenté dans `../roadmap_generator-backend/RESOURCES_PAGE_BACKEND_REQUIREMENTS.md`.
- Vérification: contrôle TypeScript, lint ciblé, détecteur Impeccable et `git diff --check`.

### 2026-10-23 — Réduction de l'espace des filtres

- Les panneaux de filtres des pages Ressources et Roadmaps ont un padding et des espacements réduits; les champs passent à 40 px de hauteur, y compris sur mobile.
- Vérification: `git diff --check`.

### 2026-10-23 — Simplification des filtres de ressources

- Retrait des filtres de dates « Depuis le » et « Jusqu'au » de la page Ressources.
- Vérification: `git diff --check`.

### 2026-10-23 — Aperçu des ressources depuis la page Ressources

- Cliquer sur le titre ouvre un modal cohérent avec celui du détail d'une étape; il affiche un lecteur pour les vidéos directes, un lecteur intégré YouTube/Vimeo ou un aperçu de page, avec navigation dans les résultats et lien pour ouvrir la source.
- Vérification: contrôle TypeScript, lint ciblé et `git diff --check`.

### 2026-10-23 — Modal limité à la ressource sélectionnée

- Le modal affiche uniquement la ressource cliquée; les commandes de navigation entre ressources ont été retirées.
- Vérification: contrôle TypeScript, lint ciblé et `git diff --check`.

### 2026-10-23 — Restauration des dimensions des filtres Roadmaps

- Le panneau de filtres de Roadmaps retrouve ses dimensions précédentes; la compaction des filtres reste appliquée à la page Ressources uniquement.
- Vérification: `git diff --check`.

### 2026-10-23 — Pagination des ressources à 10 éléments

- La page Ressources demande et affiche maintenant 10 éléments par page au lieu de 12; la pagination suit cette taille.
- Vérification: contrôle TypeScript et `git diff --check`.

### 2026-10-23 — Défilement infini des ressources

- La page charge d'abord 10 ressources, puis récupère et ajoute les suivantes automatiquement quand la fin de liste approche. Un bouton accessible permet aussi de charger la suite ou de réessayer en cas d'erreur.
- Les filtres relancent la liste depuis le début; la pagination par pages précédente/suivante est supprimée.
- Vérification: contrôle TypeScript et `git diff --check`.

### 2026-10-23 — Défilement infini de la liste des roadmaps

- La page charge 20 roadmaps au départ puis ajoute les suivantes à mesure du défilement; les filtres et le tri redémarrent la liste depuis le début.
- Le bouton accessible permet de charger la suite manuellement ou de réessayer après une erreur; la pagination précédente/suivante est retirée.
- Vérification: contrôle TypeScript, lint ciblé et `git diff --check`.

### 2026-10-23 — Filtres persistants pendant le défilement

- Les filtres des pages Roadmaps et Ressources restent visibles en haut de la zone de contenu pendant le défilement des listes.
- Vérification: `git diff --check`.

### 2026-10-23 — Largeur et fond des filtres collants

- Les panneaux de filtres Roadmaps et Ressources dépassent légèrement la largeur des grilles de cartes. Leur fond opaque est prolongé jusqu'au bord supérieur de la zone scrollable afin de masquer les cartes qui passent dessous.
- Vérification: `git diff --check`.

### 2026-10-23 — Défilement normal des filtres

- Les panneaux de filtres Roadmaps et Ressources défilent avec le reste de leur page; le bandeau opaque et le comportement collant ont été retirés. La largeur légèrement supérieure aux grilles est conservée.
- Vérification: `git diff --check`.

### 2026-10-23 — Accès direct à l'étape depuis Ressources

- Le lien du titre d'une étape dans Ressources ouvre le détail de sa roadmap et fait défiler jusqu'à la carte de cette étape.
- Vérification: `git diff --check`.

### 2026-10-23 — Graphiques du dashboard alignés sur la maquette

- La distribution par catégorie utilise un graphique en anneau avec sa légende; l'état des roadmaps reprend les barres de progression horizontales de la maquette.
- Vérification: `git diff --check`.

### 2026-10-26 — Statut des étapes dans Ressources

- Le filtre des ressources envoie `step_status` (`todo`, `in_progress`, `done`) au backend; chaque carte affiche le libellé français du statut renvoyé par `step.status`.
- Vérification: `git diff --check`.

### 2026-10-26 — Page Paramètres

- La page Paramètres reprend les sections et la disposition de la maquette; les informations de compte, les préférences d'apprenant et le mot de passe utilisent les endpoints utilisateur existants.
- Le changement d'e-mail, la photo de profil et la suppression du compte restent désactivés faute d'endpoints correspondants; les besoins sont consignés dans `SETTINGS_PAGE_BACKEND_REQUIREMENTS.md`.
- Vérification: `git diff --check`.

### 2026-10-26 — Confirmation avant déconnexion

- Les boutons de déconnexion de la barre latérale et de la page Paramètres utilisent une boîte de dialogue stylisée; annuler conserve la session active.
- Vérification: `git diff --check`.

### 2026-10-26 — Catégories du filtre Ressources alignées sur la génération

- Le filtre Ressources réutilise les mêmes valeurs et libellés de catégories que le formulaire de génération; les valeurs sont temporairement traduites vers les groupes acceptés par l'API actuelle.
- Le besoin de charger un catalogue de catégories depuis le backend et de filtrer par catégorie exacte est décrit dans `RESOURCES_CATEGORY_FILTER_BACKEND_REQUIREMENTS.md`.
- Vérification: contrôle TypeScript et `git diff --check`.
