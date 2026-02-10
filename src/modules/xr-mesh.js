/**
 * Version alternative de XR avec MESH DETECTION
 * Utilise mesh-detection au lieu de plane-detection
 * Pour tester la différence avec le plane detection
 * 
 * Quest 3/Pro uniquement (mesh-detection non supporté sur Quest 2)
 */

import * as state from './state.js';
import { grab, release, updateGrabbedObject, rotateGrabbedObject } from './grab.js';
import { checkTrashcanCollisions } from './trash.js';
import { checkCoffeeDelivery, removeCustomer } from './customers.js';
import { toggleInventory, spawnObject } from './inventory.js';
import { closeWelcomePanel, showARNotification } from './panels.js';
import { handleCoffeeMachineClick } from './coffee.js';

// Stockage des meshes détectés
const detectedMeshes = new Map(); // XRMesh -> { entity, lastUpdate, stable }
let meshDetectionSupported = false;

// Configuration du mesh detection
const MESH_CONFIG = {
    stabilizationFrames: 5,     // Moins de frames car les meshes sont plus stables
    updateThreshold: 0.01,      // Seuil de changement pour mettre à jour (mètres)
    showDebugInfo: true,        // Afficher les infos de debug
    showWireframe: true,        // Afficher le wireframe du mesh
    meshOpacity: 0.15           // Opacité du mesh
};

/**
 * Ajoute une surface détectée (hit-test fallback)
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
 * Traite les meshes détectés par WebXR
 * Crée des visualisations 3D pour chaque mesh
 */
function processDetectedMeshes(frame) {
    const currentMeshes = frame.detectedMeshes;
    if (!currentMeshes) return;
    
    // Supprimer les meshes qui n'existent plus
    for (const [mesh, data] of detectedMeshes) {
        if (!currentMeshes.has(mesh)) {
            if (data.entity && data.entity.parentNode) {
                data.entity.parentNode.removeChild(data.entity);
            }
            detectedMeshes.delete(mesh);
            console.log('🔷 Mesh supprimé');
        }
    }
    
    // Traiter chaque mesh détecté
    for (const mesh of currentMeshes) {
        const existingData = detectedMeshes.get(mesh);
        
        if (existingData) {
            // Mesh existant - incrémenter le compteur de stabilité
            existingData.frameCount++;
            
            // Mettre à jour seulement si stable
            if (existingData.stable) {
                updateMeshEntity(mesh, existingData, frame);
            } else if (existingData.frameCount >= MESH_CONFIG.stabilizationFrames) {
                // Mesh maintenant stable - créer l'entité
                existingData.stable = true;
                existingData.entity = createMeshEntity(mesh, frame);
                console.log('🔷 Mesh stabilisé:', mesh.semanticLabel || 'unknown');
            }
        } else {
            // Nouveau mesh - commencer le compteur de stabilisation
            detectedMeshes.set(mesh, {
                entity: null,
                frameCount: 1,
                stable: false,
                lastPosition: null,
                lastVertexCount: 0
            });
        }
    }
}

/**
 * Crée une entité A-Frame pour visualiser un mesh détecté
 * Utilise les vertices et indices du XRMesh
 */
