

import * as state from './state.js';
import { notifyStoryEvent, updateStoryPanel } from './story.js';
import { onDonutCreated } from './wrist-tablet.js';

let donutMachineLock = false;

// Fait apparaître un donut à côté de la machine
export function spawnDonut(machineEntity) {
    if (!machineEntity || !machineEntity.object3D) return;
    const machinePos = new THREE.Vector3();
    machineEntity.object3D.getWorldPosition(machinePos);
    const donutPos = {
        x: machinePos.x + 0.15,
        y: machinePos.y + 0.1,
        z: machinePos.z
    };
    const donut = document.createElement('a-entity');
    donut.setAttribute('gltf-model', 'url(models/Donut.glb)');
    donut.setAttribute('scale', '0.1 0.1 0.1');
    donut.setAttribute('position', `${donutPos.x} ${donutPos.y} ${donutPos.z}`);
    donut.setAttribute('class', 'clickable grabbable');
    donut.classList.add('donut');
    donut.id = `donut-${Date.now()}`;
    donut.dataset.isDonut = 'true';
    state.sceneEl.appendChild(donut);
    state.spawnedObjects.push(donut);
    donut.setAttribute('dynamic-body', 'mass:0.2;linearDamping:0.5;angularDamping:0.5;shape:box');
    state.debug('🍩 Donut prêt!');
    notifyStoryEvent('make_donut');
    updateStoryPanel();
    try { onDonutCreated(); } catch (e) {}
}

// Gère le clic sur la machine à donuts
export function handleDonutMachineClick(machineEntity) {
    if (donutMachineLock) return;
    donutMachineLock = true;
    state.debug('🍩 Préparation du donut...');
    setTimeout(() => {
        try { spawnDonut(machineEntity); } catch (e) {}
        donutMachineLock = false;
        state.debug('✅ Prêt pour un autre donut!');
    }, 1000);
}
