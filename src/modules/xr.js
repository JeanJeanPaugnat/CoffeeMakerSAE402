/**
 * Gestion de la session XR, contrôleurs et boucle principale
 */

import * as state from './state.js';
import { grab, release, updateGrabbedObject, rotateGrabbedObject } from './grab.js';
import { checkTrashcanCollisions } from './trash.js';
import { toggleInventory, spawnObject } from './inventory.js';
import { closeWelcomePanel, showARNotification } from './panels.js';
import { handleCoffeeMachineClick } from './coffee.js';
import { handleDonutMachineClick } from './donut.js';
import { toggleSpeakerPlay, nextTrack, prevTrack, selectTrack, createSpeakerUI, removeSpeakerUI } from './speaker.js';
import { vrLog } from './log-panel.js';

/**
 * Ajoute une surface détectée
 */
export function addSurface(x, y, z) {
    for (const s of state.surfaces) {
        if (Math.abs(s.x - x) < 0.1 && Math.abs(s.y - y) < 0.1 && Math.abs(s.z - z) < 0.1) return;
    }

    const box = document.createElement('a-box');
    box.setAttribute('position', `${x} ${y} ${z}`);
    box.setAttribute('width', '0.2');
    box.setAttribute('height', '0.01');
    box.setAttribute('depth', '0.2');
    box.setAttribute('visible', 'false');
    box.setAttribute('static-body', '');
    state.sceneEl.appendChild(box);

    state.surfaces.push({ x, y, z });

    if (state.surfaces.length > 200) state.surfaces.shift();
}

/**
 * Démarre la session AR
 */
export async function startARSession() {
    state.debug('Démarrage AR...');

    try {
        const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['local-floor'],
            optionalFeatures: ['hit-test', 'dom-overlay'],
            domOverlay: { root: document.getElementById('overlay') }
        });

        state.setXRSession(session);
        state.sceneEl.renderer.xr.setSession(session);

        // Setup controllers
        window.ctrl0 = state.sceneEl.renderer.xr.getController(0);
        window.ctrl1 = state.sceneEl.renderer.xr.getController(1);

        window.ctrl0.addEventListener('connected', (e) => {
            const handedness = e.data.handedness;
            console.log('Controller 0 connected:', handedness);
            if (handedness === 'right') window.rightController = window.ctrl0;
            if (handedness === 'left') window.leftController = window.ctrl0;
        });

        window.ctrl1.addEventListener('connected', (e) => {
            const handedness = e.data.handedness;
            console.log('Controller 1 connected:', handedness);
            if (handedness === 'right') window.rightController = window.ctrl1;
            if (handedness === 'left') window.leftController = window.ctrl1;
        });

        state.sceneEl.object3D.add(window.ctrl0);
        state.sceneEl.object3D.add(window.ctrl1);

        // Grab events
        window.ctrl0.addEventListener('selectstart', () => grab(window.ctrl0));
        window.ctrl0.addEventListener('selectend', release);
        window.ctrl1.addEventListener('selectstart', () => grab(window.ctrl1));
        window.ctrl1.addEventListener('selectend', release);

        state.debug('AR OK! Read the instructions');

        // Setup hit-test
        setTimeout(async () => {
            try {
                const refSpace = state.sceneEl.renderer.xr.getReferenceSpace();
                state.setXRRefSpace(refSpace);

                const viewer = await session.requestReferenceSpace('viewer');
                const hitSource = await session.requestHitTestSource({ space: viewer });
                state.setHitTestSource(hitSource);

                state.debug('Hit-test OK!');
            } catch (e) {
                state.debug('Pas de hit-test');
            }

            session.requestAnimationFrame(xrLoop);
        }, 500);

        return session;

    } catch (e) {
        state.debug('Erreur: ' + e.message);
        console.error('Erreur AR:', e.message);
        if (state.sceneEl) state.sceneEl.style.display = 'block';
        return null;
    }
}

/**
 * Boucle principale XR
 */
