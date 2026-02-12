/**
 * SAE 402 - Holo Barista
 * VERSION MESH DETECTION - Pour tester le mesh detection
 * 
 * Ce fichier est identique à main.js mais utilise mesh-detection
 * au lieu de plane-detection pour comparer les deux approches.
 * 
 * /!\ Quest 3 ou Quest Pro requis pour mesh-detection!
 */

import 'aframe';
import 'aframe-extras';
import 'aframe-physics-system';

// Import des modules - utilise xr-mesh au lieu de xr
import * as state from './modules/state.js';
import { initCoffeeAudio } from './modules/audio.js';
import { createHUDInventory } from './modules/inventory.js';
import { createWelcomePanel, setOnWelcomePanelClosed } from './modules/panels.js';
import { createWristTablet, initOrders, createDebugPanel } from './modules/wrist-tablet.js';
import { initStains, startCleaningLoop } from './modules/cleaning.js';
import { startARSessionMesh, getMeshStats, toggleMeshVisibility } from './modules/xr-mesh.js';

/* global THREE */

console.log('☕ SAE 402 - MESH DETECTION MODE - Chargement...');

// Exposer les fonctions utilitaires globalement pour debug
window.getMeshStats = getMeshStats;
window.toggleMeshVisibility = toggleMeshVisibility;

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
        const cubeEl = document.getElementById('cube');
        let cursorEl = document.getElementById('cursor');

        // Cacher la scène initialement
        if (sceneEl) {
            sceneEl.style.display = 'none';
        }

        // Vérification des éléments requis
        if (!sceneEl || !cubeEl) {
            if (debugEl) debugEl.textContent = 'Éléments manquants!';
            console.error('Éléments manquants!');
            return;
        }

        // Création automatique du curseur si manquant
        if (!cursorEl && sceneEl) {
            console.log('Creating cursor manually...');
            cursorEl = document.createElement('a-ring');
            cursorEl.id = 'cursor';
            cursorEl.setAttribute('color', 'orange'); // Orange pour indiquer mode mesh
            cursorEl.setAttribute('radius-inner', '0.05');
            cursorEl.setAttribute('radius-outer', '0.08');
            cursorEl.setAttribute('rotation', '-90 0 0');
            cursorEl.setAttribute('visible', 'false');
            cursorEl.setAttribute('material', 'shader: flat; opacity: 0.8; transparent: true');
            sceneEl.appendChild(cursorEl);
        }

        // Initialisation de l'état global
        state.setSceneElements(sceneEl, cubeEl, cursorEl, debugEl);

        if (debugEl) debugEl.textContent = 'Mode MESH DETECTION - Prêt!';

        // Initialisation de l'audio
        initCoffeeAudio();

        // Configurer le callback pour créer la tablette après fermeture du welcome panel
        setOnWelcomePanelClosed(createWristTablet);

        // --- GESTIONNAIRE DU BOUTON START ---
        startBtn.onclick = async () => {
            console.log('☕ Start button clicked! (MESH DETECTION MODE)');

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

                // Démarrer la session AR avec MESH DETECTION
                const session = await startARSessionMesh();
                
                if (session) {
                    // Initialiser les commandes dès maintenant
                    initOrders();
                    
                    // Créer le panneau de debug VR
                    createDebugPanel();
                    
                    // Créer le panneau de bienvenue
                    createWelcomePanel();

                    // Créer le menu HUD (caché par défaut)
                    createHUDInventory();

                    // Initialiser les taches et le système de nettoyage
                    initStains();
                    startCleaningLoop();

                    // Log mesh stats périodiquement
                    setInterval(() => {
                        const stats = getMeshStats();
                        if (stats.meshCount > 0) {
                            console.log(`🔷 Mesh Stats: ${stats.meshCount} meshes, ${stats.totalVertices} verts, ${stats.totalTriangles} tris`);
                        }
                    }, 5000);
                }
            }, 2500); // Délai du loader (2.5 secondes)
        };

    }, 100);
});
