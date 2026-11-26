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

### 2026-11-05 — Adaptation en streaming et annulation d'une roadmap

- Le détail d'une roadmap permet d'adapter la suite avec une consigne facultative et affiche le plan, les étapes et les ressources à mesure que le flux SSE les envoie.
- L'aperçu affiche maintenant chaque ressource reçue sous son étape, avec son titre, son type et un lien d'ouverture lorsqu'une URL est disponible.
- Le cache du détail est remplacé par la réponse `done` du backend; le flux signale ses erreurs et les étapes commencées ou terminées sont conservées conformément au contrat.
- L'action « Annuler la dernière adaptation » utilise `POST /roadmaps/{id}/adapt/undo`; le détail, la liste, les ressources et le dashboard sont invalidés après adaptation ou annulation.
- Vérification: contrôle TypeScript, build de production, détection Impeccable et `git diff --check`.

### 2026-11-03 — Espacement des actions dans les modals de régénération

- La rangée de décision des modals de régénération garde maintenant une marge intérieure horizontale et basse cohérente avec les panneaux et l'en-tête, sur grand écran comme sur mobile.
- Vérification: `git diff --check`.

### 2026-11-03 — Finition visuelle commune des modals de régénération

- Les modals de régénération des étapes et de leurs ressources reprennent maintenant le même fond, la bordure douce, les coins arrondis, l'espacement intérieur et le backdrop que le modal d'aperçu des ressources.
- Vérification: `git diff --check`.

### 2026-11-03 — Régénération des ressources d'une étape

- Chaque étape d'une roadmap non archivée permet de demander un renouvellement des ressources, avec consigne facultative ou actualisation selon le profil d'apprenant.
- La proposition compare les ressources actuelles et proposées; l'utilisateur peut les conserver ou les remplacer. L'API renvoie l'étape mise à jour et les caches du détail, des roadmaps et des ressources sont actualisés.
- La fonctionnalité est disponible quel que soit le statut de progression de l'étape, conformément au contrat backend.
- Vérification: contrôle TypeScript, build de production et `git diff --check`.

### 2026-11-03 — Carte de génération en cours dans Roadmaps

- La liste des roadmaps affiche la génération active comme une carte temporaire, avec le statut « Génération en cours » et le nombre d'étapes reçues.
- La carte ouvre `/roadmaps/generate` pour retrouver le flux SSE et respecte la recherche, le filtre d'état et le filtre de catégorie. Elle disparaît après la persistance de la roadmap, qui est alors chargée depuis l'API.
- Les actions « Créer une roadmap » et « Nouvelle roadmap » réinitialisent l'affichage d'une génération terminée avant d'ouvrir un nouveau formulaire; un flux toujours actif reste conservé.
- Vérification: contrôle TypeScript, build de production, détection Impeccable et `git diff --check`.

### 2026-11-03 — Continuer une génération après navigation interne

- Le flux de génération et ses étapes reçues sont conservés dans un store partagé; quitter la page Générer pour consulter Roadmaps ne ferme donc plus la connexion SSE.
- En revenant sur Générer dans le même onglet, l'utilisateur retrouve l'avancement ou peut consulter la roadmap si la génération est déjà terminée; les paramètres soumis restent disponibles après une erreur.
- La reprise après actualisation ou fermeture du navigateur nécessite encore une génération en tâche de fond et un endpoint de statut/reprise côté backend; ce besoin est décrit dans `ROADMAP_GENERATION_RESUME_BACKEND_REQUIREMENTS.md`.
- Vérification: contrôle TypeScript, build de production et `git diff --check`.

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

### 2026-10-26 — Accès au profil d'apprenant depuis la génération

- La génération affiche l'état du profil d'apprenant et un lien vers Paramètres pour le configurer ou le modifier.
- Le backend expose `is_configured` sur le profil global afin de distinguer un profil enregistré des valeurs par défaut.
- Vérification: `git diff --check`.

### 2026-10-28 — Archivage des roadmaps et de leurs ressources

- La liste des roadmaps distingue les éléments actifs et archivés; chaque carte permet d'archiver ou de restaurer une roadmap via les endpoints backend.
- Le détail reste consultable en lecture seule lorsqu'il est archivé, et les ressources qui lui appartiennent sont retirées de la liste Ressources par le backend; les caches roadmaps, dashboard et ressources sont actualisés après l'action.
- L'onglet actif/archivé est conservé dans l'URL pour revenir à la bonne liste depuis le détail.
- Vérification: contrôle TypeScript avec `--ignoreDeprecations 6.0` et `git diff --check`.

