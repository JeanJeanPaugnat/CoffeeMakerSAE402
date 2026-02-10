/**
 * Système de gestion des clients
 * Gère les commandes, la livraison et le scoring
 */

import * as state from './state.js';
import { showARNotification } from './panels.js';

// --- ORDER TYPES ---
export const ORDER_TYPES = {
    COFFEE: { id: 'coffee', label: '☕ Café', icon: '☕', points: 10 },
    // Future orders:
    // DONUT: { id: 'donut', label: '🍩 Donut', icon: '🍩', points: 15 },
    // COMBO: { id: 'combo', label: '☕🍩 Café + Donut', icon: '☕🍩', points: 30 },
};

// --- DELIVERY SETTINGS ---
const DELIVERY_RADIUS = 0.5; // Distance pour livrer (en mètres)
let deliveryCheckActive = false;

// --- SCORE ---
let playerScore = 0;
let customersServed = 0;

/**
 * Retourne le score actuel
 */
export function getScore() {
    return { score: playerScore, served: customersServed };
}

/**
 * Génère une commande aléatoire pour un client
 */
function generateOrder() {
    // Pour l'instant, seulement du café
    // Plus tard: random entre COFFEE, DONUT, COMBO
    return { ...ORDER_TYPES.COFFEE };
}

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

    // Générer la commande
    const order = generateOrder();
    customer.dataset.orderId = order.id;
    customer.dataset.orderLabel = order.label;
    customer.dataset.orderPoints = order.points;
    customer._order = order;
    customer._delivered = false;

    // Order text (affiche la commande)
    const text = document.createElement('a-text');
    text.setAttribute('value', `${order.icon} ${order.label}`);
    text.setAttribute('align', 'center');
    text.setAttribute('position', '0 2.2 0.3');
    text.setAttribute('scale', '1.2 1.2 1.2');
    text.setAttribute('color', '#FFD700');
    text.setAttribute('font', 'mozillavr');
    text.classList.add('order-text');
    customer.appendChild(text);

    // Instruction text
    const instruction = document.createElement('a-text');
    instruction.setAttribute('value', 'Apportez-moi ma commande!');
    instruction.setAttribute('align', 'center');
    instruction.setAttribute('position', '0 2.0 0.3');
    instruction.setAttribute('scale', '0.8 0.8 0.8');
    instruction.setAttribute('color', '#FFFFFF');
    instruction.setAttribute('font', 'mozillavr');
    instruction.classList.add('instruction-text');
    customer.appendChild(instruction);

    // Green Zone (zone de livraison)
    const circle = document.createElement('a-ring');
    circle.setAttribute('radius-inner', DELIVERY_RADIUS - 0.1);
    circle.setAttribute('radius-outer', DELIVERY_RADIUS);
    circle.setAttribute('color', '#00ff00');
    circle.setAttribute('rotation', '-90 0 0');
    circle.setAttribute('position', '0 0.02 0');
    circle.classList.add('delivery-zone');
    customer.appendChild(circle);

    // Physics (utiliser box au lieu de hull pour plus de fiabilité)
    customer.setAttribute('static-body', 'shape: box');

    state.sceneEl.appendChild(customer);
    state.customers.push(customer);

    console.log(`Customer spawned: ${randomModel}, Order: ${order.label}`);
    showARNotification(`${order.icon} Nouveau client! Commande: ${order.label}`, 3000);

    // Démarrer la vérification de livraison
    startDeliveryCheck();

    // Debug 3D immédiat
    setTimeout(() => {
        updateDebug3D(`👤 Client: ${order.label}\nPos: ${state.QUEUE_POS.x}, ${state.QUEUE_POS.z}`);
        state.debug(`Client attend: ${order.label}`);
    }, 500);
}

/**
 * Supprime un client de la scène avec animation
 * @param {Element} customer - L'entité du client
 * @param {boolean} satisfied - Si le client est satisfait (livraison réussie)
 */
