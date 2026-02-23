/**
 * Système de déverrouillage par points
 * Les items du VR Store se débloquent en gagnant des points
 */

import { getScore, onScoreChange } from './score.js';
import { showARNotification } from './panels.js';
import { vrLog } from './log-panel.js';

// --- UNLOCK TIERS ---
// Items gameplay essentiels: débloqués dès le départ (score: 0)
// Items décoratifs: débloqués progressivement
const UNLOCK_TIERS = [
    { score: 0, items: ['CUBE', 'COFFEE', 'POUBELLE', 'DONUT', 'BROOM', 'SPEAKER'] },
    { score: 50, items: ['REGISTER'] },
    { score: 100, items: ['SIGN'] },
    { score: 200, items: ['COUCH'] },
    { score: 300, items: ['PLANT'] },
    { score: 500, items: ['RUG'] }
];

// Track which unlocks have already been notified
let notifiedUnlocks = new Set();
// Callback pour rafraîchir le store
let refreshStoreCallback = null;

/**
 * Initialise le système de déverrouillage
 * Se branche sur le callback onScoreChange de score.js
 */
export function initUnlocks() {
    // Enregistrer le callback sur les changements de score
    onScoreChange((newScore) => {
        checkUnlocks(newScore);
    });

    console.log('🔓 Unlock system initialized');
    vrLog('🔓 Unlock system ready');
}

/**
 * Enregistre un callback pour rafraîchir le VR Store
 * @param {Function} callback
 */
export function setRefreshStoreCallback(callback) {
    refreshStoreCallback = callback;
}

/**
 * Vérifie si un item est débloqué
 * @param {string} label - Le label de l'item (ex: 'COFFEE', 'COUCH')
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
 * Retourne le score requis pour débloquer un item
 * @param {string} label - Le label de l'item
 * @returns {number} Le score requis, ou 0 si toujours disponible
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
 * Retourne le prochain palier à débloquer
 * @returns {{ score: number, items: string[] } | null}
 */
export function getNextUnlock() {
    const currentScore = getScore();
    for (const tier of UNLOCK_TIERS) {
        if (currentScore < tier.score) {
            return { score: tier.score, items: tier.items };
        }
    }
    return null; // Tout est débloqué
}

/**
 * Retourne la liste de tous les items débloqués
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
 * Vérifie si de nouveaux items ont été débloqués
 * Appelé via le callback onScoreChange
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

                    // Rafraîchir le store si le callback est défini
                    if (refreshStoreCallback) {
                        refreshStoreCallback();
                    }
                }
            }
        }
    }
}