### 2026-10-28 — Documentation générale du frontend

- Le README racine décrit maintenant les fonctionnalités présentes, l’architecture, les routes, les contrats API, la configuration locale, les commandes, les consignes de maquette et les limites connues; le README du package renvoie vers cette référence.
- Vérification: `git diff --check`.

### 2026-11-03 — Régénération avec proposition pour une étape

- Le détail permet de demander un ajustement d’une étape « À faire », de comparer les contenus actuels et proposés, puis d’accepter ou de refuser. La mise à jour et les caches associés sont synchronisés avec le backend.
- La régénération de la suite d’une roadmap n’est pas enregistrée comme terminée : la route `POST /roadmaps/{id}/adapt/stream` n’est pas présente dans le routeur backend courant; besoin décrit dans `ROADMAP_REGENERATION_BACKEND_REQUIREMENTS.md`.
- Vérification: contrôle TypeScript avec `--ignoreDeprecations 6.0`, détection Impeccable et `git diff --check`.

### 2026-11-05 — Historique ciblé d'une étape adaptée

- La barre d'actions du détail propose « Historique (n) » à côté des actions d'adaptation et d'annulation, et chaque étape modifiée conserve son propre accès à l'historique. Le modal global ne liste que les anciennes versions dont le contenu diffère; l'accès d'une étape ne montre que son ancienne version.
- La comparaison associe temporairement les étapes par numéro d'ordre; le backend doit fournir un lien explicite entre ancienne et nouvelle étape. L'instantané reste limité à `sessionStorage` pour la session de l'onglet; voir `ROADMAP_ADAPTATION_HISTORY_BACKEND_REQUIREMENTS.md`.
- L'annulation de la dernière adaptation demande une confirmation stylée et explique les contraintes backend (étapes adaptées encore « À faire »; les favoris des anciennes ressources ne sont pas restaurés).
- L'annulation complète de la dernière adaptation reste disponible. L'annulation d'une seule étape n'est pas encore reliée : elle nécessite une route backend dédiée et une règle de cohérence avec l'annulation complète.
- Vérification: contrôle TypeScript ciblé avec `--ignoreDeprecations 6.0`, build Vite et `git diff --check`; `npm run build` reste bloqué par l'option `baseUrl` préexistante avec TypeScript 6.

### 2026-11-05 — Aperçu des ressources adapté aux petits écrans

- Le modal d'aperçu des ressources tient dans la hauteur disponible sur mobile; son iframe, sa vidéo et ses contrôles de navigation s'adaptent à l'espace restant pour éviter le débordement hors écran.
- Vérification: contrôle TypeScript ciblé avec `--ignoreDeprecations 6.0`, build Vite et `git diff --check`.

### 2026-11-05 — Correction du débordement horizontal de l'aperçu mobile

- La grille interne du modal est maintenant contrainte à sa largeur; un contenu d'iframe large ne décale plus l'en-tête hors écran. Les boutons précédent/suivant partagent également la largeur disponible.
- Vérification: contrôle TypeScript ciblé avec `--ignoreDeprecations 6.0`, build Vite et `git diff --check`.

### 2026-11-05 — Reprise persistante de la génération de roadmap

- La génération consomme l'événement SSE `generation`, mémorise l'identifiant et le dernier `id:` reçu, puis reprend via `GET /roadmaps/generations/{id}/events` avec `Last-Event-ID` après une coupure.
- Au retour de session ou après actualisation, l'état est rechargé depuis `GET /roadmaps/generations/{id}`; les étapes produites, recherches de ressources en attente, erreurs et résultats terminés sont restaurés sans démarrer une seconde tâche.
- L'identifiant et les paramètres de génération sont conservés dans `localStorage` pour retrouver la tâche; aucun jeton d'accès n'y est écrit. La carte de génération dans Roadmaps reprend l'état rechargé.
- Limite : après redémarrage du processus backend, une tâche encore active est marquée `interrupted` par le backend et doit être relancée; le worker IA ne reprend pas au milieu de son calcul.
- Vérification: contrôle TypeScript ciblé avec `--ignoreDeprecations 6.0`, build Vite et `git diff --check`.

### 2026-11-05 — Annulation explicite d'une génération

- Le panneau de progression propose maintenant d'arrêter la génération; une confirmation stylée précède l'appel à `DELETE /api/v1/roadmaps/generations/{id}`.
- Après l'annulation, la tâche disparaît de la liste et le formulaire réapparaît avec ses paramètres; si la génération se termine avant la confirmation backend, son état final est restauré au lieu d'être effacé.
- Vérification: contrôle TypeScript ciblé avec `--ignoreDeprecations 6.0`, build Vite et `git diff --check`.

