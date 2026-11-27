# Prochaines étapes — Frontend RoadmapAI

Repère de reprise pour chaque session. Comparer ce plan à `../roadmap_generator-backend/NEXT_STEPS.md` et `../roadmap_generator-backend/features_done.md` avant de commencer : le backend peut évoluer entre deux sessions. Une seule fonctionnalité à la fois; déplacer une tâche vers `feature_done.md` uniquement après son intégration et sa vérification.

## Règle de suivi

Ajouter chaque nouvelle action de reprise tout en bas, avec sa date. La dernière entrée est toujours le prochain travail à faire. Conserver les entrées précédentes comme historique au lieu de remplacer une date globale.

## À faire en premier

### 1. Appliquer le layout partagé aux pages métier

- Utiliser `AppLayout` et `PageHeader` dans les pages du tableau de bord, des roadmaps, des ressources et des paramètres.
- Compléter les actions de l'en-tête selon les fonctions réellement disponibles; ne pas ajouter de contrôles décoratifs sans comportement.
- Garder les pages publiques et d'authentification sur leur shell dédié.

### 2. Stabiliser et terminer l'authentification frontend

- Vérifier que login et vérification OTP enregistrent l'access token en mémoire et que la navigation reflète l'état authentifié.
- Ajouter l'action logout reliée à `POST /api/v1/auth/logout`, effacer le token en mémoire et revenir à une route publique.
- Vérifier les réponses `403` de compte non vérifié et guider vers la saisie OTP.
- Garder la page « mot de passe oublié » comme interface non fonctionnelle tant que le backend ne fournit pas les routes de réinitialisation; ne pas simuler l'envoi d'un email.

### 3. Profil global d'apprenant

- Lire et enregistrer le profil avec `GET` / `PUT /api/v1/users/me/learner-profile`.
- Respecter le contrat PUT : un champ omis reprend sa valeur par défaut.
- Utiliser les enums et bornes de validation backend avant de construire les contrôles du formulaire.

### 4. Liste et détail des roadmaps

- Liste : `GET /api/v1/roadmaps?limit=20&offset=0` (réponse paginée `items`, `total`, `limit`, `offset`).
- Détail : `GET /api/v1/roadmaps/{roadmap_id}`; chaque étape inclut son état de progression.
- Calculer le pourcentage côté client à partir de `completed_steps / total_steps`, avec le cas `total_steps === 0`.
- Le profil associé est lisible via `GET /api/v1/roadmaps/{roadmap_id}/learner-profile`.

### 5. Génération de roadmap

- Intégrer `POST /api/v1/roadmaps/generate` avec formulaire conforme à `RoadmapGenerateRequest` et affichage de la réponse complète.
- Ensuite, implémenter `POST /api/v1/roadmaps/generate/stream` en `fetch` + `ReadableStream` (EventSource ne prend pas en charge POST ni le header Authorization).
- Gérer les événements `meta`, `step`, `resources`, `reset`, `done` et `error`; les ressources arrivent séparément des étapes et nécessitent un état de chargement.
- Au `reset`, vider les étapes provisoires affichées. En cas de `done`, remplacer le brouillon par la roadmap persistée avec ses identifiants.

### 6. Suivi de progression

- Mettre à jour une étape via `PUT /api/v1/roadmaps/{roadmap_id}/steps/{step_id}/progress` avec `todo`, `in_progress` ou `done`.
- Prévoir une mise à jour optimiste avec retour arrière si l'appel échoue; actualiser les agrégats et le détail.

## Bloqué par l'évolution du backend

- Reset de mot de passe et authentification sociale : endpoints backend absents.
- Modification des paramètres, adaptation et édition manuelle de roadmap, suppression : à attendre jusqu'à disponibilité et validation des routes backend correspondantes.

## Vérifications avant chaque session

1. Lire ce fichier et `feature_done.md`.
2. Relire `../roadmap_generator-backend/features_done.md` et `../roadmap_generator-backend/NEXT_STEPS.md`.
3. Vérifier dans le code backend les routes/schémas concernés si les fichiers de suivi ne sont pas explicites ou si leur date est ancienne.
4. Choisir une seule fonctionnalité réellement disponible côté backend; après intégration, mettre à jour les deux fichiers frontend ensemble.

