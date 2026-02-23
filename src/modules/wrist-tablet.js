/**
 * Système de panneau de commandes v2
 * - Commandes mixtes (coffee + donut)
 * - Difficulté progressive (Easy / Medium / Hard)
 * - Timer visuel avec bonus de rapidité
 * - Barre de progression
 */

import * as state from './state.js';
import { showARNotification } from './panels.js';
import { vrLog, initLogsPanel } from './log-panel.js';
import { addScore, getScore, incrementOrdersCompleted, resetScore, initScorePanel } from './score.js';
import { notifyStoryEvent } from './story.js';

// --- ÉTAT ---
let isInitialized = false;
let orderCompleted = false;
let orderCompletedTime = 0;

// --- COMMANDE ACTUELLE ---
// Format v2: multi-items
let currentOrder = null;

// --- TIMER ---
let orderStartTime = 0;
let timerInterval = null;

// --- PANNEAU VR ---
let ordersPanel = null;
let ordersTitleText = null;
let ordersItemsText = null;
let ordersProgressBar = null;
let ordersProgressBg = null;
let ordersTimerBar = null;
let ordersTimerBg = null;
let ordersDifficultyText = null;

// --- DIFFICULTÉ ---
const DIFFICULTY_TIERS = {
    easy: { label: 'EASY', color: '#00b894', borderColor: '#00cec9', timerSec: 60 },
    medium: { label: 'MEDIUM', color: '#fdcb6e', borderColor: '#f39c12', timerSec: 45 },
    hard: { label: 'HARD', color: '#e17055', borderColor: '#d63031', timerSec: 30 }
};

/**
 * Retourne le tier de difficulté basé sur le score actuel
 */
function getCurrentDifficulty() {
    const score = getScore();
    if (score >= 300) return 'hard';
    if (score >= 150) return 'medium';
    return 'easy';
}

// --- COMMANDES POSSIBLES PAR DIFFICULTÉ ---
const ORDERS_BY_DIFFICULTY = {
    easy: [
        { items: [{ type: 'coffee', icon: '[C]', label: 'Coffee', required: 1 }], bonusPoints: 5 },
        { items: [{ type: 'coffee', icon: '[C]', label: 'Coffee', required: 2 }], bonusPoints: 8 },
        { items: [{ type: 'coffee', icon: '[C]', label: 'Coffee', required: 3 }], bonusPoints: 10 },
        { items: [{ type: 'donut', icon: '[D]', label: 'Donut', required: 1 }], bonusPoints: 8 },
        { items: [{ type: 'donut', icon: '[D]', label: 'Donut', required: 2 }], bonusPoints: 10 }
    ],
    medium: [
        { items: [{ type: 'coffee', icon: '[C]', label: 'Coffee', required: 3 }], bonusPoints: 12 },
        { items: [{ type: 'coffee', icon: '[C]', label: 'Coffee', required: 4 }], bonusPoints: 15 },
        { items: [{ type: 'donut', icon: '[D]', label: 'Donut', required: 3 }], bonusPoints: 15 },
        // Mixed orders!
        {
            items: [
                { type: 'coffee', icon: '[C]', label: 'Coffee', required: 2 },
                { type: 'donut', icon: '[D]', label: 'Donut', required: 1 }
            ], bonusPoints: 20
        },
        {
            items: [
                { type: 'coffee', icon: '[C]', label: 'Coffee', required: 1 },
                { type: 'donut', icon: '[D]', label: 'Donut', required: 2 }
            ], bonusPoints: 20
        }
    ],
    hard: [
        {
            items: [
                { type: 'coffee', icon: '[C]', label: 'Coffee', required: 3 },
                { type: 'donut', icon: '[D]', label: 'Donut', required: 2 }
            ], bonusPoints: 30
        },
        {
            items: [
                { type: 'coffee', icon: '[C]', label: 'Coffee', required: 2 },
                { type: 'donut', icon: '[D]', label: 'Donut', required: 3 }
            ], bonusPoints: 30
        },
        { items: [{ type: 'coffee', icon: '[C]', label: 'Coffee', required: 5 }], bonusPoints: 25 },
        { items: [{ type: 'donut', icon: '[D]', label: 'Donut', required: 4 }], bonusPoints: 25 },
        {
            items: [
                { type: 'coffee', icon: '[C]', label: 'Coffee', required: 4 },
                { type: 'donut', icon: '[D]', label: 'Donut', required: 1 }
            ], bonusPoints: 35
        }
    ]
};

