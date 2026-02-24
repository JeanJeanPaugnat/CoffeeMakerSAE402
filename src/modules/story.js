/**
 * Mode Histoire / Tutoriel guidé — "SHIFT TASKS"
 * Guide le joueur de manière immersive à travers les mécaniques du jeu
 * Révélation progressive des tâches + messages narratifs
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

// Nombre de tâches visibles à la fois (révélation progressive)
const VISIBLE_TASKS_COUNT = 4;

// --- CALLBACK quand le story est terminé ---
let onStoryCompletedCallback = null;

// --- ÉTAPES DU TUTORIEL (dans l'ordre voulu) ---
const STORY_STEPS = [
    {
        id: 'open_store',
        icon: '🛒',
        label: 'Open the VR Store',
        description: 'Press Y to browse equipment',
        hint: 'Your tools await! Press Y.',
        completionMsg: 'Store unlocked! So many tools! 🛠️',
        points: 5,
        completed: false
    },
    {
        id: 'place_broom',
        icon: '🧹',
        label: 'Place a Broom',
        description: 'Find BROOM in the store',
        hint: 'This place needs cleaning...',
        completionMsg: 'A broom! Time to tidy up! 🧹',
        points: 10,
        completed: false
    },
    {
        id: 'grab_object',
        icon: '✊',
        label: 'Grab an object',
        description: 'Use the trigger to grab',
        hint: 'Try picking something up!',
        completionMsg: 'Nice grip! You\'re a natural! 💪',
        points: 5,
        completed: false
    },
    {
        id: 'clean_stain',
        icon: '✨',
        label: 'Clean all stains',
        description: 'Sweep the floor clean',
        hint: 'The floor is filthy... sweep it!',
        completionMsg: 'Sparkling clean! The floor shines! ✨',
        points: 15,
        completed: false,
        tracked: true,
        current: 0,
        required: 5
    },
    {
        id: 'place_coffee_machine',
        icon: '☕',
        label: 'Place a Coffee Machine',
        description: 'The heart of every cafe',
        hint: 'No coffee shop without a machine!',
        completionMsg: 'The coffee machine is ready! ☕',
        points: 10,
        completed: false
    },
    {
        id: 'brew_coffee',
        icon: '☕',
        label: 'Brew a coffee',
        description: 'Aim at the machine, press B',
        hint: 'That machine looks ready to brew...',
        completionMsg: 'Mmm... smells like fresh coffee! ☕',
        points: 10,
        completed: false
    },
    {
        id: 'place_donut_box',
        icon: '🍩',
        label: 'Place a Donut Box',
        description: 'Customers love sweet treats',
        hint: 'Coffee goes great with donuts!',
        completionMsg: 'Donuts! Customers will love these! 🍩',
        points: 10,
        completed: false
    },
    {
        id: 'make_donut',
        icon: '🍩',
        label: 'Make a donut',
        description: 'Aim at the box, press B',
        hint: 'Time to whip up some donuts!',
        completionMsg: 'Fresh donut ready to serve! 🍩',
        points: 10,
        completed: false
    },
    {
        id: 'place_trashcan',
        icon: '🗑️',
        label: 'Place a Trashcan',
        description: 'Keep the shop tidy',
        hint: 'You\ll need somewhere for trash...',
        completionMsg: 'Trashcan placed! Staying organized! 🗑️',
        points: 10,
        completed: false
    },
    {
        id: 'trash_object',
        icon: '🗑️',
        label: 'Throw an object away',
        description: 'Bring an object to the trash',
        hint: 'Get rid of the mess!',
        completionMsg: 'Clean and tidy! Good job! 🧼',
        points: 10,
        completed: false
    },
    {
        id: 'place_speaker',
        icon: '🔊',
        label: 'Place a Speaker',
        description: 'Set the mood with music',
        hint: 'Every cafe needs a good vibe!',
        completionMsg: 'The shop looks great! Ready for business! 🎉',
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

    console.log('📋 Shift Tasks initialized');
    vrLog('📋 Your shift has begun!');

    createStoryPanel();
    updateStoryPanel();

    // Notification d'introduction narrative
    setTimeout(() => {
        showARNotification('📋 Check your task list!', 3000);
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
        console.log(`📋 ${step.icon} ${step.current}/${step.required}`);
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

    console.log(`📋 ✅ Step completed: ${step.label} (+${step.points}pts)`);
    vrLog(`📋 ✅ ${step.label}`);

    // Notification de félicitation — Message narratif !
    showARNotification(step.completionMsg || `✅ ${step.label} (+${step.points}pts)`, 3000);

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
    if (allDone && isStoryActive) {
        console.log('📋 🎉 ALL SHIFT TASKS COMPLETE!');
        vrLog('📋 🎉 Shift setup complete!');

        // Bonus de complétion
        addScore(50, 'Shift setup complete!');

        isStoryActive = false;

        // Message de félicitation narratif
        showARNotification('Amazing work, barista! Time to serve customers! 🎉', 5000);
    }
}

/**
 * Appelé quand le joueur appuie sur le bouton START ORDERS
 * Exporté pour être utilisé par xr.js
 */
