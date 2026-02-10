/**
 * Système de tablette au poignet
 * Affiche les commandes à accomplir et track la progression
 */

import * as state from './state.js';
import { showARNotification } from './panels.js';

// --- CONFIGURATION ---
const TABLET_CONFIG = {
    width: 0.2,          // Largeur de la tablette en mètres
    height: 0.15,        // Hauteur
    offset: { x: 0, y: 0.05, z: -0.1 }, // Offset par rapport au poignet
    bgColor: '#1a1a2e',
    borderColor: '#4a4a6a',
    textColor: '#ffffff',
    checkColor: '#00ff00',
    pendingColor: '#ffaa00'
};

// --- ÉTAT ---
let tabletEntity = null;
let ordersContainer = null;
let scoreText = null;
let isAttached = false;

// Commandes actuelles
let currentOrders = [];
let completedOrders = 0;
let totalScore = 0;

// --- TYPES DE TÂCHES ---
export const TASK_TYPES = {
    COFFEE: { id: 'coffee', label: 'Café', icon: '☕', points: 10 }
    // Future:
    // CLEAN: { id: 'clean', label: 'Nettoyer', icon: '🧹', points: 5 },
    // TRASH: { id: 'trash', label: 'Poubelle', icon: '🗑️', points: 5 },
};

/**
 * Crée la tablette au poignet
 */
export function createWristTablet() {
    if (tabletEntity) return;
    
    console.log('📱 Creating wrist tablet...');
    
    // Conteneur principal
    tabletEntity = document.createElement('a-entity');
    tabletEntity.id = 'wrist-tablet';
    tabletEntity.setAttribute('position', `${TABLET_CONFIG.offset.x} ${TABLET_CONFIG.offset.y} ${TABLET_CONFIG.offset.z}`);
    tabletEntity.setAttribute('rotation', '-30 0 0'); // Incliné pour être lisible
    
    // Fond de la tablette
    const background = document.createElement('a-plane');
    background.setAttribute('width', TABLET_CONFIG.width);
    background.setAttribute('height', TABLET_CONFIG.height);
    background.setAttribute('color', TABLET_CONFIG.bgColor);
    background.setAttribute('material', 'shader: flat; opacity: 0.95');
    background.setAttribute('position', '0 0 0');
    tabletEntity.appendChild(background);
    
    // Bordure
    const border = document.createElement('a-plane');
    border.setAttribute('width', TABLET_CONFIG.width + 0.01);
    border.setAttribute('height', TABLET_CONFIG.height + 0.01);
    border.setAttribute('color', TABLET_CONFIG.borderColor);
    border.setAttribute('material', 'shader: flat');
    border.setAttribute('position', '0 0 -0.001');
    tabletEntity.appendChild(border);
    
    // Titre
    const title = document.createElement('a-text');
    title.setAttribute('value', '📋 COMMANDES');
    title.setAttribute('align', 'center');
    title.setAttribute('position', `0 ${TABLET_CONFIG.height / 2 - 0.02} 0.001`);
    title.setAttribute('scale', '0.08 0.08 0.08');
    title.setAttribute('color', '#ffffff');
    title.setAttribute('font', 'mozillavr');
    tabletEntity.appendChild(title);
    
    // Conteneur pour les commandes
    ordersContainer = document.createElement('a-entity');
    ordersContainer.id = 'orders-container';
    ordersContainer.setAttribute('position', `0 0 0.001`);
    tabletEntity.appendChild(ordersContainer);
    
    // Score en bas
    scoreText = document.createElement('a-text');
    scoreText.setAttribute('value', 'Score: 0');
    scoreText.setAttribute('align', 'center');
    scoreText.setAttribute('position', `0 ${-TABLET_CONFIG.height / 2 + 0.015} 0.001`);
    scoreText.setAttribute('scale', '0.05 0.05 0.05');
    scoreText.setAttribute('color', '#00ff00');
    scoreText.setAttribute('font', 'mozillavr');
    tabletEntity.appendChild(scoreText);
    
    // Ajouter à la scène (sera attaché au controller après)
    state.sceneEl.appendChild(tabletEntity);
    
    // Générer les premières commandes
    generateNewOrders(3);
    
    // Commencer à attacher au poignet
    startWristAttachment();
    
    console.log('📱 Wrist tablet created');
}

/**
 * Génère de nouvelles commandes
 * @param {number} count - Nombre de commandes à générer
 */
