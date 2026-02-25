/**
 * VR Store / Inventory HUD System
 * Premium UI with animations, glow effects, and immersive interactions
 */

import * as state from './state.js';
import { createSpeakerUI } from './speaker.js';
import { notifyStoryEvent, updateStoryPanel } from './story.js';
import { isItemUnlocked, getRequiredScore, setRefreshStoreCallback } from './unlocks.js';
import { showARNotification } from './panels.js';

/**
 * Store item definitions
 */
const INVENTORY_ITEMS = [
    // Row 1: Essentials
    { type: 'box', color: '#ff7675', label: 'CUBE', category: 'BASIC' },
    { type: 'gltf', model: 'models/CoffeeMachine.glb', color: '#fab1a0', label: 'COFFEE', category: 'EQUIPMENT', menuScale: '0.2 0.2 0.2', spawnScale: '0.4 0.4 0.4' },
    { type: 'gltf', model: 'models/TrashcanSmall.glb', color: '#a29bfe', label: 'TRASH CAN', category: 'EQUIPMENT', menuScale: '0.2 0.2 0.2', spawnScale: '0.8 0.8 0.8' },
    { type: 'gltf', model: 'models/BoxDonuts.glb', color: '#D2691E', label: 'DONUTS', category: 'FOOD', menuScale: '0.15 0.15 0.15', spawnScale: '0.3 0.3 0.3' },
    // Row 2
    { type: 'gltf', label: 'SPEAKER', category: 'EQUIPMENT', model: 'models/BassSpeakers.glb', color: '#fff', menuScale: '0.1 0.1 0.1', spawnScale: '0.8 0.8 0.8' },
    { type: 'gltf', label: 'BROOM', category: 'EQUIPMENT', model: 'models/Broom.glb', color: '#fff', menuScale: '0.001 0.001 0.001', spawnScale: '0.004 0.004 0.004' },
    { type: 'gltf', label: 'REGISTER', category: 'EQUIPMENT', model: 'models/Cashregister.glb', color: '#fff', menuScale: '0.005 0.005 0.005', spawnScale: '0.04 0.04 0.04' },
    // Row 3
    { type: 'gltf', label: 'SIGN', category: 'DECOR', model: 'models/Coffeesign.glb', color: '#fff', menuScale: '0.04 0.04 0.04', spawnScale: '0.2 0.2 0.2' },
    { type: 'gltf', label: 'COUCH', category: 'FURNITURE', model: 'models/Couch.glb', color: '#fff', menuScale: '0.08 0.08 0.08', spawnScale: '0.3 0.3 0.3' },
    { type: 'gltf', label: 'PLANT', category: 'DECOR', model: 'models/Houseplant.glb', color: '#fff', menuScale: '0.1 0.1 0.1', spawnScale: '0.4 0.4 0.4' },
    { type: 'gltf', label: 'RUG', category: 'DECOR', model: 'models/Rug.glb', color: '#fff', menuScale: '0.05 0.05 0.05', spawnScale: '0.4 0.4 0.4' }
];


/**
 * Creates the HUD Store menu attached to the camera
 * @returns {Element} The menu entity
 */
