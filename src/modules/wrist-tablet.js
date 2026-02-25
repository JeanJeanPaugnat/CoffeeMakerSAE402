/**
 * Système de commandes v3 — "Ticket Board" Dark Kitchen
 * - Panneau fixé dans le monde (pas attaché à la caméra)
 * - Streak system (commandes consécutives)
 * - Timer avec pénalité réelle au timeout
 * - Speed bonus doublé si rapide
 * - Messages narratifs
 * - Effets visuels d'urgence
 * - Icônes texte compatibles A-Frame (pas d'emojis)
 */

import * as state from './state.js';
import { showARNotification } from './panels.js';
import { vrLog, initLogsPanel } from './log-panel.js';
import { addScore, removeScore, getScore, incrementOrdersCompleted, resetScore, initScorePanel, setStreak, getStreak } from './score.js';
import { notifyStoryEvent } from './story.js';
import { playNewOrder, playOrderComplete, playOrderFail } from './sfx.js';
import { submitScore } from './leaderboard.js';

// --- ÉTAT ---
let isInitialized = false;
let orderCompleted = false;
let orderCompletedTime = 0;

// --- COMMANDE ACTUELLE ---
let currentOrder = null;

// --- TIMER ---
let orderStartTime = 0;
let timerInterval = null;

// --- STREAK ---
let currentStreak = 0;
let consecutiveTimeouts = 0;

// --- PANNEAU VR ---
let ordersPanel = null;
let ordersTitleText = null;
let ordersItemsText = null;
let ordersProgressBar = null;
let ordersProgressBg = null;
let ordersTimerBar = null;
let ordersTimerBg = null;
let ordersDifficultyText = null;
let ordersStreakText = null;
let ordersBorderEl = null;

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

// --- MESSAGES NARRATIFS ---
const COMPLETION_MESSAGES = [
    'Order up! Nice work!',
    'Another satisfied customer!',
    'Kitchen is on fire!',
    'You make it look easy!',
    'Perfectly done, barista!'
];

const SPEED_MESSAGES = [
    'Lightning fast! The boss is impressed!',
    'Speed demon! Incredible!',
    'Blazing fast delivery!'
];

const TIMEOUT_MESSAGES = [
    'Too slow... the customer left.',
    'Order expired... keep going!',
    'Time ran out... stay focused!'
];

const STREAK_MESSAGES = {
    3: 'x3 streak! You are unstoppable!',
    5: 'LEGENDARY BARISTA! x5 streak!',
    7: 'GODLIKE! x7 streak! Incredible!',
    10: 'x10!!! MASTER BARISTA!!!'
};

/**
 * Initialise les commandes
 */
export function initOrders() {
    if (isInitialized) {
        console.log('Orders already initialized');
        return;
    }
    isInitialized = true;
    currentStreak = 0;
    consecutiveTimeouts = 0;
    console.log('Initializing orders v3...');
    vrLog('Kitchen ready!');
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

    const summary = currentOrder.items.map(i => `${i.required}x${i.label}`).join(' + ');
    vrLog(`New: ${summary} [${tier.label}]`);
    console.log(`New order [${tier.label}]: ${summary}`);

    // Son de nouvelle commande
    playNewOrder();

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

        // Effets visuels d'urgence
        updateUrgencyEffects(remaining, currentOrder.timeLimit);

        if (remaining <= 0) {
            // Timer expired — PÉNALITÉ
            clearInterval(timerInterval);
            timerInterval = null;

            // Pénalité de score
            const penalty = 10;
            removeScore(penalty, 'Order timed out');

            // Reset streak
            currentStreak = 0;
            consecutiveTimeouts++;
            setStreak(0);

            // Message narratif
            const msg = TIMEOUT_MESSAGES[Math.floor(Math.random() * TIMEOUT_MESSAGES.length)];
            vrLog(`-${penalty}pts! ${msg}`);

            // Son d'echec
            playOrderFail();

            if (consecutiveTimeouts >= 3) {
                showARNotification('The kitchen is falling behind! Focus!', 3000);
            } else {
                showARNotification(`${msg} (-${penalty}pts)`, 2500);
            }

            // Reset urgency effects
            resetUrgencyEffects();

            // Nouvelle commande après un délai
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
                vrLog('New order...');
                generateNewOrder();
            }
        }
    }, 100);

    console.log('Order loop started');
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

