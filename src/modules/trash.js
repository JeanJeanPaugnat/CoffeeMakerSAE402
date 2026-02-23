/**
 * Système de poubelles
 */

import * as state from './state.js';
import { notifyStoryEvent, updateStoryPanel } from './story.js';

/**
 * Supprime un objet de la scène
 * @param {Element} objEl - L'élément à supprimer
 */
export function removeObjectFromScene(objEl) {
    if (!objEl || !objEl.parentNode) return;

    // Remove from spawnedObjects array
    const idx = state.spawnedObjects.indexOf(objEl);
    if (idx > -1) {
        state.spawnedObjects.splice(idx, 1);
    }

    // Remove physics body
    if (objEl.body) {
        objEl.body.world.removeBody(objEl.body);
    }

    // Remove from scene
    objEl.parentNode.removeChild(objEl);

    console.log('🗑️ Objet supprimé par la poubelle!');
    state.debug('🗑️ Objet jeté!');

    // Story mode
    notifyStoryEvent('trash_object');
    updateStoryPanel();
}

/**
 * Vérifie les collisions avec les poubelles (appelé dans la boucle XR)
 */
export function checkTrashcanCollisions() {
    if (state.trashcans.length === 0) return;

    const trashPos = new THREE.Vector3();
    const objPos = new THREE.Vector3();

    state.trashcans.forEach(trashcan => {
        if (!trashcan || !trashcan.object3D) return;
        trashcan.object3D.getWorldPosition(trashPos);

        // Check spawned objects (excluding trashcans)
        const objectsToCheck = [...state.spawnedObjects].filter(obj =>
            obj && !obj.classList.contains('trashcan')
        );

        objectsToCheck.forEach(obj => {
            if (!obj || !obj.object3D) return;
            obj.object3D.getWorldPosition(objPos);

            const distance = trashPos.distanceTo(objPos);

            if (distance < state.TRASH_RADIUS) {
                removeObjectFromScene(obj);
            }
        });

        // Check base cube too
        if (state.cubeEl && state.cubeEl.object3D) {
            state.cubeEl.object3D.getWorldPosition(objPos);
            const distance = trashPos.distanceTo(objPos);
            if (distance < state.TRASH_RADIUS) {
                removeObjectFromScene(state.cubeEl);
            }
        }
    });
}