## Prochaine action

### 2026-10-20

- Commencer l'implémentation de la première page de maquette avec `AppLayout` et `PageHeader`, après vérification des endpoints backend nécessaires.

### 2026-10-20 — Reprise après la base de navigation

- Raccorder `AppLayout`, `Sidebar` et `AppTopBar` à la première page métier, puis brancher le callback de recherche sur les données effectivement disponibles pour cette page.

### 2026-10-20 — Après la première version du tableau de bord

- Implémenter la page « Toutes les roadmaps » à partir de la maquette, en vérifiant de nouveau pagination, progression et contrats dans le backend avant de brancher les interactions.
- Garder la page de tableau de bord comme référence des indicateurs encore en gabarit; la liste des évolutions backend attendues est dans `../roadmap_generator-backend/DASHBOARD_BACKEND_REQUIREMENTS.md`.

### 2026-10-20 — Après correction des redirections de session

- Implémenter la page « Toutes les roadmaps » à partir de la maquette, après nouvelle vérification des contrats de pagination et de progression côté backend.

### 2026-10-20 — Après ajustement de la barre supérieure et de la sidebar

- Implémenter la page « Toutes les roadmaps » avec le shell commun corrigé selon les maquettes; vérifier les contrats backend avant de brancher ses filtres et interactions.

### 2026-10-20 — Après ajustement de la recherche et du titre d'accueil

- Implémenter la page « Toutes les roadmaps » avec le shell commun; vérifier les contrats backend avant de brancher ses filtres et interactions.

### 2026-10-20 — Après alignement de la largeur du contenu

- Implémenter la page « Toutes les roadmaps » en conservant les espacements du shell directement issus de sa maquette; vérifier les contrats backend avant les interactions.

### 2026-10-20 — Après intégration de la liste des roadmaps

- Implémenter la page de détail d'une roadmap depuis sa maquette avec `GET /api/v1/roadmaps/{roadmap_id}`; relire le contrat des étapes et l'état de validation backend de la progression avant d'ajouter ses interactions.

### 2026-10-20 — Après correction du défilement du shell

- Implémenter la page de détail d'une roadmap depuis sa maquette avec `GET /api/v1/roadmaps/{roadmap_id}`; vérifier le contrat des étapes et l'état de validation backend de la progression avant ses interactions.

### 2026-10-20 — Après ajustement des boutons et filtres des roadmaps

- Implémenter la page de détail d'une roadmap depuis sa maquette avec `GET /api/v1/roadmaps/{roadmap_id}`; vérifier le contrat des étapes et l'état de validation backend de la progression avant ses interactions.

### 2026-10-20 — Après intégration du détail d'une roadmap

- Implémenter la page « Générer une roadmap » à partir de sa maquette; relire le contrat `RoadmapGenerateRequest` et créer/mettre à jour son fichier backend dédié avant d'intégrer le formulaire et la génération.
- Après confirmation de la migration et des tests backend de progression, revenir activer les mises à jour de statut d'étape depuis le détail.

### 2026-10-20 — Après la navigation vers le détail depuis les roadmaps récentes

- Implémenter la page « Générer une roadmap » à partir de sa maquette; relire le contrat `RoadmapGenerateRequest` et créer/mettre à jour son fichier backend dédié avant d'intégrer le formulaire et la génération.
- Après confirmation de la migration et des tests backend de progression, revenir activer les mises à jour de statut d'étape depuis le détail.

### 2026-10-20 — Après intégration de la génération d'une roadmap

- Intégrer la génération progressive avec `POST /api/v1/roadmaps/generate/stream` afin d'afficher les étapes au fur et à mesure; le contrat SSE existant et ses événements sont consignés dans `../roadmap_generator-backend/ROADMAP_GENERATE_BACKEND_REQUIREMENTS.md`.
- Après la génération progressive, poursuivre les pages restantes à partir de leurs maquettes, en créant une fiche backend dédiée pour chaque page et en n'y reportant que les besoins backend réels.