export function generateNewOrders(count = 3) {
    currentOrders = [];
    
    for (let i = 0; i < count; i++) {
        currentOrders.push({
            id: `order-${Date.now()}-${i}`,
            type: TASK_TYPES.COFFEE, // Pour l'instant, seulement café
            completed: false
        });
    }
    
    updateTabletDisplay();
    console.log(`📋 Generated ${count} new orders`);
}

/**
 * Met à jour l'affichage de la tablette
 */
function updateTabletDisplay() {
    if (!ordersContainer) return;
    
    // Supprimer les anciens éléments
    while (ordersContainer.firstChild) {
        ordersContainer.removeChild(ordersContainer.firstChild);
    }
    
    // Afficher chaque commande
    const startY = 0.03;
    const lineHeight = 0.025;
    
    currentOrders.forEach((order, index) => {
        const orderText = document.createElement('a-text');
        const checkbox = order.completed ? '✓' : '○';
        const color = order.completed ? TABLET_CONFIG.checkColor : TABLET_CONFIG.pendingColor;
        
        orderText.setAttribute('value', `${checkbox} ${order.type.icon} ${order.type.label}`);
        orderText.setAttribute('align', 'center');
        orderText.setAttribute('position', `0 ${startY - (index * lineHeight)} 0`);
        orderText.setAttribute('scale', '0.06 0.06 0.06');
        orderText.setAttribute('color', color);
        orderText.setAttribute('font', 'mozillavr');
        
        ordersContainer.appendChild(orderText);
    });
    
    // Afficher le compteur
    const pendingCount = currentOrders.filter(o => !o.completed).length;
    const completedCount = currentOrders.filter(o => o.completed).length;
    
    const counterText = document.createElement('a-text');
    counterText.setAttribute('value', `${completedCount}/${currentOrders.length}`);
    counterText.setAttribute('align', 'center');
    counterText.setAttribute('position', `0.07 ${TABLET_CONFIG.height / 2 - 0.02} 0`);
    counterText.setAttribute('scale', '0.05 0.05 0.05');
    counterText.setAttribute('color', pendingCount === 0 ? '#00ff00' : '#ffffff');
    counterText.setAttribute('font', 'mozillavr');
    ordersContainer.appendChild(counterText);
    
    // Mettre à jour le score
    if (scoreText) {
        scoreText.setAttribute('value', `Score: ${totalScore}`);
    }
}

/**
 * Appelé quand un café est créé
 */
export function onCoffeeCreated() {
    console.log('☕ Coffee created event received');
    
    // Trouver la première commande de café non complétée
    const pendingCoffee = currentOrders.find(o => o.type.id === 'coffee' && !o.completed);
    
    if (pendingCoffee) {
        pendingCoffee.completed = true;
        completedOrders++;
        totalScore += pendingCoffee.type.points;
        
        console.log(`✅ Order completed! Score: ${totalScore}`);
        showARNotification(`✅ Café OK! +${pendingCoffee.type.points} pts`, 2000);
        state.debug(`☕ Commande validée! Score: ${totalScore}`);
        
        updateTabletDisplay();
        
        // Vérifier si toutes les commandes sont complétées
        checkAllOrdersComplete();
    } else {
        console.log('📋 No pending coffee order');
        state.debug('☕ Café créé (pas de commande)');
    }
}

/**
 * Vérifie si toutes les commandes sont terminées
 */
function checkAllOrdersComplete() {
    const allDone = currentOrders.every(o => o.completed);
    
    if (allDone) {
        console.log('🎉 All orders completed!');
        showARNotification('🎉 Toutes les commandes terminées!', 3000);
        state.debug('🎉 Série terminée!');
        
        // Générer de nouvelles commandes après un délai
        setTimeout(() => {
            generateNewOrders(3);
            showARNotification('📋 Nouvelles commandes!', 2000);
        }, 3000);
    }
}

/**
 * Attache la tablette au poignet gauche
 */
function startWristAttachment() {
    function attachLoop() {
        if (!tabletEntity) return;
        
        // Chercher le contrôleur gauche
        const leftCtrl = window.leftController;
        
        if (leftCtrl && !isAttached) {
            // Attacher la tablette au contrôleur gauche
            leftCtrl.add(tabletEntity.object3D);
            isAttached = true;
            console.log('📱 Tablet attached to left wrist');
        }
        
        requestAnimationFrame(attachLoop);
    }
    
    attachLoop();
}

/**
 * Retourne le score actuel
 */
export function getScore() {
    return { score: totalScore, completed: completedOrders };
}

/**
 * Réinitialise les commandes
 */
export function resetOrders() {
    currentOrders = [];
    completedOrders = 0;
    totalScore = 0;
    generateNewOrders(3);
}
