/**
 * Module de gestion du score
 * Centralise le score et permet de l'utiliser depuis n'importe quel fichier
 */

import { vrLog } from './log-panel.js';

// --- ÉTAT ---
let totalScore = 0;
let totalOrdersCompleted = 0;

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
    console.log(`⭐ +${points} pts${reason ? ' (' + reason + ')' : ''} → Total: ${totalScore}`);
    vrLog(`⭐ +${points}pts = ${totalScore}`);
    notifyScoreChange();
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
    console.log(`⭐ -${points} pts${reason ? ' (' + reason + ')' : ''} → Total: ${totalScore}`);
    notifyScoreChange();
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
 * Retourne les statistiques complètes
 * @returns {{ score: number, completed: number }}
 */
export function getStats() {
    return {
        score: totalScore,
        completed: totalOrdersCompleted
    };
}

/**
 * Réinitialise le score et les stats
 */
export function resetScore() {
    totalScore = 0;
    totalOrdersCompleted = 0;
    console.log('⭐ Score reset');
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
 * Crée le panneau de score visible en VR (en haut de la vision)
 */
export function initScorePanel() {
    console.log('⭐ initScorePanel called, isUiInitialized:', isUiInitialized);
    
    if (isUiInitialized) return;
    
    const cam = document.getElementById('cam');
    if (!cam) {
        console.log('⚠️ No cam found for score panel');
        return;
    }
    
    console.log('⭐ Creating score panel...');
    vrLog('⭐ Score panel init');
    
    // Créer le panneau
    scorePanel = document.createElement('a-entity');
    scorePanel.id = 'score-panel';
    scorePanel.setAttribute('position', '0 0.35 -0.6'); // En haut de la vision
    
    // Fond semi-transparent
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.25');
    bg.setAttribute('height', '0.08');
    bg.setAttribute('color', '#1a1a2e');
    bg.setAttribute('material', 'shader: flat; opacity: 0.85');
    scorePanel.appendChild(bg);
    
    // Bordure dorée
    const border = document.createElement('a-plane');
    border.setAttribute('width', '0.26');
    border.setAttribute('height', '0.09');
    border.setAttribute('color', '#ffd700');
    border.setAttribute('material', 'shader: flat');
    border.setAttribute('position', '0 0 -0.001');
    scorePanel.appendChild(border);
    
    // Texte du scores
    scoreText = document.createElement('a-text');
    scoreText.setAttribute('value', '⭐ 0 pts');
    scoreText.setAttribute('align', 'center');
    scoreText.setAttribute('position', '0 0 0.01');
    scoreText.setAttribute('scale', '0.08 0.08 0.08');
    scoreText.setAttribute('color', '#ffd700');
    scorePanel.appendChild(scoreText);
    
    cam.appendChild(scorePanel);
    isUiInitialized = true;
    
    console.log('⭐ Score panel initialized');
    vrLog('⭐ Score panel OK!');
    updateScorePanel();
}

/**
 * Met à jour l'affichage du panneau de score
 */
function updateScorePanel() {
    if (!scoreText) return;
    scoreText.setAttribute('value', `⭐ ${totalScore} pts`);
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
