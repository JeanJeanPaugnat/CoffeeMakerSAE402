# ☕ Holo Barista - SAE 402

**Jeu de simulation de barista en réalité augmentée (AR/XR)**

*Développé dans le cadre de la SAE 402 - BUT MMI*

---

## 📖 Description

Holo Barista est un jeu immersif en réalité augmentée où vous incarnez un barista dans une "dark kitchen" virtuelle. Votre mission : préparer et servir des cafés et des donuts pour accomplir les commandes qui s'affichent sur votre tablette au poignet.

Le jeu utilise **WebXR** et **A-Frame** pour offrir une expérience AR accessible directement depuis un navigateur sur casque VR (Meta Quest).

---

## 🛠️ Technologies Utilisées

### Frameworks & Librairies

| Technologie | Version | Description |
|-------------|---------|-------------|
| **A-Frame** | 1.7.1 | Framework WebVR/WebXR basé sur Three.js |
| **aframe-extras** | 7.6.1 | Composants additionnels (animations, contrôles) |
| **aframe-physics-system** | 4.0.2 | Système de physique (gravité, collisions) |
| **aframe-state-component** | 7.1.1 | Gestion d'état pour A-Frame |
| **Vite** | 7.3.1 | Bundler et serveur de développement |

### APIs WebXR Utilisées

- **WebXR Device API** - Session AR immersive
- **Hit-Test** - Détection de surfaces pour placer des objets
- **DOM Overlay** - Interface 2D superposée en AR
- **Controller Input** - Gestion des manettes VR

---

## 📂 Architecture du Projet

```
SAE-402/
├── index.html              # Page principale (version standard)
├── index-mesh.html         # Page avec mesh detection (Quest 3+)
├── package.json            # Dépendances NPM
├── vite.config.js          # Configuration Vite (SSL pour XR)
│
├── public/
│   ├── img/                # Images et textures
│   ├── models/             # Modèles 3D GLB
│   └── sounds/             # Effets sonores
│
└── src/
    ├── main.js             # Point d'entrée principal
    ├── main-mesh.js        # Point d'entrée (mesh detection)
    ├── style.css           # Styles de la landing page
    │
    └── modules/
        ├── state.js        # État global partagé
        ├── audio.js        # Système audio
        ├── coffee.js       # Machine à café et tasses
        ├── donut.js        # Machine à donuts
        ├── inventory.js    # Menu HUD / VR Store
        ├── panels.js       # Panneaux UI (welcome, notifications)
        ├── wrist-tablet.js # Tablette au poignet (commandes)
        ├── grab.js         # Système de grab/release
        ├── trash.js        # Système de poubelles
        ├── cleaning.js     # Système de nettoyage (balai)
        ├── customers.js    # Clients (désactivé - mode dark kitchen)
        ├── xr.js           # Session XR standard
        ├── xr-plan.js      # Session XR avec plane detection
        └── xr-mesh.js      # Session XR avec mesh detection
```

---

## 🎮 Fonctionnalités Actuelles

### Gameplay

- **🎒 VR Store** - Menu HUD pour placer des objets (touche Y)
- **☕ Machine à café** - Produit des tasses de café (touche B)
- **🍩 Machine à donuts** - Produit des donuts
- **✋ Grab System** - Attraper et lâcher des objets avec les contrôleurs
- **🗑️ Poubelles** - Jeter les objets indésirables
- **🧹 Nettoyage** - Balayer les taches au sol avec le balai
- **📋 Système de commandes** - Affichage des commandes à accomplir (tablette au poignet)
- **📊 Score** - Points gagnés en complétant les commandes

### Objets Disponibles dans le VR Store

| Objet | Description |
|-------|-------------|
| CUBE | Cube de test |
| COFFEE | Machine à café |
| POUBELLE | Poubelle pour jeter les objets |
| DONUT | Boîte à donuts (machine) |
| SPEAKER | Enceintes (décoration) |
| BROOM | Balai pour nettoyer |
| REGISTER | Caisse enregistreuse |
| SIGN | Enseigne café |
| COUCH | Canapé |
| PLANT | Plante verte |
| RUG | Tapis |

### Interface

- **Welcome Panel** - Instructions au démarrage
- **Orders Panel** - Affiche la commande actuelle (en bas du champ de vision)
- **Notifications AR** - Messages contextuels
- **Debug Panel** - Informations de débogage (optionnel)

---

## 📁 Fichiers pour Développement Futur

Ces fichiers sont préparés pour de futures fonctionnalités mais **ne sont pas actifs actuellement** :

| Fichier | Description | Prérequis |
|---------|-------------|-----------|
| `main-mesh.js` | Point d'entrée avec mesh detection | Quest 3 / Quest Pro |
| `xr-mesh.js` | Détection des meshes 3D de l'environnement réel | WebXR Mesh Detection |
| `xr-plan.js` | Détection des plans (sol, murs, tables) | WebXR Plane Detection |
| `index-mesh.html` | Page HTML pour le mode mesh | Quest 3+ |

### Pourquoi ces fichiers ?

- **Plane Detection** : Permet de détecter automatiquement les surfaces réelles (sol, tables) pour y placer des objets de manière plus réaliste.
- **Mesh Detection** : Technologie plus avancée (Quest 3) qui détecte la géométrie complète de la pièce, permettant des interactions plus riches avec l'environnement réel.

---

## 🚀 Installation et Lancement

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement
npm run dev

# Build pour production
npm run build
```

### Accès au jeu

1. Ouvrir le navigateur sur le casque Quest
2. Accéder à l'URL du serveur (https requis pour WebXR)
3. Cliquer sur "PLAY NOW"
4. Accepter les permissions AR

---

## 🎯 Idées d'Amélioration

### Gameplay

1. **🎵 Musique d'ambiance** - Ajouter de la musique de café relaxante via le speaker
2. **⏱️ Mode chrono** - Timer pour compléter X commandes en temps limité
3. **📈 Niveaux de difficulté** - Commandes plus complexes au fur et à mesure
4. **🍰 Nouveaux produits** - Croissants, muffins, smoothies, etc.
5. **💰 Système économique** - Argent pour acheter de nouvelles machines/décorations
6. **⭐ Évaluation clients** - Notes de satisfaction selon la rapidité/qualité

### Technique

7. **🗺️ Plane Detection actif** - Utiliser les surfaces réelles détectées
8. **🔊 Audio spatialisé** - Sons 3D positionnels
9. **💾 Sauvegarde** - Progression locale ou en ligne
10. **🎨 Customisation** - Personnaliser l'apparence du café
11. **🤝 Multijoueur** - Collaborer avec un autre barista
12. **📱 Mode spectateur** - Vue sur téléphone de ce qui se passe dans le casque

### Contenu

13. **🏆 Succès/Trophées** - Débloquer des récompenses
14. **📖 Recettes** - Combiner des ingrédients pour créer des boissons spéciales
15. **🎭 Personnages clients** - Clients avec personnalités et préférences
16. **🌟 Mode histoire** - Scénario avec progression narrative

---

## 👥 Équipe

**JWM MMI Games** - BUT MMI 2026

---

## 📝 Notes de Version

### v0.1.0 (Actuelle)
- ✅ Système de grab fonctionnel
- ✅ Machine à café et donuts
- ✅ VR Store avec objets plaçables
- ✅ Système de commandes
- ✅ Nettoyage avec balai
- ✅ Poubelles fonctionnelles
- ✅ Mode dark kitchen (sans clients visibles)

---

## 📄 Licence

Projet académique - SAE 402 - BUT MMI
