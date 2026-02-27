

import { vrLog } from './log-panel.js';


let totalScore = 0;
let totalOrdersCompleted = 0;
let currentStreak = 0;
let bestStreak = 0;
let scorePanel = null;
let scoreText = null;
let isUiInitialized = false;
let onScoreChangeCallbacks = [];

export function addScore(points, reason = '') {
    totalScore += points;
    vrLog(`+${points}pts = ${totalScore}`);
    notifyScoreChange();
    showFloatingScore(points);
    return totalScore;
}

export function removeScore(points, reason = '') {
    totalScore = Math.max(0, totalScore - points);
    vrLog(`-${points}pts = ${totalScore}`);
    notifyScoreChange();
    showFloatingScore(-points);
    return totalScore;
}

export function incrementOrdersCompleted() {
    totalOrdersCompleted++;
    notifyScoreChange();
}

export function getScore() {
    return totalScore;
}

export function setStreak(streak) {
    currentStreak = streak;
    if (streak > bestStreak) bestStreak = streak;
    notifyScoreChange();
}

export function getStreak() {
    return currentStreak;
}

export function getBestStreak() {
    return bestStreak;
}

export function getStats() {
    return {
        score: totalScore,
        completed: totalOrdersCompleted,
        streak: currentStreak
    };
}

export function resetScore() {
    totalScore = 0;
    totalOrdersCompleted = 0;
    currentStreak = 0;
    bestStreak = 0;
    notifyScoreChange();
}

export function onScoreChange(callback) {
    if (typeof callback === 'function') {
        onScoreChangeCallbacks.push(callback);
    }
}

export function offScoreChange(callback) {
    onScoreChangeCallbacks = onScoreChangeCallbacks.filter(cb => cb !== callback);
}

function notifyScoreChange() {
    updateScorePanel();
    for (const cb of onScoreChangeCallbacks) {
        try {
            cb(totalScore, totalOrdersCompleted);
        } catch (e) {
            console.error('Score callback error:', e);
        }
    }
}

export function initScorePanel() {
    if (isUiInitialized) return;
    const cam = document.getElementById('cam');
    if (!cam) return;
    scorePanel = document.createElement('a-entity');
    scorePanel.id = 'score-panel';
    scorePanel.setAttribute('position', '0 0.22 -0.6');
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.40');
    bg.setAttribute('height', '0.065');
    bg.setAttribute('color', '#0a0a1a');
    bg.setAttribute('material', 'shader: flat; opacity: 0.85');
    scorePanel.appendChild(bg);
    const border = document.createElement('a-plane');
    border.setAttribute('width', '0.41');
    border.setAttribute('height', '0.07');
    border.setAttribute('color', '#d4a574');
    border.setAttribute('material', 'shader: flat');
    border.setAttribute('position', '0 0 -0.001');
    scorePanel.appendChild(border);
    scoreText = document.createElement('a-text');
    scoreText.setAttribute('value', '0 pts | 0 orders');
    scoreText.setAttribute('align', 'center');
    scoreText.setAttribute('position', '0 0 0.01');
    scoreText.setAttribute('scale', '0.065 0.065 0.065');
    scoreText.setAttribute('color', '#d4a574');
    scorePanel.appendChild(scoreText);
    cam.appendChild(scorePanel);
    isUiInitialized = true;
    updateScorePanel();
}

function updateScorePanel() {
    if (!scoreText) return;
    let display = `${totalScore} pts | ${totalOrdersCompleted} orders`;
    if (currentStreak >= 2) display += ` | x${currentStreak}`;
    scoreText.setAttribute('value', display);
    if (currentStreak >= 5) {
        scoreText.setAttribute('color', '#e17055');
    } else if (currentStreak >= 3) {
        scoreText.setAttribute('color', '#fdcb6e');
    } else {
        scoreText.setAttribute('color', '#d4a574');
    }
}

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
    floater.setAttribute('animation__rise', {
        property: 'position',
        to: '0.15 0.30 -0.5',
        dur: 1200,
        easing: 'easeOutCubic'
    });
    setTimeout(() => {
        let opacity = 1;
        const fadeInterval = setInterval(() => {
            opacity -= 0.08;
            if (opacity <= 0) {
                clearInterval(fadeInterval);
                if (floater.parentNode) floater.parentNode.removeChild(floater);
            } else {
                floater.setAttribute('opacity', opacity.toString());
            }
        }, 50);
    }, 800);
}

export function destroyScorePanel() {
    if (scorePanel && scorePanel.parentNode) {
        scorePanel.parentNode.removeChild(scorePanel);
    }
    scorePanel = null;
    scoreText = null;
    isUiInitialized = false;
}