function createMeshEntity(mesh, frame) {
    const pose = frame.getPose(mesh.meshSpace, state.xrRefSpace);
    if (!pose) return null;
    
    // Récupérer les données du mesh
    const vertices = mesh.vertices;    // Float32Array
    const indices = mesh.indices;       // Uint32Array
    
    if (!vertices || vertices.length < 9 || !indices || indices.length < 3) {
        console.log('🔷 Mesh invalide - pas assez de données');
        return null;
    }
    
    // Position et rotation du mesh
    const pos = pose.transform.position;
    const rot = pose.transform.orientation;
    
    // Créer le conteneur
    const entity = document.createElement('a-entity');
    entity.classList.add('detected-mesh');
    entity.dataset.semanticLabel = mesh.semanticLabel || 'unknown';
    entity.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
    
    // Appliquer la rotation
    const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
    const euler = new THREE.Euler().setFromQuaternion(quat);
    entity.setAttribute('rotation', `${THREE.MathUtils.radToDeg(euler.x)} ${THREE.MathUtils.radToDeg(euler.y)} ${THREE.MathUtils.radToDeg(euler.z)}`);
    
    // Créer la géométrie THREE.js à partir des vertices et indices
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geometry.computeVertexNormals();
    
    // Couleur selon le semantic label (si disponible)
    let color = 0xff6600; // Orange par défaut pour mesh
    let edgeColor = 0xff9900;
    
    if (mesh.semanticLabel) {
        switch (mesh.semanticLabel.toLowerCase()) {
            case 'floor':
                color = 0x9b59b6;    // Violet
                edgeColor = 0x8e44ad;
                break;
            case 'wall':
                color = 0xe74c3c;    // Rouge
                edgeColor = 0xc0392b;
                break;
            case 'ceiling':
                color = 0x3498db;    // Bleu
                edgeColor = 0x2980b9;
                break;
            case 'table':
                color = 0x2ecc71;    // Vert
                edgeColor = 0x27ae60;
                break;
            case 'desk':
            case 'other':
                color = 0xf39c12;    // Jaune-orange
                edgeColor = 0xe67e22;
                break;
        }
    }
    
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: MESH_CONFIG.meshOpacity,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    
    const meshObj = new THREE.Mesh(geometry, material);
    entity.setObject3D('mesh-visual', meshObj);
    
    // Wireframe pour mieux voir la structure du mesh
    if (MESH_CONFIG.showWireframe) {
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: edgeColor,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        const wireframe = new THREE.Mesh(geometry.clone(), wireframeMaterial);
        entity.setObject3D('mesh-wireframe', wireframe);
    }
    
    // Edges pour les contours
    const edgesGeometry = new THREE.EdgesGeometry(geometry, 30); // 30 degrés threshold
    const edgesMaterial = new THREE.LineBasicMaterial({ 
        color: edgeColor,
        linewidth: 2
    });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    entity.setObject3D('mesh-edges', edges);
    
    // Label de debug (optionnel)
    if (MESH_CONFIG.showDebugInfo) {
        // Calculer le bounding box pour le centre
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        
        const vertCount = vertices.length / 3;
        const triCount = indices.length / 3;
        
        const label = document.createElement('a-text');
        label.setAttribute('value', `${mesh.semanticLabel || 'mesh'}\\n${vertCount} verts\\n${triCount} tris`);
        label.setAttribute('align', 'center');
        label.setAttribute('position', `${center.x} ${center.y + 0.2} ${center.z}`);
        label.setAttribute('scale', '0.3 0.3 0.3');
        label.setAttribute('color', `#${color.toString(16).padStart(6, '0')}`);
        label.setAttribute('look-at', '[camera]'); // Toujours face à la caméra
        entity.appendChild(label);
    }
    
    state.sceneEl.appendChild(entity);
    
    console.log(`🔷 Mesh créé: ${mesh.semanticLabel || 'unknown'} (${vertices.length/3} vertices, ${indices.length/3} triangles)`);
    
    return entity;
}

/**
 * Met à jour une entité de mesh existante
 * Vérifie si le changement est significatif avant de mettre à jour
 */
function updateMeshEntity(mesh, data, frame) {
    if (!data.entity) return;
    
    const pose = frame.getPose(mesh.meshSpace, state.xrRefSpace);
    if (!pose) return;
    
    const pos = pose.transform.position;
    
    // Vérifier si le changement de position est significatif
    if (data.lastPosition) {
        const dx = Math.abs(pos.x - data.lastPosition.x);
        const dy = Math.abs(pos.y - data.lastPosition.y);
        const dz = Math.abs(pos.z - data.lastPosition.z);
        
        // Ignorer les petits changements pour éviter les saccades
        if (dx < MESH_CONFIG.updateThreshold && 
            dy < MESH_CONFIG.updateThreshold && 
            dz < MESH_CONFIG.updateThreshold) {
            // Pas de changement de position, mais vérifier si le mesh a changé
            const currentVertexCount = mesh.vertices ? mesh.vertices.length : 0;
            if (currentVertexCount === data.lastVertexCount) {
                return; // Rien n'a changé
            }
        }
    }
    
    // Mettre à jour la position
    data.entity.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
    data.lastPosition = { x: pos.x, y: pos.y, z: pos.z };
    
    // Mettre à jour la rotation
    const rot = pose.transform.orientation;
    const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
    const euler = new THREE.Euler().setFromQuaternion(quat);
    data.entity.setAttribute('rotation', `${THREE.MathUtils.radToDeg(euler.x)} ${THREE.MathUtils.radToDeg(euler.y)} ${THREE.MathUtils.radToDeg(euler.z)}`);
    
    // Si le mesh a changé significativement, recréer la géométrie
    const vertices = mesh.vertices;
    const indices = mesh.indices;
    
    if (!vertices || !indices) return;
    
    const currentVertexCount = vertices.length;
    if (currentVertexCount !== data.lastVertexCount) {
        data.lastVertexCount = currentVertexCount;
        
        // Nouvelle géométrie
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        geometry.computeVertexNormals();
        
        // Mettre à jour le mesh principal
        const visualMesh = data.entity.getObject3D('mesh-visual');
        if (visualMesh) {
            visualMesh.geometry.dispose();
            visualMesh.geometry = geometry;
        }
        
        // Mettre à jour le wireframe
        const wireframe = data.entity.getObject3D('mesh-wireframe');
        if (wireframe) {
            wireframe.geometry.dispose();
            wireframe.geometry = geometry.clone();
        }
        
        // Mettre à jour les edges
        const edges = data.entity.getObject3D('mesh-edges');
        if (edges) {
            const newEdgesGeometry = new THREE.EdgesGeometry(geometry, 30);
            edges.geometry.dispose();
            edges.geometry = newEdgesGeometry;
        }
        
        console.log(`🔷 Mesh mis à jour: ${vertices.length/3} vertices`);
    }
}

