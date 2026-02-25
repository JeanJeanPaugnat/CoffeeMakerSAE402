/**
 * Module de gestion du score v2
 * - Score avec affichage enrichi (pts + orders + streak)
 * - Animation "+N pts" flottante
 * - Streak tracking
 */

import { vrLog } from './log-panel.js';

// --- ÉTAT ---
let totalScore = 0;
let totalOrdersCompleted = 0;
let currentStreak = 0;
let bestStreak = 0; // Meilleur streak atteint dans la session

// --- UI ---
let scorePanel = null;
let scoreText = null;
let isUiInitialized = false;

// --- CALLBACKS ---
let onScoreChangeCallbacks = [];

/**
 * Ajoute des points au score
 * @param {number} points - Nombre de points à ajouter
 * @param {string} reason - Raison (optionnel, pour le log)
 * @returns {number} Le nouveau score total
 */
export function addScore(points, reason = '') {
    totalScore += points;
    console.log(`+${points} pts${reason ? ' (' + reason + ')' : ''} = Total: ${totalScore}`);
    vrLog(`+${points}pts = ${totalScore}`);
    notifyScoreChange();

    // Animation flottante "+N pts"
    showFloatingScore(points);

    return totalScore;
}

/**
 * Retire des points au score
 * @param {number} points - Nombre de points à retirer
 * @param {string} reason - Raison (optionnel)
 * @returns {number} Le nouveau score total
 */
export function removeScore(points, reason = '') {
    totalScore = Math.max(0, totalScore - points);
    console.log(`-${points} pts${reason ? ' (' + reason + ')' : ''} = Total: ${totalScore}`);
    vrLog(`-${points}pts = ${totalScore}`);
    notifyScoreChange();

    // Animation flottante rouge "-N pts"
    showFloatingScore(-points);

    return totalScore;
}

/**
 * Incrémente le compteur de commandes complétées
 */
export function incrementOrdersCompleted() {
    totalOrdersCompleted++;
    notifyScoreChange();
}

/**
 * Retourne le score actuel
 * @returns {number}
 */
export function getScore() {
    return totalScore;
}

/**
 * Définit le streak courant
 * @param {number} streak
 */
export function setStreak(streak) {
    currentStreak = streak;
    if (streak > bestStreak) bestStreak = streak;
    notifyScoreChange();
}

/**
 * Retourne le streak courant
 * @returns {number}
 */
export function getStreak() {
    return currentStreak;
}

/**
 * Retourne le meilleur streak atteint dans la session
 * @returns {number}
 */
export function getBestStreak() {
    return bestStreak;
}

/**
 * Retourne les statistiques complètes
 * @returns {{ score: number, completed: number, streak: number }}
 */
export function getStats() {
    return {
        score: totalScore,
        completed: totalOrdersCompleted,
        streak: currentStreak
    };
}

/**
 * Réinitialise le score et les stats
 */
export function resetScore() {
    totalScore = 0;
    totalOrdersCompleted = 0;
    currentStreak = 0;
    bestStreak = 0;
    console.log('Score reset');
    notifyScoreChange();
}

/**
 * Enregistre un callback appelé quand le score change
 * @param {Function} callback - Function(score, ordersCompleted)
 */
export function onScoreChange(callback) {
    if (typeof callback === 'function') {
        onScoreChangeCallbacks.push(callback);
    }
}

/**
 * Retire un callback
 * @param {Function} callback
 */
export function offScoreChange(callback) {
    onScoreChangeCallbacks = onScoreChangeCallbacks.filter(cb => cb !== callback);
}

/**
 * Notifie tous les callbacks du changement de score
 */
function notifyScoreChange() {
    // Mettre à jour l'UI
    updateScorePanel();

    for (const cb of onScoreChangeCallbacks) {
        try {
            cb(totalScore, totalOrdersCompleted);
        } catch (e) {
            console.error('Score callback error:', e);
        }
    }
}

/**
 * Crée le panneau de score enrichi — HUD attaché à la caméra
 * Affiche : pts | orders | streak
 */