/**
 * Crée le panneau de commandes — "Ticket Board" fixé dans le monde
 */
function createOrdersPanel() {
    if (ordersPanel) return;

    const sceneEl = document.querySelector('a-scene');
    if (!sceneEl) {
        console.log('No scene found');
        return;
    }

    initOrders();

    // === PANNEAU PRINCIPAL ===
    ordersPanel = document.createElement('a-entity');
    ordersPanel.id = 'orders-panel';

    // Fond principal — style écran de cuisine
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.56');
    bg.setAttribute('height', '0.40');
    bg.setAttribute('color', '#0a0a1a');
    bg.setAttribute('material', 'shader: flat; opacity: 0.95');
    ordersPanel.appendChild(bg);

    // Bordure (change de couleur selon la difficulté + urgence)
    const border = document.createElement('a-plane');
    border.setAttribute('width', '0.58');
    border.setAttribute('height', '0.42');
    border.setAttribute('color', '#4a4a6a');
    border.setAttribute('material', 'shader: flat');
    border.setAttribute('position', '0 0 -0.001');
    border.id = 'orders-border';
    ordersBorderEl = border;
    ordersPanel.appendChild(border);

    // Titre "ORDER"
    ordersTitleText = document.createElement('a-text');
    ordersTitleText.setAttribute('value', '~ ORDER ~');
    ordersTitleText.setAttribute('align', 'center');
    ordersTitleText.setAttribute('position', '-0.05 0.16 0.01');
    ordersTitleText.setAttribute('scale', '0.09 0.09 0.09');
    ordersTitleText.setAttribute('color', '#ffffff');
    ordersTitleText.setAttribute('font', 'mozillavr');
    ordersPanel.appendChild(ordersTitleText);

    // Texte de difficulté
    ordersDifficultyText = document.createElement('a-text');
    ordersDifficultyText.setAttribute('value', '[EASY]');
    ordersDifficultyText.setAttribute('align', 'center');
    ordersDifficultyText.setAttribute('position', '0.20 0.16 0.01');
    ordersDifficultyText.setAttribute('scale', '0.05 0.05 0.05');
    ordersDifficultyText.setAttribute('color', '#00b894');
    ordersPanel.appendChild(ordersDifficultyText);

    // Ligne décorative
    const line = document.createElement('a-plane');
    line.setAttribute('width', '0.46');
    line.setAttribute('height', '0.002');
    line.setAttribute('color', '#4a4a6a');
    line.setAttribute('position', '0 0.11 0.01');
    line.id = 'orders-line';
    ordersPanel.appendChild(line);

    // Texte des items de la commande
    ordersItemsText = document.createElement('a-text');
    ordersItemsText.setAttribute('value', 'Loading...');
    ordersItemsText.setAttribute('align', 'center');
    ordersItemsText.setAttribute('position', '0 0.04 0.01');
    ordersItemsText.setAttribute('scale', '0.08 0.08 0.08');
    ordersItemsText.setAttribute('color', '#dfe6e9');
    ordersItemsText.setAttribute('wrap-count', '35');
    ordersPanel.appendChild(ordersItemsText);

    // Barre de progression (fond)
    ordersProgressBg = document.createElement('a-plane');
    ordersProgressBg.setAttribute('width', '0.46');
    ordersProgressBg.setAttribute('height', '0.025');
    ordersProgressBg.setAttribute('color', '#1a1a2e');
    ordersProgressBg.setAttribute('position', '0 -0.04 0.01');
    ordersPanel.appendChild(ordersProgressBg);

    // Barre de progression (remplissage)
    ordersProgressBar = document.createElement('a-plane');
    ordersProgressBar.setAttribute('width', '0.001');
    ordersProgressBar.setAttribute('height', '0.02');
    ordersProgressBar.setAttribute('color', '#00b894');
    ordersProgressBar.setAttribute('position', '-0.23 -0.04 0.015');
    ordersPanel.appendChild(ordersProgressBar);

    // Timer barre (fond)
    ordersTimerBg = document.createElement('a-plane');
    ordersTimerBg.setAttribute('width', '0.46');
    ordersTimerBg.setAttribute('height', '0.015');
    ordersTimerBg.setAttribute('color', '#1a1a2e');
    ordersTimerBg.setAttribute('position', '0 -0.07 0.01');
    ordersPanel.appendChild(ordersTimerBg);

    // Timer barre (remplissage)
    ordersTimerBar = document.createElement('a-plane');
    ordersTimerBar.setAttribute('width', '0.46');
    ordersTimerBar.setAttribute('height', '0.01');
    ordersTimerBar.setAttribute('color', '#0984e3');
    ordersTimerBar.setAttribute('position', '0 -0.07 0.015');
    ordersPanel.appendChild(ordersTimerBar);

    // Texte TIME à gauche
    const timerLabel = document.createElement('a-text');
    timerLabel.setAttribute('value', 'TIME');
    timerLabel.setAttribute('align', 'left');
    timerLabel.setAttribute('position', '-0.25 -0.07 0.02');
    timerLabel.setAttribute('scale', '0.035 0.035 0.035');
    timerLabel.setAttribute('color', '#636e72');
    timerLabel.id = 'orders-timer-label';
    ordersPanel.appendChild(timerLabel);

    // Texte de streak
    ordersStreakText = document.createElement('a-text');
    ordersStreakText.setAttribute('value', '');
    ordersStreakText.setAttribute('align', 'center');
    ordersStreakText.setAttribute('position', '0 -0.10 0.01');
    ordersStreakText.setAttribute('scale', '0.05 0.05 0.05');
    ordersStreakText.setAttribute('color', '#e17055');
    ordersPanel.appendChild(ordersStreakText);

    // Texte de status (bonus points)
    const statusText = document.createElement('a-text');
    statusText.setAttribute('value', '');
    statusText.setAttribute('align', 'center');
    statusText.setAttribute('position', '0 -0.14 0.01');
    statusText.setAttribute('scale', '0.045 0.045 0.045');
    statusText.setAttribute('color', '#636e72');
    statusText.id = 'orders-status-text';
    ordersPanel.appendChild(statusText);

    // === Position relative à la caméra — face au joueur ===
    const cam = document.getElementById('cam');
    let targetX = 0, targetY = 1.5, targetZ = -1.5;
    let panelAngleY = 0;

    if (cam) {
        const camPos = cam.object3D.position.clone();
        const camRot = cam.object3D.rotation;
        const distance = 1.5;
        targetX = camPos.x - Math.sin(camRot.y) * distance;
        targetY = camPos.y;
        targetZ = camPos.z - Math.cos(camRot.y) * distance;
        panelAngleY = (camRot.y * 180 / Math.PI);
    }

    ordersPanel.setAttribute('position', `${targetX} ${targetY + 2} ${targetZ}`);
    ordersPanel.setAttribute('rotation', `0 ${panelAngleY} 0`);

    // Animation d'entrée — slide depuis le haut vers la position face au joueur
    ordersPanel.setAttribute('animation', {
        property: 'position',
        to: `${targetX} ${targetY} ${targetZ}`,
        dur: 1200,
        easing: 'easeOutCubic'
    });

    sceneEl.appendChild(ordersPanel);
    console.log('Orders Ticket Board created (facing player)');
    vrLog('Ticket Board ready!');

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

    // Mettre à jour le streak
    if (ordersStreakText) {
        if (currentStreak >= 2) {
            ordersStreakText.setAttribute('text',
                `value: STREAK x${currentStreak}; color: #e17055; align: center; wrapCount: 20`);
        } else {
            ordersStreakText.setAttribute('value', '');
        }
    }

    if (orderCompleted) {
        // Afficher DONE!
        ordersItemsText.setAttribute('text',
            'value: COMPLETE!\\nNew order...; color: #00b894; align: center; wrapCount: 35');

        updateProgressBar(1); // 100%
    } else {
        // Construire le texte des items — format clair avec compteur
        const lines = [];
        let totalRequired = 0;
        let totalCurrent = 0;

        for (const item of currentOrder.items) {
            // Construire : "Coffee: [x][x][ ] 2/3"
            let slots = '';
            for (let i = 0; i < item.required; i++) {
                if (i < item.current) {
                    slots += '[x]';
                } else {
                    slots += '[ ]';
                }
            }
            lines.push(`${item.label}: ${slots} ${item.current}/${item.required}`);
            totalRequired += item.required;
            totalCurrent += item.current;
        }

        const text = lines.join('\\n');
        ordersItemsText.setAttribute('text',
            `value: ${text}; color: #dfe6e9; align: center; wrapCount: 35`);

        // Mettre à jour la barre de progression
        const progress = totalRequired > 0 ? totalCurrent / totalRequired : 0;
        updateProgressBar(progress);
    }

    // Mettre à jour le texte de status (bonus points)
    const statusEl = ordersPanel ? ordersPanel.querySelector('#orders-status-text') : null;
    if (statusEl && !orderCompleted && currentOrder) {
        const streakBonus = currentStreak >= 2 ? ` | Streak x${currentStreak}` : '';
        statusEl.setAttribute('text',
            `value: +${currentOrder.bonusPoints} bonus${streakBonus}; color: #636e72; align: center; wrapCount: 30`);
    }
}