### 2026-10-20 — Après raccordement de « Nouvelle roadmap » dans la liste

- Intégrer la génération progressive avec `POST /api/v1/roadmaps/generate/stream`; le contrat SSE existe déjà et la fiche backend est dans `../roadmap_generator-backend/ROADMAP_GENERATE_BACKEND_REQUIREMENTS.md`.
- Ensuite, poursuivre les pages restantes à partir de leurs maquettes et relever seulement leurs besoins backend réels dans une fiche dédiée.

### 2026-10-20 — Après intégration de la mise à jour de progression

- Valider côté backend que la migration `a9d3f5b27c64` est appliquée aux deux bases, puis exécuter entièrement `doppler run -- pytest tests/ --reuse-db -v`; la vérification reste en attente car les identifiants et Doppler ne sont pas disponibles dans l'environnement actuel.
- Après validation, poursuivre la génération progressive avec `POST /api/v1/roadmaps/generate/stream`, puis les pages restantes à partir de leurs maquettes.

### 2026-10-21 — Après l'intégration du dashboard et de la liste des roadmaps

- Reprendre la page Ressources depuis sa maquette, vérifier les contrats disponibles et consigner uniquement les besoins backend qui manquent dans sa fiche dédiée.
- Clarifier/ajouter côté backend le contrat de tendances mensuelles du dashboard si les variations de la maquette doivent être affichées.

### 2026-10-22 — Après l'intégration de la génération progressive

- Reprendre la page Ressources depuis sa maquette, vérifier les contrats disponibles et consigner uniquement les besoins backend manquants dans sa fiche dédiée.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si les variations de la maquette doivent être affichées.

### 2026-10-22 — Après l'ajout des aperçus de ressources dans le détail

- Reprendre la page Ressources depuis sa maquette, vérifier les contrats disponibles et consigner uniquement les besoins backend manquants dans sa fiche dédiée.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si les variations de la maquette doivent être affichées.

### 2026-10-22 — Après l'alignement des icônes de ressources

- Reprendre la page Ressources depuis sa maquette, vérifier les contrats disponibles et consigner uniquement les besoins backend manquants dans sa fiche dédiée.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si les variations de la maquette doivent être affichées.

### 2026-10-22 — Après l'alignement des premières cartes du détail

- Reprendre la page Ressources depuis sa maquette, vérifier les contrats disponibles et consigner uniquement les besoins backend manquants dans sa fiche dédiée.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si les variations de la maquette doivent être affichées.

### 2026-10-23 — Après l'implémentation de la page Ressources

- Ajouter à `GET /api/v1/resources` le statut de progression de l'étape et son filtre (`todo`, `in_progress`, `done`), selon `../roadmap_generator-backend/RESOURCES_PAGE_BACKEND_REQUIREMENTS.md`; activer ensuite le filtre et afficher le statut réel dans les cartes.
- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-23 — Après la compaction des panneaux de filtres

- Ajouter à `GET /api/v1/resources` le statut de progression de l'étape et son filtre (`todo`, `in_progress`, `done`), selon la fiche backend dédiée, puis activer le filtre et afficher le statut réel dans les cartes.
- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-23 — Après la simplification des filtres de ressources

- Ajouter à `GET /api/v1/resources` le statut de progression de l'étape et son filtre (`todo`, `in_progress`, `done`), selon la fiche backend dédiée, puis activer le filtre et afficher le statut réel dans les cartes.
- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-23 — Après l'ajout de l'aperçu des ressources

- Ajouter à `GET /api/v1/resources` le statut de progression de l'étape et son filtre (`todo`, `in_progress`, `done`), selon la fiche backend dédiée, puis activer le filtre et afficher le statut réel dans les cartes.
- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-23 — Après la limitation du modal à une ressource

- Ajouter à `GET /api/v1/resources` le statut de progression de l'étape et son filtre (`todo`, `in_progress`, `done`), selon la fiche backend dédiée, puis activer le filtre et afficher le statut réel dans les cartes.
- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-23 — Après la restauration des filtres Roadmaps

