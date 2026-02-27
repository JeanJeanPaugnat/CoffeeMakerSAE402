

import * as state from './state.js';
import { notifyStoryEvent, updateStoryPanel } from './story.js';
import { playCoffeeSound } from './audio.js';
import { onCoffeeCreated } from './wrist-tablet.js';

// Fait apparaître une tasse de café à côté de la machine
export function spawnCoffeeCup(machineEntity) {
    if (!machineEntity || !machineEntity.object3D) return;
    const machinePos = new THREE.Vector3();
    machineEntity.object3D.getWorldPosition(machinePos);

    const cupPos = {
        x: machinePos.x + 0.15,
        y: machinePos.y + 0.05,
        z: machinePos.z
    };
    
    const cup = document.createElement('a-entity');
    cup.setAttribute('gltf-model', 'url(models/Coffeecup.glb)');
    cup.setAttribute('scale', '0.12 0.12 0.12');
    cup.setAttribute('position', `${cupPos.x} ${cupPos.y} ${cupPos.z}`);
    cup.setAttribute('class', 'clickable grabbable');
    cup.classList.add('coffee-cup');
    cup.id = `coffee-cup-${Date.now()}`;
    cup.dataset.isCoffee = 'true';
    state.sceneEl.appendChild(cup);
    state.spawnedObjects.push(cup);
    cup.setAttribute('dynamic-body', 'mass:0.3;linearDamping:0.5;angularDamping:0.5;shape:box');
    state.debug('☕ Café prêt!');
    notifyStoryEvent('brew_coffee');
    updateStoryPanel();
    try { onCoffeeCreated(); } catch (e) {}
}

// Gère le clic sur la machine à café
export function handleCoffeeMachineClick(machineEntity) {
    if (state.coffeeMachineLock) return;
    state.setCoffeeMachineLock(true);
    state.debug('☕ Préparation du café...');
    playCoffeeSound();
    setTimeout(() => {
        try { spawnCoffeeCup(machineEntity); } catch (e) {}
        state.setCoffeeMachineLock(false);
        state.debug('✅ Prêt pour un autre café!');
    }, 1500);
}
