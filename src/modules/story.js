

import { addScore } from './score.js';
import { showARNotification } from './panels.js';
import { vrLog } from './log-panel.js';
import { playDing } from './sfx.js';

let isStoryActive = false;
let storyPanel = null;
let storyPanelTexts = [];
let currentStepIndex = 0;
let stainsCleanedCount = 0;
const STAINS_REQUIRED = 5;
const VISIBLE_TASKS_COUNT = 4;
let onStoryCompletedCallback = null;
const STORY_STEPS = [
    {
        id: 'open_store',
        icon: '[Store]',
        label: 'Open the VR Store',
        description: 'Press Y to browse equipment',
        hint: 'Your tools await! Press Y.',
        completionMsg: 'Store unlocked! So many tools!',
        points: 5,
        completed: false
    },
    {
        id: 'place_broom',
        icon: '[Broom]',
        label: 'Place a Broom',
        description: 'Find BROOM in the store',
        hint: 'This place needs cleaning...',
        completionMsg: 'A broom! Time to tidy up!',
        points: 10,
        completed: false
    },
    {
        id: 'grab_object',
        icon: '[Grab]',
        label: 'Grab an object',
        description: 'Use the trigger to grab',
        hint: 'Try picking something up!',
        completionMsg: 'Nice grip! You are a natural!',
        points: 5,
        completed: false
    },
    {
        id: 'clean_stain',
        icon: '[Clean]',
        label: 'Clean all stains',
        description: 'Sweep the floor clean',
        hint: 'The floor is filthy... sweep it!',
        completionMsg: 'Sparkling clean! The floor shines!',
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
        description: 'The heart of every cafe',
        hint: 'No coffee shop without a machine!',
        completionMsg: 'The coffee machine is ready!',
        points: 10,
        completed: false
    },
    {
        id: 'brew_coffee',
        icon: '[Brew]',
        label: 'Brew a coffee',
        description: 'Aim at the machine, press B',
        hint: 'That machine looks ready to brew...',
        completionMsg: 'Mmm... smells like fresh coffee!',
        points: 10,
        completed: false
    },
    {
        id: 'place_donut_box',
        icon: '[Donut]',
        label: 'Place a Donut Box',
        description: 'Customers love sweet treats',
        hint: 'Coffee goes great with donuts!',
        completionMsg: 'Donuts! Customers will love these!',
        points: 10,
        completed: false
    },
    {
        id: 'make_donut',
        icon: '[Donut]',
        label: 'Make a donut',
        description: 'Aim at the box, press B',
        hint: 'Time to whip up some donuts!',
        completionMsg: 'Fresh donut ready to serve!',
        points: 10,
        completed: false
    },
    {
        id: 'place_trashcan',
        icon: '[Trash]',
        label: 'Place a Trashcan',
        description: 'Keep the shop tidy',
        hint: 'You will need somewhere for trash...',
        completionMsg: 'Trashcan placed! Staying organized!',
        points: 10,
        completed: false
    },
    {
        id: 'trash_object',
        icon: '[Trash]',
        label: 'Throw an object away',
        description: 'Bring an object to the trash',
        hint: 'Get rid of the mess!',
        completionMsg: 'Clean and tidy! Good job!',
        points: 10,
        completed: false
    },
    {
        id: 'place_speaker',
        icon: '[Music]',
        label: 'Place a Speaker',
        description: 'Set the mood with music',
        hint: 'Every cafe needs a good vibe!',
        completionMsg: 'The shop looks great! Ready for business!',
        points: 10,
        completed: false
    }
];

export function initStory() {
    if (isStoryActive) return;
    isStoryActive = true;
    currentStepIndex = 0;
    for (const step of STORY_STEPS) {
        step.completed = false;
        if (step.tracked) step.current = 0;
    }
    vrLog('Your shift has begun!');
    createStoryPanel();
    updateStoryPanel();
    setTimeout(() => {
        showARNotification('Check your task list!', 3000);
    }, 1000);
}

