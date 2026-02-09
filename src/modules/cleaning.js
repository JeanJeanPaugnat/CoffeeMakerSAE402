/**
 * Système de nettoyage (balai et taches)
 */

import * as state from './state.js';

/**
 * Crée une tache aléatoire sur le sol
 */
export function spawnRandomStain() {
    const x = (Math.random() - 0.5) * 4;
    const z = (Math.random() - 0.5) * 4 - 1.5;
    const y = 0.01;

    const stain = document.createElement('a-circle');
    stain.setAttribute('radius', 0.2 + Math.random() * 0.2);
    stain.setAttribute('rotation', '-90 0 0');
    stain.setAttribute('position', `${x} ${y} ${z}`);
    stain.setAttribute('color', '#5d4037');
    stain.setAttribute('opacity', '0.9');
    stain.setAttribute('material', 'shader: flat; transparent: true');
    stain.classList.add('stain');

    state.sceneEl.appendChild(stain);
    state.stains.push({ el: stain, health: 100 });

    console.log('Dirt spot spawned at', x, z);
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
            stainObj.el.setAttribute('opacity', stainObj.health / 100);

            if (stainObj.health <= 0) {
                if (stainObj.el.parentNode) stainObj.el.parentNode.removeChild(stainObj.el);
                state.stains.splice(index, 1);
                state.debug('Tache nettoyée !');

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
