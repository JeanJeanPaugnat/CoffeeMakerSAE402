/**
 * Système d'inventaire/menu HUD
 */

import * as state from './state.js';
import { createSpeakerUI, stopSpeaker, removeSpeakerUI } from './speaker.js';
import { notifyStoryEvent, updateStoryPanel } from './story.js';

/**
 * Configuration des items disponibles dans le store
 */
const INVENTORY_ITEMS = [
    // Row 1: Primitives + Basics
    { type: 'box', color: '#ff7675', label: 'CUBE' },
    { type: 'gltf', model: 'models/CoffeeMachine.glb', color: '#fab1a0', label: 'COFFEE', menuScale: '0.2 0.2 0.2', spawnScale: '0.4 0.4 0.4' },
    { type: 'gltf', model: 'models/TrashcanSmall.glb', color: '#a29bfe', label: 'POUBELLE', menuScale: '0.2 0.2 0.2', spawnScale: '0.8 0.8 0.8' },
    { type: 'gltf', model: 'models/BoxDonuts.glb', color: '#D2691E', label: 'DONUT', menuScale: '0.15 0.15 0.15', spawnScale: '0.3 0.3 0.3' },
    // Row 2 
    { type: 'gltf', label: 'SPEAKER', model: 'models/BassSpeakers.glb', color: '#fff', menuScale: '0.1 0.1 0.1', spawnScale: '0.8 0.8 0.8' },
    { type: 'gltf', label: 'BROOM', model: 'models/Broom.glb', color: '#fff', menuScale: '0.001 0.001 0.001', spawnScale: '0.004 0.004 0.004' },
    { type: 'gltf', label: 'REGISTER', model: 'models/Cashregister.glb', color: '#fff', menuScale: '0.005 0.005 0.005', spawnScale: '0.04 0.04 0.04' },
    // Row 3
    { type: 'gltf', label: 'SIGN', model: 'models/Coffeesign.glb', color: '#fff', menuScale: '0.04 0.04 0.04', spawnScale: '0.2 0.2 0.2' },
    { type: 'gltf', label: 'COUCH', model: 'models/Couch.glb', color: '#fff', menuScale: '0.08 0.08 0.08', spawnScale: '0.3 0.3 0.3' },
    { type: 'gltf', label: 'PLANT', model: 'models/Houseplant.glb', color: '#fff', menuScale: '0.1 0.1 0.1', spawnScale: '0.4 0.4 0.4' },
    { type: 'gltf', label: 'RUG', model: 'models/Rug.glb', color: '#fff', menuScale: '0.05 0.05 0.05', spawnScale: '0.4 0.4 0.4' }
];

/**
 * Crée le menu HUD attaché à la caméra
 * @returns {Element} L'entité du menu
 */
export function createHUDInventory() {
    const menu = document.createElement('a-entity');
    state.setInventoryEntity(menu);
    menu.setAttribute('visible', false);

    const cam = document.getElementById('cam');
    if (!cam) return null;

    menu.setAttribute('position', '0 -0.2 -0.8');
    menu.setAttribute('rotation', '-15 0 0');
    menu.setAttribute('scale', '0.5 0.5 0.5');

    // Background
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '1.6');
    bg.setAttribute('height', '1.4');
    bg.setAttribute('color', '#000000');
    bg.setAttribute('opacity', '0.6');
    bg.setAttribute('shader', 'flat');
    bg.setAttribute('position', '0 -0.05 -0.01');
    menu.appendChild(bg);

    // Title
    const title = document.createElement('a-text');
    title.setAttribute('value', 'VR STORE');
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 0.55 0.03');
    title.setAttribute('width', '4');
    title.setAttribute('color', '#ffffff');
    title.setAttribute('font', 'mozillavr');
    title.setAttribute('letter-spacing', '2');
    menu.appendChild(title);

    // Decorative Line
    const line = document.createElement('a-plane');
    line.setAttribute('width', '1.0');
    line.setAttribute('height', '0.003');
    line.setAttribute('color', '#00cec9');
    line.setAttribute('position', '0 0.48 0.03');
    menu.appendChild(line);

    // Create item buttons
    const gap = 0.35;
    const itemsPerRow = 4;
    const startX = -((itemsPerRow - 1) * gap) / 2;

    INVENTORY_ITEMS.forEach((item, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const x = startX + (col * gap);
        const y = 0.25 - (row * 0.4);

        const btnGroup = createItemButton(item, x, y);
        menu.appendChild(btnGroup);
    });

    cam.appendChild(menu);
    console.log('🛍️ HUD Inventory Created');
    return menu;
}

/**
 * Crée un bouton d'item pour le menu
 */
