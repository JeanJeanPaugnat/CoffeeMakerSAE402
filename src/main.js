/**
 * SAE 402 - Holo Barista
 * Point d'entrée principal de l'application
 * 
 * Structure des modules :
 * - state.js       : État global partagé
 * - audio.js       : Système audio
 * - coffee.js      : Machine à café et tasses
 * - inventory.js   : Menu HUD et spawn d'objets
 * - panels.js      : Panneaux UI (welcome, notifications)
 * - wrist-tablet.js: Tablette au poignet (commandes)
 * - grab.js        : Système de grab/release
 * - trash.js       : Système de poubelles
 * - cleaning.js    : Système de nettoyage (balai)
 * - xr.js          : Session XR et boucle principale
 */

import 'aframe';
import 'aframe-extras';
import 'aframe-physics-system';

// Import des modules
import * as state from './modules/state.js';
import { initCoffeeAudio, initBgMusic, playBgMusic } from './modules/audio.js';
import { createHUDInventory } from './modules/inventory.js';
import { createWelcomePanel, setOnWelcomePanelClosed } from './modules/panels.js';
import { createWristTablet } from './modules/wrist-tablet.js';
import { initScorePanel } from './modules/score.js';
import { initLogsPanel } from './modules/log-panel.js';
import { initStains, startCleaningLoop } from './modules/cleaning.js';
import { startARSession } from './modules/xr.js';
import { initStory, setOnStoryCompleted } from './modules/story.js';
import { initUnlocks } from './modules/unlocks.js';
import { initSfx } from './modules/sfx.js';
import { getUsername, setUsername, hasUsername } from './modules/profile.js';
import { renderLeaderboard, submitScoreSync } from './modules/leaderboard.js';

/* global THREE */

console.log('☕ SAE 402 - Chargement...');

/**
 * Initialisation de l'application
 */
window.addEventListener('load', () => {
    setTimeout(() => {
        // Récupération des éléments DOM
        const debugEl = document.getElementById('debug');
        const startBtn = document.getElementById('start-btn');
        const landingPage = document.getElementById('landing-page');
        const gameContainer = document.getElementById('game-container');
        const sceneEl = document.getElementById('scene');
        const usernameInput = document.getElementById('username-input');

        // --- USERNAME GATING ---
        // Pre-fill if username exists in localStorage
        if (hasUsername() && usernameInput) {
            usernameInput.value = getUsername();
            startBtn.disabled = false;
        }

        // Enable/disable start button based on username
        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                const val = usernameInput.value.trim();
                startBtn.disabled = val.length === 0;
            });
        }

        // --- LEADERBOARD ON LANDING PAGE ---
        renderLeaderboard('leaderboard-container');

        // --- BEFOREUNLOAD : save score on page close ---
        window.addEventListener('beforeunload', () => {
            submitScoreSync();
        });
        let cursorEl = document.getElementById('cursor');

        // Cacher la scène initialement
        if (sceneEl) {
            sceneEl.style.display = 'none';
        }

        // Vérification des éléments requis
        if (!sceneEl) {
            if (debugEl) debugEl.textContent = 'Éléments manquants!';
            console.error('Éléments manquants!');
            return;
        }

        // Création automatique du curseur si manquant
        if (!cursorEl && sceneEl) {
            console.log('Creating cursor manually...');
            cursorEl = document.createElement('a-ring');
            cursorEl.id = 'cursor';
            cursorEl.setAttribute('color', 'green');
            cursorEl.setAttribute('radius-inner', '0.05');
            cursorEl.setAttribute('radius-outer', '0.08');
            cursorEl.setAttribute('rotation', '-90 0 0');
            cursorEl.setAttribute('visible', 'false');
            cursorEl.setAttribute('material', 'shader: flat; opacity: 0.8; transparent: true');
            sceneEl.appendChild(cursorEl);
        }

        // Initialisation de l'état global
        state.setSceneElements(sceneEl, null, cursorEl, debugEl);

        if (debugEl) debugEl.textContent = 'Prêt!';

        // Initialisation de l'audio
        initCoffeeAudio();
        initBgMusic();
        initSfx();

        // Configurer le callback pour lancer le mode histoire après fermeture du welcome panel
        setOnWelcomePanelClosed(() => {
            initStory();
        });

        // Quand le tutoriel est terminé → lancer les commandes
        setOnStoryCompleted(() => {
            createWristTablet();
        });

        // --- GESTIONNAIRE DU BOUTON START ---
        startBtn.onclick = async () => {
            console.log('☕ Start button clicked!');

            // Save username from input
            if (usernameInput && usernameInput.value.trim()) {
                setUsername(usernameInput.value.trim());
            }

            // 1. Cacher la landing page
            if (landingPage) {
                landingPage.style.display = 'none';
            }

            // 2. Afficher le loader
            if (gameContainer) {
                gameContainer.classList.remove('hidden');
                gameContainer.classList.add('visible');
            }

            // 3. Après le délai du loader, lancer l'AR
            setTimeout(async () => {
                // Cacher le loader, afficher la scène
                if (gameContainer) {
                    gameContainer.classList.remove('visible');
                    gameContainer.classList.add('hidden');
                }
                if (sceneEl) {
                    sceneEl.style.display = 'block';
                }

                // Démarrer la session AR
                const session = await startARSession();

                if (session) {
                    // Lancer la musique de fond
                    playBgMusic();

                    // Initialiser le système de déverrouillage
                    initUnlocks();


                    // Initialiser le score et les logs (sans les commandes)
                    initScorePanel();
                    initLogsPanel();

                    // Créer le panneau de bienvenue
                    createWelcomePanel();

                    // Créer le menu HUD (caché par défaut)
                    createHUDInventory();

                    // Initialiser les taches et le système de nettoyage
                    initStains();
                    startCleaningLoop();
                }
            }, 2500); // Délai du loader (2.5 secondes)
        };

    }, 100);
});