export function createHUDInventory() {
    const menu = document.createElement('a-entity');
    state.setInventoryEntity(menu);
    menu.setAttribute('visible', false);

    const cam = document.getElementById('cam');
    if (!cam) return null;

    menu.setAttribute('position', '0 -0.2 -0.8');
    menu.setAttribute('rotation', '-15 0 0');
    menu.setAttribute('scale', '0.001 0.001 0.001'); // Start tiny for open animation

    // === OUTER GLOW BORDER ===
    const glowBorder = document.createElement('a-plane');
    glowBorder.setAttribute('width', '1.72');
    glowBorder.setAttribute('height', '1.52');
    glowBorder.setAttribute('color', '#00cec9');
    glowBorder.setAttribute('opacity', '0.35');
    glowBorder.setAttribute('shader', 'flat');
    glowBorder.setAttribute('position', '0 -0.05 -0.025');
    glowBorder.classList.add('store-glow');
    menu.appendChild(glowBorder);

    // === MAIN BACKGROUND — Glass-morphism style ===
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '1.68');
    bg.setAttribute('height', '1.48');
    bg.setAttribute('color', '#0a0a1e');
    bg.setAttribute('opacity', '0.82');
    bg.setAttribute('shader', 'flat');
    bg.setAttribute('position', '0 -0.05 -0.015');
    menu.appendChild(bg);

    // Inner accent border
    const innerBorder = document.createElement('a-plane');
    innerBorder.setAttribute('width', '1.62');
    innerBorder.setAttribute('height', '1.42');
    innerBorder.setAttribute('color', '#00cec9');
    innerBorder.setAttribute('opacity', '0.08');
    innerBorder.setAttribute('shader', 'flat');
    innerBorder.setAttribute('position', '0 -0.05 -0.012');
    menu.appendChild(innerBorder);

    // === TITLE: ☕ VR STORE ===
    const title = document.createElement('a-text');
    title.setAttribute('value', '☕  VR STORE');
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 0.64 0.03');
    title.setAttribute('width', '3.6');
    title.setAttribute('color', '#ffffff');
    title.setAttribute('font', 'mozillavr');
    title.setAttribute('letter-spacing', '3');
    menu.appendChild(title);

    // === SUBTITLE ===
    const subtitle = document.createElement('a-text');
    subtitle.setAttribute('value', 'Tap items to spawn them');
    subtitle.setAttribute('align', 'center');
    subtitle.setAttribute('position', '0 0.51 0.03');
    subtitle.setAttribute('width', '1.8');
    subtitle.setAttribute('color', '#636e72');
    subtitle.setAttribute('font', 'mozillavr');
    menu.appendChild(subtitle);

    // === DECORATIVE LINES ===
    // Left line
    const lineLeft = document.createElement('a-plane');
    lineLeft.setAttribute('width', '0.35');
    lineLeft.setAttribute('height', '0.003');
    lineLeft.setAttribute('color', '#00cec9');
    lineLeft.setAttribute('position', '-0.42 0.45 0.03');
    lineLeft.setAttribute('opacity', '0.7');
    menu.appendChild(lineLeft);

    // Center diamond
    const diamond = document.createElement('a-text');
    diamond.setAttribute('value', '◆');
    diamond.setAttribute('align', 'center');
    diamond.setAttribute('position', '0 0.45 0.03');
    diamond.setAttribute('width', '1.2');
    diamond.setAttribute('color', '#00cec9');
    menu.appendChild(diamond);

    // Right line
    const lineRight = document.createElement('a-plane');
    lineRight.setAttribute('width', '0.35');
    lineRight.setAttribute('height', '0.003');
    lineRight.setAttribute('color', '#00cec9');
    lineRight.setAttribute('position', '0.42 0.45 0.03');
    lineRight.setAttribute('opacity', '0.7');
    menu.appendChild(lineRight);

    // Build item cards
    buildStoreItems(menu);

    cam.appendChild(menu);
    console.log('🛍️ HUD Inventory Created (Premium UI)');

    // Register refresh callback for when items are unlocked
    setRefreshStoreCallback(() => refreshStoreUI());

    return menu;
}

/**
 * Builds item card buttons in the store menu
 * @param {Element} menu - The menu entity
 */
function buildStoreItems(menu) {
    const gap = 0.38;
    const itemsPerRow = 4;
    const startX = -((itemsPerRow - 1) * gap) / 2;

    INVENTORY_ITEMS.forEach((item, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const x = startX + (col * gap);
        const y = 0.22 - (row * 0.42);

        const btnGroup = createItemButton(item, x, y, index);
        btnGroup.classList.add('store-item-btn');
        menu.appendChild(btnGroup);
    });
}

/**
 * Refreshes the VR Store to update locked/unlocked items
 */
export function refreshStoreUI() {
    const menu = state.inventoryEntity;
    if (!menu) return;

    // Remove old item buttons
    const oldBtns = menu.querySelectorAll('.store-item-btn');
    oldBtns.forEach(btn => btn.parentNode.removeChild(btn));

    // Rebuild with updated lock/unlock state
    buildStoreItems(menu);

    console.log('🛍️ Store UI refreshed');
}

/**
 * Creates a premium item card for the store
 */
