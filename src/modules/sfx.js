
const BASE_PATH = '/sounds/';
const sfxCache = {};

function loadSfx(name, volume = 0.5) {
    if (sfxCache[name]) return sfxCache[name];
    const audio = new Audio(`${BASE_PATH}${name}.mp3`);
    audio.volume = volume;
    audio.preload = 'auto';
    sfxCache[name] = audio;
    return audio;
}

function playSfx(name) {
    const audio = sfxCache[name];
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log(`SFX ${name} error:`, e));
    }
}

export function initSfx() {
    loadSfx('ding', 0.6);
    loadSfx('paper', 0.5);
    loadSfx('new_order', 0.5);
    loadSfx('order_complete', 0.7);
    loadSfx('order_fail', 0.5);
}

export function playDing() { playSfx('ding'); }
export function playPaper() { playSfx('paper'); }
export function playNewOrder() { playSfx('new_order'); }
export function playOrderComplete() { playSfx('order_complete'); }
export function playOrderFail() { playSfx('order_fail'); }
