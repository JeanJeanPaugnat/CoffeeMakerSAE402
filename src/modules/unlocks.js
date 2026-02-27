

import { getScore, onScoreChange } from './score.js';
import { showARNotification } from './panels.js';
import { vrLog } from './log-panel.js';


const UNLOCK_TIERS = [
    { score: 0, items: ['CUBE', 'COFFEE', 'TRASH CAN', 'DONUTS', 'BROOM', 'SPEAKER'] },
    { score: 50, items: ['REGISTER'] },
    { score: 100, items: ['SIGN'] },
    { score: 200, items: ['COUCH'] },
    { score: 300, items: ['PLANT'] },
    { score: 500, items: ['RUG'] }
];
let notifiedUnlocks = new Set();
let refreshStoreCallback = null;

export function initUnlocks() {
    onScoreChange((newScore) => {
        checkUnlocks(newScore);
    });
    vrLog('🔓 Unlock system ready');
}

export function setRefreshStoreCallback(callback) {
    refreshStoreCallback = callback;
}

export function isItemUnlocked(label) {
    const currentScore = getScore();
    for (const tier of UNLOCK_TIERS) {
        if (tier.items.includes(label) && currentScore >= tier.score) {
            return true;
        }
    }
    return false;
}

export function getRequiredScore(label) {
    for (const tier of UNLOCK_TIERS) {
        if (tier.items.includes(label)) {
            return tier.score;
        }
    }
    return 0;
}

export function getNextUnlock() {
    const currentScore = getScore();
    for (const tier of UNLOCK_TIERS) {
        if (currentScore < tier.score) {
            return { score: tier.score, items: tier.items };
        }
    }
    return null;
}

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

function checkUnlocks(newScore) {
    for (const tier of UNLOCK_TIERS) {
        if (newScore >= tier.score) {
            for (const item of tier.items) {
                const key = `${tier.score}-${item}`;
                if (!notifiedUnlocks.has(key) && tier.score > 0) {
                    notifiedUnlocks.add(key);
                    vrLog(`🔓 ${item} unlocked!`);
                    showARNotification(`🔓 New item: ${item}!`, 3000);
                    if (refreshStoreCallback) refreshStoreCallback();
                }
            }
        }
    }
}