function createItemButton(item, x, y, index) {
    const btnGroup = document.createElement('a-entity');
    btnGroup.setAttribute('position', `${x} ${y} 0.05`);

    const unlocked = isItemUnlocked(item.label);
    const requiredScore = getRequiredScore(item.label);

    // === CARD BACKGROUND ===
    const btn = document.createElement('a-box');
    btn.setAttribute('width', '0.32');
    btn.setAttribute('height', '0.38');
    btn.setAttribute('depth', '0.015');
    btn.setAttribute('opacity', '0.95');
    btn.setAttribute('class', 'clickable');

    if (unlocked) {
        btn.setAttribute('color', '#1a2332');

        // Spawn data (only for unlocked items)
        btn.dataset.spawnType = item.type;
        btn.dataset.spawnColor = item.color;
        if (item.model) btn.dataset.spawnModel = item.model;
        if (item.spawnScale) btn.dataset.spawnScale = item.spawnScale;

        // === HOVER EFFECTS — UNLOCKED ===
        btn.addEventListener('mouseenter', () => {
            // Scale up smoothly
            btn.setAttribute('animation__hover', {
                property: 'scale',
                to: '1.15 1.15 1.15',
                dur: 200,
                easing: 'easeOutQuad'
            });
            // Glow border color
            btn.setAttribute('color', '#2a3a4e');

            // Card glow effect
            const cardGlow = btnGroup.querySelector('.card-glow');
            if (cardGlow) {
                cardGlow.setAttribute('opacity', '0.5');
                cardGlow.setAttribute('color', '#00cec9');
            }

            // Icon 360° spin
            const icon = btnGroup.querySelector('.item-icon');
            if (icon) {
                icon.setAttribute('animation__spin', {
                    property: 'rotation',
                    to: '25 385 0',
                    dur: 600,
                    easing: 'easeInOutCubic'
                });
            }
        });

        btn.addEventListener('mouseleave', () => {
            // Scale back
            btn.setAttribute('animation__hover', {
                property: 'scale',
                to: '1 1 1',
                dur: 200,
                easing: 'easeOutQuad'
            });
            btn.setAttribute('color', '#1a2332');

            // Remove glow
            const cardGlow = btnGroup.querySelector('.card-glow');
            if (cardGlow) {
                cardGlow.setAttribute('opacity', '0.15');
                cardGlow.setAttribute('color', '#00cec9');
            }

            // Reset icon rotation
            const icon = btnGroup.querySelector('.item-icon');
            if (icon) {
                icon.removeAttribute('animation__spin');
                icon.setAttribute('rotation', '25 25 0');
            }
        });
    } else {
        // === LOCKED ITEM ===
        btn.setAttribute('color', '#0d0d12');
        btn.dataset.locked = 'true';
        btn.dataset.requiredScore = requiredScore;

        // Hover: shake effect
        btn.addEventListener('mouseenter', () => {
            btn.setAttribute('color', '#1a0a0a');
            // Shake animation (wiggle left-right)
            btn.setAttribute('animation__shake', {
                property: 'position',
                from: `${x - 0.008} ${y} 0.05`,
                to: `${x + 0.008} ${y} 0.05`,
                dur: 80,
                dir: 'alternate',
                loop: 4,
                easing: 'easeInOutSine'
            });
            // Red flash on border
            const cardGlow = btnGroup.querySelector('.card-glow');
            if (cardGlow) {
                cardGlow.setAttribute('opacity', '0.5');
                cardGlow.setAttribute('color', '#d63031');
            }
        });

        btn.addEventListener('mouseleave', () => {
            btn.setAttribute('color', '#0d0d12');
            btn.removeAttribute('animation__shake');
            btnGroup.setAttribute('position', `${x} ${y} 0.05`);
            // Reset glow
            const cardGlow = btnGroup.querySelector('.card-glow');
            if (cardGlow) {
                cardGlow.setAttribute('opacity', '0.15');
                cardGlow.setAttribute('color', '#d63031');
            }
        });
    }

    btnGroup.appendChild(btn);

    // === CARD GLOW BORDER ===
    const cardGlow = document.createElement('a-plane');
    cardGlow.setAttribute('width', '0.34');
    cardGlow.setAttribute('height', '0.40');
    cardGlow.setAttribute('shader', 'flat');
    cardGlow.setAttribute('position', '0 0 -0.005');
    cardGlow.setAttribute('opacity', '0.15');
    cardGlow.classList.add('card-glow');
    if (unlocked) {
        cardGlow.setAttribute('color', '#00cec9');
    } else {
        cardGlow.setAttribute('color', '#d63031');
    }
    btnGroup.appendChild(cardGlow);

    // === CATEGORY TAG ===
    if (item.category) {
        const categoryTag = document.createElement('a-text');
        categoryTag.setAttribute('value', item.category);
        categoryTag.setAttribute('align', 'center');
        categoryTag.setAttribute('position', '0 0.155 0.06');
        categoryTag.setAttribute('width', '1.0');
        categoryTag.setAttribute('color', unlocked ? '#00cec9' : '#636e72');
        categoryTag.setAttribute('font', 'mozillavr');
        btnGroup.appendChild(categoryTag);
    }

    // === 3D ICON ===
    let icon;
    if (item.type === 'gltf') {
        icon = document.createElement('a-entity');
        icon.setAttribute('gltf-model', `url(${item.model})`);
        icon.setAttribute('scale', item.menuScale || '0.08 0.08 0.08');
    } else if (item.type === 'donutbox') {
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

    icon.setAttribute('position', '0 0.03 0.06');
    icon.setAttribute('rotation', '25 25 0');
    icon.setAttribute('class', 'item-icon');

    // Locked: dim the icon
    if (!unlocked) {
        icon.setAttribute('material', 'opacity: 0.2; color: #333');
    }

    // Idle bobbing animation (gentle floating)
    if (unlocked) {
        const bobOffset = (index % 3) * 0.3; // Stagger the animations
        icon.setAttribute('animation__bob', {
            property: 'position',
            from: '0 0.02 0.06',
            to: '0 0.05 0.06',
            dur: 2000 + (bobOffset * 500),
            dir: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
    }

    btnGroup.appendChild(icon);

    // === LABEL ===
    const label = document.createElement('a-text');
    label.setAttribute('align', 'center');
    label.setAttribute('position', '0 -0.1 0.06');
    label.setAttribute('width', '1.4');
    label.setAttribute('font', 'mozillavr');

    if (unlocked) {
        label.setAttribute('value', item.label);
        label.setAttribute('color', '#e0e0e0');
    } else {
        // Lock icon + required score
        label.setAttribute('value', `${requiredScore} PTS`);
        label.setAttribute('color', '#8b0000');
        label.setAttribute('width', '1.3');
    }

    btnGroup.appendChild(label);

    // === LOCK OVERLAY (for locked items) ===
    if (!unlocked) {
        const lockOverlay = document.createElement('a-text');
        lockOverlay.setAttribute('value', 'X');
        lockOverlay.setAttribute('align', 'center');
        lockOverlay.setAttribute('position', '0 0.03 0.08');
        lockOverlay.setAttribute('width', '2.5');
        lockOverlay.setAttribute('color', '#ffffff');
        lockOverlay.setAttribute('opacity', '0.5');
        btnGroup.appendChild(lockOverlay);

        // "TO UNLOCK" subtitle
        const unlockHint = document.createElement('a-text');
        unlockHint.setAttribute('value', 'TO UNLOCK');
        unlockHint.setAttribute('align', 'center');
        unlockHint.setAttribute('position', '0 -0.145 0.06');
        unlockHint.setAttribute('width', '1');
        unlockHint.setAttribute('color', '#555');
        unlockHint.setAttribute('font', 'mozillavr');
        btnGroup.appendChild(unlockHint);
    }

    return btnGroup;
}

/**
 * Spawns an object in front of the camera
 */
export function spawnObject(type, color, model, customScale) {
    const now = Date.now();
    if (now - state.lastSpawnTime < 500) {
        console.warn('⚠️ Spawn rate limited');
        return;
    }

    // Check if item is locked
    const itemLabel = getItemLabelFromModel(model);
    if (itemLabel && !isItemUnlocked(itemLabel)) {
        const req = getRequiredScore(itemLabel);
        showARNotification(`🔒 Need ${req} pts to unlock!`, 2500);
        console.log(`🔒 Blocked spawn: ${itemLabel} requires ${req} pts`);
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
            entity = document.createElement('a-entity');
            entity.classList.add('donutbox');

            const box = document.createElement('a-box');
            box.setAttribute('width', '0.15');
            box.setAttribute('height', '0.08');
            box.setAttribute('depth', '0.15');
            box.setAttribute('color', '#FFB6C1');
            box.setAttribute('position', '0 0 0');
            entity.appendChild(box);

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
    entity.setAttribute('class', 'clickable grabbable');
    entity.id = `spawned-${now}`;

    // Trash can tracking
    if (model && model.includes('Trashcan')) {
        entity.classList.add('trashcan');
        state.trashcans.push(entity);
    }

    // Speaker — only one allowed in scene
    const isSpeaker = model && model.includes('BassSpeakers');
    if (isSpeaker) {
        const existingSpeaker = document.querySelector('.speaker');
        if (existingSpeaker) {
            console.log('🔊 Speaker already exists, blocking spawn');
            showARNotification('Speaker already placed!', 2000);
            return;
        }

        entity.classList.add('speaker');
        console.log('🔊 Speaker spawned');
        state.debug('🔊 Speaker placed! Press B to open music');

        // Keep speaker upright — lock X and Z rotation
        setTimeout(() => {
            if (entity.body) {
                entity.body.angularFactor.set(0, 1, 0);
                console.log('🔊 Speaker upright constraint applied');
            }
        }, 1000);
    }

    // Add entity to scene FIRST, then apply physics
    state.sceneEl.appendChild(entity);
    state.spawnedObjects.push(entity);

    // Apply physics AFTER adding to scene
    if (type === 'gltf') {
        entity.setAttribute('dynamic-body', 'mass:0.5;linearDamping:0.3;angularDamping:0.3;shape:box');
    } else {
        entity.setAttribute('dynamic-body', 'mass:0.5;linearDamping:0.3;angularDamping:0.3');
    }

    state.debug(`Spawned: ${type}`);
    console.log(`📦 Spawned ${type} at`, spawnPos);

    // Story mode: notify placement of specific objects
    if (model) {
        if (model.includes('CoffeeMachine')) { notifyStoryEvent('place_coffee_machine'); updateStoryPanel(); }
        if (model.includes('BoxDonuts')) { notifyStoryEvent('place_donut_box'); updateStoryPanel(); }
        if (model.includes('Trashcan')) { notifyStoryEvent('place_trashcan'); updateStoryPanel(); }
        if (model.includes('Broom')) { notifyStoryEvent('place_broom'); updateStoryPanel(); }
        if (model.includes('BassSpeakers')) { notifyStoryEvent('place_speaker'); updateStoryPanel(); }
    }
}

/**
 * Helper: get item label from model path
 */
function getItemLabelFromModel(model) {
    if (!model) return null;
    for (const item of INVENTORY_ITEMS) {
        if (item.model && model.includes(item.model.split('/').pop().replace('.glb', ''))) {
            return item.label;
        }
    }
    return null;
}

/**
 * Toggle store visibility with premium open/close animations
 */
export function toggleInventory() {
    const menu = state.inventoryEntity;
    if (menu && menu.object3D) {
        const vis = menu.object3D.visible;
        const nowVisible = !vis;

        if (nowVisible) {
            // Refresh store before showing
            refreshStoreUI();

            // Remove any lingering close animation to prevent conflicts
            menu.removeAttribute('animation__close');
            menu.removeAttribute('animation__open');
            menu.removeAttribute('animation__pulse');

            // Make visible and reset scale
            menu.setAttribute('visible', true);
            menu.setAttribute('scale', '0.001 0.001 0.001');

            // === OPEN ANIMATION: Scale up with elastic bounce ===
            // Use setTimeout to ensure attribute removal is processed first
            setTimeout(() => {
                menu.setAttribute('animation__open', {
                    property: 'scale',
                    to: '0.5 0.5 0.5',
                    dur: 600,
                    easing: 'easeOutElastic'
                });

                // Glow pulse on open
                const glow = menu.querySelector('.store-glow');
                if (glow) {
                    glow.removeAttribute('animation__pulse');
                    setTimeout(() => {
                        glow.setAttribute('animation__pulse', {
                            property: 'opacity',
                            from: '0.6',
                            to: '0.25',
                            dur: 800,
                            easing: 'easeOutQuad'
                        });
                    }, 10);
                }
            }, 10);
        } else {
            // Remove open animation to prevent conflicts
            menu.removeAttribute('animation__open');
            menu.removeAttribute('animation__close');

            // === CLOSE ANIMATION: Scale down ===
            setTimeout(() => {
                menu.setAttribute('animation__close', {
                    property: 'scale',
                    to: '0.001 0.001 0.001',
                    dur: 300,
                    easing: 'easeInBack'
                });
            }, 10);

            // Hide after animation completes
            setTimeout(() => {
                menu.setAttribute('visible', false);
            }, 350);
        }

        // Disable raycasting on sub-meshes when menu is closed
        menu.object3D.traverse(child => {
            if (child.isMesh) {
                child.layers.set(nowVisible ? 0 : 31);
            }
        });

        console.log('Toggle Store:', nowVisible);

        // Story mode: notify store opening
        if (nowVisible) {
            notifyStoryEvent('open_store');
            updateStoryPanel();
        }
    }
}