function xrLoop(time, frame) {
    if (!state.xrSession) return;
    state.xrSession.requestAnimationFrame(xrLoop);

    if (!frame || !state.xrRefSpace) {
        state.setXRRefSpace(state.sceneEl.renderer.xr.getReferenceSpace());
        return;
    }

    // Hit-test processing
    if (state.hitTestSource) {
        try {
            const hits = frame.getHitTestResults(state.hitTestSource);
            if (hits.length > 0) {
                const pose = hits[0].getPose(state.xrRefSpace);
                if (pose) {
                    const p = pose.transform.position;
                    const r = pose.transform.orientation;

                    state.cursorEl.object3D.visible = true;
                    state.cursorEl.object3D.position.set(p.x, p.y, p.z);

                    if (r) {
                        const poseRot = new THREE.Quaternion(r.x, r.y, r.z, r.w);
                        const offset = new THREE.Quaternion();
                        offset.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
                        poseRot.multiply(offset);
                        state.cursorEl.object3D.quaternion.copy(poseRot);
                    } else {
                        state.cursorEl.object3D.rotation.set(-Math.PI / 2, 0, 0);
                    }

                    addSurface(p.x, p.y, p.z);
                }
            } else {
                state.cursorEl.object3D.visible = false;
            }
        } catch (e) {
            console.error("Hit test error:", e);
        }
    }

    // Collision checks
    checkTrashcanCollisions();

    // Process controller inputs
    processControllerInputs();

    // Handle controller interactions
    handleControllerInteraction(window.rightController || window.ctrl0);
    handleControllerInteraction(window.leftController || window.ctrl1);

    // Update grabbed object position
    updateGrabbedObject();
}

/**
 * Traite les entrées des contrôleurs
 */
