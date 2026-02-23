/**
 * Système de nettoyage (balai et taches)
 */

import * as state from './state.js';
import { notifyStoryEvent } from './story.js';

// Modèles de taches de sang disponibles
const BLOOD_MODELS = [
    '/CoffeeMakerSAE402/models/Blood.glb',
    '/CoffeeMakerSAE402/models/BloodSplat.glb',
    '/CoffeeMakerSAE402/models/BloodSplat2.glb'
];

/**
 * Crée une tache aléatoire sur le sol
 */
export function spawnRandomStain() {
    const x = (Math.random() - 0.5) * 4;
    const z = (Math.random() - 0.5) * 4 - 1.5;
    const y = 0.01;

    // Choisir un modèle de sang aléatoire
    const randomModel = BLOOD_MODELS[Math.floor(Math.random() * BLOOD_MODELS.length)];
    const randomRotation = Math.random() * 360;
    const randomScale = 0.3 + Math.random() * 0.3;

    const stain = document.createElement('a-entity');
    stain.setAttribute('gltf-model', randomModel);
    stain.setAttribute('position', `${x} ${y} ${z}`);
    stain.setAttribute('rotation', `0 ${randomRotation} 0`);
    stain.setAttribute('scale', `${randomScale} ${randomScale} ${randomScale}`);
    stain.classList.add('stain');

    state.sceneEl.appendChild(stain);
    state.stains.push({ el: stain, health: 100, scale: randomScale });

    console.log('Blood stain spawned at', x, z);
}

/**
 * Initialise les taches de départ
 */
export function initStains() {
    setTimeout(() => {
        for (let i = 0; i < 5; i++) spawnRandomStain();
    }, 2000);
}

/**
 * Vérifie si le balai nettoie une tache
 */
export function checkCleaning() {
    // Only if holding the broom
    if (!state.grabbed || !state.currentGrabbedEl) return;
    
    const model = state.currentGrabbedEl.getAttribute('gltf-model');
    if (!model || !model.includes('Broom')) return;

    const broomPos = new THREE.Vector3();
    state.currentGrabbedEl.object3D.getWorldPosition(broomPos);

    state.stains.forEach((stainObj, index) => {
        if (!stainObj.el || !stainObj.el.parentNode) return;

        const stainPos = stainObj.el.object3D.position;
        const dist = new THREE.Vector2(broomPos.x, broomPos.z).distanceTo(new THREE.Vector2(stainPos.x, stainPos.z));
        const verticalDist = Math.abs(broomPos.y - stainPos.y);

        if (dist < 0.4 && verticalDist < 0.5) {
            stainObj.health -= 5;
            
            // Réduire le scale proportionnellement à la santé
            const scaleFactor = (stainObj.health / 100) * stainObj.scale;
            stainObj.el.setAttribute('scale', `${scaleFactor} ${scaleFactor} ${scaleFactor}`);

            if (stainObj.health <= 0) {
                if (stainObj.el.parentNode) stainObj.el.parentNode.removeChild(stainObj.el);
                state.stains.splice(index, 1);
                state.debug('Tache nettoyée !');

                // Story mode
                notifyStoryEvent('clean_stain');

                // Occasionally spawn new stain
                if (Math.random() > 0.5) spawnRandomStain();
            }
        }
    });
}

/**
 * Démarre la boucle de nettoyage
 */
export function startCleaningLoop() {
    setInterval(checkCleaning, 50);
}
