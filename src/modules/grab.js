

import * as state from './state.js';
import { notifyStoryEvent, updateStoryPanel } from './story.js';

// Attrape l'objet le plus proche du contrôleur
export function grab(controller) {
    if (state.grabbed) return;
    const ctrlPos = new THREE.Vector3();
    controller.getWorldPosition(ctrlPos);
    const allGrabbables = [state.cubeEl, ...state.spawnedObjects];
    let closestEl = null;
    let closestDist = 1.0;
    allGrabbables.forEach(el => {
        if (!el || !el.object3D) return;
        const objPos = new THREE.Vector3();
        el.object3D.getWorldPosition(objPos);
        const dist = ctrlPos.distanceTo(objPos);
        if (dist < closestDist) {
            closestDist = dist;
            closestEl = el;
        }
    });
    if (!closestEl) {
        state.debug('Rien à attraper');
        return;
    }
    state.debug('GRAB!');
    notifyStoryEvent('grab_object');
    updateStoryPanel();
    state.setGrabbed(true);
    state.setGrabController(controller);
    state.setCurrentGrabbedEl(closestEl);
    state.resetVelocities();
    closestEl._originalColor = closestEl.getAttribute('color');
    closestEl.setAttribute('color', '#FFD700');
    if (closestEl.body) {
        closestEl.body.mass = 0;
        closestEl.body.type = 2;
        closestEl.body.collisionResponse = false;
        closestEl.body.updateMassProperties();
    }
    state.debug('ATTRAPÉ!');
}

// Relâche l'objet actuellement tenu
export function release() {
    if (!state.grabbed || !state.currentGrabbedEl) return;
    const velocities = state.getVelocities();
    let vx = 0, vy = 0, vz = 0;
    if (velocities.length >= 2) {
        const l = velocities[velocities.length - 1];
        const f = velocities[0];
        const dt = (l.t - f.t) / 1000;
        if (dt > 0.01) {
            vx = (l.x - f.x) / dt;
            vy = (l.y - f.y) / dt;
            vz = (l.z - f.z) / dt;
        }
    }
    const el = state.currentGrabbedEl;
    const originalColor = el._originalColor || '#8A2BE2';
    el.setAttribute('color', originalColor);
    if (el.body) {
        const p = el.object3D.position;
        el.body.position.set(p.x, p.y, p.z);
        el.body.type = 1;
        el.body.collisionResponse = true;
        el.body.mass = 0.3;
        el.body.updateMassProperties();
        el.body.velocity.set(vx, vy, vz);
        el.body.wakeUp();
        if (el.classList.contains('speaker')) {
            el.body.angularFactor.set(0, 1, 0);
            el.body.angularVelocity.set(0, 0, 0);
            const yRot = el.object3D.rotation.y;
            el.object3D.rotation.set(0, yRot, 0);
            el.body.quaternion.copy(el.object3D.quaternion);
        }
    }
    state.setGrabbed(false);
    state.setGrabController(null);
    state.setCurrentGrabbedEl(null);
    state.debug('Lâché!');
}

// Met à jour la position de l'objet attrapé (appelé dans la boucle XR)
export function updateGrabbedObject() {
    if (!state.grabbed || !state.grabController || !state.currentGrabbedEl) return;
    try {
        const pos = new THREE.Vector3();
        state.grabController.getWorldPosition(pos);
        if (isFinite(pos.x) && isFinite(pos.y) && isFinite(pos.z)) {
            state.currentGrabbedEl.object3D.position.set(pos.x, pos.y, pos.z);
            const model = state.currentGrabbedEl.getAttribute('gltf-model');
            if (model && model.includes('Broom')) {
                state.currentGrabbedEl.object3D.translateY(-0.6);
            }
            if (state.currentGrabbedEl.body) {
                const p = state.currentGrabbedEl.object3D.position;
                state.currentGrabbedEl.body.position.set(p.x, p.y, p.z);
            }
            state.addVelocity({ x: pos.x, y: pos.y, z: pos.z, t: performance.now() });
        }
    } catch (e) {}
}

// Rotation de l'objet avec le joystick
export function rotateGrabbedObject(axis, value) {
    if (!state.grabbed || !state.currentGrabbedEl) return;
    if (Math.abs(value) < 0.1) return;
    const rotSpeed = 0.05;
    if (axis === 'y') {
        state.currentGrabbedEl.object3D.rotation.y += -value * rotSpeed;
    } else if (axis === 'x') {
        state.currentGrabbedEl.object3D.rotation.x += -value * rotSpeed;
    }
    if (state.currentGrabbedEl.body) {
        const q = state.currentGrabbedEl.object3D.quaternion;
        state.currentGrabbedEl.body.quaternion.set(q.x, q.y, q.z, q.w);
    }
}