export function notifyStoryEvent(eventId) {
    if (!isStoryActive) return;
    const step = STORY_STEPS.find(s => s.id === eventId);
    if (!step || step.completed) return;
    if (step.tracked) {
        step.current++;
        vrLog(`${step.icon} ${step.current}/${step.required}`);
        if (step.current < step.required) {
            showARNotification(`${step.icon} ${step.current}/${step.required}`, 1500);
            updateStoryPanel();
            return;
        }
    }
    step.completed = true;
    addScore(step.points, `Story: ${step.label}`);
    playDing();
    vrLog(`Done: ${step.label}`);
    showARNotification(step.completionMsg || `${step.label} (+${step.points}pts)`, 3000);
    advanceToNextStep();
    updateStoryPanel();
    checkStoryCompletion();
}

function advanceToNextStep() {
    for (let i = 0; i < STORY_STEPS.length; i++) {
        if (!STORY_STEPS[i].completed) {
            currentStepIndex = i;
            return;
        }
    }
    currentStepIndex = STORY_STEPS.length;
}

function checkStoryCompletion() {
    const allDone = STORY_STEPS.every(s => s.completed);
    if (allDone && isStoryActive) {
        vrLog('Shift setup complete!');
        addScore(50, 'Shift setup complete!');
        isStoryActive = false;
        showARNotification('Amazing work, barista! Time to serve customers!', 5000);
    }
}

export function triggerStoryComplete() {
    vrLog('Opening for business...');
    hideStoryPanel();
    if (onStoryCompletedCallback) {
        try {
            onStoryCompletedCallback();
        } catch (e) {
            console.error('Story: callback error:', e);
        }
    }
}

export function setOnStoryCompleted(callback) {
    onStoryCompletedCallback = callback;
}

function getVisibleSteps() {
    const result = [];
    let visibleUncompleted = 0;

    for (let i = 0; i < STORY_STEPS.length; i++) {
        const step = STORY_STEPS[i];

        if (step.completed) {
            // Les tâches complétées sont toujours visibles
            result.push({ step, index: i, visible: true });
        } else if (visibleUncompleted < VISIBLE_TASKS_COUNT) {
            // Montrer les N prochaines tâches non complétées
            result.push({ step, index: i, visible: true });
            visibleUncompleted++;
        } else {
            // Les tâches suivantes sont cachées
            result.push({ step, index: i, visible: false });
        }
    }

    return result;
}