function processControllerInputs() {
    const ses = state.sceneEl.renderer.xr.getSession();
    if (!ses) return;

    let isAnyBtnPressed = false;

    for (const source of ses.inputSources) {
        if (!source.gamepad) continue;

        // Joystick rotation
        if (state.grabbed && state.currentGrabbedEl && source.gamepad.axes.length >= 2) {
            if (source.handedness === 'left') {
                const axisX = source.gamepad.axes[2] !== undefined ? source.gamepad.axes[2] : source.gamepad.axes[0];
                rotateGrabbedObject('y', axisX);
            }
            if (source.handedness === 'right') {
                const axisY = source.gamepad.axes[3] !== undefined ? source.gamepad.axes[3] : source.gamepad.axes[1];
                rotateGrabbedObject('x', axisY);
            }
        }

        // LEFT CONTROLLER - Menu Toggle (Y button)
        if (source.handedness === 'left' && source.gamepad) {
            const yBtn = source.gamepad.buttons[5] || source.gamepad.buttons[4] || source.gamepad.buttons[3];

            if (yBtn && yBtn.pressed) {
                if (!state.menuToggleLock) {
                    state.setMenuToggleLock(true);
                    toggleInventory();
                }
            } else {
                if (state.menuToggleLock) state.setMenuToggleLock(false);
            }
        }

        // RIGHT CONTROLLER - A button (release object)
        if (source.handedness === 'right' && source.gamepad) {
            // Debug button presses
            for (let bi = 0; bi < source.gamepad.buttons.length; bi++) {
                if (source.gamepad.buttons[bi].pressed) {
                    state.debug(`BTN ${bi} | Grab:${state.grabbed} | Obj:${state.currentGrabbedEl ? state.currentGrabbedEl.id : 'none'}`);
                }
            }

            const aBtn = source.gamepad.buttons[4] || source.gamepad.buttons[3];

            if (aBtn && aBtn.pressed && !state.giveCoffeeLock) {
                state.debug(`A pressed! Grab:${state.grabbed}`);

                // Le bouton A peut être utilisé pour lâcher l'objet
                if (state.grabbed && state.currentGrabbedEl) {
                    state.setGiveCoffeeLock(true);
                    release();
                    showARNotification('Objet lâché!', 1000);
                    setTimeout(() => { state.setGiveCoffeeLock(false); }, 500);
                }
            }

            // B button - Coffee Machine / Donut Box
            const bBtn = source.gamepad.buttons[5];

            if (bBtn && bBtn.pressed && !state.coffeeMachineLock) {
                console.log('[DEBUG] B pressed, searching for machines...');
                state.debug('B: Cherche machine...');

                const rightCtrl = window.rightController;
                if (rightCtrl) {
                    const tempMatrix = new THREE.Matrix4();
                    tempMatrix.identity().extractRotation(rightCtrl.matrixWorld);

                    const raycaster = new THREE.Raycaster();
                    raycaster.ray.origin.setFromMatrixPosition(rightCtrl.matrixWorld);
                    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
                    raycaster.far = 5.0;

                    const machines = [];
                    console.log('[DEBUG] Checking', state.spawnedObjects.length, 'spawned objects');

                    state.spawnedObjects.forEach(obj => {
                        if (obj && obj.object3D) {
                            const model = obj.getAttribute('gltf-model');

                            if (model && model.includes('CoffeeMachine')) {
                                console.log('[DEBUG] Found CoffeeMachine!');
                                obj.object3D.traverse(child => {
                                    if (child.isMesh) {
                                        child.el = obj;
                                        child.machineType = 'coffee';
                                        machines.push(child);
                                    }
                                });
                            } else if (model && model.includes('BoxDonuts')) {
                                console.log('[DEBUG] Found BoxDonuts!');
                                obj.object3D.traverse(child => {
                                    if (child.isMesh) {
                                        child.el = obj;
                                        child.machineType = 'donut';
                                        machines.push(child);
                                    }
                                });
                            } else if (model && model.includes('BassSpeakers')) {
                                console.log('[DEBUG] Found Speaker!');
                                obj.object3D.traverse(child => {
                                    if (child.isMesh) {
                                        child.el = obj;
                                        child.machineType = 'speaker';
                                        machines.push(child);
                                    }
                                });
                            }
                        }
                    });

                    console.log('[DEBUG] Machines found:', machines.length);
                    state.debug(`Machines: ${machines.length}`);

                    const intersects = raycaster.intersectObjects(machines);
                    console.log('[DEBUG] Intersections:', intersects.length);

                    if (intersects.length > 0) {
                        const hitMesh = intersects[0].object;
                        const hitEntity = hitMesh.el;
                        const machineType = hitMesh.machineType;

                        if (hitEntity) {
                            if (machineType === 'coffee') {
                                console.log('[DEBUG] Hit Coffee Machine!');
                                state.debug('☕ Coffee Machine!');
                                handleCoffeeMachineClick(hitEntity);
                            } else if (machineType === 'donut') {
                                console.log('[DEBUG] Hit Donut Box!');
                                state.debug('🍩 Donut Box!');
                                handleDonutMachineClick(hitEntity);
                            } else if (machineType === 'speaker') {
                                console.log('[DEBUG] Hit Speaker!');
                                vrLog('🔊 Hit Speaker model');
                                // Toggle l'UI du speaker au lieu de toggle la musique
                                if (state.speakerUIEntity) {
                                    vrLog('❌ Closing Speaker UI');
                                    state.debug('🔊 Closing Speaker UI');
                                    removeSpeakerUI();
                                    state.setSpeakerUI(null);
                                } else {
                                    vrLog('✅ Opening Speaker UI');
                                    state.debug('🔊 Opening Speaker UI');
                                    createSpeakerUI(hitEntity);
                                }
                            }
                        }
                    } else {
                        state.debug('❌ Pas de machine visée');
                    }
                } else {
                    console.log('[DEBUG] No rightCtrl');
                    state.debug('❌ Pas de controller droit');
                }
            } else if (bBtn && bBtn.pressed && state.coffeeMachineLock) {
                state.debug('⏳ En cours...');
            }
        }

        // Trigger pressed
        if (source.gamepad) {
            if (source.gamepad.buttons[0] && source.gamepad.buttons[0].pressed) {
                isAnyBtnPressed = true;
            }
        }
    }

    window.isAnyBtnPressed = isAnyBtnPressed;
    if (!isAnyBtnPressed) {
        window.uiClickLock = false;
    }
}

/**
 * Gère l'interaction laser avec le menu
 */
