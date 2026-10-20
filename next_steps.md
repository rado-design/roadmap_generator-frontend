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
