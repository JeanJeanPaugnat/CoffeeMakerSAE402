/**
 * Système de machine à café et tasses
 */

import * as state from './state.js';
import { playCoffeeSound } from './audio.js';
import { onCoffeeCreated } from './wrist-tablet.js';

/**
 * Fait apparaître une tasse de café à côté de la machine
 * @param {Element} machineEntity - L'entité de la machine à café
 */
export function spawnCoffeeCup(machineEntity) {
    if (!machineEntity || !machineEntity.object3D) return;

    const machinePos = new THREE.Vector3();
    machineEntity.object3D.getWorldPosition(machinePos);

    // Position à droite de la machine (offset de 0.15m sur X)
    const cupPos = {
        x: machinePos.x + 0.15,
        y: machinePos.y + 0.05,
        z: machinePos.z
    };

    const cup = document.createElement('a-entity');
    cup.setAttribute('gltf-model', 'url(models/Coffeecup.glb)');
    cup.setAttribute('scale', '0.12 0.12 0.12');
    cup.setAttribute('position', `${cupPos.x} ${cupPos.y} ${cupPos.z}`);
    cup.setAttribute('dynamic-body', 'mass:0.3;linearDamping:0.5;angularDamping:0.5');
    cup.setAttribute('class', 'clickable grabbable');
    cup.classList.add('coffee-cup');
    cup.id = `coffee-cup-${Date.now()}`;
    cup.dataset.isCoffee = 'true';

    state.sceneEl.appendChild(cup);
    state.spawnedObjects.push(cup);

    console.log('☕ Tasse de café créée à:', cupPos);
    state.debug('☕ Café prêt!');
    
    // Notifier la tablette qu'un café a été créé
    onCoffeeCreated();
}

/**
 * Gère le clic sur la machine à café
 * @param {Element} machineEntity - L'entité de la machine
 */
export function handleCoffeeMachineClick(machineEntity) {
    if (state.coffeeMachineLock) return;
    state.setCoffeeMachineLock(true);

    console.log('☕ Machine à café activée!');
    state.debug('☕ Préparation du café...');

    playCoffeeSound();

    // Attendre 1.5 secondes puis faire apparaître la tasse
    setTimeout(() => {
        spawnCoffeeCup(machineEntity);
        state.setCoffeeMachineLock(false);
    }, 1500);
}