### 2026-11-12 — Catalogue de catégories et historique durable des adaptations

- Le formulaire de génération et le filtre Ressources chargent les catégories depuis `GET /api/v1/categories`; le filtre envoie la catégorie exacte via `category_value` et les listes de catégories codées en dur côté frontend ont été retirées.
- Le détail d'une roadmap récupère les adaptations depuis `GET /api/v1/roadmaps/{id}/adapt/revisions`. Les anciennes versions s'appuient sur `step_links`, le repère « Modifiée » ne s'affiche que si le contenu diffère, et une étape ayant explicitement `replaced_step_id: null` est signalée comme nouvelle.
- Pour les révisions enregistrées avant `step_links`, l'association par ordre reste un repli de compatibilité. L'annulation ciblée d'une seule étape n'est pas fournie par l'API et reste à faire si elle est ajoutée côté backend.
- Vérification: TypeScript (`tsc --noEmit -p tsconfig.app.json --ignoreDeprecations 6.0`), build Vite et `git diff --check`.

### 2026-11-12 — Génération organisée en étapes

- Le formulaire de génération présente désormais un champ à la fois, avec progression et navigation précédent/suivant; les valeurs restent conservées en changeant d'étape.
- Les catégories du catalogue backend sont regroupées selon leur famille et repliées afin de réduire la hauteur de la sélection. Les écrans et la progression sont structurés à partir d'une liste d'étapes extensible.
- Vérification: TypeScript, build Vite et détection Impeccable. L'inspection visuelle via Chrome n'a pas abouti, le contrôle Computer Use n'ayant pas pu déterminer l'URL du navigateur.

### 2026-11-13 — Restauration ciblée d'une étape adaptée

- L'aperçu d'historique d'une étape propose de restaurer son ancienne version lorsque le lien backend est explicite, que la révision est la dernière et que l'étape est encore « À faire ».
- Une confirmation stylisée précise que seule cette étape sera restaurée et que ses favoris ne seront pas récupérés. L'appel à `POST /api/v1/roadmaps/{id}/adapt/revisions/latest/steps/{created_step_id}/undo` actualise le détail, l'historique, les listes, les ressources et le tableau de bord.
- Vérification: TypeScript et `git diff --check`.

### 2026-11-13 — Photo de profil et changement d'adresse e-mail

- Paramètres permet d'ajouter, remplacer et supprimer l'avatar avec validation JPEG/PNG/WebP et limite frontend de 2 Mo; l'image est aussi affichée dans la barre supérieure.
- Le changement d'adresse demande le mot de passe courant, envoie un code à la nouvelle adresse, permet de renvoyer le code après le délai backend de 60 secondes, de confirmer ou d'annuler la demande. L'adresse affichée comme courante ne change qu'après confirmation backend.
- La suppression du compte reste indisponible : aucun endpoint backend n'est fourni.
- Vérification: TypeScript (`tsc --noEmit -p tsconfig.app.json --ignoreDeprecations 6.0`) et `git diff --check`.

### 2026-11-19 — Refonte du détail d'une roadmap selon la maquette

- Le contenu du détail reprend la composition de la maquette : titre et fil d'Ariane, panneau de progression et d'actions, puis étapes présentées en timeline. Le niveau est chargé via l'endpoint de profil propre à la roadmap. Le layout partagé, la barre latérale et le header restent inchangés.
- Les ressources apparaissent sous leur étape sous forme de cartes article/vidéo; un clic ouvre l'aperçu de la ressource sélectionnée. Les statuts, l'historique par étape, l'annulation, l'adaptation et la régénération restent accessibles.
- Vérification : TypeScript (`tsc --noEmit -p tsconfig.app.json --ignoreDeprecations 6.0`) et `git diff --check`. La capture navigateur n'a pas pu être réalisée : le navigateur de vérification ne pouvait pas accéder au serveur local et Playwright CLI n'a pas pu télécharger son paquet dans l'environnement.

### 2026-11-19 — Ajustements du détail : typographie, aperçus et progression

- Les titres utilisent maintenant la même police Inter que le reste de l'application. Les cartes de ressources chargent une miniature vidéo ou un aperçu intégré d'article; l'illustration actuelle reste visible tant que l'aperçu charge ou si le média échoue.
- La timeline distingue les étapes terminées, l'étape actuelle et celles à venir avec les marqueurs et les connecteurs. L'étape « En cours » n'a plus de contour rectangulaire.
- Vérification : TypeScript (`tsc --noEmit -p tsconfig.app.json --ignoreDeprecations 6.0`) et `git diff --check`.

