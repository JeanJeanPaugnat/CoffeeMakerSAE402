/**
 * Score-based unlock system
 * VR Store items unlock as the player earns points
 */

import { getScore, onScoreChange } from './score.js';
import { showARNotification } from './panels.js';
import { vrLog } from './log-panel.js';

// --- UNLOCK TIERS ---
// Essential gameplay items: unlocked from the start (score: 0)
// Decorative items: unlocked progressively
const UNLOCK_TIERS = [
    { score: 0, items: ['CUBE', 'COFFEE', 'TRASH CAN', 'DONUTS', 'BROOM', 'SPEAKER'] },
    { score: 50, items: ['REGISTER'] },
    { score: 100, items: ['SIGN'] },
    { score: 200, items: ['COUCH'] },
    { score: 300, items: ['PLANT'] },
    { score: 500, items: ['RUG'] }
];

// Track which unlocks have already been notified
let notifiedUnlocks = new Set();
// Callback to refresh the store UI
let refreshStoreCallback = null;

/**
 * Initializes the unlock system
 * Hooks into the onScoreChange callback from score.js
 */
export function initUnlocks() {
    onScoreChange((newScore) => {
        checkUnlocks(newScore);
    });

    console.log('🔓 Unlock system initialized');
    vrLog('🔓 Unlock system ready');
}

/**
 * Registers a callback to refresh the VR Store
 * @param {Function} callback
 */
export function setRefreshStoreCallback(callback) {
    refreshStoreCallback = callback;
}

/**
 * Checks if an item is unlocked
 * @param {string} label - The item label (e.g. 'COFFEE', 'COUCH')
 * @returns {boolean}
 */
export function isItemUnlocked(label) {
    const currentScore = getScore();
    for (const tier of UNLOCK_TIERS) {
        if (tier.items.includes(label) && currentScore >= tier.score) {
            return true;
        }
    }
    return false;
}

/**
 * Returns the score required to unlock an item
 * @param {string} label - The item label
 * @returns {number} Required score, or 0 if always available
 */
export function getRequiredScore(label) {
    for (const tier of UNLOCK_TIERS) {
        if (tier.items.includes(label)) {
            return tier.score;
        }
    }
    return 0;
}

/**
 * Returns the next unlock tier
 * @returns {{ score: number, items: string[] } | null}
 */
export function getNextUnlock() {
    const currentScore = getScore();
    for (const tier of UNLOCK_TIERS) {
        if (currentScore < tier.score) {
            return { score: tier.score, items: tier.items };
        }
    }
    return null; // Everything unlocked
}

/**
 * Returns a list of all unlocked items
 * @returns {string[]}
 */
export function getUnlockedItems() {
    const currentScore = getScore();
    const unlocked = [];
    for (const tier of UNLOCK_TIERS) {
        if (currentScore >= tier.score) {
            unlocked.push(...tier.items);
        }
    }
    return unlocked;
}

/**
 * Checks if new items have been unlocked
 * Called via the onScoreChange callback
 * @param {number} newScore
 */
function checkUnlocks(newScore) {
    for (const tier of UNLOCK_TIERS) {
        if (newScore >= tier.score) {
            for (const item of tier.items) {
                const key = `${tier.score}-${item}`;
                if (!notifiedUnlocks.has(key) && tier.score > 0) {
                    notifiedUnlocks.add(key);
                    console.log(`🔓 UNLOCKED: ${item} (at ${tier.score} pts)`);
                    vrLog(`🔓 ${item} unlocked!`);
                    showARNotification(`🔓 New item: ${item}!`, 3000);

                    // Refresh the store if callback is set
                    if (refreshStoreCallback) {
                        refreshStoreCallback();
                    }
                }
            }
        }
    }
}