- Ajouter à `GET /api/v1/resources` le statut de progression de l'étape et son filtre (`todo`, `in_progress`, `done`), selon la fiche backend dédiée, puis activer le filtre et afficher le statut réel dans les cartes.
- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-23 — Après le passage à 10 ressources par page

- Ajouter à `GET /api/v1/resources` le statut de progression de l'étape et son filtre (`todo`, `in_progress`, `done`), selon la fiche backend dédiée, puis activer le filtre et afficher le statut réel dans les cartes.
- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-23 — Après l'ajout du défilement infini des ressources

- Ajouter à `GET /api/v1/resources` le statut de progression de l'étape et son filtre (`todo`, `in_progress`, `done`), selon la fiche backend dédiée, puis activer le filtre et afficher le statut réel dans les cartes.
- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-23 — Après l'ajout du défilement infini aux roadmaps

- Ajouter à `GET /api/v1/resources` le statut de progression de l'étape et son filtre (`todo`, `in_progress`, `done`), selon la fiche backend dédiée, puis activer le filtre et afficher le statut réel dans les cartes.
- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-23 — Après l'ancrage des filtres pendant le défilement

- Ajouter à `GET /api/v1/resources` le statut de progression de l'étape et son filtre (`todo`, `in_progress`, `done`), selon la fiche backend dédiée, puis activer le filtre et afficher le statut réel dans les cartes.
- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-23 — Après l'ajustement visuel des filtres collants

- Ajouter à `GET /api/v1/resources` le statut de progression de l'étape et son filtre (`todo`, `in_progress`, `done`), selon la fiche backend dédiée, puis activer le filtre et afficher le statut réel dans les cartes.
- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-23 — Après le retour au défilement normal des filtres

- Ajouter à `GET /api/v1/resources` le statut de progression de l'étape et son filtre (`todo`, `in_progress`, `done`), selon la fiche backend dédiée, puis activer le filtre et afficher le statut réel dans les cartes.
- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-23 — Après l'accès direct aux étapes depuis Ressources

- Ajouter à `GET /api/v1/resources` le statut de progression de l'étape et son filtre (`todo`, `in_progress`, `done`), selon la fiche backend dédiée, puis activer le filtre et afficher le statut réel dans les cartes.
- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-23 — Après les graphiques du dashboard

- Ajouter à `GET /api/v1/resources` le statut de progression de l'étape et son filtre (`todo`, `in_progress`, `done`), selon la fiche backend dédiée, puis activer le filtre et afficher le statut réel dans les cartes.
- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-26 — Après le branchement du statut des ressources

- Reprendre la page Paramètres depuis sa maquette.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-26 — Après la page Paramètres

- Ajouter les capacités e-mail, photo de profil et suppression du compte décrites dans `SETTINGS_PAGE_BACKEND_REQUIREMENTS.md`, puis activer les actions correspondantes sur la page Paramètres.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-26 — Après la confirmation de déconnexion

- Ajouter les capacités e-mail, photo de profil et suppression du compte décrites dans `SETTINGS_PAGE_BACKEND_REQUIREMENTS.md`, puis activer les actions correspondantes sur la page Paramètres.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-26 — Après la boîte de dialogue de déconnexion

- Ajouter les capacités e-mail, photo de profil et suppression du compte décrites dans `SETTINGS_PAGE_BACKEND_REQUIREMENTS.md`, puis activer les actions correspondantes sur la page Paramètres.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-26 — Après l'alignement des catégories Ressources

- Charger les catégories depuis le backend et filtrer les ressources par catégorie exacte selon `RESOURCES_CATEGORY_FILTER_BACKEND_REQUIREMENTS.md`.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-26 — Après le lien vers le profil d'apprenant

- Charger les catégories depuis le backend et filtrer les ressources par catégorie exacte selon `RESOURCES_CATEGORY_FILTER_BACKEND_REQUIREMENTS.md`.
- Ajouter les capacités e-mail, photo de profil et suppression du compte décrites dans `SETTINGS_PAGE_BACKEND_REQUIREMENTS.md`, puis activer les actions correspondantes sur la page Paramètres.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-28 — Après l'intégration de l'archivage