### 2026-11-19 — Défilement limité aux étapes et état de repli des ressources

- Le titre, le résumé et les actions de progression restent en place; seule la timeline des étapes défile, aussi sur mobile.
- En cas de chargement en cours ou d'échec d'aperçu, un état visuel avec titre et domaine remplace l'icône d'erreur brute. Les aperçus vidéo conservent une illustration de repli; les liens restent ouvrables.
- Vérification : TypeScript (`tsc --noEmit -p tsconfig.app.json --ignoreDeprecations 6.0`) et `git diff --check`.

### 2026-11-19 — Rétablissement des liens de ressources dans les cartes

- Les cartes rechargent l’aperçu intégré du lien d’article lorsqu’il est disponible et proposent désormais un lien direct vers la ressource, en plus de l’aperçu modal. Si le chargement échoue, le repli reste visible.
- Vérification : TypeScript (`tsc --noEmit -p tsconfig.app.json --ignoreDeprecations 6.0`) et `git diff --check`.

### 2026-11-24 — Refonte du dashboard selon la maquette

- Le dashboard présente une bannière d'accueil, un indicateur visuel du taux de roadmaps terminées, les compteurs réels par état, la répartition par catégorie, et l'état global des parcours.
- La section des roadmaps récentes affiche jusqu'à cinq éléments renvoyés par le backend, leur catégorie, leur progression d'étapes, leur date de création et un accès au détail. La recherche de la barre supérieure filtre ces résultats.
- Le lien de création mène au parcours existant `/roadmaps/generate`. Le header partagé et le side bar n'ont pas été modifiés.
- Vérification : contrôle TypeScript et `git diff --check`.

### 2026-11-24 — Ajustements visuels du dashboard après aperçu

- Les anneaux de la progression globale démarrent au côté gauche et n'affichent plus de segment résiduel à 0 %.
- Les compteurs « Vos roadmaps » utilisent des anneaux de répartition autour de chaque valeur, comme sur la maquette de référence.
- Les panneaux conservent une hauteur utile et un état vide illustré lorsqu'aucune donnée n'est disponible; la bannière d'accueil utilise un fond neutre.
- Vérification : TypeScript, détection Impeccable et `git diff --check`.

### 2026-11-24 — Rétablissement des icônes des compteurs dashboard

- Les icônes d'état sont rétablies à gauche des libellés « Vos roadmaps »; les anneaux des valeurs restent alignés à droite.
- Vérification : TypeScript et `git diff --check`.

### 2026-11-24 — Sortie garantie de la restauration de session

- L'appel de restauration `/auth/refresh` a maintenant un délai maximal de 15 secondes; l'application ne reste plus bloquée indéfiniment si l'API ne répond pas.
- Le client rejette aussi une réponse sans `access_token`, ce qui évite de marquer à tort la session comme authentifiée.
- En cas d'échec, l'état passe à déconnecté et les gardes de routes dirigent vers la connexion.
- Vérification : TypeScript et `git diff --check`.

### 2026-11-24 — Nouvelle création depuis le dashboard après une génération terminée

- Les actions de création du dashboard réinitialisent désormais l'état d'une génération terminée avant d'ouvrir le formulaire, comme les actions de la liste Roadmaps.
- La génération active n'est pas interrompue par `startNew`; son état est conservé et les liens transmettent le dashboard comme origine de navigation.
- Vérification : TypeScript et `git diff --check`.

### 2026-11-24 — Quota de génération dans la génération et les paramètres

- Le frontend consomme `GET /users/me/usage` et affiche le plan, le quota utilisé/restant, la période et le renouvellement dans Paramètres.
- Une génération refusée en `402 quota_exceeded` affiche le quota atteint, la consommation et la date de renouvellement, avec un lien vers Paramètres. Une `429 generation_rate_limited` affiche sa limite horaire et le délai de reprise sans relancer automatiquement la requête.
- Les erreurs de limite gardent leur type et leurs métadonnées dans l'état de génération, y compris après actualisation. Le compteur d'usage est invalidé après une génération réussie ou un refus de quota.
- Vérification : contrôle TypeScript, détection Impeccable et `git diff --check`.

### 2026-11-24 — Vérification complète de l'intégration du quota