/**
 * Met à jour la barre de progression
 */
function updateProgressBar(progress) {
    if (!ordersProgressBar) return;
    const maxWidth = 0.46;
    const barWidth = Math.max(0.001, maxWidth * progress);
    ordersProgressBar.setAttribute('width', barWidth);
    ordersProgressBar.setAttribute('position', `${-0.23 + barWidth / 2} -0.04 0.015`);

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
    const maxWidth = 0.46;
    const ratio = Math.max(0, remaining / total);
    const barWidth = Math.max(0.001, maxWidth * ratio);
    ordersTimerBar.setAttribute('width', barWidth);
    ordersTimerBar.setAttribute('position', `${-0.23 + barWidth / 2} -0.07 0.015`);

    // Couleur : bleu > jaune > rouge
    if (ratio > 0.5) {
        ordersTimerBar.setAttribute('color', '#0984e3');
    } else if (ratio > 0.25) {
        ordersTimerBar.setAttribute('color', '#fdcb6e');
    } else {
        ordersTimerBar.setAttribute('color', '#d63031');
    }
}

/**
 * Effets d'urgence quand le timer est bas
 */
function updateUrgencyEffects(remaining, total) {
    if (!ordersBorderEl) return;
    const ratio = remaining / total;

    if (ratio <= 0.1) {
        // Flash rouge rapide quand < 10%
        ordersBorderEl.setAttribute('animation__urgency', {
            property: 'material.color',
            from: '#d63031',
            to: '#1a1a2e',
            dur: 300,
            dir: 'alternate',
            loop: true,
            easing: 'linear'
        });
    } else if (ratio <= 0.25) {
        // Pulse rouge lent quand < 25%
        ordersBorderEl.setAttribute('animation__urgency', {
            property: 'material.color',
            from: '#e17055',
            to: DIFFICULTY_TIERS[getCurrentDifficulty()].borderColor,
            dur: 800,
            dir: 'alternate',
            loop: true,
            easing: 'easeInOutSine'
        });
    }
}

