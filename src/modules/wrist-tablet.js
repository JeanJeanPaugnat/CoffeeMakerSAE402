/**
 * Système de panneau de commandes
 * Affiche une commande de 3 cafés à accomplir
 */

import * as state from './state.js';
import { showARNotification } from './panels.js';
import { vrLog, initLogsPanel } from './log-panel.js';
import { addScore, incrementOrdersCompleted, resetScore, initScorePanel } from './score.js';
import { notifyStoryEvent } from './story.js';

// --- ÉTAT ---
let isInitialized = false;
let itemsCreatedCount = 0;
let orderCompleted = false;
let orderCompletedTime = 0; // Timestamp de fin de commande

// --- COMMANDE ACTUELLE ---
let currentOrder = {
    type: 'coffee',
    icon: '☕',
    label: 'Coffee',
    required: 3,
    points: 10
};

// --- PANNEAU VR ---
let ordersPanel = null;
let ordersPanelText = null;

// --- TYPES DE TÂCHES ---
export const TASK_TYPES = {
    COFFEE: { id: 'coffee', label: 'Coffee', icon: '☕', points: 10 },
    DONUT: { id: 'donut', label: 'Donut', icon: '🍩', points: 15 }
};

// --- COMMANDES POSSIBLES ---
const POSSIBLE_ORDERS = [
    { type: 'coffee', icon: '☕', label: 'Coffee', required: 2, points: 10 },
    { type: 'coffee', icon: '☕', label: 'Coffee', required: 3, points: 10 },
    { type: 'coffee', icon: '☕', label: 'Coffee', required: 4, points: 10 },
    { type: 'donut', icon: '🍩', label: 'Donut', required: 1, points: 15 },
    { type: 'donut', icon: '🍩', label: 'Donut', required: 2, points: 15 },
    { type: 'donut', icon: '🍩', label: 'Donut', required: 3, points: 15 }
];

/**
 * Initialise les commandes
 */
export function initOrders() {
    if (isInitialized) {
        console.log('📋 Orders already initialized');
        return;
    }
    isInitialized = true;
    console.log('📋 Initializing orders...');
    vrLog('📋 System ready');
    resetOrder();
    
    // Démarrer la boucle de vérification pour les transitions
    startOrderLoop();
}

/**
 * Boucle de vérification des commandes
 * Utilise setInterval car requestAnimationFrame ne marche pas bien en XR
 */
let loopStarted = false;
let loopInterval = null;
function startOrderLoop() {
    if (loopStarted) {
        console.log('🔄 Order loop already running');
        return;
    }
    loopStarted = true;
    
    // Utiliser setInterval au lieu de requestAnimationFrame
    loopInterval = setInterval(() => {
        // Si une commande est terminée et que 2 secondes sont passées
        if (orderCompleted && orderCompletedTime > 0) {
            const elapsed = Date.now() - orderCompletedTime;
            if (elapsed >= 2000) {
                console.log('⏰ 2s elapsed, resetting order...');
                vrLog('⏰ Resetting...');
                doResetOrder();
            }
        }
    }, 100); // Vérifie toutes les 100ms
    
    console.log('🔄 Order check loop started (setInterval)');
    vrLog('🔄 Loop OK');
}

/**
 * Effectue le reset de la commande
 */
let lastResetTime = 0;
function doResetOrder() {
    // Éviter les appels multiples (cooldown de 1 seconde)
    const now = Date.now();
    if (now - lastResetTime < 1000) {
        return;
    }
    lastResetTime = now;
    
    // Reset d'abord les flags pour stopper la boucle
    orderCompleted = false;
    orderCompletedTime = 0;
    itemsCreatedCount = 0;
    
    // Choisir une nouvelle commande aléatoire
    const randomIndex = Math.floor(Math.random() * POSSIBLE_ORDERS.length);
    currentOrder = { ...POSSIBLE_ORDERS[randomIndex] };

    vrLog(`📋 New: ${currentOrder.required}x ${currentOrder.icon}`);
    console.log(`✅ New order: ${currentOrder.required}x ${currentOrder.label}`);
    showARNotification('📋 New order!', 2000);

    // MAJ immédiate du panneau pour afficher la nouvelle commande
    updatePanel();
}

/**
 * Génère une nouvelle commande de 3 cafés
 */
export function generateNewOrders(count = 3) {
    resetOrder();
}

/**
 * Reset la commande en cours avec une nouvelle commande aléatoire
 */
function resetOrder() {
    itemsCreatedCount = 0;
    orderCompleted = false;
    
    // Choisir une commande aléatoire
    const randomIndex = Math.floor(Math.random() * POSSIBLE_ORDERS.length);
    currentOrder = { ...POSSIBLE_ORDERS[randomIndex] };
    
    vrLog(`📋 ${currentOrder.required}x ${currentOrder.icon}`);
    updatePanel();
}

/**
 * Crée le panneau de commandes
 */
export function createDebugPanel() {
    createOrdersPanel();
}

export function createWristTablet() {
    createOrdersPanel();
}