function createStoryPanel() {
    if (storyPanel) return;

    const sceneEl = document.querySelector('a-scene');
    if (!sceneEl) return;

    storyPanel = document.createElement('a-entity');
    storyPanel.id = 'story-panel';
    // Position fixe dans le monde
    storyPanel.setAttribute('position', '0 1.5 -1.2');

    // Fond principal — plus sombre et immersif
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.46');
    bg.setAttribute('height', '0.78');
    bg.setAttribute('color', '#0f0f1e');
    bg.setAttribute('material', 'shader: flat; opacity: 0.94');
    storyPanel.appendChild(bg);

    // Bordure — couleur chaude café
    const border = document.createElement('a-plane');
    border.setAttribute('width', '0.48');
    border.setAttribute('height', '0.80');
    border.setAttribute('color', '#d4a574');
    border.setAttribute('material', 'shader: flat');
    border.setAttribute('position', '0 0 -0.001');
    storyPanel.appendChild(border);

    // Titre — "SHIFT TASKS"
    const title = document.createElement('a-text');
    title.setAttribute('value', 'SHIFT TASKS');
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 0.34 0.01');
    title.setAttribute('scale', '0.09 0.09 0.09');
    title.setAttribute('color', '#d4a574');
    title.setAttribute('font', 'mozillavr');
    storyPanel.appendChild(title);

    // Ligne décorative sous le titre
    const line = document.createElement('a-plane');
    line.setAttribute('width', '0.32');
    line.setAttribute('height', '0.002');
    line.setAttribute('color', '#d4a574');
    line.setAttribute('position', '0 0.30 0.01');
    storyPanel.appendChild(line);

    // Sous-titre contextuel
    const subTitle = document.createElement('a-text');
    subTitle.setAttribute('value', 'Set up the shop before opening!');
    subTitle.setAttribute('align', 'center');
    subTitle.setAttribute('position', '0 0.26 0.01');
    subTitle.setAttribute('scale', '0.04 0.04 0.04');
    subTitle.setAttribute('color', '#8a8a9a');
    subTitle.id = 'story-subtitle';
    storyPanel.appendChild(subTitle);

    // Créer les lignes de texte pour chaque étape
    storyPanelTexts = [];
    const startY = 0.20;
    const lineHeight = 0.045;

    // Créer les slots (max = toutes les tâches + 1 pour le "...")
    for (let i = 0; i < STORY_STEPS.length + 1; i++) {
        const textEl = document.createElement('a-text');
        textEl.setAttribute('align', 'left');
        textEl.setAttribute('position', `-0.20 ${startY - i * lineHeight} 0.01`);
        textEl.setAttribute('scale', '0.055 0.055 0.055');
        textEl.setAttribute('color', '#636e72');
        textEl.setAttribute('wrap-count', '42');
        textEl.setAttribute('visible', 'false');
        storyPanel.appendChild(textEl);
        storyPanelTexts.push(textEl);
    }

    // --- TEXTE D'ASTUCE POUR LE RAFRAÎCHISSEMENT ---
    const refreshHint = document.createElement('a-text');
    refreshHint.setAttribute('value', '* Open VR Store (Y) to refresh checks *');
    refreshHint.setAttribute('align', 'center');
    refreshHint.setAttribute('position', '0 -0.27 0.01'); // Placé juste au-dessus de la barre de progression
    refreshHint.setAttribute('scale', '0.035 0.035 0.035');
    refreshHint.setAttribute('color', '#ff7675'); // Un rouge/saumon doux pour attirer l'œil sans agresser
    refreshHint.setAttribute('font', 'mozillavr');
    refreshHint.id = 'story-refresh-hint';
    storyPanel.appendChild(refreshHint);

    // Barre de progression en bas
    const progressBg = document.createElement('a-plane');
    progressBg.setAttribute('width', '0.38');
    progressBg.setAttribute('height', '0.025');
    progressBg.setAttribute('color', '#1a1a2e');
    progressBg.setAttribute('position', '0 -0.33 0.01');
    progressBg.id = 'story-progress-bg';
    storyPanel.appendChild(progressBg);

    const progressBar = document.createElement('a-plane');
    progressBar.setAttribute('width', '0.001');
    progressBar.setAttribute('height', '0.02');
    progressBar.setAttribute('color', '#00b894');
    progressBar.setAttribute('position', '-0.19 -0.33 0.015');
    progressBar.id = 'story-progress-bar';
    storyPanel.appendChild(progressBar);

    // Texte de progression
    const progressText = document.createElement('a-text');
    progressText.setAttribute('value', `0/${STORY_STEPS.length}`);
    progressText.setAttribute('align', 'center');
    progressText.setAttribute('position', '0 -0.36 0.01');
    progressText.setAttribute('scale', '0.05 0.05 0.05');
    progressText.setAttribute('color', '#636e72');
    progressText.id = 'story-progress-text';
    storyPanel.appendChild(progressText);

    // Bouton OPEN SHOP (grisé et caché au départ)
    const startBtn = document.createElement('a-box');
    startBtn.setAttribute('width', '0.3');
    startBtn.setAttribute('height', '0.06');
    startBtn.setAttribute('depth', '0.02');
    startBtn.setAttribute('color', '#2d3436');
    startBtn.setAttribute('position', '0 -0.33 0.02');
    startBtn.setAttribute('visible', 'false');
    startBtn.id = 'story-start-orders-btn';

    const startBtnText = document.createElement('a-text');
    startBtnText.setAttribute('value', 'OPEN SHOP');
    startBtnText.setAttribute('align', 'center');
    startBtnText.setAttribute('position', '0 0.01 0.02');
    startBtnText.setAttribute('scale', '0.08 0.08 0.08');
    startBtnText.setAttribute('color', '#636e72');
    startBtnText.setAttribute('font', 'mozillavr');
    startBtnText.id = 'story-start-orders-text';
    startBtn.appendChild(startBtnText);

    storyPanel.appendChild(startBtn);

// Animation d'entrée — slide depuis la droite (ON LA NOMME animation__enter)
    storyPanel.setAttribute('animation__enter', {
        property: 'position',
        from: '1.5 1.5 -1.2',
        to: '0 1.5 -1.2',
        dur: 1000,
        easing: 'easeOutCubic',
        delay: 500
    });

    sceneEl.appendChild(storyPanel);
    console.log('Shift Tasks panel created');
}