export function removeCustomer(customer, satisfied = true) {
    if (!customer) {
        console.log('[removeCustomer] ERREUR: customer est null!');
        updateDebug3D('❌ removeCustomer: customer null!');
        return;
    }
    
    console.log('[removeCustomer] Removing customer:', customer.id, 'satisfied:', satisfied);
    updateDebug3D(`🚶 Client part...\nSatisfait: ${satisfied}`);
    
    const idx = state.customers.indexOf(customer);
    if (idx > -1) {
        state.customers.splice(idx, 1);
        console.log('[removeCustomer] Customer removed from array, remaining:', state.customers.length);
    } else {
        console.log('[removeCustomer] Customer not found in array!');
    }

    // Animation de départ
    if (satisfied && customer.object3D) {
        console.log('[removeCustomer] Starting satisfaction animation');
        // Animation satisfaction: monte et disparaît
        customer.setAttribute('animation', {
            property: 'position',
            to: `${customer.object3D.position.x} ${customer.object3D.position.y + 0.5} ${customer.object3D.position.z - 1}`,
            dur: 800,
            easing: 'easeOutQuad'
        });
        customer.setAttribute('animation__fade', {
            property: 'scale',
            to: '0 0 0',
            dur: 800,
            delay: 200,
            easing: 'easeInQuad'
        });
    }

    // Nettoyage après animation
    setTimeout(() => {
        console.log('[removeCustomer] setTimeout cleanup executing');
        updateDebug3D('🗑️ Nettoyage client...');
        
        try {
            customer.setAttribute('visible', 'false');

            if (customer.body && customer.body.world) {
                customer.body.world.removeBody(customer.body);
            }

            if (customer.parentNode) {
                customer.parentNode.removeChild(customer);
                console.log('[removeCustomer] Customer removed from DOM');
                updateDebug3D('✅ Client supprimé!');
            }
        } catch (e) {
            console.error('[removeCustomer] Error during cleanup:', e);
            updateDebug3D('❌ Erreur suppression');
        }
        
        console.log('Client despawned via removeCustomer');
    }, satisfied ? 1000 : 0);
    
    state.debug(satisfied ? '😊 Client satisfait!' : 'Client parti...');
    
    // Spawn next customer après délai
    console.log('[removeCustomer] Will spawn new customer in 4s');
    updateDebug3D('⏳ Prochain client dans 4s...');
    setTimeout(spawnCustomer, 4000);
}

/**
 * Vérifie si un item correspond à la commande
 * @param {Element} item - L'objet (café, donut, etc.)
 * @param {Object} order - La commande du client
 * @returns {boolean}
 */
function itemMatchesOrder(item, order) {
    if (!item || !order) {
        console.log('[itemMatchesOrder] item ou order null:', { item: !!item, order: !!order });
        updateDebug3D('❌ item/order null');
        return false;
    }
    
    console.log('[itemMatchesOrder] Checking:', {
        orderId: order.id,
        isCoffee: item.dataset?.isCoffee,
        hasCoffeeClass: item.classList?.contains('coffee-cup'),
        itemId: item.id
    });
    
    if (order.id === 'coffee') {
        const match = item.dataset.isCoffee === 'true' || item.classList.contains('coffee-cup');
        console.log('[itemMatchesOrder] Coffee match:', match);
        if (!match) {
            updateDebug3D(`❌ Pas un café!\nisCoffee: ${item.dataset?.isCoffee}\nclass: ${item.className}`);
        }
        return match;
    }
    // Future: donut, combo, etc.
    // if (order.id === 'donut') {
    //     return item.dataset.isDonut === 'true';
    // }
    
    return false;
}

/**
 * Trouve tous les items livrables dans la scène
 * @returns {Element[]}
 */
function findDeliverableItems() {
    const items = [];
    
    // Chercher les tasses de café dans spawnedObjects
    state.spawnedObjects.forEach(obj => {
        if (obj && obj.dataset && obj.dataset.isCoffee === 'true') {
            items.push(obj);
        }
    });
    
    // Chercher aussi via classe CSS
    const coffees = document.querySelectorAll('.coffee-cup');
    coffees.forEach(cup => {
        if (!items.includes(cup)) items.push(cup);
    });
    
    // Debug: log le nombre d'items trouvés
    if (items.length > 0) {
        console.log(`[findDeliverableItems] Found ${items.length} items:`, items.map(i => i.id));
    }
    
    return items;
}

// --- DEBUG 3D ---
let debugText3D = null;
let lastDebugUpdate = 0;

/**
 * Affiche un message de debug en 3D au-dessus du client
 */
function updateDebug3D(message) {
    const now = Date.now();
    if (now - lastDebugUpdate < 100) return; // Limite les updates
    lastDebugUpdate = now;
    
    if (!debugText3D) {
        debugText3D = document.createElement('a-text');
        debugText3D.setAttribute('align', 'center');
        debugText3D.setAttribute('position', '0 0.5 -1');
        debugText3D.setAttribute('scale', '0.5 0.5 0.5');
        debugText3D.setAttribute('color', '#00FF00');
        debugText3D.setAttribute('font', 'mozillavr');
        debugText3D.setAttribute('look-at', '[camera]');
        debugText3D.id = 'debug-3d';
        state.sceneEl.appendChild(debugText3D);
    }
    
    debugText3D.setAttribute('value', message);
    console.log('[DEBUG 3D]', message);
}

/**
 * Vérifie la proximité et effectue la livraison si possible
 */
