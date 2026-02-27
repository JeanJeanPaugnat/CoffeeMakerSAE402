

import { getUsername } from './profile.js';
import { getStats, getBestStreak } from './score.js';

let lastSubmitTime = 0;
const SUBMIT_COOLDOWN = 5000;

// Soumet le score actuel au leaderboard (avec cooldown)
export async function submitScore() {
    const username = getUsername();
    if (!username) return;
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) return;
    lastSubmitTime = now;
    const stats = getStats();
    const bestStreak = getBestStreak();
    try {
        const response = await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, score: stats.score, ordersCompleted: stats.completed, bestStreak }),
        });
        if (response.ok) {
            const data = await response.json();
            console.log(`🏆 Score submitted! Rank: #${data.rank}, Best: ${data.bestScore}`);
        }
    } catch (error) {
        console.error('Failed to submit score:', error);
    }
}

// Soumet le score immédiatement (bypass throttle)
export function submitScoreSync() {
    const username = getUsername();
    if (!username) return;
    const stats = getStats();
    const bestStreak = getBestStreak();
    const data = JSON.stringify({ username, score: stats.score, ordersCompleted: stats.completed, bestStreak });
    navigator.sendBeacon('/api/score', new Blob([data], { type: 'application/json' }));
}

// Récupère le leaderboard depuis l'API
export async function fetchLeaderboard(limit = 20) {
    try {
        const response = await fetch(`/api/leaderboard?limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        return data.leaderboard || [];
    } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        return [];
    }
}

// Rend le leaderboard HTML dans un conteneur
export async function renderLeaderboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<p class="lb-loading">Loading leaderboard...</p>';
    const entries = await fetchLeaderboard(20);
    const currentUser = getUsername();
    if (entries.length === 0) {
        container.innerHTML = `<div class="lb-empty"><p>☕ No scores yet!</p><p>Be the first barista on the leaderboard.</p></div>`;
        return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    let html = `<table class="lb-table"><thead><tr><th>#</th><th>Barista</th><th>Score</th><th>Orders</th><th>Streak</th></tr></thead><tbody>`;
    for (const entry of entries) {
        const isCurrentUser = currentUser && entry.username === currentUser;
        const rankDisplay = entry.rank <= 3 ? medals[entry.rank - 1] : entry.rank;
        const rowClass = isCurrentUser ? 'lb-row lb-row-self' : 'lb-row';
        const topClass = entry.rank <= 3 ? `lb-top-${entry.rank}` : '';
        html += `<tr class="${rowClass} ${topClass}"><td class="lb-rank">${rankDisplay}</td><td class="lb-name">${escapeHtml(entry.username)}${isCurrentUser ? ' <span class=\"lb-you\">(you)</span>' : ''}</td><td class="lb-score">${entry.score} pts</td><td class="lb-orders">${entry.ordersCompleted}</td><td class="lb-streak">x${entry.bestStreak}</td></tr>`;
    }
    html += '</tbody></table>';
    container.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