export function initScorePanel() {
    if (isUiInitialized) return;

    const cam = document.getElementById('cam');
    if (!cam) {
        console.log('No cam found for score panel');
        return;
    }

    // Créer le panneau
    scorePanel = document.createElement('a-entity');
    scorePanel.id = 'score-panel';
    scorePanel.setAttribute('position', '0 0.22 -0.6'); // En haut de la vision

    // Fond semi-transparent — plus large pour les infos enrichies
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.40');
    bg.setAttribute('height', '0.065');
    bg.setAttribute('color', '#0a0a1a');
    bg.setAttribute('material', 'shader: flat; opacity: 0.85');
    scorePanel.appendChild(bg);

    // Bordure dorée
    const border = document.createElement('a-plane');
    border.setAttribute('width', '0.41');
    border.setAttribute('height', '0.07');
    border.setAttribute('color', '#d4a574');
    border.setAttribute('material', 'shader: flat');
    border.setAttribute('position', '0 0 -0.001');
    scorePanel.appendChild(border);

    // Texte du score — enrichi
    scoreText = document.createElement('a-text');
    scoreText.setAttribute('value', '0 pts | 0 orders');
    scoreText.setAttribute('align', 'center');
    scoreText.setAttribute('position', '0 0 0.01');
    scoreText.setAttribute('scale', '0.065 0.065 0.065');
    scoreText.setAttribute('color', '#d4a574');
    scorePanel.appendChild(scoreText);

    cam.appendChild(scorePanel);
    isUiInitialized = true;

    console.log('Score panel v2 initialized');
    updateScorePanel();
}

/**
 * Met à jour l'affichage du panneau de score
 * Format: "145 pts | 12 orders | x3"
 */
function updateScorePanel() {
    if (!scoreText) return;

    let display = `${totalScore} pts | ${totalOrdersCompleted} orders`;

    // Ajouter le streak si >= 2
    if (currentStreak >= 2) {
        display += ` | x${currentStreak}`;
    }

    scoreText.setAttribute('value', display);

    // Couleur du texte selon le streak
    if (currentStreak >= 5) {
        scoreText.setAttribute('color', '#e17055'); // Orange-rouge pour streak élevé
    } else if (currentStreak >= 3) {
        scoreText.setAttribute('color', '#fdcb6e'); // Jaune pour streak moyen
    } else {
        scoreText.setAttribute('color', '#d4a574'); // Couleur café par défaut
    }
}

/**
 * Affiche un score flottant "+N pts" ou "-N pts" qui monte et disparaît
 * @param {number} points - Points (positif ou négatif)
 */
function showFloatingScore(points) {
    const cam = document.getElementById('cam');
    if (!cam) return;

    const floater = document.createElement('a-text');
    const isPositive = points > 0;
    const displayText = isPositive ? `+${points}` : `${points}`;
    const color = isPositive ? '#00b894' : '#d63031';

    floater.setAttribute('value', displayText);
    floater.setAttribute('align', 'center');
    floater.setAttribute('position', '0.15 0.15 -0.5');
    floater.setAttribute('scale', '0.08 0.08 0.08');
    floater.setAttribute('color', color);
    floater.setAttribute('opacity', '1');

    cam.appendChild(floater);

    // Animation : monte et disparaît
    floater.setAttribute('animation__rise', {
        property: 'position',
        to: '0.15 0.30 -0.5',
        dur: 1200,
        easing: 'easeOutCubic'
    });

    // Fade out après un délai
    setTimeout(() => {
        let opacity = 1;
        const fadeInterval = setInterval(() => {
            opacity -= 0.08;
            if (opacity <= 0) {
                clearInterval(fadeInterval);
                if (floater.parentNode) {
                    floater.parentNode.removeChild(floater);
                }
            } else {
                floater.setAttribute('opacity', opacity.toString());
            }
        }, 50);
    }, 800);
}

/**
 * Supprime le panneau de score
 */
export function destroyScorePanel() {
    if (scorePanel && scorePanel.parentNode) {
        scorePanel.parentNode.removeChild(scorePanel);
    }
    scorePanel = null;
    scoreText = null;
    isUiInitialized = false;
}
