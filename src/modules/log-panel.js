/**
 * Module de panneau de logs VR externe
 * Permet d'afficher des logs depuis n'importe quel fichier
 */

// --- ÉTAT ---
let logsPanel = null;
let logsPanelText = null;
let vrLogs = [];
const MAX_VR_LOGS = 8;
let isAttached = false;

/**
 * Ajoute un log visible en VR
 * @param {string} message - Le message à afficher
 */
export function vrLog(message) {
    console.log(message);
    vrLogs.push(message);
    if (vrLogs.length > MAX_VR_LOGS) {
        vrLogs.shift();
    }
    updateLogsPanel();
}

/**
 * Efface tous les logs
 */
export function clearLogs() {
    vrLogs = [];
    updateLogsPanel();
}

/**
 * Met à jour le panneau de logs VR
 */
function updateLogsPanel() {
    if (!logsPanelText) return;
    logsPanelText.setAttribute('value', vrLogs.join('\\n'));
}

/**
 * Initialise et attache le panneau de logs à la caméra
 * Peut être appelé plusieurs fois sans effet
 */
export function initLogsPanel() {
    if (isAttached) return;
    
    const cam = document.getElementById('cam');
    if (!cam) {
        console.log('⚠️ No cam found for logs panel');
        return;
    }
    
    createLogsPanel(cam);
    isAttached = true;
}

/**
 * Crée le panneau de logs visible en VR
 * @param {Element} cam - L'élément caméra auquel attacher le panneau
 */
function createLogsPanel(cam) {
    if (logsPanel) return;
    
    logsPanel = document.createElement('a-entity');
    logsPanel.id = 'logs-panel';
    logsPanel.setAttribute('position', '0.35 0 -0.8');
    
    // Fond
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.35');
    bg.setAttribute('height', '0.4');
    bg.setAttribute('color', '#000000');
    bg.setAttribute('material', 'shader: flat; opacity: 0.85');
    logsPanel.appendChild(bg);
    
    // Titre
    const title = document.createElement('a-text');
    title.setAttribute('value', '📝 LOGS');
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 0.17 0.01');
    title.setAttribute('scale', '0.08 0.08 0.08');
    title.setAttribute('color', '#ff6600');
    logsPanel.appendChild(title);
    
    // Texte des logs
    logsPanelText = document.createElement('a-text');
    logsPanelText.setAttribute('value', 'Waiting...');
    logsPanelText.setAttribute('align', 'left');
    logsPanelText.setAttribute('position', '-0.15 0.1 0.01');
    logsPanelText.setAttribute('scale', '0.04 0.04 0.04');
    logsPanelText.setAttribute('color', '#00ff00');
    logsPanelText.setAttribute('wrap-count', '30');
    logsPanel.appendChild(logsPanelText);
    
    cam.appendChild(logsPanel);
    vrLog('📝 Logs ready');
}

/**
 * Détache et supprime le panneau de logs
 */
export function destroyLogsPanel() {
    if (logsPanel && logsPanel.parentNode) {
        logsPanel.parentNode.removeChild(logsPanel);
    }
    logsPanel = null;
    logsPanelText = null;
    isAttached = false;
    vrLogs = [];
}
