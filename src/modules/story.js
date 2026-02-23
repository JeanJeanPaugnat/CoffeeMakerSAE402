/**
 * Mode Histoire / Tutoriel guidé
 * Guide le joueur à travers les mécaniques du jeu avec une checklist interactive
 * Chaque étape complétée rapporte des points bonus
 */

import { addScore } from './score.js';
import { showARNotification } from './panels.js';
import { vrLog } from './log-panel.js';

// --- ÉTAT ---
let isStoryActive = false;
let storyPanel = null;
let storyPanelTexts = [];
let currentStepIndex = 0;
let stainsCleanedCount = 0;
const STAINS_REQUIRED = 5;

// --- ÉTAPES DU TUTORIEL (dans l'ordre voulu) ---
const STORY_STEPS = [
    {
        id: 'open_store',
        icon: '[Store]',
        label: 'Open the VR Store',
        description: 'Press Y to open the store',
        points: 5,
        completed: false
    },
    {
        id: 'place_broom',
        icon: '[Broom]',
        label: 'Place a Broom',
        description: 'Select BROOM in the store',
        points: 10,
        completed: false
    },
    {
        id: 'grab_object',
        icon: '[Grab]',
        label: 'Grab an object',
        description: 'Grab with the trigger',
        points: 5,
        completed: false
    },
    {
        id: 'clean_stain',
        icon: '[Clean]',
        label: 'Clean all stains',
        description: 'Use the broom to clean stains',
        points: 15,
        completed: false,
        tracked: true,
        current: 0,
        required: 5
    },
    {
        id: 'place_coffee_machine',
        icon: '[Coffee]',
        label: 'Place a Coffee Machine',
        description: 'Select COFFEE in the store',
        points: 10,
        completed: false
    },
    {
        id: 'brew_coffee',
        icon: '[Coffee]',
        label: 'Brew a coffee',
        description: 'Aim at the machine and press B',
        points: 10,
        completed: false
    },
    {
        id: 'place_donut_box',
        icon: '[Donut]',
        label: 'Place a Donut Box',
        description: 'Select DONUT in the store',
        points: 10,
        completed: false
    },
    {
        id: 'make_donut',
        icon: '[Donut]',
        label: 'Make a donut',
        description: 'Aim at the box and press B',
        points: 10,
        completed: false
    },
    {
        id: 'place_trashcan',
        icon: '[Trash]',
        label: 'Place a Trashcan',
        description: 'Select TRASHCAN in the store',
        points: 10,
        completed: false
    },
    {
        id: 'trash_object',
        icon: '[Trash]',
        label: 'Throw an object away',
        description: 'Bring an object to the trashcan',
        points: 10,
        completed: false
    },
    {
        id: 'place_speaker',
        icon: '[Speaker]',
        label: 'Place a Speaker',
        description: 'Select SPEAKER in the store',
        points: 10,
        completed: false
    }
];

/**
 * Initialise le mode histoire et crée le panneau checklist
 */
export function initStory() {
    if (isStoryActive) return;
    isStoryActive = true;
    currentStepIndex = 0;

    // Réinitialiser toutes les étapes du tutoriel
    for (const step of STORY_STEPS) {
        step.completed = false;
        if (step.tracked) step.current = 0;
    }

    console.log('📖 Story mode initialized');
    vrLog('📖 Mode Histoire activé!');

    createStoryPanel();
    updateStoryPanel();

    // Notification d'introduction
    setTimeout(() => {
        showARNotification('📖 Mode Histoire: suis le guide!', 3000);
    }, 1000);
}

/**
 * Notifie le système story qu'un événement s'est produit
 * Appelé depuis les autres modules
 * Les étapes peuvent être complétées dans n'importe quel ordre
 * @param {string} eventId - L'identifiant de l'événement
 */