function createItemButton(item, x, y) {
    const btnGroup = document.createElement('a-entity');
    btnGroup.setAttribute('position', `${x} ${y} 0.05`);

    // Card Background
    const btn = document.createElement('a-box');
    btn.setAttribute('width', '0.28');
    btn.setAttribute('height', '0.32');
    btn.setAttribute('depth', '0.02');
    btn.setAttribute('color', '#2d3436');
    btn.setAttribute('opacity', '0.9');
    btn.setAttribute('class', 'clickable');

    // Spawn Data
    btn.dataset.spawnType = item.type;
    btn.dataset.spawnColor = item.color;
    if (item.model) btn.dataset.spawnModel = item.model;
    if (item.spawnScale) btn.dataset.spawnScale = item.spawnScale;

    // Hover Effects
    btn.addEventListener('mouseenter', () => {
        btn.setAttribute('color', '#636e72');
        btn.setAttribute('scale', '1.1 1.1 1.1');
        const icon = btnGroup.querySelector('.item-icon');
        if (icon) icon.setAttribute('animation', 'property: rotation; to: 25 385 0; dur: 800; easing: easeInOutQuad');
    });
    btn.addEventListener('mouseleave', () => {
        btn.setAttribute('color', '#2d3436');
        btn.setAttribute('scale', '1 1 1');
        const icon = btnGroup.querySelector('.item-icon');
        if (icon) icon.removeAttribute('animation');
    });

    btnGroup.appendChild(btn);

    // 3D Icon
    let icon;
    if (item.type === 'gltf') {
        icon = document.createElement('a-entity');
        icon.setAttribute('gltf-model', `url(${item.model})`);
        icon.setAttribute('scale', item.menuScale || '0.08 0.08 0.08');
    } else if (item.type === 'donutbox') {
        // Icône spéciale pour la boîte à donuts
        icon = document.createElement('a-entity');
        const miniBox = document.createElement('a-box');
        miniBox.setAttribute('width', '0.1');
        miniBox.setAttribute('height', '0.05');
        miniBox.setAttribute('depth', '0.1');
        miniBox.setAttribute('color', '#FFB6C1');
        icon.appendChild(miniBox);
        const miniDonut = document.createElement('a-torus');
        miniDonut.setAttribute('radius', '0.03');
        miniDonut.setAttribute('radius-tubular', '0.01');
        miniDonut.setAttribute('color', '#D2691E');
        miniDonut.setAttribute('position', '0 0.04 0');
        icon.appendChild(miniDonut);
        icon.setAttribute('scale', item.menuScale || '0.5 0.5 0.5');
    } else {
        icon = document.createElement(`a-${item.type}`);
        icon.setAttribute('scale', '0.06 0.06 0.06');
        icon.setAttribute('material', `color: ${item.color}; metalness: 0.5; roughness: 0.1`);
    }

    icon.setAttribute('position', '0 0.04 0.06');
    icon.setAttribute('rotation', '25 25 0');
    icon.setAttribute('class', 'item-icon');
    btnGroup.appendChild(icon);

    // Label
    const label = document.createElement('a-text');
    label.setAttribute('value', item.label);
    label.setAttribute('align', 'center');
    label.setAttribute('position', '0 -0.11 0.06');
    label.setAttribute('width', '1.4');
    label.setAttribute('color', '#dfe6e9');
    btnGroup.appendChild(label);

    return btnGroup;
}

/**
 * Fait apparaître un objet devant la caméra
 */
