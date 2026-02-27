

import * as state from './state.js';
import { playPaper } from './sfx.js';


let onWelcomePanelClosed = null;

// Définit le callback appelé quand le panneau de bienvenue est fermé
export function setOnWelcomePanelClosed(callback) {
    onWelcomePanelClosed = callback;
}

// Crée le panneau de bienvenue (Manager Briefing)
export function createWelcomePanel() {
    const cam = document.getElementById('cam');
    const scene = document.querySelector('a-scene');
    if (!cam || !scene) return null;
    playPaper();
    const camPos = cam.object3D.position.clone();
    const camRot = cam.object3D.rotation;
    const distance = 1.5;
    const targetX = camPos.x - Math.sin(camRot.y) * distance;
    const targetY = camPos.y - 0.2;
    const targetZ = camPos.z - Math.cos(camRot.y) * distance;
    const startY = targetY + 2;
    const welcomePanel = document.createElement('a-entity');
    welcomePanel.setAttribute('position', `${targetX} ${startY} ${targetZ}`);
    const angleY = (camRot.y * 180 / Math.PI);
    welcomePanel.setAttribute('rotation', `0 ${angleY} 0`);
    const paper = document.createElement('a-plane');
    paper.setAttribute('width', '1.0');
    paper.setAttribute('height', '1.2');
    paper.setAttribute('color', '#f5ecd7');
    paper.setAttribute('material', 'shader: flat; side: double');
    paper.setAttribute('position', '0 0 0');
    welcomePanel.appendChild(paper);

    // Ombre portée
    const shadow = document.createElement('a-plane');
    shadow.setAttribute('width', '1.02');
    shadow.setAttribute('height', '1.22');
    shadow.setAttribute('color', '#5c3d1e');
    shadow.setAttribute('opacity', '0.25');
    shadow.setAttribute('position', '0.012 -0.012 -0.01');
    welcomePanel.appendChild(shadow);

    // === HEADER ===
    const logo = document.createElement('a-text');
    logo.setAttribute('value', 'HOLO BARISTA');
    logo.setAttribute('align', 'center');
    logo.setAttribute('position', '0 0.52 0.01');
    logo.setAttribute('width', '1.6');
    logo.setAttribute('color', '#8b4513');
    logo.setAttribute('font', 'mozillavr');
    welcomePanel.appendChild(logo);

    // Sous-titre
    const subtitle = document.createElement('a-text');
    subtitle.setAttribute('value', '~ FIRST DAY ~');
    subtitle.setAttribute('align', 'center');
    subtitle.setAttribute('position', '0 0.43 0.01');
    subtitle.setAttribute('width', '1.0');
    subtitle.setAttribute('color', '#a0522d');
    subtitle.setAttribute('font', 'mozillavr');
    welcomePanel.appendChild(subtitle);

    // Ligne décorative haute
    const lineTop = document.createElement('a-plane');
    lineTop.setAttribute('width', '0.7');
    lineTop.setAttribute('height', '0.003');
    lineTop.setAttribute('color', '#8b4513');
    lineTop.setAttribute('position', '0 0.38 0.01');
    welcomePanel.appendChild(lineTop);

    // === TEXTE NARRATIF — Synopsis immersif ===
    const storyText = document.createElement('a-text');
    storyText.setAttribute('value',
        'Welcome to Holo Coffee, rookie!\\n\\n' +
        'Today is your first day as our\\n' +
        'new barista. The shop is a mess\\n' +
        "after last night's party...\\n" +
        'Customers will be arriving soon!\\n\\n' +
        'Clean up the place, set up your\\n' +
        'machines, and get ready to serve\\n' +
        'the best coffee in town.\\n\\n' +
        "I'm counting on you!"
    );
    storyText.setAttribute('align', 'center');
    storyText.setAttribute('position', '0 0.06 0.01');
    storyText.setAttribute('width', '0.85');
    storyText.setAttribute('color', '#3d2914');
    storyText.setAttribute('line-height', '52');
    welcomePanel.appendChild(storyText);

    // Ligne décorative basse
    const lineBottom = document.createElement('a-plane');
    lineBottom.setAttribute('width', '0.4');
    lineBottom.setAttribute('height', '0.003');
    lineBottom.setAttribute('color', '#8b4513');
    lineBottom.setAttribute('position', '0 -0.30 0.01');
    welcomePanel.appendChild(lineBottom);

    // Signature du manager
    const signature = document.createElement('a-text');
    signature.setAttribute('value', '-- The Manager');
    signature.setAttribute('align', 'center');
    signature.setAttribute('position', '0.15 -0.35 0.01');
    signature.setAttribute('width', '0.7');
    signature.setAttribute('color', '#6b3a1f');
    signature.setAttribute('font', 'mozillavr');
    welcomePanel.appendChild(signature);

    // === BOUTON "BEGIN SHIFT" ===
    const closeBtn = document.createElement('a-box');
    closeBtn.setAttribute('width', '0.3');
    closeBtn.setAttribute('height', '0.07');
    closeBtn.setAttribute('depth', '0.02');
    closeBtn.setAttribute('color', '#6b3a1f');
    closeBtn.setAttribute('position', '0 -0.50 0.02');
    closeBtn.setAttribute('class', 'clickable');
    closeBtn.id = 'welcome-close-btn';

    const closeTxt = document.createElement('a-text');
    closeTxt.setAttribute('value', 'BEGIN SHIFT');
    closeTxt.setAttribute('align', 'center');
    closeTxt.setAttribute('position', '0 0.01 0.02');
    closeTxt.setAttribute('width', '1.1');
    closeTxt.setAttribute('color', '#f5ecd7');
    closeTxt.setAttribute('font', 'mozillavr');
    closeBtn.appendChild(closeTxt);

    // Hover effect
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.setAttribute('color', '#a0522d');
        closeBtn.setAttribute('scale', '1.1 1.1 1.1');
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.setAttribute('color', '#6b3a1f');
        closeBtn.setAttribute('scale', '1 1 1');
    });

    welcomePanel.appendChild(closeBtn);

    // Attacher à la scène (ancré dans le monde)
    scene.appendChild(welcomePanel);

    // Animation de descente avec léger rebond élastique
    welcomePanel.setAttribute('animation', {
        property: 'position',
        to: `${targetX} ${targetY} ${targetZ}`,
        dur: 1200,
        easing: 'easeOutElastic'
    });

    state.setWelcomePanel(welcomePanel);
    console.log('📜 Manager Briefing Panel created');

    return welcomePanel;
}

// Ferme le panneau de bienvenue avec animation fluide
export function closeWelcomePanel() {
    const panel = state.welcomePanel;
    if (panel && panel.parentNode) {
        const pos = panel.getAttribute('position');
        const exitY = (pos?.y || 1.4) - 1.5;
        panel.setAttribute('animation__exit', {
            property: 'position',
            to: `${pos?.x || 0} ${exitY} ${pos?.z || -1.5}`,
            dur: 800,
            easing: 'easeInCubic'
        });
        setTimeout(() => {
            if (panel.parentNode) panel.parentNode.removeChild(panel);
            state.setWelcomePanel(null);
            state.debug('🟢 Briefing fermé');
            if (onWelcomePanelClosed) setTimeout(onWelcomePanelClosed, 1000);
        }, 900);
    }
}

// Affiche une notification AR temporaire
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
    setTimeout(() => {
        let opacity = 1;
        const fadeInterval = setInterval(() => {
            opacity -= 0.05;
            if (opacity <= 0) {
                clearInterval(fadeInterval);
                if (notification.parentNode) notification.parentNode.removeChild(notification);
            } else {
                notification.setAttribute('opacity', opacity.toString());
            }
        }, 50);
    }, duration);
}