export function notifyStoryEvent(eventId) {
    if (!isStoryActive) return;

    const step = STORY_STEPS.find(s => s.id === eventId);
    if (!step || step.completed) return;

    // Si l'étape est tracked (compteur), incrémenter
    if (step.tracked) {
        step.current++;
        console.log(`📖 ${step.icon} ${step.current}/${step.required}`);
        vrLog(`${step.icon} ${step.current}/${step.required}`);

        // Pas encore terminé → juste mettre à jour l'affichage
        if (step.current < step.required) {
            showARNotification(`${step.icon} ${step.current}/${step.required}`, 1500);
            updateStoryPanel();
            return;
        }
        // Sinon, on continue pour marquer comme complété
    }

    // Marquer comme complété (n'importe quel ordre)
    step.completed = true;

    // Bonus points
    addScore(step.points, `Story: ${step.label}`);

    console.log(`📖 ✅ Step completed: ${step.label} (+${step.points}pts)`);
    vrLog(`📖 ✅ ${step.label}`);

    // Notification de félicitation
    showARNotification(`[OK] ${step.icon} ${step.label} (+${step.points}pts)`, 3000);

    // Avancer l'indicateur vers la prochaine étape non complétée
    advanceToNextStep();

    // Mettre à jour le panneau
    updateStoryPanel();

    // Vérifier si toutes les étapes sont complétées
    checkStoryCompletion();
}

/**
 * Avance l'indicateur vers la prochaine étape non complétée
 */
function advanceToNextStep() {
    for (let i = 0; i < STORY_STEPS.length; i++) {
        if (!STORY_STEPS[i].completed) {
            currentStepIndex = i;
            return;
        }
    }
    currentStepIndex = STORY_STEPS.length; // Toutes complétées
}

/**
 * Vérifie si toutes les étapes sont terminées
 */
function checkStoryCompletion() {
    const allDone = STORY_STEPS.every(s => s.completed);
    if (allDone) {
        console.log('📖 🎉 STORY MODE COMPLETE!');
        vrLog('📖 🎉 Tutoriel terminé!');

        // Bonus de complétion
        addScore(50, 'Tutoriel terminé!');

        setTimeout(() => {
            showARNotification('🎉 Bravo! Tutoriel terminé! +50pts\nÀ toi de jouer maintenant!', 5000);
        }, 500);

        // Le panneau disparaît automatiquement
        setTimeout(() => {
            hideStoryPanel();
            isStoryActive = false;
        }, 6000);
    }
}

/**
 * Crée le panneau checklist en VR
 * Positionné à gauche du champ de vision
 */
function createStoryPanel() {
    if (storyPanel) return;

    // Placer le panneau dans la scène (pas enfant de la caméra)
    const sceneEl = document.querySelector('a-scene');
    if (!sceneEl) return;

    storyPanel = document.createElement('a-entity');
    storyPanel.id = 'story-panel';
    // Position fixe dans le monde (ex: devant le joueur, hauteur yeux)
    storyPanel.setAttribute('position', '0 1.5 -1.2');

    // Fond principal
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.42');
    bg.setAttribute('height', '0.72');
    bg.setAttribute('color', '#1a1a2e');
    bg.setAttribute('material', 'shader: flat; opacity: 0.92');
    storyPanel.appendChild(bg);

    // Bordure
    const border = document.createElement('a-plane');
    border.setAttribute('width', '0.44');
    border.setAttribute('height', '0.74');
    border.setAttribute('color', '#e17055');
    border.setAttribute('material', 'shader: flat');
    border.setAttribute('position', '0 0 -0.001');
    storyPanel.appendChild(border);

    // Titre
    const title = document.createElement('a-text');
    title.setAttribute('value', '📖 GUIDE');
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 0.32 0.01');
    title.setAttribute('scale', '0.09 0.09 0.09');
    title.setAttribute('color', '#e17055');
    title.setAttribute('font', 'mozillavr');
    storyPanel.appendChild(title);

    // Ligne décorative sous le titre
    const line = document.createElement('a-plane');
    line.setAttribute('width', '0.3');
    line.setAttribute('height', '0.002');
    line.setAttribute('color', '#e17055');
    line.setAttribute('position', '0 0.28 0.01');
    storyPanel.appendChild(line);

    // Créer les lignes de texte pour chaque étape
    storyPanelTexts = [];
    const startY = 0.22;
    const lineHeight = 0.042;

    STORY_STEPS.forEach((step, index) => {
        const textEl = document.createElement('a-text');
        textEl.setAttribute('align', 'left');
        textEl.setAttribute('position', `-0.18 ${startY - index * lineHeight} 0.01`);
        textEl.setAttribute('scale', '0.055 0.055 0.055');
        textEl.setAttribute('color', '#b2bec3');
        textEl.setAttribute('wrap-count', '40');
        storyPanel.appendChild(textEl);
        storyPanelTexts.push(textEl);
    });

    // Barre de progression en bas
    const progressBg = document.createElement('a-plane');
    progressBg.setAttribute('width', '0.36');
    progressBg.setAttribute('height', '0.025');
    progressBg.setAttribute('color', '#2d3436');
    progressBg.setAttribute('position', '0 -0.32 0.01');
    progressBg.id = 'story-progress-bg';
    storyPanel.appendChild(progressBg);

    const progressBar = document.createElement('a-plane');
    progressBar.setAttribute('width', '0.001');
    progressBar.setAttribute('height', '0.02');
    progressBar.setAttribute('color', '#00b894');
    progressBar.setAttribute('position', '-0.18 -0.32 0.015');
    progressBar.id = 'story-progress-bar';
    storyPanel.appendChild(progressBar);

    // Texte de progression
    const progressText = document.createElement('a-text');
    progressText.setAttribute('value', `0/${STORY_STEPS.length}`);
    progressText.setAttribute('align', 'center');
    progressText.setAttribute('position', '0 -0.35 0.01');
    progressText.setAttribute('scale', '0.05 0.05 0.05');
    progressText.setAttribute('color', '#636e72');
    progressText.id = 'story-progress-text';
    storyPanel.appendChild(progressText);

    sceneEl.appendChild(storyPanel);
    console.log('📖 Story panel created (fixed in world)');
}

