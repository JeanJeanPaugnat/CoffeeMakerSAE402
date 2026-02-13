/**
 * Système de speaker avec playlist musicale
 * Permet de jouer de la musique depuis les enceintes placées dans le monde
 */

import * as state from './state.js';
import { stopBgMusic, playBgMusic } from './audio.js';
import { vrLog } from './log-panel.js';

// --- PLAYLIST ---
const PLAYLIST = [
    { name: 'Billie Jean', file: 'billie-jean-official-video.mp3' },
    { name: 'Party Rock', file: 'LMFAO.mp3' },
    { name: 'Lean On', file: 'LeanOn.mp3' },
    { name: 'No Broke Boys', file: 'no-broke-boys-official-audio.mp3' },
    { name: 'Timber', file: 'Timber.mp3' },
    { name: 'Shake It Off', file: 'ShakeItOff.mp3' },
    { name: 'I Gotta Feeling', file: 'GottaFeelming.mp3' }
];

// --- ÉTAT DU SPEAKER ---
let speakerAudio = null;
let currentTrackIndex = 0;
let isPlaying = false;
let speakerUI = null;
let currentSpeakerEntity = null;

/**
 * Initialise l'audio du speaker
 */
function initSpeakerAudio() {
    if (!speakerAudio) {
        speakerAudio = new Audio();
        speakerAudio.volume = 0.6;
        speakerAudio.loop = false;
        
        // Passer à la chanson suivante quand une se termine
        speakerAudio.addEventListener('ended', () => {
            vrLog('🎵 Track ended, next...');
            nextTrack();
        });
        
        // Log des erreurs audio
        speakerAudio.addEventListener('error', (e) => {
            vrLog(`❌ Audio err: ${e.type}`);
        });
        
        speakerAudio.addEventListener('loadstart', () => {
            vrLog('📥 Loading track...');
        });
        
        speakerAudio.addEventListener('canplay', () => {
            vrLog('✅ Track ready');
        });
    }
    return speakerAudio;
}

/**
 * Charge et joue une piste
 * @param {number} index - Index de la piste dans la playlist
 */
function loadTrack(index) {
    vrLog(`🎵 loadTrack(${index})`);
    
    if (index < 0 || index >= PLAYLIST.length) {
        vrLog(`❌ Invalid idx: ${index}`);
        return;
    }
    
    currentTrackIndex = index;
    const track = PLAYLIST[index];
    
    initSpeakerAudio();
    const src = `/CoffeeMakerSAE402/sounds/speakerPlaylist/${encodeURIComponent(track.file)}`;
    vrLog(`📁 ${track.name}`);
    speakerAudio.src = src;
    
    console.log(`🔊 Chargement: ${track.name}`);
    updateUITrackName();
}

/**
 * Joue/Pause la musique du speaker
 */
export function toggleSpeakerPlay() {
    console.log('🔊 toggleSpeakerPlay called');
    vrLog('🔊 toggleSpeakerPlay');
    initSpeakerAudio();
    
    if (isPlaying) {
        speakerAudio.pause();
        isPlaying = false;
        vrLog('⏸️ PAUSED');
        console.log('⏸️ Speaker en pause');
        state.debug('⏸️ Musique en pause');
        // Reprendre la musique de fond
        playBgMusic();
    } else {
        // Arrêter la musique de fond
        stopBgMusic();
        
        // Si pas de source chargée, charger la première piste
        if (!speakerAudio.src || speakerAudio.src === '') {
            vrLog('🎵 No src, loading 0');
            loadTrack(0);
        }
        
        vrLog('▶️ Attempting play...');
        speakerAudio.play().then(() => {
            vrLog('✅ Playing OK!');
        }).catch(e => {
            vrLog(`❌ Play err: ${e.message}`);
            console.log('Speaker error:', e);
            state.debug('❌ Erreur audio: ' + e.message);
        });
        isPlaying = true;
        const track = PLAYLIST[currentTrackIndex];
        vrLog(`▶️ ${track?.name}`);
        console.log('▶️ Speaker en lecture:', track?.name);
        state.debug('▶️ ' + (track?.name || 'Playing'));
    }
    
    updateUIPlayButton();
}

/**
 * Piste suivante
 */