function handleControllerInteraction(controller) {
    if (!controller) return;

    const isMenuVisible = state.inventoryEntity && state.inventoryEntity.object3D && state.inventoryEntity.object3D.visible;
    const isWelcomeVisible = state.welcomePanel !== null;
    const isSpeakerUIVisible = state.speakerUIEntity !== null;

    let line = controller.getObjectByName('laser-line');
    let cursor = controller.getObjectByName('laser-cursor');

    if (!isMenuVisible && !isWelcomeVisible && !isSpeakerUIVisible) {
        if (line) line.visible = false;
        if (cursor) cursor.visible = false;
        return;
    }

    if (!line) {
        const lineGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
        line = new THREE.Line(lineGeom, lineMat);
        line.name = 'laser-line';
        controller.add(line);
    }

    if (!cursor) {
        const cursorGeom = new THREE.RingGeometry(0.02, 0.04, 32);
        const cursorMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        cursor = new THREE.Mesh(cursorGeom, cursorMat);
        cursor.name = 'laser-cursor';
        controller.add(cursor);
    }

    line.visible = true;
    cursor.visible = false;

    // Raycast
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);

    const raycaster = new THREE.Raycaster();
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    raycaster.far = 3.0;

    const buttons = [];

    if (isMenuVisible && state.inventoryEntity && state.inventoryEntity.object3D) {
        state.inventoryEntity.object3D.traverse(child => {
            if (child.el && child.el.classList.contains('clickable') && child.isMesh) {
                buttons.push(child);
            }
        });
    }

    if (state.welcomePanel && state.welcomePanel.object3D) {
        state.welcomePanel.object3D.traverse(child => {
            if (child.el && child.el.classList.contains('clickable') && child.isMesh) {
                buttons.push(child);
            }
        });
    }

    // Speaker UI buttons
    if (state.speakerUIEntity && state.speakerUIEntity.object3D) {
        let speakerBtnCount = 0;
        state.speakerUIEntity.object3D.traverse(child => {
            if (child.el && child.el.classList && child.el.classList.contains('clickable') && child.isMesh) {
                buttons.push(child);
                speakerBtnCount++;
            }
        });
        // Log seulement au premier clic
        if (window.isAnyBtnPressed && !window.uiClickLock) {
            vrLog(`🎯 SpeakerUI btns: ${speakerBtnCount}`);
        }
    } else if (window.isAnyBtnPressed && !window.uiClickLock) {
        vrLog('⚠️ No speakerUIEntity');
        // Fallback: scan all speaker entities in scene
        const speakerEls = document.querySelectorAll('.speaker');
        speakerEls.forEach(speakerEl => {
            const speakerUI = speakerEl.querySelector('#speaker-ui');
            if (speakerUI && speakerUI.object3D) {
                speakerUI.object3D.traverse(child => {
                    if (child.el && child.el.classList && child.el.classList.contains('clickable') && child.isMesh) {
                        buttons.push(child);
                    }
                });
            }
        });
    }

    const intersects = raycaster.intersectObjects(buttons);

    if (intersects.length > 0) {
        const hit = intersects[0];
        const el = hit.object.el;
        const dist = hit.distance;

        // Log ce qu'on détecte seulement au clic
        if (window.isAnyBtnPressed && !window.uiClickLock) {
            const elId = el?.id || 'no-id';
            const hasAction = el?.dataset?.speakerAction || 'none';
            vrLog(`🎯 Hit: ${elId} act=${hasAction}`);
        }

        const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -dist)];
        line.geometry.setFromPoints(points);
        line.geometry.attributes.position.needsUpdate = true;

        cursor.visible = true;
        cursor.position.set(0, 0, -dist);

        el.setAttribute('scale', '1.1 1.1 1.1');
        el.setAttribute('color', '#636e72');

        if (window.isAnyBtnPressed && !window.uiClickLock) {
            window.uiClickLock = true;

            if (el.id === 'welcome-close-btn') {
                console.log('📜 Closing Welcome Panel');
                closeWelcomePanel();
            } else if (el.dataset && el.dataset.speakerAction) {
                // Speaker controls
                const action = el.dataset.speakerAction;
                vrLog(`🎮 Speaker action: ${action}`);
                console.log('🔊 Speaker action detected:', action);
                state.debug('🔊 ' + action);
                el.setAttribute('color', '#e94560');

                if (action === 'toggle') {
                    vrLog('▶️ toggle!');
                    toggleSpeakerPlay();
                } else if (action === 'next') {
                    vrLog('⏭️ next!');
                    nextTrack();
                } else if (action === 'prev') {
                    vrLog('⏮️ prev!');
                    prevTrack();
                } else if (action === 'track' && el.dataset.trackIndex !== undefined) {
                    vrLog(`🎵 track ${el.dataset.trackIndex}`);
                    selectTrack(parseInt(el.dataset.trackIndex));
                }
            } else if (el.dataset && el.dataset.spawnType) {
                console.log('SPAWN COMMAND for', el.dataset.spawnType);
                el.setAttribute('color', '#00cec9');
                spawnObject(el.dataset.spawnType, el.dataset.spawnColor, el.dataset.spawnModel, el.dataset.spawnScale);
            }
        }

    } else {
        const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -2)];
        line.geometry.setFromPoints(points);
        line.geometry.attributes.position.needsUpdate = true;
    }
}