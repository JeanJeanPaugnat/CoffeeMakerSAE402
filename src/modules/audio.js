/**
 * Système audio du jeu
 */

import { coffeeAudio, setCoffeeAudio, bgMusic, setBgMusic } from './state.js';

/**
 * Initialise l'audio pour la machine à café
 */
export function initCoffeeAudio() {
    const audio = new Audio('/CoffeeMakerSAE402/sounds/coffee_sound.mp3');
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

/**
 * Initialise la musique de fond
 */
export function initBgMusic() {
    const audio = new Audio('/CoffeeMakerSAE402/sounds/bg_music.mp3');
    audio.volume = 0.4;
    audio.loop = true;
    setBgMusic(audio);
    return audio;
}

/**
 * Lance la musique de fond
 */
export function playBgMusic() {
    if (bgMusic) {
        bgMusic.play().catch(e => console.log('BG Music error:', e));
        console.log('🎵 Musique de fond lancée');
    }
}

/**
 * Arrête la musique de fond
 */
export function stopBgMusic() {
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
        console.log('🎵 Musique de fond arrêtée');
    }
}

/**
 * Change le volume de la musique de fond
 * @param {number} volume - Volume entre 0 et 1
 */
export function setBgMusicVolume(volume) {
    if (bgMusic) {
        bgMusic.volume = Math.max(0, Math.min(1, volume));
    }
}
