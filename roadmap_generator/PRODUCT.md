# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Personnes qui veulent structurer un parcours d'apprentissage ou de progression (autodidactes, étudiants, reconversions) sans passer des heures à configurer un outil. Elles cherchent quelque chose de plus simple que Notion et plus flexible que Trello.

## Product Purpose
Générer des roadmaps d'apprentissage/progression personnalisées par IA et permettre de suivre son avancement avec zéro configuration manuelle.

## Positioning
Expérience zéro setup pour la progression : plus simple et immédiat que Notion, plus flexible et structuré qu'un board Trello classique, avec des roadmaps générées par IA adaptées au profil.

## Operating Context
Application Web responsive (desktop et mobile). Utilisation en sessions courtes pour consulter et cocher l'avancement, ou en session initiale pour générer un parcours complet.

## Capabilities and Constraints
- Expérience "zéro setup" : l'utilisateur ne doit jamais être bloqué par de la configuration
- IA interchangeable (Grok aujourd'hui, OpenRouter possible plus tard)
- Mobile-first / responsive obligatoire
- Accessibilité de base attendue
- Stack : Frontend React 19 + Vite + TypeScript (CSS Modules), Backend FastAPI + SQLAlchemy + PostgreSQL
- Terminologie :
  - Roadmap = parcours structuré généré
  - Step / Milestone = étape du parcours
  - Progress = avancement de l'utilisateur

## Brand Commitments
- Nom : RoadmapAI
- Identité visuelle : Interface calme et lisible, sans surcharge, épurée et rassurante

## Evidence on Hand
- Frontend existant dans `roadmap_generator/` avec système d'authentification (register, login, verify-otp) et tokens Material 3 déjà définis dans `styles/index.scss`.
- Backend FastAPI fonctionnel avec endpoints d'authentification et gestion JWT.

## Product Principles
- Une action principale claire par écran
- Interface calme et lisible, sans surcharge
- Le produit doit rester simple même quand les roadmaps deviennent complexes

## Accessibility & Inclusion
- Accessibilité de base attendue (contrastes de couleurs, navigation clavier, focus-visible explicite, structure sémantique)