export function nextTrack() {
    vrLog(`⏭️ NEXT (was ${currentTrackIndex})`);
    const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length;
    loadTrack(nextIndex);
    
    if (isPlaying) {
        vrLog('▶️ Auto-play next');
        speakerAudio.play().then(() => {
            vrLog('✅ Next playing');
        }).catch(e => {
            vrLog(`❌ Next err: ${e.message}`);
            console.log('Speaker error:', e);
        });
    }
}

/**
 * Piste précédente
 */
export function prevTrack() {
    vrLog(`⏮️ PREV (was ${currentTrackIndex})`);
    const prevIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    loadTrack(prevIndex);
    
    if (isPlaying) {
        vrLog('▶️ Auto-play prev');
        speakerAudio.play().then(() => {
            vrLog('✅ Prev playing');
        }).catch(e => {
            vrLog(`❌ Prev err: ${e.message}`);
            console.log('Speaker error:', e);
        });
    }
}

/**
 * Sélectionne une piste spécifique
 * @param {number} index - Index de la piste
 */
export function selectTrack(index) {
    loadTrack(index);
    
    // Démarrer la lecture
    stopBgMusic();
    speakerAudio.play().catch(e => console.log('Speaker error:', e));
    isPlaying = true;
    
    updateUIPlayButton();
}

/**
 * Met à jour le nom de la piste dans l'UI
 */
function updateUITrackName() {
    if (!speakerUI) return;
    
    const trackText = speakerUI.querySelector('#speaker-track-name');
    if (trackText) {
        const track = PLAYLIST[currentTrackIndex];
        trackText.setAttribute('value', track ? track.name : 'No Track');
    }
}

/**
 * Met à jour le bouton play/pause
 */
function updateUIPlayButton() {
    if (!speakerUI) return;
    
    const playBtn = speakerUI.querySelector('#speaker-play-btn-text');
    if (playBtn) {
        playBtn.setAttribute('value', isPlaying ? '⏸' : '▶');
    }
}

/**
 * Crée l'interface UI au-dessus du speaker
 * @param {Element} speakerEntity - L'entité du speaker
 */
export function createSpeakerUI(speakerEntity) {
    console.log('🔊 createSpeakerUI called');
    vrLog('🔊 createSpeakerUI');
    state.debug('🔊 Creating Speaker UI...');
    
    if (!speakerEntity) {
        console.log('❌ No speakerEntity');
        vrLog('❌ No speakerEntity!');
        state.debug('❌ No speakerEntity');
        return;
    }
    
    vrLog(`📦 Entity: ${speakerEntity.id || 'no-id'}`);
    
    if (!speakerEntity.object3D) {
        console.log('❌ No object3D on speakerEntity');
        vrLog('❌ No object3D!');
        state.debug('❌ No object3D');
        return;
    }
    
    // Log position pour debug physique
    const pos = speakerEntity.getAttribute('position');
    vrLog(`📍 Pos: ${pos?.x?.toFixed(2)}, ${pos?.y?.toFixed(2)}, ${pos?.z?.toFixed(2)}`);
    
    // Si une UI existe déjà pour un autre speaker, la supprimer
    if (speakerUI && speakerUI.parentNode) {
        speakerUI.parentNode.removeChild(speakerUI);
    }
    
    currentSpeakerEntity = speakerEntity;
    
    // Créer le panneau UI
    speakerUI = document.createElement('a-entity');
    speakerUI.id = 'speaker-ui';
    speakerUI.setAttribute('position', '0 0.8 0'); // Au-dessus du speaker
    
    // Fond du panneau
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.5');
    bg.setAttribute('height', '0.25');
    bg.setAttribute('color', '#1a1a2e');
    bg.setAttribute('material', 'shader: flat; opacity: 0.95');
    speakerUI.appendChild(bg);
    
    // Bordure
    const border = document.createElement('a-plane');
    border.setAttribute('width', '0.52');
    border.setAttribute('height', '0.27');
    border.setAttribute('color', '#e94560');
    border.setAttribute('material', 'shader: flat');
    border.setAttribute('position', '0 0 -0.001');
    speakerUI.appendChild(border);
    
    // Titre
    const title = document.createElement('a-text');
    title.setAttribute('value', '🔊 SPEAKER');
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 0.08 0.01');
    title.setAttribute('width', '1.2');
    title.setAttribute('color', '#e94560');
    speakerUI.appendChild(title);
    
    // Nom de la piste actuelle
    const trackName = document.createElement('a-text');
    trackName.id = 'speaker-track-name';
    trackName.setAttribute('value', PLAYLIST[currentTrackIndex]?.name || 'Select a track');
    trackName.setAttribute('align', 'center');
    trackName.setAttribute('position', '0 0.01 0.01');
    trackName.setAttribute('width', '0.8');
    trackName.setAttribute('color', '#ffffff');
    speakerUI.appendChild(trackName);
    
    // Boutons de contrôle
    const controlsY = -0.07;
    
    // Bouton Précédent
    const prevBtn = createControlButton('⏮', -0.12, controlsY, 'prev');
    speakerUI.appendChild(prevBtn);
    
    // Bouton Play/Pause
    const playBtn = createControlButton(isPlaying ? '⏸' : '▶', 0, controlsY, 'toggle');
    playBtn.querySelector('a-text').id = 'speaker-play-btn-text';
    speakerUI.appendChild(playBtn);
    
    // Bouton Suivant
    const nextBtn = createControlButton('⏭', 0.12, controlsY, 'next');
    speakerUI.appendChild(nextBtn);
    
    // Ajouter l'UI au speaker
    vrLog('📎 Attaching UI to speaker');
    speakerEntity.appendChild(speakerUI);
    
    // Stocker dans state pour les interactions VR
    state.setSpeakerUI(speakerUI);
    
    // Faire face à la caméra (billboard)
    speakerUI.setAttribute('look-at', '#cam');
    
    vrLog('✅ Speaker UI OK!');
    console.log('🔊 Speaker UI créée et ajoutée à state');
    state.debug('🔊 Speaker UI OK!');
}