/**
 * Initialise les commandes
 */
export function initOrders() {
    if (isInitialized) {
        console.log('📋 Orders already initialized');
        return;
    }
    isInitialized = true;
    console.log('📋 Initializing orders v2...');
    vrLog('📋 System ready');
    generateNewOrder();
    startOrderLoop();
}

/**
 * Génère une nouvelle commande basée sur la difficulté actuelle
 */
function generateNewOrder() {
    orderCompleted = false;
    orderCompletedTime = 0;

    const difficulty = getCurrentDifficulty();
    const pool = ORDERS_BY_DIFFICULTY[difficulty];
    const template = pool[Math.floor(Math.random() * pool.length)];
    const tier = DIFFICULTY_TIERS[difficulty];

    // Deep copy des items avec current = 0
    currentOrder = {
        items: template.items.map(item => ({ ...item, current: 0 })),
        difficulty: difficulty,
        bonusPoints: template.bonusPoints,
        timeLimit: tier.timerSec
    };

    // Lancer le timer
    orderStartTime = Date.now();
    startTimer();

    const summary = currentOrder.items.map(i => `${i.required}x${i.icon}`).join(' + ');
    vrLog(`📋 New: ${summary} [${tier.label}]`);
    console.log(`📋 New order [${tier.label}]: ${summary}`);

    updatePanel();
}

/**
 * Démarre le timer de commande
 */
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (orderCompleted || !currentOrder) return;

        const elapsed = (Date.now() - orderStartTime) / 1000;
        const remaining = currentOrder.timeLimit - elapsed;

        // Mettre à jour la barre de timer
        updateTimerBar(remaining, currentOrder.timeLimit);

        if (remaining <= 0) {
            // Timer expired
            clearInterval(timerInterval);
            timerInterval = null;

            console.log('⏰ Timer expired!');
            vrLog('⏰ Time up!');
            showARNotification('Time up! New order...', 2000);

            // Pas de pénalité, juste nouvelle commande
            setTimeout(() => {
                generateNewOrder();
            }, 1500);
        }
    }, 100);
}

/**
 * Boucle de transition entre commandes
 */
let loopStarted = false;
let loopInterval = null;
function startOrderLoop() {
    if (loopStarted) return;
    loopStarted = true;

    loopInterval = setInterval(() => {
        if (orderCompleted && orderCompletedTime > 0) {
            const elapsed = Date.now() - orderCompletedTime;
            if (elapsed >= 2000) {
                console.log('⏰ 2s elapsed, new order...');
                vrLog('⏰ New order...');
                generateNewOrder();
            }
        }
    }, 100);

    console.log('🔄 Order loop started');
    vrLog('🔄 Loop OK');
}

/**
 * Crée les commandes (format rétrocompatible)
 */
