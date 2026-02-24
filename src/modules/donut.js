/**
 * Système de machine à donuts
 */

import * as state from './state.js';
import { notifyStoryEvent, updateStoryPanel } from './story.js';
import { onDonutCreated } from './wrist-tablet.js';

// Lock pour éviter les doubles clics
let donutMachineLock = false;

/**
 * Fait apparaître un donut à côté de la machine
 * @param {Element} machineEntity - L'entité de la machine à donuts
 */
export function spawnDonut(machineEntity) {
    if (!machineEntity || !machineEntity.object3D) return;

    const machinePos = new THREE.Vector3();
    machineEntity.object3D.getWorldPosition(machinePos);

    // Position à côté de la machine
    const donutPos = {
        x: machinePos.x + 0.15,
        y: machinePos.y + 0.1,
        z: machinePos.z
    };

    // Créer un donut avec le modèle GLB
    const donut = document.createElement('a-entity');
    donut.setAttribute('gltf-model', 'url(models/Donut.glb)');
    donut.setAttribute('scale', '0.1 0.1 0.1');
    donut.setAttribute('position', `${donutPos.x} ${donutPos.y} ${donutPos.z}`);
    donut.setAttribute('class', 'clickable grabbable');
    donut.classList.add('donut');
    donut.id = `donut-${Date.now()}`;
    donut.dataset.isDonut = 'true';

    // Ajouter à la scène D'ABORD, puis appliquer la physique
    state.sceneEl.appendChild(donut);
    state.spawnedObjects.push(donut);

    // Appliquer la physique APRÈS l'ajout à la scène
    // shape:box force une bounding-box de collision pour les GLTF
    donut.setAttribute('dynamic-body', 'mass:0.2;linearDamping:0.5;angularDamping:0.5;shape:box');

    console.log('🍩 Donut créé');
    state.debug('🍩 Donut prêt!');

    // Story mode
    notifyStoryEvent('make_donut');
    updateStoryPanel();

    // Notifier le panneau de commandes
    try {
        onDonutCreated();
    } catch (e) {
        console.error('❌ Error in onDonutCreated:', e);
    }
}

/**
 * Gère le clic sur la machine à donuts
 * @param {Element} machineEntity - L'entité de la machine
 */
export function handleDonutMachineClick(machineEntity) {
    if (donutMachineLock) {
        console.log('[DEBUG] donutMachineLock is TRUE, blocking');
        return;
    }
    donutMachineLock = true;

    console.log('🍩 Machine à donuts activée!');
    state.debug('🍩 Préparation du donut...');

    // Attendre 1 seconde puis faire apparaître le donut
    setTimeout(() => {
        try {
            spawnDonut(machineEntity);
        } catch (e) {
            console.error('❌ Error in spawnDonut:', e);
        }
        donutMachineLock = false;
        state.debug('✅ Prêt pour un autre donut!');
    }, 1000);
}
