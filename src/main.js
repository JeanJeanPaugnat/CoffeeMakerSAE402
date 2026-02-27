

import 'aframe';
import 'aframe-extras';
import 'aframe-physics-system';

// Import des modules
import * as state from './modules/state.js';
import { initCoffeeAudio, initBgMusic, playBgMusic } from './modules/audio.js';
import { createHUDInventory } from './modules/inventory.js';
import { createWelcomePanel, setOnWelcomePanelClosed } from './modules/panels.js';
import { createWristTablet } from './modules/wrist-tablet.js';
import { initScorePanel } from './modules/score.js';
import { initLogsPanel } from './modules/log-panel.js';
import { initStains, startCleaningLoop } from './modules/cleaning.js';
import { startARSession } from './modules/xr.js';
import { initStory, setOnStoryCompleted } from './modules/story.js';
import { initUnlocks } from './modules/unlocks.js';
import { initSfx } from './modules/sfx.js';
import { getUsername, setUsername, hasUsername } from './modules/profile.js';
import { renderLeaderboard, submitScoreSync } from './modules/leaderboard.js';


console.log('☕ SAE 402 - Chargement...');

window.addEventListener('load', () => {
    setTimeout(() => {
        const debugEl = document.getElementById('debug');
        const startBtn = document.getElementById('start-btn');
        const landingPage = document.getElementById('landing-page');
        const gameContainer = document.getElementById('game-container');
        const sceneEl = document.getElementById('scene');
        const usernameInput = document.getElementById('username-input');
        if (hasUsername() && usernameInput) {
            usernameInput.value = getUsername();
            startBtn.disabled = false;
        }
        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                const val = usernameInput.value.trim();
                startBtn.disabled = val.length === 0;
            });
        }
        renderLeaderboard('leaderboard-container');
        window.addEventListener('beforeunload', () => { submitScoreSync(); });
        let cursorEl = document.getElementById('cursor');
        if (sceneEl) sceneEl.style.display = 'none';
        if (!sceneEl) {
            if (debugEl) debugEl.textContent = 'Éléments manquants!';
            return;
        }
        if (!cursorEl && sceneEl) {
            cursorEl = document.createElement('a-ring');
            cursorEl.id = 'cursor';
            cursorEl.setAttribute('color', 'green');
            cursorEl.setAttribute('radius-inner', '0.05');
            cursorEl.setAttribute('radius-outer', '0.08');
            cursorEl.setAttribute('rotation', '-90 0 0');
            cursorEl.setAttribute('visible', 'false');
            cursorEl.setAttribute('material', 'shader: flat; opacity: 0.8; transparent: true');
            sceneEl.appendChild(cursorEl);
        }
        state.setSceneElements(sceneEl, null, cursorEl, debugEl);
        if (debugEl) debugEl.textContent = 'Prêt!';
        initCoffeeAudio();
        initBgMusic();
        initSfx();
        setOnWelcomePanelClosed(() => { initStory(); });
        setOnStoryCompleted(() => { createWristTablet(); });
        startBtn.onclick = async () => {
            if (usernameInput && usernameInput.value.trim()) setUsername(usernameInput.value.trim());
            if (landingPage) landingPage.style.display = 'none';
            if (gameContainer) {
                gameContainer.classList.remove('hidden');
                gameContainer.classList.add('visible');
            }
            setTimeout(async () => {
                if (gameContainer) {
                    gameContainer.classList.remove('visible');
                    gameContainer.classList.add('hidden');
                }
                if (sceneEl) sceneEl.style.display = 'block';
                const session = await startARSession();
                if (session) {
                    playBgMusic();
                    initUnlocks();
                    initScorePanel();
                    initLogsPanel();
                    createWelcomePanel();
                    createHUDInventory();
                    initStains();
                    startCleaningLoop();
                }
            }, 2500);
        };
    }, 100);
});