export function generateNewOrders(count = 3) {
    generateNewOrder();
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

    initOrders();

    // Panneau principal
    ordersPanel = document.createElement('a-entity');
    ordersPanel.id = 'orders-panel';
    ordersPanel.setAttribute('position', '0 -0.3 -0.8');

    // Fond principal (plus grand)
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.5');
    bg.setAttribute('height', '0.28');
    bg.setAttribute('color', '#1a1a2e');
    bg.setAttribute('material', 'shader: flat; opacity: 0.92');
    ordersPanel.appendChild(bg);

    // Bordure (change de couleur selon la difficulté)
    const border = document.createElement('a-plane');
    border.setAttribute('width', '0.52');
    border.setAttribute('height', '0.30');
    border.setAttribute('color', '#4a4a6a');
    border.setAttribute('material', 'shader: flat');
    border.setAttribute('position', '0 0 -0.001');
    border.id = 'orders-border';
    ordersPanel.appendChild(border);

    // Titre "ORDER"
    ordersTitleText = document.createElement('a-text');
    ordersTitleText.setAttribute('value', 'ORDER');
    ordersTitleText.setAttribute('align', 'center');
    ordersTitleText.setAttribute('position', '0 0.1 0.01');
    ordersTitleText.setAttribute('scale', '0.09 0.09 0.09');
    ordersTitleText.setAttribute('color', '#ffffff');
    ordersTitleText.setAttribute('font', 'mozillavr');
    ordersPanel.appendChild(ordersTitleText);

    // Texte de difficulté
    ordersDifficultyText = document.createElement('a-text');
    ordersDifficultyText.setAttribute('value', '[EASY]');
    ordersDifficultyText.setAttribute('align', 'center');
    ordersDifficultyText.setAttribute('position', '0.18 0.1 0.01');
    ordersDifficultyText.setAttribute('scale', '0.05 0.05 0.05');
    ordersDifficultyText.setAttribute('color', '#00b894');
    ordersPanel.appendChild(ordersDifficultyText);

    // Ligne décorative
    const line = document.createElement('a-plane');
    line.setAttribute('width', '0.4');
    line.setAttribute('height', '0.002');
    line.setAttribute('color', '#4a4a6a');
    line.setAttribute('position', '0 0.065 0.01');
    line.id = 'orders-line';
    ordersPanel.appendChild(line);

    // Texte des items de la commande
    ordersItemsText = document.createElement('a-text');
    ordersItemsText.setAttribute('value', 'Loading...');
    ordersItemsText.setAttribute('align', 'center');
    ordersItemsText.setAttribute('position', '0 0.02 0.01');
    ordersItemsText.setAttribute('scale', '0.07 0.07 0.07');
    ordersItemsText.setAttribute('color', '#dfe6e9');
    ordersItemsText.setAttribute('wrap-count', '40');
    ordersPanel.appendChild(ordersItemsText);

    // Barre de progression (fond)
    ordersProgressBg = document.createElement('a-plane');
    ordersProgressBg.setAttribute('width', '0.4');
    ordersProgressBg.setAttribute('height', '0.02');
    ordersProgressBg.setAttribute('color', '#2d3436');
    ordersProgressBg.setAttribute('position', '0 -0.03 0.01');
    ordersPanel.appendChild(ordersProgressBg);

    // Barre de progression (remplissage)
    ordersProgressBar = document.createElement('a-plane');
    ordersProgressBar.setAttribute('width', '0.001');
    ordersProgressBar.setAttribute('height', '0.016');
    ordersProgressBar.setAttribute('color', '#00b894');
    ordersProgressBar.setAttribute('position', '-0.2 -0.03 0.015');
    ordersPanel.appendChild(ordersProgressBar);

    // Timer barre (fond)
    ordersTimerBg = document.createElement('a-plane');
    ordersTimerBg.setAttribute('width', '0.4');
    ordersTimerBg.setAttribute('height', '0.012');
    ordersTimerBg.setAttribute('color', '#2d3436');
    ordersTimerBg.setAttribute('position', '0 -0.06 0.01');
    ordersPanel.appendChild(ordersTimerBg);

    // Timer barre (remplissage)
    ordersTimerBar = document.createElement('a-plane');
    ordersTimerBar.setAttribute('width', '0.4');
    ordersTimerBar.setAttribute('height', '0.008');
    ordersTimerBar.setAttribute('color', '#0984e3');
    ordersTimerBar.setAttribute('position', '0 -0.06 0.015');
    ordersPanel.appendChild(ordersTimerBar);

    // Texte du timer
    const timerText = document.createElement('a-text');
    timerText.setAttribute('value', 'TIME');
    timerText.setAttribute('align', 'left');
    timerText.setAttribute('position', '-0.22 -0.06 0.02');
    timerText.setAttribute('scale', '0.035 0.035 0.035');
    timerText.setAttribute('color', '#636e72');
    timerText.id = 'orders-timer-label';
    ordersPanel.appendChild(timerText);

    // Texte de status (en dessous)
    const statusText = document.createElement('a-text');
    statusText.setAttribute('value', '');
    statusText.setAttribute('align', 'center');
    statusText.setAttribute('position', '0 -0.09 0.01');
    statusText.setAttribute('scale', '0.05 0.05 0.05');
    statusText.setAttribute('color', '#636e72');
    statusText.id = 'orders-status-text';
    ordersPanel.appendChild(statusText);

    cam.appendChild(ordersPanel);
    console.log('📋 Orders panel v2 created');
    vrLog('Panel ready');

    initLogsPanel();
    initScorePanel();
    updatePanel();
}

