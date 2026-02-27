

import * as state from './state.js';
import { notifyStoryEvent, updateStoryPanel } from './story.js';

export function removeObjectFromScene(objEl) {
    if (!objEl || !objEl.parentNode) return;
    const idx = state.spawnedObjects.indexOf(objEl);
    if (idx > -1) state.spawnedObjects.splice(idx, 1);
    if (objEl.body) objEl.body.world.removeBody(objEl.body);
    objEl.parentNode.removeChild(objEl);
    state.debug('🗑️ Objet jeté!');
    notifyStoryEvent('trash_object');
    updateStoryPanel();
}

export function checkTrashcanCollisions() {
    if (state.trashcans.length === 0) return;
    const trashPos = new THREE.Vector3();
    const objPos = new THREE.Vector3();
    state.trashcans.forEach(trashcan => {
        if (!trashcan || !trashcan.object3D) return;
        trashcan.object3D.getWorldPosition(trashPos);
        const objectsToCheck = [...state.spawnedObjects].filter(obj => obj && !obj.classList.contains('trashcan'));
        objectsToCheck.forEach(obj => {
            if (!obj || !obj.object3D) return;
            obj.object3D.getWorldPosition(objPos);
            const distance = trashPos.distanceTo(objPos);
            if (distance < state.TRASH_RADIUS) removeObjectFromScene(obj);
        });
        if (state.cubeEl && state.cubeEl.object3D) {
            state.cubeEl.object3D.getWorldPosition(objPos);
            const distance = trashPos.distanceTo(objPos);
            if (distance < state.TRASH_RADIUS) removeObjectFromScene(state.cubeEl);
        }
    });
}