/**
 * Met à jour l'affichage du panneau checklist
 */
export function updateStoryPanel() {
    if (!storyPanel || storyPanelTexts.length === 0) return;

    const completedCount = STORY_STEPS.filter(s => s.completed).length;

    STORY_STEPS.forEach((step, index) => {
        const textEl = storyPanelTexts[index];
        if (!textEl) return;

        let prefix, color;

        if (step.completed) {
            prefix = '[X]';
            color = '#00b894'; // Green
        } else if (index === currentStepIndex) {
            prefix = '>';
            color = '#fdcb6e'; // Yellow
        } else {
            prefix = '[ ]';
            color = '#636e72'; // Gray
        }

        // Show counter for tracked steps
        let label = step.label;
        if (step.tracked && !step.completed) {
            label = `${step.label} (${step.current}/${step.required})`;
        }

        const fullText = `${prefix} ${step.icon} ${label}`;
        // Force color update for A-Frame text
        textEl.setAttribute('text', `value: ${fullText}; color: ${color}; align: left; wrapCount: 40`);
    });

    // Mettre à jour la barre de progression
    const progressBar = storyPanel.querySelector('#story-progress-bar');
    const progressText = storyPanel.querySelector('#story-progress-text');

    if (progressBar) {
        const maxWidth = 0.36;
        const progress = completedCount / STORY_STEPS.length;
        const barWidth = Math.max(0.001, maxWidth * progress);
        progressBar.setAttribute('width', barWidth);
        // Recalculer la position pour que la barre parte de la gauche
        progressBar.setAttribute('position', `${-0.18 + barWidth / 2} -0.32 0.015`);
    }

    if (progressText) {
        progressText.setAttribute('value', `${completedCount}/${STORY_STEPS.length}`);
    }
}

/**
 * Cache le panneau story avec animation
 */
function hideStoryPanel() {
    if (!storyPanel) return;

    storyPanel.setAttribute('animation', {
        property: 'position',
        to: '-1.5 0.05 -0.8',
        dur: 800,
        easing: 'easeInCubic'
    });

    setTimeout(() => {
        if (storyPanel && storyPanel.parentNode) {
            storyPanel.parentNode.removeChild(storyPanel);
            storyPanel = null;
            storyPanelTexts = [];
        }
    }, 1000);
}

/**
 * Vérifie si le mode histoire est actif
 * @returns {boolean}
 */
export function isStoryModeActive() {
    return isStoryActive;
}

/**
 * Retourne la progression du mode histoire
 * @returns {{ completed: number, total: number, steps: Array }}
 */
export function getStoryProgress() {
    return {
        completed: STORY_STEPS.filter(s => s.completed).length,
        total: STORY_STEPS.length,
        steps: STORY_STEPS.map(s => ({ id: s.id, label: s.label, completed: s.completed }))
    };
}

/**
 * Détruit le panneau story
 */
export function destroyStoryPanel() {
    if (storyPanel && storyPanel.parentNode) {
        storyPanel.parentNode.removeChild(storyPanel);
    }
    storyPanel = null;
    storyPanelTexts = [];
}