- Charger les catégories depuis le backend et filtrer les ressources par catégorie exacte selon `RESOURCES_CATEGORY_FILTER_BACKEND_REQUIREMENTS.md`.
- Ajouter les capacités e-mail, photo de profil et suppression du compte décrites dans `SETTINGS_PAGE_BACKEND_REQUIREMENTS.md`, puis activer les actions correspondantes sur la page Paramètres.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-10-28 — Après la documentation générale du frontend

- Charger les catégories depuis le backend et filtrer les ressources par catégorie exacte selon `RESOURCES_CATEGORY_FILTER_BACKEND_REQUIREMENTS.md`.
- Ajouter les capacités e-mail, photo de profil et suppression du compte décrites dans `SETTINGS_PAGE_BACKEND_REQUIREMENTS.md`, puis activer les actions correspondantes sur la page Paramètres.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-11-03 — Après l'ajustement des étapes

- Intégrer l'adaptation en streaming de la suite d'une roadmap quand `POST /roadmaps/{id}/adapt/stream` et son contrat SSE seront présents dans le backend; voir `ROADMAP_REGENERATION_BACKEND_REQUIREMENTS.md`.
- Charger les catégories depuis le backend et filtrer les ressources par catégorie exacte selon `RESOURCES_CATEGORY_FILTER_BACKEND_REQUIREMENTS.md`.
- Ajouter les capacités e-mail, photo de profil et suppression du compte décrites dans `SETTINGS_PAGE_BACKEND_REQUIREMENTS.md`, puis activer les actions correspondantes sur la page Paramètres.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.

### 2026-11-03 — Après la régénération des ressources

- Intégrer l'adaptation en streaming de la suite d'une roadmap lorsque `POST /roadmaps/{id}/adapt/stream` et son contrat SSE sont disponibles; voir `ROADMAP_REGENERATION_BACKEND_REQUIREMENTS.md`.

### 2026-11-03 — Après la finition des modals de régénération

- Intégrer l'adaptation en streaming de la suite d'une roadmap lorsque `POST /roadmaps/{id}/adapt/stream` et son contrat SSE seront disponibles; voir `ROADMAP_REGENERATION_BACKEND_REQUIREMENTS.md`.

### 2026-11-03 — Après l'ajustement des marges des modals

- Intégrer l'adaptation en streaming de la suite d'une roadmap lorsque `POST /roadmaps/{id}/adapt/stream` et son contrat SSE seront disponibles; voir `ROADMAP_REGENERATION_BACKEND_REQUIREMENTS.md`.

### 2026-11-05 — Après l'historique des étapes adaptées

- Remplacer l'instantané `sessionStorage` et l'association temporaire par numéro d'ordre par un endpoint authentifié d'historique incluant le lien explicite ancienne/nouvelle étape; ajouter aussi l'annulation ciblée d'une étape adaptée, tout en gardant l'annulation complète cohérente après une restauration partielle. Voir `ROADMAP_ADAPTATION_HISTORY_BACKEND_REQUIREMENTS.md` dans le dépôt backend.

### 2026-11-05 — Après l'ajustement du modal de ressources mobile

- Intégrer l'endpoint d'historique durable des adaptations et l'annulation ciblée d'une étape quand les contrats backend décrits dans `ROADMAP_ADAPTATION_HISTORY_BACKEND_REQUIREMENTS.md` seront disponibles.

### 2026-11-05 — Après la correction du débordement horizontal du modal mobile

- Intégrer l'historique durable des adaptations et l'annulation ciblée d'une étape quand les contrats backend décrits dans `ROADMAP_ADAPTATION_HISTORY_BACKEND_REQUIREMENTS.md` seront disponibles.

### 2026-11-05 — Après la reprise persistante de la génération

- Si les générations doivent survivre aussi à un redémarrage du processus backend, remplacer la tâche `asyncio` locale par un worker durable; le comportement actuel conclut une tâche active avec `interrupted` au redémarrage.