- Le build de production fonctionne après retrait de `baseUrl` déprécié de TypeScript 6; l'alias `@/*` reste défini par `paths`.
- `npm run build` et `git diff --check` passent. Le build signale seulement l'avertissement existant de bundle JavaScript supérieur à 500 kB.
### 2026-11-24 — Cartes des roadmaps et ressources inspirées de la référence

- Les cartes de roadmaps et de ressources adoptent une surface sombre compacte, avec icônes, badges, titres hiérarchisés et métadonnées lisibles.
- Les liens d'ouverture, l'aperçu des ressources, les favoris, les états de progression et les actions d'archivage restent accessibles.
- Vérification : build frontend, détection Impeccable et `git diff --check`.
### 2026-11-24 — Correction du style et de la grille des cartes

- Les cartes Roadmaps et Ressources restent dans le thème clair; seuls leur structure, leur hiérarchie visuelle et leurs métadonnées s'inspirent de la référence.
- Les deux listes affichent quatre cartes par ligne sur grand écran, puis trois, deux et une selon la largeur disponible.
- Vérification : `git diff --check`.
### 2026-11-24 — Barre de filtres horizontale et archivage depuis le détail

- Les pages Roadmaps et Ressources présentent une barre de recherche avec icône, le tri et les filtres sur une rangée horizontale qui se replie sur mobile, comme sur la maquette.
- Les actions Archiver/Désarchiver ont été déplacées des cartes vers le panneau de progression du détail d’une roadmap; les deux listes se rafraîchissent après modification.
- Vérification : build frontend et `git diff --check`.
### 2026-11-25 — Badge de statut sur les cartes Ressources

- Le statut de l’étape apparaît maintenant dans l’en-tête de la carte, avec le type de ressource et le bouton favori; il n’est plus placé dans le bloc de contexte.
- Vérification : build frontend et `git diff --check`.
### 2026-11-25 — Icône favori sans contour circulaire

- Le bouton favori des cartes Ressources affiche maintenant uniquement l’étoile, sans bordure ni fond circulaire; l’état sélectionné reste visible par sa couleur.
- Vérification : `git diff --check`.
### 2026-11-25 — Menus déroulants personnalisés pour les filtres

- Les filtres Roadmaps et Ressources utilisent maintenant un composant partagé avec bouton arrondi, panneau blanc espacé et options arrondies, au lieu du menu natif du navigateur.
- Le menu se ferme après sélection, au clic extérieur ou avec Échap; les options prennent aussi en charge les flèches, Début et Fin au clavier.
- Vérification : build frontend et `git diff --check`.
### 2026-11-25 — Persistance des types et focus arrondi des favoris

- Le menu Type garde les types proposés (article, vidéo, cours, documentation, livre, podcast, exercice et projet) même lorsque le résultat courant est filtré sur un seul type.
- Le contour de focus « Mes favoris » conserve maintenant le rayon arrondi du contrôle.
- Vérification : build frontend et `git diff --check`.
### 2026-11-25 — Typographie des titres de page harmonisée

- Les titres principaux des pages partagent maintenant la même police Inter, taille 24 px, graisse 700 et interligne 32 px que la référence; leurs descriptions passent à 14 px / 20 px.
- Le titre du détail de roadmap, celui de génération et l’écran de vérification OTP suivent les mêmes tokens; les fils d’Ariane du détail sont réduits à 12 px / 18 px. Le grand titre promotionnel de l’accueil et le nom de marque restent distincts.
- Les tokens typographiques correspondants sont consignés dans `DESIGN.md`.
- Vérification : build frontend et `git diff --check`.
### 2026-11-25 — Historique des adaptations accessible sur les roadmaps archivées

- Le bouton d’historique n’est plus caché par les actions désactivées des roadmaps archivées.
- En cas d’échec de `/adapt/revisions`, le détail explique que l’historique est indisponible et propose de recharger les données.
- Vérification : build frontend et `git diff --check`.
### 2026-11-25 — Actions d’historique restaurées dans le panneau Roadmap

- Les boutons Historique et Annuler la dernière adaptation restent visibles dans le panneau de progression; ils indiquent leur chargement et sont désactivés seulement si aucune ancienne version ou adaptation n’est disponible.
- Les étapes disposant d’une version liée conservent leur action locale « Modifiée · Voir l’historique » et la restauration ciblée.
- Vérification : build frontend et `git diff --check`.
### 2026-11-25 — Restauration directe par étape adaptée