/**
 * Met à jour l'affichage du panneau
 */
function updatePanel() {
    if (!ordersItemsText || !currentOrder) return;

    const difficulty = getCurrentDifficulty();
    const tier = DIFFICULTY_TIERS[difficulty];

    // Mettre à jour la bordure et la couleur selon la difficulté
    const border = ordersPanel ? ordersPanel.querySelector('#orders-border') : null;
    const line = ordersPanel ? ordersPanel.querySelector('#orders-line') : null;
    if (border) border.setAttribute('color', tier.borderColor);
    if (line) line.setAttribute('color', tier.borderColor);

    // Mettre à jour le texte de difficulté
    if (ordersDifficultyText) {
        ordersDifficultyText.setAttribute('text',
            `value: [${tier.label}]; color: ${tier.color}; align: center; wrapCount: 20`);
    }

    if (orderCompleted) {
        // Afficher DONE!
        ordersItemsText.setAttribute('text',
            'value: COMPLETE!\\nNew order...; color: #00b894; align: center; wrapCount: 40');

        updateProgressBar(1); // 100%
    } else {
        // Construire le texte des items
        const lines = [];
        let totalRequired = 0;
        let totalCurrent = 0;

        for (const item of currentOrder.items) {
            // Construire les icônes texte: [C][C][x][x] (remplis vs vides)
            let icons = '';
            for (let i = 0; i < item.required; i++) {
                if (i < item.current) {
                    icons += `[${item.icon.charAt(1)}]`; // Filled icon
                } else {
                    icons += `[ ]`; // Empty
                }
            }
            lines.push(`${item.label}: ${icons} ${item.current}/${item.required}`);
            totalRequired += item.required;
            totalCurrent += item.current;
        }

        const text = lines.join('\\n');
        ordersItemsText.setAttribute('text',
            `value: ${text}; color: #dfe6e9; align: center; wrapCount: 40`);

        // Mettre à jour la barre de progression
        const progress = totalRequired > 0 ? totalCurrent / totalRequired : 0;
        updateProgressBar(progress);
    }

    // Mettre à jour le texte de status
    const statusEl = ordersPanel ? ordersPanel.querySelector('#orders-status-text') : null;
    if (statusEl && !orderCompleted && currentOrder) {
        const elapsed = (Date.now() - orderStartTime) / 1000;
        const remaining = Math.max(0, Math.ceil(currentOrder.timeLimit - elapsed));
        statusEl.setAttribute('text',
            `value: +${currentOrder.bonusPoints} bonus pts; color: #636e72; align: center; wrapCount: 30`);
    }
}

/**
 * Met à jour la barre de progression
 */
function updateProgressBar(progress) {
    if (!ordersProgressBar) return;
    const maxWidth = 0.4;
    const barWidth = Math.max(0.001, maxWidth * progress);
    ordersProgressBar.setAttribute('width', barWidth);
    ordersProgressBar.setAttribute('position', `${-0.2 + barWidth / 2} -0.03 0.015`);

    // Couleur de la barre selon le progrès
    if (progress >= 1) {
        ordersProgressBar.setAttribute('color', '#00b894');
    } else if (progress >= 0.5) {
        ordersProgressBar.setAttribute('color', '#00cec9');
    } else {
        ordersProgressBar.setAttribute('color', '#0984e3');
    }
}

/**
 * Met à jour la barre de timer
 */