/**
 * Reset les effets d'urgence
 */
function resetUrgencyEffects() {
    if (!ordersBorderEl) return;
    ordersBorderEl.removeAttribute('animation__urgency');
    const tier = DIFFICULTY_TIERS[getCurrentDifficulty()];
    ordersBorderEl.setAttribute('color', tier.borderColor);
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
        to: '1.12 1.12 1.12',
        dur: 300,
        dir: 'alternate',
        loop: 3,
        easing: 'easeInOutQuad'
    });

    // Reset urgency
    resetUrgencyEffects();

    // Flash vert sur la bordure
    if (ordersBorderEl) {
        ordersBorderEl.setAttribute('color', '#00b894');
        setTimeout(() => {
            const tier = DIFFICULTY_TIERS[getCurrentDifficulty()];
            ordersBorderEl.setAttribute('color', tier.borderColor);
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
        vrLog('Not init, fixing...');
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
            const needed = currentOrder.items.map(i => i.label).join(', ');
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
    vrLog(`${orderItem.label} ${orderItem.current}/${orderItem.required}`);

    updatePanel();

    // Vérifier si toute la commande est complète
    const allComplete = currentOrder.items.every(i => i.current >= i.required);

    if (allComplete) {
        orderCompleted = true;
        orderCompletedTime = Date.now();
        incrementOrdersCompleted();
        consecutiveTimeouts = 0; // Reset timeout counter

        // Stop timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        // Calculer les points de base
        let totalPoints = 0;
        for (const item of currentOrder.items) {
            totalPoints += item.required * 10; // 10 pts par item
        }

        // Bonus de temps
        const elapsed = (Date.now() - orderStartTime) / 1000;
        const remaining = currentOrder.timeLimit - elapsed;
        let timeBonus = 0;
        let isSpeedBonus = false;

        if (remaining > 0) {
            const timeRatio = remaining / currentOrder.timeLimit;

            // Speed bonus doublé si moins de 50% du temps utilisé
            if (timeRatio > 0.5) {
                timeBonus = Math.round(currentOrder.bonusPoints * 2);
                isSpeedBonus = true;
            } else {
                // Bonus proportionnel au temps restant
                timeBonus = Math.round(currentOrder.bonusPoints * timeRatio);
            }
        }

        // Streak
        currentStreak++;
        setStreak(currentStreak);

        // Streak bonus
        let streakBonus = 0;
        if (currentStreak >= 3) {
            streakBonus = currentStreak * 2; // 2pts par niveau de streak
        }

        const finalPoints = totalPoints + timeBonus + streakBonus;
        const tier = DIFFICULTY_TIERS[currentOrder.difficulty];
        addScore(finalPoints, `Order [${tier.label}]`);

        // Son de complétion
        playOrderComplete();

        // Messages narratifs
        let completionMsg = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];

        if (isSpeedBonus) {
            completionMsg = SPEED_MESSAGES[Math.floor(Math.random() * SPEED_MESSAGES.length)];
        }

        // Check streak milestones
        const streakMsg = STREAK_MESSAGES[currentStreak];
        if (streakMsg) {
            completionMsg = streakMsg;
        }

        // Build notification
        let notifParts = [`+${finalPoints}pts`];
        if (timeBonus > 0) notifParts.push(`Speed +${timeBonus}`);
        if (streakBonus > 0) notifParts.push(`Streak +${streakBonus}`);

        vrLog(`DONE! ${notifParts.join(' | ')}`);
        showARNotification(`${completionMsg} (${notifParts.join(' | ')})`, 3500);

        // Story mode
        notifyStoryEvent('complete_order');

        // Submit score to leaderboard
        submitScore();

        // Animation de célébration
        celebrateCompletion();

        updatePanel();
        console.log('Order completed, waiting 2s...');
    } else {
        // Feedback pour item individuel
        showARNotification(`${orderItem.label} ${orderItem.current}/${orderItem.required}`, 1500);
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
    currentStreak = 0;
    consecutiveTimeouts = 0;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    resetScore();
    isInitialized = false;
    initOrders();
}