export function updateStoryPanel() {
    if (!storyPanel || storyPanelTexts.length === 0) return;

    const completedCount = STORY_STEPS.filter(s => s.completed).length;
    const visibleSteps = getVisibleSteps();
    const hiddenCount = visibleSteps.filter(v => !v.visible).length;

    let textIndex = 0;

    // 1. Mise à jour des lignes avec la syntaxe objet (Force le rafraîchissement 3D)
    for (const { step, index, visible } of visibleSteps) {
        if (!visible) continue;

        const textEl = storyPanelTexts[textIndex];
        if (!textEl) break;

        let prefix, color;

        if (step.completed) {
            prefix = '[X]';
            color = '#00b894'; // Vert
        } else if (index === currentStepIndex) {
            prefix = '>';
            color = '#fdcb6e'; // Jaune
        } else {
            prefix = '[ ]';
            color = '#636e72'; // Gris
        }

        let label = step.label;
        if (step.tracked && !step.completed) {
            label = `${step.label} (${step.current}/${step.required})`;
        }

        const fullText = `${prefix} ${step.icon} ${label}`;

        // LA CORRECTION EST ICI : On passe un objet complet au composant 'text'
        textEl.setAttribute('visible', true);
        textEl.setAttribute('text', {
            value: fullText,
            color: color,
            align: 'left',
            wrapCount: 42
        });

        // Animation pulse sur la tâche courante
        if (index === currentStepIndex && !step.completed) {
            // CORRECTION ICI : Ne l'appliquer que si elle n'y est pas déjà !
            if (!textEl.hasAttribute('animation__pulse')) {
                textEl.setAttribute('animation__pulse', {
                    property: 'scale',
                    from: '0.055 0.055 0.055',
                    to: '0.062 0.062 0.062',
                    dur: 800,
                    dir: 'alternate',
                    loop: true,
                    easing: 'easeInOutSine'
                });
            }
        } else {
            textEl.removeAttribute('animation__pulse');
            textEl.setAttribute('scale', '0.055 0.055 0.055');
        }

        textIndex++;
    }

    // 2. Afficher la ligne "... X more tasks"
    if (hiddenCount > 0 && textIndex < storyPanelTexts.length) {
        const moreEl = storyPanelTexts[textIndex];
        if (moreEl) {
            moreEl.setAttribute('visible', true);
            moreEl.setAttribute('text', {
                value: `    ... ${hiddenCount} more task${hiddenCount > 1 ? 's' : ''}`,
                color: '#4a4a5a',
                align: 'left',
                wrapCount: 42
            });
            moreEl.removeAttribute('animation__pulse');
            moreEl.setAttribute('scale', '0.055 0.055 0.055');
            textIndex++;
        }
    }

    // 3. Cacher proprement les lignes restantes
    for (let i = textIndex; i < storyPanelTexts.length; i++) {
        storyPanelTexts[i].setAttribute('visible', false);
    }

    // --- MISE À JOUR DU SOUS-TITRE (Même logique de forçage) ---
    const subtitleEl = storyPanel.querySelector('#story-subtitle');
    if (subtitleEl) {
        const currentStep = STORY_STEPS[currentStepIndex];
        if (currentStep && !currentStep.completed) {
            subtitleEl.setAttribute('text', 'value', currentStep.hint || currentStep.description);
        } else if (completedCount === STORY_STEPS.length) {
            subtitleEl.setAttribute('text', 'value', 'All tasks done! You are ready!');
        }
    }

    // --- MISE À JOUR DE LA PROGRESSION ---
    const progressBar = storyPanel.querySelector('#story-progress-bar');
    const progressText = storyPanel.querySelector('#story-progress-text');

    if (progressBar) {
        const maxWidth = 0.38;
        const progress = completedCount / STORY_STEPS.length;
        const barWidth = Math.max(0.001, maxWidth * progress);
        progressBar.setAttribute('width', barWidth);
        progressBar.setAttribute('position', `${-0.19 + barWidth / 2} -0.33 0.015`);

        if (progress < 0.33) {
            progressBar.setAttribute('color', '#e17055');
        } else if (progress < 0.66) {
            progressBar.setAttribute('color', '#fdcb6e');
        } else {
            progressBar.setAttribute('color', '#00b894');
        }
    }

    if (progressText) {
        // Forçage du texte de progression
        progressText.setAttribute('text', 'value', `${completedCount}/${STORY_STEPS.length}`);
    }

    // --- BOUTON DE FIN (OPEN SHOP) ---
    const allDone = completedCount === STORY_STEPS.length;
    const startBtn = storyPanel.querySelector('#story-start-orders-btn');
    const startBtnText = storyPanel.querySelector('#story-start-orders-text');
    const progressBg = storyPanel.querySelector('#story-progress-bg');

    if (startBtn && allDone) {
// --- BOUTON DE FIN (OPEN SHOP) ---
    const allDone = completedCount === STORY_STEPS.length;
    const startBtn = storyPanel.querySelector('#story-start-orders-btn');
    const startBtnText = storyPanel.querySelector('#story-start-orders-text');
    const progressBg = storyPanel.querySelector('#story-progress-bg');
    
    // NOUVEAU : Récupérer le texte d'astuce
    const refreshHint = storyPanel.querySelector('#story-refresh-hint');

    if (allDone) {
        // ... (Ton code existant pour le bouton StartBtn) ...
        if (startBtn) {
            startBtn.setAttribute('visible', true);
            startBtn.setAttribute('color', '#00b894');
            startBtn.setAttribute('class', 'clickable');
            if (startBtnText) startBtnText.setAttribute('text', 'color', '#ffffff');

            startBtn.setAttribute('animation__pulse', {
                property: 'scale',
                from: '1 1 1',
                to: '1.08 1.08 1.08',
                dur: 600,
                dir: 'alternate',
                loop: true,
                easing: 'easeInOutSine'
            });
        }

        if (progressBg) progressBg.setAttribute('visible', false);
        if (progressBar) progressBar.setAttribute('visible', false);
        if (progressText) progressText.setAttribute('visible', false);
        
        // Cacher l'astuce de rafraîchissement puisque tout est validé
        if (refreshHint) refreshHint.setAttribute('visible', false);
        
    } else {
        // Si tout n'est pas fini, s'assurer que l'astuce est visible
        if (refreshHint) refreshHint.setAttribute('visible', true);
    }
    }
}


function hideStoryPanel() {
    if (!storyPanel) return;

    // 1. On supprime l'animation d'entrée pour éviter tout conflit
    storyPanel.removeAttribute('animation__enter');

    // 2. On lance l'animation de sortie (ON LA NOMME animation__leave)
    storyPanel.setAttribute('animation__leave', {
        property: 'position',
        to: '-1.5 1.5 -1.2',
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

export function isStoryModeActive() {
    return isStoryActive;
}

export function getStoryProgress() {
    return {
        completed: STORY_STEPS.filter(s => s.completed).length,
        total: STORY_STEPS.length,
        steps: STORY_STEPS.map(s => ({ id: s.id, label: s.label, completed: s.completed }))
    };
}

export function destroyStoryPanel() {
    if (storyPanel && storyPanel.parentNode) {
        storyPanel.parentNode.removeChild(storyPanel);
    }
    storyPanel = null;
    storyPanelTexts = [];
}