/**
 * Crée un bouton de contrôle
 */
function createControlButton(icon, x, y, action) {
    const btn = document.createElement('a-entity');
    btn.setAttribute('position', `${x} ${y} 0.02`);
    
    const bg = document.createElement('a-circle');
    bg.setAttribute('radius', '0.04');
    bg.setAttribute('color', '#16213e');
    bg.setAttribute('class', 'clickable speaker-btn');
    bg.dataset.speakerAction = action;
    btn.appendChild(bg);
    
    const text = document.createElement('a-text');
    text.setAttribute('value', icon);
    text.setAttribute('align', 'center');
    text.setAttribute('position', '0 0 0.01');
    text.setAttribute('width', '0.8');
    text.setAttribute('color', '#ffffff');
    btn.appendChild(text);
    
    return btn;
}

/**
 * Crée un bouton de sélection de piste
 */
function createTrackButton(index, x, y) {
    const track = PLAYLIST[index];
    if (!track) return document.createElement('a-entity');
    
    const btn = document.createElement('a-entity');
    btn.setAttribute('position', `${x} ${y} 0.02`);
    
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.4');
    bg.setAttribute('height', '0.035');
    bg.setAttribute('color', '#16213e');
    bg.setAttribute('class', 'clickable speaker-btn');
    bg.dataset.speakerAction = 'track';
    bg.dataset.trackIndex = index;
    btn.appendChild(bg);
    
    const text = document.createElement('a-text');
    text.setAttribute('value', `${index + 1}. ${track.name}`);
    text.setAttribute('align', 'center');
    text.setAttribute('position', '0 0 0.01');
    text.setAttribute('width', '0.7');
    text.setAttribute('color', '#b8b8b8');
    btn.appendChild(text);
    
    return btn;
}

/**
 * Supprime l'UI du speaker
 */
export function removeSpeakerUI() {
    if (speakerUI && speakerUI.parentNode) {
        speakerUI.parentNode.removeChild(speakerUI);
        speakerUI = null;
    }
}

/**
 * Arrête complètement le speaker
 */
export function stopSpeaker() {
    if (speakerAudio) {
        speakerAudio.pause();
        speakerAudio.currentTime = 0;
        isPlaying = false;
    }
    playBgMusic();
}

/**
 * Retourne l'état de lecture
 */
export function isSpeakerPlaying() {
    return isPlaying;
}

/**
 * Retourne la playlist
 */
export function getPlaylist() {
    return PLAYLIST;
}