function createOrdersPanel() {
    if (ordersPanel) return;
    
    const cam = document.getElementById('cam');
    if (!cam) {
        console.log('⚠️ No cam found');
        return;
    }
    
    // Initialiser les commandes si pas déjà fait
    initOrders();
    
    // Créer le panneau
    ordersPanel = document.createElement('a-entity');
    ordersPanel.id = 'orders-panel';
    ordersPanel.setAttribute('position', '0 -0.35 -0.8');
    
    // Fond
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.4');
    bg.setAttribute('height', '0.2');
    bg.setAttribute('color', '#1a1a2e');
    bg.setAttribute('material', 'shader: flat; opacity: 0.9');
    ordersPanel.appendChild(bg);
    
    // Bordure
    const border = document.createElement('a-plane');
    border.setAttribute('width', '0.42');
    border.setAttribute('height', '0.22');
    border.setAttribute('color', '#4a4a6a');
    border.setAttribute('material', 'shader: flat');
    border.setAttribute('position', '0 0 -0.001');
    ordersPanel.appendChild(border);
    
    // Titre
    const title = document.createElement('a-text');
    title.setAttribute('value', '📋 ORDER');
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 0.07 0.01');
    title.setAttribute('scale', '0.1 0.1 0.1');
    title.setAttribute('color', '#ffffff');
    ordersPanel.appendChild(title);
    
    // Texte de la commande
    ordersPanelText = document.createElement('a-text');
    ordersPanelText.setAttribute('value', 'Loading...');
    ordersPanelText.setAttribute('align', 'center');
    ordersPanelText.setAttribute('position', '0 -0.02 0.01');
    ordersPanelText.setAttribute('scale', '0.08 0.08 0.08');
    ordersPanelText.setAttribute('color', '#00ff00');
    ordersPanelText.setAttribute('wrap-count', '35');
    ordersPanel.appendChild(ordersPanelText);
    
    cam.appendChild(ordersPanel);
    console.log('📋 Orders panel created');
    vrLog('Panel ready');
    
    // Initialiser le panneau de logs externe
    initLogsPanel();
    
    // Initialiser le panneau de score en haut
    initScorePanel();
    
    // Mettre à jour l'affichage
    updatePanel();
}

/**
 * Met à jour l'affichage du panneau
 */
function updatePanel() {
    if (!ordersPanelText) {
        vrLog('⚠️ No panel text!');
        return;
    }

    const lines = [];

    // Afficher la commande avec progrès
    let color = '#00ff00';
    if (orderCompleted) {
        lines.push('DONE!');
        lines.push('Next order...');
        color = '#00b894'; // Green for done
    } else {
        lines.push(`${currentOrder.label}`);
        lines.push(`${itemsCreatedCount}/${currentOrder.required}`);
        color = '#00ff00'; // Green for active
    }

    const text = lines.join('\n');
    // Force A-Frame text update
    ordersPanelText.setAttribute('text', `value: ${text}; color: ${color}; align: center; wrapCount: 35`);
    vrLog(`📋 ${lines[0]}`);
    console.log('[updatePanel]', text);
}

/**
 * Appelé quand un café est créé
 */
export function onCoffeeCreated() {
    onItemCreated('coffee');
}

/**
 * Appelé quand un donut est créé
 */
export function onDonutCreated() {
    onItemCreated('donut');
}

/**
 * Logique commune pour tous les items
 */
function onItemCreated(itemType) {
    // Si pas initialisé, initialiser maintenant
    if (!isInitialized) {
        vrLog('⚠️ Not init, fixing...');
        initOrders();
    }
    
    // Si commande en cours de transition, ignorer
    if (orderCompleted) {
        vrLog('⏳ Wait next order...');
        return;
    }
    
    // Vérifier si c'est le bon type d'item
    if (currentOrder.type !== itemType) {
        vrLog(`❌ Wrong! Need ${currentOrder.icon}`);
        showARNotification(`❌ Besoin de ${currentOrder.icon} pas de ${itemType === 'coffee' ? '☕' : '🍩'}`, 2000);
        return;
    }
    
    itemsCreatedCount++;
    vrLog(`${currentOrder.icon} ${itemsCreatedCount}/${currentOrder.required}`);
    
    // Mettre à jour l'affichage
    updatePanel();
    
    // Vérifier si la commande est complète
    if (itemsCreatedCount >= currentOrder.required) {
        orderCompleted = true;
        incrementOrdersCompleted();
        orderCompletedTime = Date.now(); // Enregistrer le timestamp

        // Calculer les points de la commande (points × quantité)
        const orderPoints = currentOrder.points * currentOrder.required;
        addScore(orderPoints, currentOrder.label);

        vrLog(`✅ COMPLETE! +${orderPoints}pts`);
        vrLog(`⏳ Next in 2s...`);
        showARNotification(`🎉 Commande terminée! +${orderPoints} pts`, 3000);

        // Story mode
        notifyStoryEvent('complete_order');

        // MAJ immédiate du panneau pour afficher DONE!
        updatePanel();
        console.log('⏰ Order completed, waiting 2s via loop...');
    } else {
        showARNotification(`${currentOrder.icon} ${itemsCreatedCount}/${currentOrder.required}`, 1500);
    }
}

/**
 * Retourne le score actuel (délègue au module score)
 */
export { getStats as getScore } from './score.js';

/**
 * Réinitialise tout
 */
export function resetOrders() {
    itemsCreatedCount = 0;
    orderCompleted = false;
    resetScore();
    isInitialized = false;
    initOrders();
}