- Chaque étape avec une ancienne version associée affiche maintenant « Restaurer l’ancienne version » dans ses actions, en plus du bouton d’historique.
- L’action ouvre la confirmation existante, respecte les règles backend (étape non commencée, dernière adaptation) et montre son état de chargement sur l’étape concernée.
- Préférence de travail rappelée : préserver l’historique global et par étape, et maintenir un accès à l’annulation globale et à la restauration ciblée.
- Vérification : build frontend et `git diff --check`.
### 2026-11-25 — Historique conservé pour les étapes remplacées au contenu identique

- Une étape associée par `step_links` à son ancienne version reste marquée comme adaptée même si les champs visibles sont identiques; le bouton de restauration sous ses ressources n’est plus masqué par une comparaison de contenu seule.
- La restauration reste limitée aux liens explicites renvoyés par le backend et aux règles d’éligibilité de la dernière adaptation.
- Vérification : build frontend et `git diff --check`.
### 2026-11-25 — Badge d’historique replacé sous chaque étape

- Le badge « Modifiée · Voir l’historique » reste sous le titre de l’étape comme dans l’ancienne maquette; l’ancienne version et la restauration ciblée restent dans sa fenêtre d’historique.
- La lecture des liens de révision accepte les identifiants numériques sérialisés en texte et les anciens enregistrements dont `step_links` est omis ou nul.
- Le bouton global d’historique et l’annulation globale restent dans le panneau de progression.
- Vérification : build frontend et `git diff --check`.

### 2026-11-25 — Ajustements du détail de roadmap

- L’action « Annuler la dernière adaptation » est accessible depuis la fenêtre Historique de la carte « Votre progression ».
- L’archivage et le désarchivage utilisent une icône discrète en haut à droite de cette carte, avec un survol rouge.
- La zone de contenu du détail remplit désormais la hauteur et la largeur disponibles avec le fond cassé; le panneau des étapes récupère la hauteur libérée.
- Vérification : `npm run build`.

### 2026-11-25 — Hauteur visible augmentée pour la première étape

- Réduction des espacements verticaux autour du titre et dans la timeline afin d’agrandir la zone visible sans changer le défilement interne des étapes.
- L’objectif est de garder visibles les aperçus de ressources et les actions de régénération sur les écrans courants.
- Vérification : `npm run build` et `git diff --check`.

### 2026-11-25 — Aération sous la timeline

- Augmentation de l’espace inférieur dans la liste défilante des étapes pour dégager les cartes de ressources de la limite du panneau, sur desktop et mobile.
- Vérification : `git diff --check`.

### 2026-11-25 — Ajustement de l’en-tête et de l’espacement des étapes

- Le contenu du détail commence un peu plus haut, ce qui libère quelques pixels supplémentaires pour la timeline.
- Un léger espacement supplémentaire sépare les cartes d’étape.
- Vérification : `git diff --check`.

### 2026-11-25 — Espace entre le panneau et le footer

- Ajout d'une marge intérieure basse de 24 px sur desktop et 20 px sur mobile pour séparer visuellement la carte timeline du footer, tout en conservant le fond cassé.
- Vérification : `git diff --check`.

### 2026-11-25 — Timeline déroulée sur la hauteur complète de la page

- L’espace sous le détail est ramené à 12 px.
- La liste des étapes ne se limite plus à une fenêtre interne : le contenu de chaque étape, ses aperçus et ses actions de régénération restent déroulés dans la page principale.
- La page peut donc grandir avec la roadmap; le footer demeure en bas de l’application.
- Vérification : `npm run build` et `git diff --check`.

### 2026-11-25 — Carte de progression persistante au défilement

- La carte « Votre progression » reste visible en haut pendant le défilement de la timeline sur écran large; elle reprend le flux normal sur mobile.
- Vérification : `git diff --check`.

### 2026-11-25 — Boutons du détail plus compacts et arrondis

- Réduction de la hauteur et du padding des boutons de progression, d’historique, de régénération et de navigation des aperçus.
- Les boutons d’action ont des coins plus arrondis; les commandes uniquement iconiques gardent leur forme circulaire.
- Vérification : `npm run build` et `git diff --check`.

### 2026-11-25 — Typographie légèrement réduite dans le détail

- Les titres de roadmap et d’étape, titres de la carte progression, titres de modals et textes de description sont réduits d’environ 1 à 2 px, sans changer la famille de police ni la hiérarchie.
- Vérification : `npm run build` et `git diff --check`.

### 2026-11-25 — Paramètres organisés par rubriques