export function spawnObject(type, color, model, customScale) {
    const now = Date.now();
    if (now - state.lastSpawnTime < 500) {
        console.warn('⚠️ Spawn rate limited');
        return;
    }
    state.setLastSpawnTime(now);

    const cam = document.getElementById('cam');
    const camPos = new THREE.Vector3();
    const camDir = new THREE.Vector3();

    cam.object3D.getWorldPosition(camPos);
    cam.object3D.getWorldDirection(camDir);

    const spawnPos = camPos.clone().add(camDir.multiplyScalar(-1.5));
    spawnPos.y = Math.max(spawnPos.y, 0.1);

    console.log('✨ SPAWNING at:', spawnPos);

    let entity;
    switch (type) {
        case 'sphere':
            entity = document.createElement('a-sphere');
            entity.setAttribute('radius', '0.08');
            break;
        case 'cylinder':
            entity = document.createElement('a-cylinder');
            entity.setAttribute('radius', '0.06');
            entity.setAttribute('height', '0.15');
            break;
        case 'gltf':
            entity = document.createElement('a-entity');
            entity.setAttribute('gltf-model', `url(${model})`);
            entity.setAttribute('scale', customScale || '0.1 0.1 0.1');
            break;
        case 'tetrahedron':
            entity = document.createElement('a-tetrahedron');
            entity.setAttribute('radius', '0.1');
            break;
        case 'donutbox':
            // Créer une boîte à donuts (box avec un torus dessus)
            entity = document.createElement('a-entity');
            entity.classList.add('donutbox');
            
            // La boîte
            const box = document.createElement('a-box');
            box.setAttribute('width', '0.15');
            box.setAttribute('height', '0.08');
            box.setAttribute('depth', '0.15');
            box.setAttribute('color', '#FFB6C1'); // Rose
            box.setAttribute('position', '0 0 0');
            entity.appendChild(box);
            
            // Le donut décoratif sur la boîte
            const donutDeco = document.createElement('a-torus');
            donutDeco.setAttribute('radius', '0.04');
            donutDeco.setAttribute('radius-tubular', '0.015');
            donutDeco.setAttribute('color', '#D2691E');
            donutDeco.setAttribute('position', '0 0.06 0');
            donutDeco.setAttribute('rotation', '0 0 0');
            entity.appendChild(donutDeco);
            
            entity.setAttribute('scale', customScale || '0.3 0.3 0.3');
            break;
        default:
            entity = document.createElement('a-box');
            entity.setAttribute('width', '0.12');
            entity.setAttribute('height', '0.12');
            entity.setAttribute('depth', '0.12');
    }

    entity.setAttribute('position', `${spawnPos.x} ${spawnPos.y} ${spawnPos.z}`);
    entity.setAttribute('color', color);
    entity.setAttribute('dynamic-body', 'mass:0.5;linearDamping:0.3;angularDamping:0.3');
    entity.setAttribute('class', 'clickable grabbable');
    entity.id = `spawned-${now}`;

    // Si c'est une poubelle
    if (model && model.includes('Trashcan')) {
        entity.classList.add('trashcan');
        state.trashcans.push(entity);
    }
    
    // Si c'est un speaker, créer l'interface de musique
    if (model && model.includes('BassSpeakers')) {
        // Supprimer l'ancien speaker s'il existe
        const oldSpeakers = document.querySelectorAll('.speaker');
        if (oldSpeakers.length > 0) {
            console.log('🔊 Removing old speaker(s)');
            stopSpeaker(); // Arrêter la musique
            removeSpeakerUI(); // Supprimer l'UI
            
            oldSpeakers.forEach(oldSpeaker => {
                // Retirer de spawnedObjects
                const idx = state.spawnedObjects.indexOf(oldSpeaker);
                if (idx > -1) state.spawnedObjects.splice(idx, 1);
                // Supprimer du DOM
                if (oldSpeaker.parentNode) oldSpeaker.parentNode.removeChild(oldSpeaker);
            });
        }
        
        entity.classList.add('speaker');
        console.log('🔊 Speaker spawned, setting up UI...');
        state.debug('🔊 Speaker placé!');
        
        // Attendre que le modèle soit chargé pour créer l'UI et appliquer la physique
        entity.addEventListener('model-loaded', () => {
            console.log('🔊 Speaker model loaded event fired');
            state.debug('🔊 Model loaded!');
            // (Ré)appliquer la physique après chargement du modèle
            entity.setAttribute('dynamic-body', 'mass:0.5;linearDamping:0.3;angularDamping:0.3');
            createSpeakerUI(entity);
        });
        
        // Fallback: créer l'UI après un délai si model-loaded ne se déclenche pas
        setTimeout(() => {
            console.log('🔊 Checking for speaker UI after timeout...');
            if (!entity.querySelector('#speaker-ui')) {
                console.log('🔊 Fallback: creating speaker UI after timeout');
                state.debug('🔊 Fallback UI creation');
                createSpeakerUI(entity);
            } else {
                console.log('🔊 Speaker UI already exists');
            }
        }, 2000);
    }

    state.sceneEl.appendChild(entity);
    state.spawnedObjects.push(entity);

    state.debug(`Spawné: ${type}`);
    console.log(`📦 Spawned ${type} at`, spawnPos);

    // Story mode: notifier le placement d'objets spécifiques
    if (model) {
        if (model.includes('CoffeeMachine')) { notifyStoryEvent('place_coffee_machine'); updateStoryPanel(); }
        if (model.includes('BoxDonuts')) { notifyStoryEvent('place_donut_box'); updateStoryPanel(); }
        if (model.includes('Trashcan')) { notifyStoryEvent('place_trashcan'); updateStoryPanel(); }
        if (model.includes('Broom')) { notifyStoryEvent('place_broom'); updateStoryPanel(); }
        if (model.includes('BassSpeakers')) { notifyStoryEvent('place_speaker'); updateStoryPanel(); }
    }
}

/**
 * Toggle la visibilité du menu
 */
export function toggleInventory() {
    const menu = state.inventoryEntity;
    if (menu && menu.object3D) {
        const vis = menu.object3D.visible;
        menu.setAttribute('visible', !vis);
        console.log('Toggle Menu:', !vis);

        // Story mode: notifier l'ouverture du store
        if (!vis) {
            notifyStoryEvent('open_store');
            updateStoryPanel();
        }
    }
}
