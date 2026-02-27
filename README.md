# SAE 402 - Holo Barista

## Présentation
Ce projet est une application VR/WebXR développée pour le module SAE 402, permettant de simuler un café interactif en réalité augmentée. L'utilisateur incarne un barista et doit gérer un café virtuel, avec des mécaniques de jeu immersives et une interface moderne.

## Fonctionnalités principales
- **Gestion du score et des commandes** : Système de points, streaks, bonus de rapidité, pénalités en cas de timeout.
- **Détection de surfaces (plan et mesh)** : Placement d’objets sur des surfaces détectées dans l’environnement.
- **Inventaire interactif** : HUD pour acheter et placer des équipements (machine à café, boîte à donuts, poubelle, etc.).
- **Système audio** : Musique de fond, sons d’événements, playlist dynamique.
- **Tutoriel guidé** : Mode histoire avec checklist progressive, messages narratifs et bonus.
- **Leaderboard** : Classement des scores, sauvegarde et synchronisation.
- **Déverrouillage d’objets** : Items du store débloqués selon le score.
- **Nettoyage et gestion des déchets** : Balai, poubelle, interactions physiques.
- **Tablette au poignet** : Suivi des commandes, timer, feedback visuel.
- **XR Controllers** : Prise en charge des contrôleurs, interactions laser, raycast, grab/release.

## Fonctionnement général
- L’utilisateur commence sur une page d’accueil, entre son pseudo, puis lance la session AR.
- Un tutoriel guide l’utilisateur à travers les étapes de setup du café.
- Les commandes arrivent, l’utilisateur doit préparer cafés et donuts, gérer la rapidité et la précision.
- Les objets sont placés sur les surfaces détectées (plan ou mesh).
- Le score évolue selon la performance, débloquant de nouveaux objets.
- Un leaderboard permet de comparer les scores.

## Versions et détection de plan/mesh
- Deux versions sont disponibles :
  - **Plan detection** : Détection de surfaces planes pour placer les objets.
  - **Mesh detection** : Détection de maillages pour une interaction plus fine.
- Ces versions sont semi-fonctionnelles : lors du changement de salle, le casque ne récupère que le dernier décor généré, ce qui limite la persistance des objets placés.

## Problèmes connus
- Lors du changement de salle, la détection ne conserve que le dernier décor, les objets précédents ne sont pas récupérés.
- Mesh detection et plan detection fonctionnent, mais la persistance des objets reste à améliorer.

---
