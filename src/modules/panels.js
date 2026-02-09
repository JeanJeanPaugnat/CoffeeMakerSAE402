/**
 * Panneaux UI (Welcome, Notifications)
 */

import * as state from './state.js';

// Callback pour éviter la dépendance circulaire avec customers.js
let onWelcomePanelClosed = null;

/**
 * Définit le callback appelé quand le panneau de bienvenue est fermé
 * @param {Function} callback
 */
export function setOnWelcomePanelClosed(callback) {
    onWelcomePanelClosed = callback;
}

/**
 * Crée le panneau de bienvenue avec les instructions
 * @returns {Element} L'entité du panneau
 */
export function createWelcomePanel() {
    const cam = document.getElementById('cam');
    if (!cam) return null;

    const welcomePanel = document.createElement('a-entity');
    welcomePanel.setAttribute('position', '0 0 -1.2');
    welcomePanel.setAttribute('rotation', '0 0 0');

    // Paper Background
    const paper = document.createElement('a-plane');
    paper.setAttribute('width', '1.02');
    paper.setAttribute('height', '1.24');
    paper.setAttribute('color', '#f5f0e1');
    paper.setAttribute('material', 'shader: flat; side: double');
    paper.setAttribute('position', '0 0 0');
    welcomePanel.appendChild(paper);

    // Paper Shadow
    const shadow = document.createElement('a-plane');
    shadow.setAttribute('width', '1.04');
    shadow.setAttribute('height', '1.26');
    shadow.setAttribute('color', '#8b7355');
    shadow.setAttribute('opacity', '0.3');
    shadow.setAttribute('position', '0.01 -0.01 -0.01');
    welcomePanel.appendChild(shadow);

    // Title
    const title = document.createElement('a-text');
    title.setAttribute('value', '~ HOLO BARISTA ~');
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 0.56 0.01');
    title.setAttribute('width', '1.5');
    title.setAttribute('color', '#2d1810');
    title.setAttribute('font', 'mozillavr');
    welcomePanel.appendChild(title);

    // Decorative Line
    const line = document.createElement('a-plane');
    line.setAttribute('width', '0.5');
    line.setAttribute('height', '0.003');
    line.setAttribute('color', '#8b4513');
    line.setAttribute('position', '0 0.16 0.01');
    welcomePanel.appendChild(line);

    // Intro Text
    const introText = document.createElement('a-text');
    introText.setAttribute('value',
        'Welcome to Holo Barista!\\n\\n' +
        'You are the barista of a virtual coffee shop.\\n' +
        'Your mission: serve delicious coffee!\\n\\n' +
        '~ HOW TO PLAY ~\\n\\n' +
        '1. Press Y to open the VR Store\\n' +
        '2. Place a Coffee Machine\\n' +
        '3. Point at it and press B to brew\\n' +
        '4. Grab the cup and serve!\\n' +
        '5. Use the Trash to clean up\\n\\n' +
        'Good luck, barista!'
    );
    introText.setAttribute('align', 'center');
    introText.setAttribute('position', '0 -0.02 0.01');
    introText.setAttribute('width', '1.1');
    introText.setAttribute('color', '#3d2914');
    introText.setAttribute('line-height', '55');
    welcomePanel.appendChild(introText);

    // Close Button
    const closeBtn = document.createElement('a-box');
    closeBtn.setAttribute('width', '0.2');
    closeBtn.setAttribute('height', '0.06');
    closeBtn.setAttribute('depth', '0.02');
    closeBtn.setAttribute('color', '#8b4513');
    closeBtn.setAttribute('position', '0 -0.55 0.02');
    closeBtn.setAttribute('class', 'clickable');
    closeBtn.id = 'welcome-close-btn';

    const closeTxt = document.createElement('a-text');
    closeTxt.setAttribute('value', 'START');
    closeTxt.setAttribute('align', 'center');
    closeTxt.setAttribute('position', '0 0.01 0.02');
    closeTxt.setAttribute('width', '1.2');
    closeTxt.setAttribute('color', '#f5f0e1');
    closeBtn.appendChild(closeTxt);

    // Hover effect
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.setAttribute('color', '#a0522d');
        closeBtn.setAttribute('scale', '1.1 1.1 1.1');
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.setAttribute('color', '#8b4513');
        closeBtn.setAttribute('scale', '1 1 1');
    });

    welcomePanel.appendChild(closeBtn);
    cam.appendChild(welcomePanel);
    
    state.setWelcomePanel(welcomePanel);
    console.log('📜 Welcome Panel Created');

    return welcomePanel;
}

/**
 * Ferme le panneau de bienvenue
 */
export function closeWelcomePanel() {
    const panel = state.welcomePanel;
    if (panel && panel.parentNode) {
        panel.parentNode.removeChild(panel);
        state.setWelcomePanel(null);
        state.debug('🟢 PANEL FERMÉ');
        
        // Appeler le callback (spawnCustomer) après un délai
        if (onWelcomePanelClosed) {
            setTimeout(onWelcomePanelClosed, 2000);
        }
    }
}

/**
 * Affiche une notification AR temporaire
 * @param {string} message - Le message à afficher
 * @param {number} duration - Durée en ms avant disparition
 */
export function showARNotification(message, duration = 2000) {
    const cam = document.getElementById('cam');
    if (!cam) return;

    const notification = document.createElement('a-text');
    notification.setAttribute('value', message);
    notification.setAttribute('align', 'center');
    notification.setAttribute('position', '0 0.3 -1');
    notification.setAttribute('width', '3');
    notification.setAttribute('color', '#00ff00');
    notification.setAttribute('opacity', '1');
    notification.setAttribute('background', '#000000');
    notification.setAttribute('padding', '0.1');

    cam.appendChild(notification);

    // Fade out animation
    setTimeout(() => {
        let opacity = 1;
        const fadeInterval = setInterval(() => {
            opacity -= 0.05;
            if (opacity <= 0) {
                clearInterval(fadeInterval);
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            } else {
                notification.setAttribute('opacity', opacity.toString());
            }
        }, 50);
    }, duration);
}