### 2026-11-12 — Après le catalogue des catégories et l'historique durable des adaptations

- Si le backend ajoute la route d'annulation ciblée, permettre de restaurer une seule étape adaptée depuis son historique; l'annulation complète de la dernière adaptation reste déjà disponible.
- Clarifier/ajouter côté backend le contrat des tendances mensuelles du dashboard si elles doivent correspondre à la maquette.
- Ajouter les capacités e-mail, photo de profil et suppression du compte décrites dans `SETTINGS_PAGE_BACKEND_REQUIREMENTS.md`, puis activer les actions correspondantes sur la page Paramètres.
- Si les générations doivent survivre à un redémarrage du processus backend, remplacer la tâche `asyncio` locale par un worker durable.

### 2026-11-12 — Après le parcours de génération en plusieurs étapes

- Si le backend ajoute une route dédiée, permettre de restaurer une seule étape adaptée depuis son historique; l'annulation complète de la dernière adaptation reste disponible.
- Compléter les capacités Paramètres et les tendances mensuelles du tableau de bord si leurs contrats backend sont livrés.
- Pour conserver une génération active après un redémarrage du processus backend, remplacer la tâche `asyncio` locale par un worker durable.

### 2026-11-13 — Après la restauration ciblée d'une étape

- Si les générations doivent survivre à un redémarrage du processus backend, remplacer la tâche `asyncio` locale par un worker durable.
- Compléter les capacités Paramètres et les tendances mensuelles du tableau de bord lorsque les contrats backend correspondants seront livrés.

### 2026-11-13 — Après l'intégration de l'avatar et du changement d'e-mail

- Ajouter la suppression du compte lorsque le backend fournit son endpoint et sa politique de confirmation/conservation.
- Si les générations doivent survivre à un redémarrage du processus backend, remplacer la tâche `asyncio` locale par un worker durable.

### 2026-11-19 — Après la refonte du détail d'une roadmap

- Continuer l'implémentation des pages restantes à partir de leurs maquettes; conserver le header et le side bar partagés.

### 2026-11-19 — Après les ajustements de la typographie et de la timeline

- Continuer l'implémentation des pages restantes à partir de leurs maquettes; conserver le header et le side bar partagés.

### 2026-11-19 — Après le défilement interne des étapes et les aperçus de repli

- Continuer l'implémentation des pages restantes à partir de leurs maquettes; conserver le header et le side bar partagés.

### 2026-11-19 — Après le rétablissement des liens de ressources

- Continuer l'implémentation des pages restantes à partir de leurs maquettes; conserver le header et le side bar partagés.

### 2026-11-24 — Après la refonte du dashboard

- Continuer l'ajustement des pages restantes selon leurs maquettes, en réutilisant les données et fonctionnalités déjà disponibles côté backend.

### 2026-11-24 — Après l'ajustement visuel du dashboard

- Continuer les pages restantes à partir de leurs maquettes, en conservant les données backend et les composants partagés déjà en place.

### 2026-11-24 — Après le rétablissement des icônes du dashboard

- Continuer les pages restantes à partir de leurs maquettes en conservant les repères visuels et données déjà intégrés.

### 2026-11-24 — Après la protection du bootstrap de session

- Continuer les pages restantes selon leurs maquettes, en conservant les contrats backend et les composants partagés.

### 2026-11-24 — Après la correction de création depuis le dashboard

- Continuer l'implémentation des pages restantes à partir des maquettes, en gardant cohérents les parcours d'action entre dashboard et liste des roadmaps.

### 2026-11-24 — Après l'intégration des quotas de génération

- Continuer l'implémentation des pages restantes selon leurs maquettes; les prochains écarts d'API seront vérifiés dans les contrats backend avant d'être notés ici.

### 2026-11-24 — Après le build de l'intégration quota

- Poursuivre les pages restantes en suivant les maquettes, en gardant les routes API comme source de vérité.
### 2026-11-24 — Après l'ajustement des cartes

- Vérifier le rendu des cartes Roadmaps et Ressources sur desktop et mobile, puis ajuster les détails visuels selon le retour.
### 2026-11-24 — Après la correction des cartes

