/**
 * Système de speaker avec playlist musicale
 * Permet de jouer de la musique depuis les enceintes placées dans le monde
 */

import * as state from './state.js';
import { stopBgMusic, playBgMusic } from './audio.js';

// --- PLAYLIST ---
const PLAYLIST = [
    { name: 'Billie Jean', file: 'billie-jean-official-video.mp3' },
    { name: 'Party Rock', file: 'LMFAO - Party Rock Anthem (Audio) ft. Lauren Bennett, GoonRock.mp3' },
    { name: 'Lean On', file: 'Major Lazer & DJ Snake - Lean On (feat. MØ) [Official Lyric Video].mp3' },
    { name: 'No Broke Boys', file: 'no-broke-boys-official-audio.mp3' },
    { name: 'Timber', file: 'Pitbull, Ke$ha - Timber (featuring Ke$ha - Official Video).mp3' },
    { name: 'Shake It Off', file: 'Taylor Swift - Shake It Off.mp3' },
    { name: 'I Gotta Feeling', file: 'The Black Eyed Peas - I Gotta Feeling (Official Music Video).mp3' }
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
            nextTrack();
        });
    }
    return speakerAudio;
}

/**
 * Charge et joue une piste
 * @param {number} index - Index de la piste dans la playlist
 */
function loadTrack(index) {
    if (index < 0 || index >= PLAYLIST.length) return;
    
    currentTrackIndex = index;
    const track = PLAYLIST[index];
    
    initSpeakerAudio();
    speakerAudio.src = `/CoffeeMakerSAE402/sounds/speakerPlaylist/${encodeURIComponent(track.file)}`;
    
    console.log(`🔊 Chargement: ${track.name}`);
    updateUITrackName();
}

/**
 * Joue/Pause la musique du speaker
 */
export function toggleSpeakerPlay() {
    console.log('🔊 toggleSpeakerPlay called');
    initSpeakerAudio();
    
    if (isPlaying) {
        speakerAudio.pause();
        isPlaying = false;
        console.log('⏸️ Speaker en pause');
        state.debug('⏸️ Musique en pause');
        // Reprendre la musique de fond
        playBgMusic();
    } else {
        // Arrêter la musique de fond
        stopBgMusic();
        
        // Si pas de source chargée, charger la première piste
        if (!speakerAudio.src || speakerAudio.src === '') {
            loadTrack(0);
        }
        
        speakerAudio.play().catch(e => {
            console.log('Speaker error:', e);
            state.debug('❌ Erreur audio: ' + e.message);
        });
        isPlaying = true;
        const track = PLAYLIST[currentTrackIndex];
        console.log('▶️ Speaker en lecture:', track?.name);
        state.debug('▶️ ' + (track?.name || 'Playing'));
    }
    
    updateUIPlayButton();
}

/**
 * Piste suivante
 */
export function nextTrack() {
    const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length;
    loadTrack(nextIndex);
    
    if (isPlaying) {
        speakerAudio.play().catch(e => console.log('Speaker error:', e));
    }
}

/**
 * Piste précédente
 */
export function prevTrack() {
    const prevIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    loadTrack(prevIndex);
    
    if (isPlaying) {
        speakerAudio.play().catch(e => console.log('Speaker error:', e));
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
    state.debug('🔊 Creating Speaker UI...');
    
    if (!speakerEntity) {
        console.log('❌ No speakerEntity');
        state.debug('❌ No speakerEntity');
        return;
    }
    
    if (!speakerEntity.object3D) {
        console.log('❌ No object3D on speakerEntity');
        state.debug('❌ No object3D');
        return;
    }
    
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
    bg.setAttribute('height', '0.4');
    bg.setAttribute('color', '#1a1a2e');
    bg.setAttribute('material', 'shader: flat; opacity: 0.95');
    speakerUI.appendChild(bg);
    
    // Bordure
    const border = document.createElement('a-plane');
    border.setAttribute('width', '0.52');
    border.setAttribute('height', '0.42');
    border.setAttribute('color', '#e94560');
    border.setAttribute('material', 'shader: flat');
    border.setAttribute('position', '0 0 -0.001');
    speakerUI.appendChild(border);
    
    // Titre
    const title = document.createElement('a-text');
    title.setAttribute('value', '🔊 SPEAKER');
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 0.15 0.01');
    title.setAttribute('width', '1.2');
    title.setAttribute('color', '#e94560');
    speakerUI.appendChild(title);
    
    // Nom de la piste actuelle
    const trackName = document.createElement('a-text');
    trackName.id = 'speaker-track-name';
    trackName.setAttribute('value', PLAYLIST[currentTrackIndex]?.name || 'Select a track');
    trackName.setAttribute('align', 'center');
    trackName.setAttribute('position', '0 0.05 0.01');
    trackName.setAttribute('width', '0.8');
    trackName.setAttribute('color', '#ffffff');
    speakerUI.appendChild(trackName);
    
    // Boutons de contrôle
    const controlsY = -0.05;
    
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
    
    // Liste des pistes (scrollable visuellement, 3 visibles)
    const listY = -0.12;
    for (let i = 0; i < Math.min(3, PLAYLIST.length); i++) {
        const trackBtn = createTrackButton(i, 0, listY - (i * 0.045));
        speakerUI.appendChild(trackBtn);
    }
    
    // Ajouter l'UI au speaker
    speakerEntity.appendChild(speakerUI);
    
    // Stocker dans state pour les interactions VR
    state.setSpeakerUI(speakerUI);
    
    // Faire face à la caméra (billboard)
    speakerUI.setAttribute('look-at', '#cam');
    
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
