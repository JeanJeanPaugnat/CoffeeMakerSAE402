/**
 * Système audio du jeu
 */

import { coffeeAudio, setCoffeeAudio } from './state.js';

/**
 * Initialise l'audio pour la machine à café
 */
export function initCoffeeAudio() {
    const audio = new Audio('/sounds/public_assets_café.MP3');
    audio.volume = 0.7;
    setCoffeeAudio(audio);
    return audio;
}

/**
 * Joue le son du café
 */
export function playCoffeeSound() {
    const audio = coffeeAudio;
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio error:', e));
    }
}
