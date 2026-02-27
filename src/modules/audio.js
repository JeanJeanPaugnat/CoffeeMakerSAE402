

import { coffeeAudio, setCoffeeAudio, bgMusic, setBgMusic } from './state.js';

// Initialise l'audio pour la machine à café
export function initCoffeeAudio() {
    const audio = new Audio('/sounds/coffee_sound.mp3');
    audio.volume = 0.7;
    setCoffeeAudio(audio);
    return audio;
}

// Joue le son du café
export function playCoffeeSound() {
    const audio = coffeeAudio;
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => {});
    }
}

// Initialise la musique de fond
export function initBgMusic() {
    const audio = new Audio('/sounds/bg_music.mp3');
    audio.volume = 0.4;
    audio.loop = true;
    setBgMusic(audio);
    return audio;
}

// Lance la musique de fond
export function playBgMusic() {
    if (bgMusic) {
        bgMusic.play().catch(() => {});
    }
}

// Arrête la musique de fond
export function stopBgMusic() {
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
}

// Change le volume de la musique de fond (0 à 1)
export function setBgMusicVolume(volume) {
    if (bgMusic) {
        bgMusic.volume = Math.max(0, Math.min(1, volume));
    }
}