- Vérifier le rendu des grilles à quatre colonnes sur desktop et leur adaptation sur tablette et mobile.
### 2026-11-24 — Après la barre de filtres et le déplacement de l'archivage

- Vérifier visuellement la barre de filtres horizontale et les actions d’archivage dans le détail sur desktop et mobile.
### 2026-11-25 — Après le déplacement des badges Ressources

- Vérifier le rendu des badges de statut sur les cartes Ressources en desktop et mobile.
### 2026-11-25 — Après l’ajustement de l’icône favori

- Vérifier visuellement l’étoile seule sur les cartes Ressources et contrôler les états focus, favori et chargement.
### 2026-11-25 — Après les menus de filtres personnalisés

- Vérifier visuellement l’écart entre les boutons et leurs panneaux, ainsi que le rendu des options longues sur desktop et mobile.
### 2026-11-25 — Après l'ajustement des filtres Ressources

- Vérifier que la liste de types reste disponible après sélection et que l’état de focus de « Mes favoris » reste arrondi.
### 2026-11-25 — Après l’harmonisation des titres

- Vérifier les titres de page et descriptions sur desktop/mobile, notamment le détail de roadmap et le formulaire de génération.
### 2026-11-25 — Après la correction de l’historique des adaptations

- Vérifier qu’une roadmap adaptée affiche ses versions précédentes dans le détail, y compris lorsqu’elle est archivée.
### 2026-11-25 — Après le rétablissement des actions d’historique

- Contrôler dans une roadmap réellement adaptée que les deux boutons deviennent actifs et que chaque étape modifiée ouvre sa version précédente.
### 2026-11-25 — Après l’ajout de la restauration directe par étape

- Vérifier dans une roadmap adaptée l’action de restauration sur une étape modifiée, la confirmation, puis l’historique restant sur les autres étapes.
### 2026-11-25 — Après la correction de détection des étapes remplacées

- Vérifier sur une adaptation récente que chaque étape reliée à une ancienne version affiche son action de restauration sous ses ressources.
### 2026-11-25 — Après le repositionnement du badge d’historique

- Confirmer visuellement que chaque étape adaptée affiche le badge sous son titre, que la fenêtre montre son ancienne version et que la restauration ciblée est disponible si l’étape peut être annulée.

### 2026-11-25 — Après les ajustements du détail de roadmap

- Vérifier dans le navigateur que le fond cassé couvre toute la zone jusqu’au footer, que la carte montre davantage de timeline, et que l’action d’annulation se trouve dans Historique.

### 2026-11-25 — Après l’augmentation de hauteur de la timeline

- Vérifier visuellement à la résolution de référence que les deux actions de régénération apparaissent au bas de la première étape.

### 2026-11-25 — Après l’ajout d’espace sous la timeline

- Vérifier visuellement que les cartes de ressources gardent une marge nette avant le bas du panneau.

### 2026-11-25 — Après l’ajustement vertical du détail

- Confirmer visuellement l’alignement du titre et l’espace sous chaque étape.

### 2026-11-25 — Après l’ajout de marge au-dessus du footer

- Contrôler visuellement que le bas de la carte timeline n’est plus collé au footer.

### 2026-11-25 — Après le passage de la timeline au défilement de page

- Vérifier sur une roadmap longue que les cartes d’étape restent entières jusqu’aux actions, que la page principale défile et que le footer reste accessible après la dernière étape.

### 2026-11-25 — Après la fixation de la carte de progression

- Vérifier le comportement sticky sur écran large et l’empilement normal sur mobile.

### 2026-11-25 — Après la réduction des boutons du détail

- Vérifier visuellement les proportions des actions de la roadmap et des modals sur desktop et mobile.

### 2026-11-25 — Après l’ajustement de typographie du détail

- Vérifier le rendu des titres et sous-titres sur les largeurs desktop et mobile.

### 2026-11-25 — Après la réorganisation des paramètres

- Vérifier visuellement les rubriques Paramètres sur desktop et mobile, notamment le menu en deux colonnes et la carte Quota.

