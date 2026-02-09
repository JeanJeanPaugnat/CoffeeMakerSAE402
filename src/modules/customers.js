/**
 * Système de gestion des clients
 */

import * as state from './state.js';
import { showARNotification } from './panels.js';

/**
 * Fait apparaître un nouveau client
 */
export function spawnCustomer() {
    // Limite à 1 client
    if (state.customers.length > 0) return;

    console.log('Attempting to spawn customer...');
    state.debug('🧍 NEW CUSTOMER ARRIVING...');

    // Random Model
    const models = ['models/Punk.glb', 'models/Punk.glb'];
    const randomModel = models[Math.floor(Math.random() * models.length)];

    const customer = document.createElement('a-entity');
    customer.setAttribute('gltf-model', `url(${randomModel})`);
    customer.setAttribute('position', `${state.QUEUE_POS.x} 0 ${state.QUEUE_POS.z}`);

    if (randomModel.includes('Grandpa')) {
        customer.setAttribute('scale', '0.011 0.011 0.011');
    } else {
        customer.setAttribute('scale', '1 1 1');
    }

    customer.setAttribute('rotation', '0 0 0');
    customer.classList.add('customer');
    customer.id = `customer-${Date.now()}`;

    // Order text
    const text = document.createElement('a-text');
    text.setAttribute('value', 'Grab coffee + Press A!');
    text.setAttribute('align', 'center');
    text.setAttribute('position', '0 2.2 0.3');
    text.setAttribute('scale', '1 1 1');
    text.setAttribute('color', '#FFD700');
    text.setAttribute('font', 'mozillavr');
    customer.appendChild(text);

    // Green Zone
    const circle = document.createElement('a-ring');
    circle.setAttribute('radius-inner', '0.4');
    circle.setAttribute('radius-outer', '0.5');
    circle.setAttribute('color', '#00ff00');
    circle.setAttribute('rotation', '-90 0 0');
    circle.setAttribute('position', '0 0.02 0');
    customer.appendChild(circle);

    // Physics
    customer.setAttribute('static-body', 'shape: hull');

    state.sceneEl.appendChild(customer);
    state.customers.push(customer);

    console.log(`Customer spawned: ${randomModel}`);
    showARNotification('☕ New Customer!', 2000);

    setTimeout(() => {
        state.debug('Customer Waiting!');
    }, 1000);
}

/**
 * Supprime un client de la scène
 * @param {Element} customer - L'entité du client
 */
export function removeCustomer(customer) {
    if (!customer) return;
    
    const idx = state.customers.indexOf(customer);
    if (idx > -1) state.customers.splice(idx, 1);

    customer.setAttribute('visible', 'false');

    if (customer.body && customer.body.world) {
        customer.body.world.removeBody(customer.body);
    }

    if (customer.parentNode) {
        customer.parentNode.removeChild(customer);
    }
    
    console.log('Client despawned via removeCustomer');
    state.debug('Customer left. Next in 4s...');
    
    // Spawn next customer
    setTimeout(spawnCustomer, 4000);
}

/**
 * Livre un café à un client
 * @param {Element} customer - Le client
 * @param {Element} cupEl - La tasse de café
 */
export function deliverCoffee(customer, cupEl) {
    if (customer._delivered) return;
    customer._delivered = true;

    console.log('✅ DELIVERY SUCCESS!');
    showARNotification('✅ THANKS! Perfect coffee!', 3000);
    state.debug('✅ Café livré (Collision)!');

    // Remove Cup
    if (cupEl.parentNode) cupEl.parentNode.removeChild(cupEl);

    // Remove Customer
    removeCustomer(customer);
}

/**
 * Check callback (deprecated - uses collide event now)
 */
export function checkCoffeeDelivery() {
    // Logic moved to 'collide' event in coffee.js
}
