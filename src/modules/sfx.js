/**
 * Système de sons UI (SFX)
 * Sons courts pour les événements de jeu : ding, order, paper, etc.
 * Utilise le même base path que audio.js
 */

const BASE_PATH = '/CoffeeMakerSAE402/sounds/';

// --- SONS PRÉ-CHARGÉS ---
const sfxCache = {};

/**
 * Charge un son et le met en cache
 * @param {string} name - Nom du son (sans extension)
 * @param {number} volume - Volume par défaut (0-1)
 * @returns {HTMLAudioElement}
 */
function loadSfx(name, volume = 0.5) {
    if (sfxCache[name]) return sfxCache[name];
    const audio = new Audio(`${BASE_PATH}${name}.mp3`);
    audio.volume = volume;
    audio.preload = 'auto';
    sfxCache[name] = audio;
    return audio;
}

/**
 * Joue un son par son nom
 * @param {string} name - Nom du son
 */
function playSfx(name) {
    const audio = sfxCache[name];
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log(`SFX ${name} error:`, e));
    }
}

/**
 * Initialise et pré-charge tous les sons UI
 * Appeler une fois au démarrage du jeu
 */
export function initSfx() {
    loadSfx('ding', 0.6);
    loadSfx('paper', 0.5);
    loadSfx('new_order', 0.5);
    loadSfx('order_complete', 0.7);
    loadSfx('order_fail', 0.5);
    console.log('SFX system initialized');
}

// --- FONCTIONS PUBLIQUES PAR ÉVÉNEMENT ---

/** Son de tâche complétée (tutoriel) */
export function playDing() { playSfx('ding'); }

/** Son de papier (briefing manager) */
export function playPaper() { playSfx('paper'); }

/** Son de nouvelle commande reçue */
export function playNewOrder() { playSfx('new_order'); }

/** Son de commande terminée */
export function playOrderComplete() { playSfx('order_complete'); }

/** Son de commande ratée / timeout */
export function playOrderFail() { playSfx('order_fail'); }