/**
 * Démarre la session AR avec MESH DETECTION
 */
export async function startARSessionMesh() {
    state.debug('Démarrage AR (Mesh Detection)...');

    try {
        // Liste des features à demander
        const supportedFeatures = ['hit-test', 'dom-overlay'];
        
        // Ajouter mesh-detection (Quest 3/Pro uniquement)
        try {
            const supported = await navigator.xr.isSessionSupported('immersive-ar');
            if (supported) {
                supportedFeatures.push('mesh-detection');
                console.log('🔷 Mesh detection requested');
            }
        } catch (e) {
            console.log('Mesh detection check failed:', e);
        }

        const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['local-floor'],
            optionalFeatures: supportedFeatures,
            domOverlay: { root: document.getElementById('overlay') }
        });

        // Vérifier si mesh-detection a été activé
        meshDetectionSupported = session.enabledFeatures?.includes('mesh-detection') || false;
        console.log('🔷 Mesh detection enabled:', meshDetectionSupported);
        
        if (!meshDetectionSupported) {
            state.debug('⚠️ Mesh detection NON supporté! (Quest 3/Pro requis)');
        }

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

        state.debug('AR OK! (Mesh Detection Mode)');

        // Setup hit-test
        setTimeout(async () => {
            try {
                const refSpace = state.sceneEl.renderer.xr.getReferenceSpace();
                state.setXRRefSpace(refSpace);
                
                const viewer = await session.requestReferenceSpace('viewer');
                const hitSource = await session.requestHitTestSource({ space: viewer });
                state.setHitTestSource(hitSource);
                
                if (meshDetectionSupported) {
                    state.debug('🔷 Mesh Detection + Hit-test OK!');
                } else {
                    state.debug('Hit-test OK! (No mesh detection - Quest 3/Pro required)');
                }
            } catch (e) {
                state.debug('Pas de hit-test');
            }

            session.requestAnimationFrame(xrLoopMesh);
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
 * Boucle principale XR (version Mesh Detection)
 */
function xrLoopMesh(time, frame) {
    if (!state.xrSession) return;
    state.xrSession.requestAnimationFrame(xrLoopMesh);

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

    // Mesh Detection Processing (au lieu de Plane Detection)
    if (meshDetectionSupported && frame.detectedMeshes) {
        processDetectedMeshes(frame);
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

/**
 * Fonction utilitaire pour obtenir des stats sur les meshes détectés
 */
export function getMeshStats() {
    let totalVertices = 0;
    let totalTriangles = 0;
    
    for (const [mesh] of detectedMeshes) {
        if (mesh.vertices) totalVertices += mesh.vertices.length / 3;
        if (mesh.indices) totalTriangles += mesh.indices.length / 3;
    }
    
    return {
        meshCount: detectedMeshes.size,
        totalVertices,
        totalTriangles,
        supported: meshDetectionSupported
    };
}

/**
 * Toggle pour afficher/cacher tous les meshes
 */
export function toggleMeshVisibility(visible = undefined) {
    for (const [, data] of detectedMeshes) {
        if (data.entity && data.entity.object3D) {
            if (visible === undefined) {
                data.entity.object3D.visible = !data.entity.object3D.visible;
            } else {
                data.entity.object3D.visible = visible;
            }
        }
    }
}