function checkDeliveryProximity() {
    if (state.customers.length === 0) {
        updateDebug3D('Pas de client');
        return;
    }
    
    const items = findDeliverableItems();
    if (items.length === 0) {
        updateDebug3D(`Client attend | Cafés: 0`);
        return;
    }
    
    state.customers.forEach(customer => {
        if (customer._delivered) return;
        
        const customerPos = new THREE.Vector3();
        customer.object3D.getWorldPosition(customerPos);
        
        let closestDist = Infinity;
        let closestItem = null;
        
        items.forEach(item => {
            if (!item || !item.object3D) return;
            
            const itemPos = new THREE.Vector3();
            item.object3D.getWorldPosition(itemPos);
            
            const distance = customerPos.distanceTo(itemPos);
            
            if (distance < closestDist) {
                closestDist = distance;
                closestItem = item;
            }
            
            // Si l'item est dans la zone de livraison
            if (distance < DELIVERY_RADIUS) {
                updateDebug3D(`✅ DANS ZONE! dist=${distance.toFixed(2)}m`);
                // Vérifier si l'item correspond à la commande
                if (itemMatchesOrder(item, customer._order)) {
                    updateDebug3D(`✅ LIVRAISON!`);
                    deliverItem(customer, item);
                }
            }
        });
        
        // Afficher la distance au café le plus proche
        if (closestDist < Infinity && closestDist >= DELIVERY_RADIUS) {
            const remaining = (closestDist - DELIVERY_RADIUS).toFixed(2);
            updateDebug3D(`☕ Dist: ${closestDist.toFixed(2)}m | Zone: ${DELIVERY_RADIUS}m\nEncore ${remaining}m à parcourir`);
            
            // Mettre à jour le texte au-dessus du client
            const instructionText = customer.querySelector('.instruction-text');
            if (instructionText) {
                instructionText.setAttribute('value', `Distance: ${closestDist.toFixed(1)}m`);
                instructionText.setAttribute('color', closestDist < 1 ? '#FFFF00' : '#FFFFFF');
            }
        }
    });
}

/**
 * Démarre la boucle de vérification de livraison
 */
export function startDeliveryCheck() {
    if (deliveryCheckActive) return;
    deliveryCheckActive = true;
    
    function checkLoop() {
        if (!deliveryCheckActive) return;
        checkDeliveryProximity();
        requestAnimationFrame(checkLoop);
    }
    
    checkLoop();
    console.log('📦 Delivery check started');
    state.debug('📦 Système livraison actif');
    updateDebug3D('📦 Livraison: ON');
}

/**
 * Arrête la boucle de vérification
 */
export function stopDeliveryCheck() {
    deliveryCheckActive = false;
}

/**
 * Livre un item à un client
 * @param {Element} customer - Le client
 * @param {Element} item - L'item livré (café, donut, etc.)
 */
export function deliverItem(customer, item) {
    if (!customer || customer._delivered) {
        console.log('[deliverItem] Blocked: customer null or already delivered');
        return;
    }
    customer._delivered = true;

    const order = customer._order;
    const points = order ? order.points : 10;
    
    // Ajouter les points
    playerScore += points;
    customersServed++;
    
    // Debug visuel
    updateDebug3D(`🎉 +${points}pts! Total: ${playerScore}`);

    console.log(`✅ DELIVERY SUCCESS! +${points} points (Total: ${playerScore})`);
    showARNotification(`✅ Merci! +${points} points!`, 3000);
    state.debug(`✅ Livré: ${order ? order.label : 'Item'}! Score: ${playerScore}`);

    // Effet visuel sur l'item (disparition)
    if (item) {
        item.setAttribute('animation', {
            property: 'scale',
            to: '0 0 0',
            dur: 300,
            easing: 'easeInQuad'
        });
        
        setTimeout(() => {
            // Retirer de spawnedObjects
            const idx = state.spawnedObjects.indexOf(item);
            if (idx > -1) state.spawnedObjects.splice(idx, 1);
            
            if (item.parentNode) item.parentNode.removeChild(item);
        }, 300);
    }

    // Supprimer le client (satisfait)
    console.log('[deliverItem] Calling removeCustomer now...');
    updateDebug3D('🔄 Suppression client...');
    removeCustomer(customer, true);
}

/**
 * Livre un café à un client (legacy - garde compatibilité)
 * @param {Element} customer - Le client
 * @param {Element} cupEl - La tasse de café
 */
export function deliverCoffee(customer, cupEl) {
    deliverItem(customer, cupEl);
}

/**
 * Check callback (deprecated - uses proximity now)
 */
export function checkCoffeeDelivery() {
    checkDeliveryProximity();
}