export function triggerStoryComplete() {
    console.log('📋 START ORDERS button pressed!');
    vrLog('📋 Opening for business...');

    // Cacher le panneau
    hideStoryPanel();

    // Lancer le callback
    if (onStoryCompletedCallback) {
        try {
            onStoryCompletedCallback();
            console.log('Story: callback executed OK');
        } catch (e) {
            console.error('Story: callback error:', e);
        }
    } else {
        console.warn('Story: no callback registered');
    }
}

/**
 * Définit le callback appelé quand le tutoriel est terminé
 * @param {Function} callback
 */
export function setOnStoryCompleted(callback) {
    onStoryCompletedCallback = callback;
}

/**
 * Calcule quelles tâches sont visibles (révélation progressive)
 * On montre :
 *  - Toutes les tâches déjà complétées
 *  - La tâche en cours
 *  - Les N prochaines tâches non complétées (fenêtre glissante)
 * @returns {Array<{step, index, visible}>}
 */
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

/**
 * Crée le panneau checklist en VR — "SHIFT TASKS"
 * Positionné devant le joueur dans le monde
 */
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

    // Titre — "SHIFT TASKS" au lieu de "GUIDE"
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
    // On crée assez de slots pour toutes les étapes + texte "more..."
    storyPanelTexts = [];
    const startY = 0.20;
    const lineHeight = 0.045;

    // Créer les slots pour les tâches visibles (max = toutes les tâches + 1 pour le "...")
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

    // Bouton START ORDERS (grisé et caché au départ)
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

    // Animation d'entrée — slide depuis la droite
    storyPanel.setAttribute('animation', {
        property: 'position',
        from: '1.5 1.5 -1.2',
        to: '0 1.5 -1.2',
        dur: 1000,
        easing: 'easeOutCubic',
        delay: 500
    });

    sceneEl.appendChild(storyPanel);
    console.log('📋 Shift Tasks panel created');
}

/**
 * Met à jour l'affichage du panneau checklist
 * Utilise la révélation progressive — seules N tâches non complétées sont visibles
 */