### 2026-11-25 — Après la réduction globale des boutons

- Vérifier les tailles des actions sur le dashboard, les formulaires, les modals et les pages Roadmaps et Ressources.

### 2026-11-25 — Après l’activation du mode sombre

- Vérifier visuellement les vues Dashboard, Roadmaps, Ressources, Paramètres, Génération et Détail en mode sombre, puis contrôler la persistance après rechargement.

### 2026-11-25 — Après le retrait des bordures des cartes

- Vérifier le contraste des cartes Roadmaps et Ressources en mode clair et sombre.

### 2026-11-25 — Après l’ajout de l’ombre légère

- Vérifier que l’ombre reste discrète sur les cartes Roadmaps et Ressources dans les deux thèmes.

### 2026-11-25 — Après les ombres colorées et les survols

- Vérifier visuellement les ombres du tableau de bord, du détail des roadmaps, des ressources d’étape et les retours au survol des cartes.

### 2026-11-25 — Après l’extension du survol au dashboard

- Vérifier le survol des panneaux du dashboard et des ressources clés dans le détail d’une roadmap, en clair comme en sombre.

### 2026-11-25 — Après le retrait des bordures du dashboard et du détail

- Vérifier le rendu des panneaux du dashboard sans effet au survol et des cartes du détail sans bordure, dans les deux thèmes.

### 2026-11-25 — Après la couleur dédiée aux icônes de catégorie

- Vérifier la lisibilité des couleurs de chaque catégorie sur fond clair et sombre.

### 2026-11-26 — Quota des régénérations

- Vérifier si le quota partagé des modifications IA doit aussi couvrir l’actualisation des ressources : l’endpoint backend `POST /roadmaps/{id}/steps/{step_id}/resource-adjustments` ne vérifie actuellement pas ce quota.

### 2026-11-26 — Après la réduction du footer mobile

- Vérifier son rendu sur un petit écran lorsque les liens passent sur plusieurs lignes.

### 2026-11-26 — Après la reprise des styles Roadmaps, Ressources et détail

- Vérifier les trois vues en clair et en sombre sur desktop, tablette et mobile, notamment l’alignement des filtres, les cartes ressources et le panneau de progression fixe.

### 2026-11-26 — Après la réduction globale de l’échelle

- Vérifier l’absence de défilement horizontal et le remplissage de la fenêtre sur desktop et mobile; contrôler aussi les modals.

### 2026-11-26 — Après l’élargissement du panneau de progression

- Vérifier que les informations de progression restent visibles à côté des étapes sur les largeurs desktop et tablette.

### 2026-11-26 — Après la refonte du tableau de bord

- Vérifier le rendu de la nouvelle disposition sur desktop, tablette et mobile, en clair et en sombre.
- Si une recommandation basée sur les ressources ou la prochaine étape est souhaitée, exposer ces informations dans l’API dashboard avant de l’afficher.

### 2026-11-26 — Après l’ajout de la progression des objectifs

- Vérifier le changement visuel de l’étoile sur la page Ressources lors d’un succès API et son retour arrière en cas d’échec.
- Vérifier la barre des objectifs, le stockage local et le rendu mobile dans le détail d’une roadmap.
- Implémenter les exigences de persistance backend décrites dans STEP_LEARNING_OBJECTIVES_PROGRESS_BACKEND_REQUIREMENTS.md, puis remplacer le stockage local du frontend par les états synchronisés.


### 2026-11-26 — Après l’ajustement des couleurs d’objectifs

- Vérifier visuellement l’état coché en thème clair et sombre sur desktop et mobile.

### 2026-11-27 — Après l’ajout du loader lumineux

- Vérifier visuellement le loader dans les trois contextes desktop et mobile, en clair et en sombre.


### 2026-11-27 — Après l’ajout du loader d’adaptation globale

- Vérifier le loader dans le modal d’adaptation avant l’arrivée de la première étape, sur mobile et desktop.


### 2026-11-27 — Après la couleur du badge « À faire »

- Vérifier le contraste du statut sur les cartes de ressources et dans le sélecteur de statut, en clair et en sombre.