- La page Paramètres reprend une navigation latérale distincte pour Général, Profil d’apprenant, Sécurité, Quota de génération et Compte.
- Chaque rubrique affiche son propre contenu dans une carte dédiée, avec une adaptation mobile de la navigation.
- Les actions existantes de profil, e-mail, préférences, mot de passe, quota et déconnexion sont conservées.
- Vérification : `npm run build` et `git diff --check`.

### 2026-11-25 — Ajustements visuels des paramètres et boutons

- Le contrôle de photo de profil est placé sous l’avatar et les panneaux des paramètres partagent maintenant le rendu sans cadre de la rubrique Général.
- Sur mobile, le menu des paramètres utilise une liste compacte en deux colonnes au lieu de boutons en pastilles.
- Les boutons partagés et plusieurs actions spécifiques (déconnexion, génération, listes) ont une hauteur et un padding réduits.
- Vérification : `npm run build` et `git diff --check`.

### 2026-11-25 — Paramètres étendus sur la largeur disponible

- Suppression de la largeur maximale de la page Paramètres afin que le panneau de contenu utilise toute la largeur disponible jusqu’au bord droit.
- Vérification : `git diff --check`.

### 2026-11-25 — Fond des paramètres étendu jusqu’aux bords

- Ajustement de la largeur du conteneur blanc pour compenser les marges négatives du layout et couvrir toute la zone principale, y compris à droite.
- Adaptation du calcul aux marges plus petites sur mobile.
- Vérification : `git diff --check`.

### 2026-11-25 — Fond des paramètres prolongé sous le contenu

- Le fond blanc est appliqué à toute la zone de défilement principale, même quand une rubrique contient peu de contenu.
- Ajout d’une classe optionnelle sur la zone principale d’AppLayout pour permettre ce fond spécifique à la page Paramètres.
- Vérification : `npm run build` et `git diff --check`.

### 2026-11-25 — Boutons Actives et Archivées compacts

- Réduction de la hauteur et du padding des boutons de bascule des roadmaps afin de les aligner sur la taille des boutons Paramètres.
- Ajustement du padding du conteneur pour garder une hauteur totale cohérente avec son contour.
- Vérification : `git diff --check`.

### 2026-11-25 — Déconnexion signalée comme action destructive

- Le bouton de déconnexion des Paramètres et celui de la barre latérale utilisent maintenant une apparence rouge, avec un survol plus contrasté.
- Vérification : `git diff --check`.

### 2026-11-25 — Confirmation de déconnexion et menu de statut

- Le bouton de confirmation de déconnexion et son icône utilisent maintenant le style rouge d’action destructive.
- Le statut d’une étape utilise un menu personnalisé avec un espacement visible de 8 px sous le sélecteur; fermeture au clic extérieur ou avec Échap.
- Vérification : `npm run build` et `git diff --check`.

### 2026-11-25 — Mode sombre activable

- Activation du bouton de thème dans la barre supérieure avec bascule entre mode clair et mode sombre.
- La préférence est mémorisée localement et rétablie après rechargement.
- Ajout d’une palette sombre pour l’application, avec ajustements spécifiques des paramètres, de la génération et du détail d’une roadmap.
- Vérification : `npm run build` et `git diff --check`.

### 2026-11-25 — Curseur du bouton de thème

- Le bouton de thème affiche désormais le curseur pointeur et un état de survol; les commandes encore désactivées gardent le curseur d’indisponibilité.
- Vérification : `git diff --check`.

### 2026-11-25 — Bordures retirées des cartes Roadmaps et Ressources

- Suppression des bordures extérieures des cartes de roadmap, cartes de création et cartes de ressource, en conservant leurs coins arrondis et leur fond.
- Vérification : `git diff --check`.

### 2026-11-25 — Ombre légère sur les cartes

- Ajout d’une ombre discrète aux cartes Roadmaps, à la carte de création et aux cartes Ressources, avec une intensité adaptée au mode sombre.
- Vérification : `git diff --check`.

### 2026-11-25 — Ombres colorées et survol des cartes

- Ajout d’ombres bleutées discrètes aux panneaux du tableau de bord et aux cartes du détail de roadmap.
- Les cartes Roadmaps, Ressources et ressources d’étape renforcent leur ombre au survol; les ressources se soulèvent légèrement.
- Le style d’ombre suit aussi le mode sombre.
- Vérification : `npm run build` et `git diff --check`.

### 2026-11-25 — Survol des cartes du dashboard et ressources de roadmap

- Les panneaux du dashboard renforcent leur ombre bleutée au survol.
- Les ressources clés de la colonne latérale du détail de roadmap ont maintenant le même retour visuel que les ressources liées aux étapes.
- Vérification : `git diff --check`.

