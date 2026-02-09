/**
 * Gestion de la session XR, contrôleurs et boucle principale
 */

import * as state from './state.js';
import { grab, release, updateGrabbedObject, rotateGrabbedObject } from './grab.js';
import { checkTrashcanCollisions } from './trash.js';
import { checkCoffeeDelivery, removeCustomer } from './customers.js';
import { toggleInventory, spawnObject } from './inventory.js';
import { closeWelcomePanel, showARNotification } from './panels.js';
import { handleCoffeeMachineClick } from './coffee.js';

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
    checkCoffeeDelivery();

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

        // RIGHT CONTROLLER - A button (give coffee)
        if (source.handedness === 'right' && source.gamepad) {
            // Debug
            for (let bi = 0; bi < source.gamepad.buttons.length; bi++) {
                if (source.gamepad.buttons[bi].pressed) {
                    state.debug(`BTN ${bi} | Grab:${state.grabbed} | Cup:${state.currentGrabbedEl ? 'yes' : 'no'} | Cust:${state.customers.length}`);
                }
            }

            const aBtn = source.gamepad.buttons[4] || source.gamepad.buttons[3];

            if (aBtn && aBtn.pressed && !state.giveCoffeeLock) {
                state.debug(`A pressed! Grab:${state.grabbed}`);

                if (state.grabbed && state.currentGrabbedEl) {
                    const isCoffee =
                        (state.currentGrabbedEl.classList && state.currentGrabbedEl.classList.contains('coffee-cup')) ||
                        (state.currentGrabbedEl.dataset && state.currentGrabbedEl.dataset.isCoffee === 'true') ||
                        (state.currentGrabbedEl.id && state.currentGrabbedEl.id.includes('coffee-cup'));

                    state.debug(`Coffee:${isCoffee} Cust:${state.customers.length}`);

                    if (isCoffee && state.customers.length > 0) {
                        state.setGiveCoffeeLock(true);
                        console.log('✅ COFFEE GIVEN BY BUTTON A!');
                        showARNotification('✅ THANKS! Perfect coffee!', 3000);
                        state.debug('✅ Café livré!');

                        // Remove cup
                        const cupIdx = state.spawnedObjects.indexOf(state.currentGrabbedEl);
                        if (cupIdx > -1) state.spawnedObjects.splice(cupIdx, 1);
                        if (state.currentGrabbedEl.body && state.currentGrabbedEl.body.world) {
                            state.currentGrabbedEl.body.world.removeBody(state.currentGrabbedEl.body);
                        }
                        if (state.currentGrabbedEl.parentNode) state.currentGrabbedEl.parentNode.removeChild(state.currentGrabbedEl);

                        // Reset grab state
                        state.setGrabbed(false);
                        state.setGrabController(null);
                        state.setCurrentGrabbedEl(null);

                        // Remove customer
                        const customer = state.customers[0];
                        removeCustomer(customer);

                        setTimeout(() => { state.setGiveCoffeeLock(false); }, 500);
                    }
                }
            }

            // B button - Coffee Machine
            const bBtn = source.gamepad.buttons[5];

            if (bBtn && bBtn.pressed && !state.coffeeMachineLock) {
                const rightCtrl = window.rightController;
                if (rightCtrl) {
                    const tempMatrix = new THREE.Matrix4();
                    tempMatrix.identity().extractRotation(rightCtrl.matrixWorld);

                    const raycaster = new THREE.Raycaster();
                    raycaster.ray.origin.setFromMatrixPosition(rightCtrl.matrixWorld);
                    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
                    raycaster.far = 5.0;

                    const coffeeMachines = [];
                    state.spawnedObjects.forEach(obj => {
                        if (obj && obj.object3D) {
                            const model = obj.getAttribute('gltf-model');
                            if (model && model.includes('CoffeeMachine')) {
                                obj.object3D.traverse(child => {
                                    if (child.isMesh) {
                                        child.el = obj;
                                        coffeeMachines.push(child);
                                    }
                                });
                            }
                        }
                    });

                    const intersects = raycaster.intersectObjects(coffeeMachines);

                    if (intersects.length > 0) {
                        const hitEntity = intersects[0].object.el;
                        if (hitEntity) {
                            handleCoffeeMachineClick(hitEntity);
                        }
                    }
                }
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

    let line = controller.getObjectByName('laser-line');
    let cursor = controller.getObjectByName('laser-cursor');

    if (!isMenuVisible && !isWelcomeVisible) {
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

    if (state.inventoryEntity && state.inventoryEntity.object3D) {
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

    const intersects = raycaster.intersectObjects(buttons);

    if (intersects.length > 0) {
        const hit = intersects[0];
        const el = hit.object.el;
        const dist = hit.distance;

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
            } else if (el.dataset.spawnType) {
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