function updateTimerBar(remaining, total) {
    if (!ordersTimerBar) return;
    const maxWidth = 0.4;
    const ratio = Math.max(0, remaining / total);
    const barWidth = Math.max(0.001, maxWidth * ratio);
    ordersTimerBar.setAttribute('width', barWidth);
    ordersTimerBar.setAttribute('position', `${-0.2 + barWidth / 2} -0.06 0.015`);

    // Couleur : bleu → jaune → rouge
    if (ratio > 0.5) {
        ordersTimerBar.setAttribute('color', '#0984e3');
    } else if (ratio > 0.2) {
        ordersTimerBar.setAttribute('color', '#fdcb6e');
    } else {
        ordersTimerBar.setAttribute('color', '#d63031');
    }
}

/**
 * Animation de célébration quand une commande est complétée
 */
function celebrateCompletion() {
    if (!ordersPanel) return;

    // Pulsation du panneau
    ordersPanel.setAttribute('animation__celebrate', {
        property: 'scale',
        from: '1 1 1',
        to: '1.15 1.15 1.15',
        dur: 300,
        dir: 'alternate',
        loop: 3,
        easing: 'easeInOutQuad'
    });

    // Changer temporairement la couleur de la bordure
    const border = ordersPanel.querySelector('#orders-border');
    if (border) {
        border.setAttribute('color', '#00b894');
        setTimeout(() => {
            const tier = DIFFICULTY_TIERS[getCurrentDifficulty()];
            border.setAttribute('color', tier.borderColor);
        }, 1500);
    }
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
    if (!isInitialized) {
        vrLog('⚠️ Not init, fixing...');
        initOrders();
    }

    if (orderCompleted) {
        vrLog('Wait next order...');
        return;
    }

    if (!currentOrder) return;

    // Trouver l'item correspondant dans la commande
    const orderItem = currentOrder.items.find(i => i.type === itemType && i.current < i.required);

    if (!orderItem) {
        // C'est soit le mauvais type, soit déjà complété
        const hasItem = currentOrder.items.find(i => i.type === itemType);
        if (!hasItem) {
            const needed = currentOrder.items.map(i => i.icon).join(', ');
            vrLog(`Wrong! Need ${needed}`);
            showARNotification(`Wrong item! Need: ${needed}`, 2000);
        } else {
            vrLog('Already enough of this type!');
            showARNotification('Already have enough of this type!', 1500);
        }
        return;
    }

    // Incrémenter
    orderItem.current++;
    vrLog(`${orderItem.icon} ${orderItem.current}/${orderItem.required}`);

    updatePanel();

    // Vérifier si toute la commande est complète
    const allComplete = currentOrder.items.every(i => i.current >= i.required);

    if (allComplete) {
        orderCompleted = true;
        orderCompletedTime = Date.now();
        incrementOrdersCompleted();

        // Stop timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        // Calculer les points
        let totalPoints = 0;
        for (const item of currentOrder.items) {
            totalPoints += item.required * 10; // 10 pts par item
        }

        // Bonus de temps
        const elapsed = (Date.now() - orderStartTime) / 1000;
        const remaining = currentOrder.timeLimit - elapsed;
        let timeBonus = 0;
        if (remaining > 0) {
            // Bonus proportionnel au temps restant
            timeBonus = Math.round(currentOrder.bonusPoints * (remaining / currentOrder.timeLimit));
        }

        const finalPoints = totalPoints + timeBonus;
        addScore(finalPoints, `Order [${DIFFICULTY_TIERS[currentOrder.difficulty].label}]`);

        const bonusText = timeBonus > 0 ? ` (+${timeBonus} speed bonus!)` : '';
        vrLog(`COMPLETE! +${finalPoints}pts${bonusText}`);
        vrLog('Next in 2s...');
        showARNotification(`Order complete! +${finalPoints} pts${bonusText}`, 3000);

        // Story mode
        notifyStoryEvent('complete_order');

        // Animation de célébration
        celebrateCompletion();

        updatePanel();
        console.log('⏰ Order completed, waiting 2s...');
    } else {
        // Feedback pour item individuel
        showARNotification(`${orderItem.icon} ${orderItem.current}/${orderItem.required}`, 1500);
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
    orderCompleted = false;
    orderCompletedTime = 0;
    currentOrder = null;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    resetScore();
    isInitialized = false;
    initOrders();
}