### 2026-11-25 — Bordures du dashboard et du détail retirées

- Suppression des bordures extérieures des panneaux du dashboard et des cartes principales et ressources du détail d’une roadmap.
- Retrait de l’accentuation au survol des panneaux du dashboard; les ombres de base sont conservées.
- Vérification : `git diff --check`.

### 2026-11-25 — Soulignement retiré des flèches des roadmaps récentes

- Suppression du soulignement par défaut sous les flèches d’ouverture des lignes du dashboard et ajout d’un focus clavier explicite.
- Vérification : `git diff --check`.

### 2026-11-25 — Icônes de catégorie des roadmaps

- Les icônes de catégorie des cartes Roadmaps utilisent maintenant la couleur primaire de l’application, adaptée automatiquement au thème clair ou sombre.
- Vérification : `git diff --check`.

### 2026-11-25 — Couleur propre à chaque icône de catégorie

- Retrait du fond bleu commun des icônes de catégorie des cartes Roadmaps et attribution d’une couleur dédiée à chaque catégorie.
- Déclinaisons ajustées pour le mode sombre.
- Vérification : `git diff --check`.

### 2026-11-25 — Contour des icônes de catégorie restauré

- Restauration d’un contour discret autour des icônes colorées, sans réintroduire le fond bleu.
- Vérification : `git diff --check`.

### 2026-11-26 — Quota des adaptations et régénérations IA

- Lecture des quotas `adjustments_*` renvoyés par le backend et affichage du budget dédié dans Paramètres, partagé entre adaptation d’une roadmap et régénération d’étape.
- Transmission du champ `quota` des erreurs API et affichage d’un message précis avec consommation, date de renouvellement et lien vers les quotas lorsqu’une action est refusée pour quota épuisé.
- Actualisation du résumé des quotas après les tentatives d’adaptation et de régénération.

### 2026-11-26 — Hauteur du footer sur mobile

- Réduction du padding vertical et des espacements internes du footer sur mobile.

### 2026-11-26 — Reprise des styles Roadmaps, Ressources et détail

- Alignement de la liste des roadmaps sur la maquette : filtres horizontaux, grille responsive de trois cartes et accès direct pour commencer, continuer ou revoir un parcours.
- Refonte des cartes Ressources avec couverture illustrative, statut, contexte roadmap/étape et actions ouvrir/aperçu.
- Présentation du détail en étapes cartographiées, avec progression latérale fixe, objectifs lisibles et ressources repliables.
- Maintien des données, filtres, favoris, statuts, historiques, régénérations et aperçus existants.

### 2026-11-26 — Réduction globale de l’échelle de l’interface

- Réduction uniforme de 10 % de l’application, incluant les textes, icônes, boutons, champs et espacements.
- Compensation de la hauteur du conteneur racine pour qu’il continue à remplir la fenêtre.

### 2026-11-26 — Défilement horizontal après la réduction globale

- Suppression de l’élargissement artificiel du conteneur racine qui provoquait un débordement horizontal.

### 2026-11-26 — Largeur du panneau de progression du détail

- Élargissement léger du panneau « Votre progression » pour laisser plus de place à ses informations.

### 2026-11-26 — Refonte du tableau de bord

- Réorganisation selon la nouvelle maquette : message de bienvenue avec action, trois panneaux de synthèse, puis roadmaps récentes et état des parcours.
- Remplacement de la répartition par catégories par des actions recommandées construites à partir des parcours existants et des destinations déjà disponibles.
- Conservation des agrégats backend, des liens de navigation, de la recherche des roadmaps récentes et des états de chargement/erreur.
- Adaptation de la disposition aux écrans tablette et mobile.

### 2026-11-26 — Favoris et progression des objectifs

- Mise à jour optimiste des favoris sur la page Ressources ; l’étoile active est maintenant pleine et colorée, avec retour à l’état précédent en cas d’erreur API.
- Ajout de cases à cocher, d’un compteur et d’une barre de progression pour les objectifs de chaque étape du détail d’une roadmap.
- Conservation locale dans le navigateur de la progression individuelle des objectifs en attendant sa persistance backend.
- Création de STEP_LEARNING_OBJECTIVES_PROGRESS_BACKEND_REQUIREMENTS.md pour documenter la synchronisation à prévoir.


### 2026-11-26 — Couleur des objectifs terminés

- Alignement de la ligne d’objectif cochée, de sa case et de la barre de progression sur le vert menthe de la maquette fournie, avec une variante lisible en mode sombre.
