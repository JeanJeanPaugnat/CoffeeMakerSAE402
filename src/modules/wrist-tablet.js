/**
 * Système de panneau de commandes
 * Affiche une commande de 3 cafés à accomplir
 */

import * as state from './state.js';
import { showARNotification } from './panels.js';

// --- ÉTAT ---
let isInitialized = false;
let coffeesCreatedCount = 0;
let requiredCoffees = 3;
let orderCompleted = false;
let totalScore = 0;
let totalOrdersCompleted = 0;

// --- PANNEAU VR ---
let ordersPanel = null;
let ordersPanelText = null;

// --- PANNEAU DE LOGS VR ---
let logsPanel = null;
let logsPanelText = null;
let vrLogs = [];
const MAX_VR_LOGS = 8;

// --- TYPES DE TÂCHES ---
export const TASK_TYPES = {
    COFFEE: { id: 'coffee', label: 'Coffee', icon: '☕', points: 10 }
};

/**
 * Ajoute un log visible en VR
 */
function vrLog(message) {
    console.log(message);
    vrLogs.push(message);
    if (vrLogs.length > MAX_VR_LOGS) {
        vrLogs.shift();
    }
    updateLogsPanel();
}

/**
 * Met à jour le panneau de logs VR
 */
function updateLogsPanel() {
    if (!logsPanelText) return;
    logsPanelText.setAttribute('value', vrLogs.join('\\n'));
}

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
}

/**
 * Génère une nouvelle commande de 3 cafés
 */
export function generateNewOrders(count = 3) {
    resetOrder();
}

/**
 * Reset la commande en cours
 */
function resetOrder() {
    coffeesCreatedCount = 0;
    orderCompleted = false;
    vrLog(`📋 New order: ${requiredCoffees} coffees`);
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
    
    // Créer le panneau de logs VR
    createLogsPanel(cam);
    
    // Mettre à jour l'affichage
    updatePanel();
}

/**
 * Crée le panneau de logs visible en VR
 */
function createLogsPanel(cam) {
    if (logsPanel) return;
    
    logsPanel = document.createElement('a-entity');
    logsPanel.id = 'logs-panel';
    logsPanel.setAttribute('position', '0.35 0 -0.8');
    
    // Fond
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.35');
    bg.setAttribute('height', '0.4');
    bg.setAttribute('color', '#000000');
    bg.setAttribute('material', 'shader: flat; opacity: 0.85');
    logsPanel.appendChild(bg);
    
    // Titre
    const title = document.createElement('a-text');
    title.setAttribute('value', '📝 LOGS');
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 0.17 0.01');
    title.setAttribute('scale', '0.08 0.08 0.08');
    title.setAttribute('color', '#ff6600');
    logsPanel.appendChild(title);
    
    // Texte des logs
    logsPanelText = document.createElement('a-text');
    logsPanelText.setAttribute('value', 'Waiting...');
    logsPanelText.setAttribute('align', 'left');
    logsPanelText.setAttribute('position', '-0.15 0.1 0.01');
    logsPanelText.setAttribute('scale', '0.04 0.04 0.04');
    logsPanelText.setAttribute('color', '#00ff00');
    logsPanelText.setAttribute('wrap-count', '30');
    logsPanel.appendChild(logsPanelText);
    
    cam.appendChild(logsPanel);
    vrLog('Logs ready');
}

/**
 * Met à jour l'affichage du panneau
 */
function updatePanel() {
    if (!ordersPanelText) return;
    
    const lines = [];
    
    // Afficher la commande avec progrès
    if (orderCompleted) {
        lines.push(`🟢 ✓ ☕ Coffee (${requiredCoffees}/${requiredCoffees})`);
    } else {
        lines.push(`🟡 ○ ☕ Coffee (${coffeesCreatedCount}/${requiredCoffees})`);
    }
    
    // Stats
    lines.push(`Score: ${totalScore} pts`);
    lines.push(`Orders done: ${totalOrdersCompleted}`);
    
    ordersPanelText.setAttribute('value', lines.join('\\n'));
}

/**
 * Appelé quand un café est créé
 */
export function onCoffeeCreated() {
    coffeesCreatedCount++;
    vrLog(`☕ Coffee ${coffeesCreatedCount}/${requiredCoffees}`);
    
    // Si pas initialisé, initialiser maintenant
    if (!isInitialized) {
        vrLog('⚠️ Not init, fixing...');
        initOrders();
    }
    
    // Ajouter les points pour chaque café
    totalScore += TASK_TYPES.COFFEE.points;
    vrLog(`+${TASK_TYPES.COFFEE.points} pts`);
    
    // Mettre à jour l'affichage
    updatePanel();
    
    // Vérifier si la commande est complète
    if (coffeesCreatedCount >= requiredCoffees && !orderCompleted) {
        orderCompleted = true;
        totalOrdersCompleted++;
        
        vrLog(`✅ ORDER COMPLETE!`);
        vrLog(`Total: ${totalOrdersCompleted} orders`);
        showARNotification(`🎉 Commande terminée! ${totalScore} pts`, 3000);
        
        updatePanel();
        
        // Nouvelle commande après 3 secondes
        setTimeout(() => {
            vrLog(`📋 New order incoming...`);
            showARNotification('📋 Nouvelle commande!', 2000);
            resetOrder();
        }, 4000);
    } else {
        showARNotification(`☕ ${coffeesCreatedCount}/${requiredCoffees}`, 1500);
    }
}

/**
 * Retourne le score actuel
 */
export function getScore() {
    return { score: totalScore, completed: totalOrdersCompleted };
}

/**
 * Réinitialise tout
 */
export function resetOrders() {
    coffeesCreatedCount = 0;
    orderCompleted = false;
    totalScore = 0;
    totalOrdersCompleted = 0;
    isInitialized = false;
    initOrders();
}