export function updateStoryPanel() {
    if (!storyPanel || storyPanelTexts.length === 0) return;

    const completedCount = STORY_STEPS.filter(s => s.completed).length;
    const visibleSteps = getVisibleSteps();

    // Cacher toutes les lignes d'abord
    for (const textEl of storyPanelTexts) {
        textEl.setAttribute('visible', 'false');
    }

    // Compter les étapes visibles et les cachées
    const shownSteps = visibleSteps.filter(v => v.visible);
    const hiddenCount = visibleSteps.filter(v => !v.visible).length;

    let textIndex = 0;

    for (const { step, index, visible } of visibleSteps) {
        if (!visible) continue;

        const textEl = storyPanelTexts[textIndex];
        if (!textEl) break;

        textEl.setAttribute('visible', 'true');

        let prefix, color;

        if (step.completed) {
            prefix = '✓';
            color = '#00b894'; // Vert
        } else if (index === currentStepIndex) {
            prefix = '►';
            color = '#fdcb6e'; // Jaune — tâche active
        } else {
            prefix = '○';
            color = '#636e72'; // Gris
        }

        // Afficher le compteur pour les tâches tracked
        let label = step.label;
        if (step.tracked && !step.completed) {
            label = `${step.label} (${step.current}/${step.required})`;
        }

        const fullText = `${prefix} ${step.icon} ${label}`;
        textEl.setAttribute('text', `value: ${fullText}; color: ${color}; align: left; wrapCount: 42`);

        // Animation pulse sur la tâche courante (via scale oscillation)
        if (index === currentStepIndex && !step.completed) {
            textEl.setAttribute('animation__pulse', {
                property: 'scale',
                from: '0.055 0.055 0.055',
                to: '0.062 0.062 0.062',
                dur: 800,
                dir: 'alternate',
                loop: true,
                easing: 'easeInOutSine'
            });
        } else {
            textEl.removeAttribute('animation__pulse');
            textEl.setAttribute('scale', '0.055 0.055 0.055');
        }

        textIndex++;
    }

    // Montrer combien de tâches restent cachées
    if (hiddenCount > 0) {
        const moreEl = storyPanelTexts[textIndex];
        if (moreEl) {
            moreEl.setAttribute('visible', 'true');
            const moreText = `    ... ${hiddenCount} more task${hiddenCount > 1 ? 's' : ''}`;
            moreEl.setAttribute('text', `value: ${moreText}; color: #4a4a5a; align: left; wrapCount: 42`);
        }
    }

    // Mettre à jour le sous-titre avec le hint de la tâche en cours
    const subtitleEl = storyPanel.querySelector('#story-subtitle');
    if (subtitleEl) {
        const currentStep = STORY_STEPS[currentStepIndex];
        if (currentStep && !currentStep.completed) {
            subtitleEl.setAttribute('value', currentStep.hint || currentStep.description);
        } else if (completedCount === STORY_STEPS.length) {
            subtitleEl.setAttribute('value', 'All tasks done! You\\re ready!');
        }
    }

    // Mettre à jour la barre de progression
    const progressBar = storyPanel.querySelector('#story-progress-bar');
    const progressText = storyPanel.querySelector('#story-progress-text');

    if (progressBar) {
        const maxWidth = 0.38;
        const progress = completedCount / STORY_STEPS.length;
        const barWidth = Math.max(0.001, maxWidth * progress);
        progressBar.setAttribute('width', barWidth);
        progressBar.setAttribute('position', `${-0.19 + barWidth / 2} -0.33 0.015`);

        // Couleur progressive : rouge → orange → vert
        if (progress < 0.33) {
            progressBar.setAttribute('color', '#e17055');
        } else if (progress < 0.66) {
            progressBar.setAttribute('color', '#fdcb6e');
        } else {
            progressBar.setAttribute('color', '#00b894');
        }
    }

    if (progressText) {
        progressText.setAttribute('value', `${completedCount}/${STORY_STEPS.length}`);
    }

    // Activer/désactiver le bouton OPEN SHOP
    const allDone = completedCount === STORY_STEPS.length;
    const startBtn = storyPanel.querySelector('#story-start-orders-btn');
    const startBtnText = storyPanel.querySelector('#story-start-orders-text');
    const progressBg = storyPanel.querySelector('#story-progress-bg');

    if (startBtn) {
        if (allDone) {
            // Activer le bouton avec animation
            startBtn.setAttribute('visible', 'true');
            startBtn.setAttribute('color', '#00b894');
            startBtn.setAttribute('class', 'clickable');
            if (startBtnText) startBtnText.setAttribute('color', '#ffffff');

            // Animation pulse sur le bouton pour attirer l'attention
            startBtn.setAttribute('animation__pulse', {
                property: 'scale',
                from: '1 1 1',
                to: '1.08 1.08 1.08',
                dur: 600,
                dir: 'alternate',
                loop: true,
                easing: 'easeInOutSine'
            });

            // Cacher la barre de progression
            if (progressBg) progressBg.setAttribute('visible', 'false');
            if (progressBar) progressBar.setAttribute('visible', 'false');
            if (progressText) progressText.setAttribute('visible', 'false');

            console.log('📋 OPEN SHOP button ENABLED');
        }
    }
}

/**
 * Cache le panneau story avec animation
 */
function hideStoryPanel() {
    if (!storyPanel) return;

    // Animation de sortie — slide vers la gauche
    storyPanel.setAttribute('animation', {
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
