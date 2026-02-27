

import * as state from './state.js';
import { stopBgMusic, playBgMusic } from './audio.js';
import { vrLog } from './log-panel.js';

// Playlist musicale du speaker
const PLAYLIST = [
    { name: 'Billie Jean', file: 'billieJean.mp3' },
    { name: 'Party Rock', file: 'LMFAO.mp3' },
    { name: 'Lean On', file: 'LeanOn.mp3' },
    { name: 'No Broke Boys', file: 'brokeBoys.mp3' },
    { name: 'Timber', file: 'Timber.mp3' },
    { name: 'Shake It Off', file: 'ShakeItOff.mp3' },
    { name: 'I Gotta Feeling', file: 'GottaFeelling.mp3' }
];


let speakerAudio = null;
let currentTrackIndex = 0;
let isPlaying = false;
let speakerUI = null;
let currentSpeakerEntity = null;

// Initialise l'audio du speaker (singleton)
function initSpeakerAudio() {
    if (!speakerAudio) {
        speakerAudio = new Audio();
        speakerAudio.volume = 0.6;
        speakerAudio.loop = false;
        speakerAudio.addEventListener('ended', () => {
            vrLog('🎵 Track ended, next...');
            nextTrack();
        });
        speakerAudio.addEventListener('error', (e) => vrLog(`❌ Audio err: ${e.type}`));
        speakerAudio.addEventListener('loadstart', () => vrLog('📥 Loading track...'));
        speakerAudio.addEventListener('canplay', () => vrLog('✅ Track ready'));
    }
    return speakerAudio;
}

// Charge et prépare une piste
function loadTrack(index) {
    vrLog(`🎵 loadTrack(${index})`);
    if (index < 0 || index >= PLAYLIST.length) {
        vrLog(`❌ Invalid idx: ${index}`);
        return;
    }
    currentTrackIndex = index;
    const track = PLAYLIST[index];
    initSpeakerAudio();
    speakerAudio.src = `/sounds/speakerPlaylist/${encodeURIComponent(track.file)}`;
    vrLog(`📁 ${track.name}`);
    console.log(`🔊 Chargement: ${track.name}`);
    updateUITrackName();
}

// Joue ou met en pause la musique du speaker
export function toggleSpeakerPlay() {
    vrLog('🔊 toggleSpeakerPlay');
    initSpeakerAudio();
    if (isPlaying) {
        speakerAudio.pause();
        isPlaying = false;
        vrLog('⏸️ PAUSED');
        state.debug('⏸️ Musique en pause');
        playBgMusic();
    } else {
        stopBgMusic();
        if (!speakerAudio.src) {
            vrLog('🎵 No src, loading 0');
            loadTrack(0);
        }
        vrLog('▶️ Attempting play...');
        speakerAudio.play().then(() => vrLog('✅ Playing OK!'))
            .catch(e => {
                vrLog(`❌ Play err: ${e.message}`);
                state.debug('❌ Erreur audio: ' + e.message);
            });
        isPlaying = true;
        const track = PLAYLIST[currentTrackIndex];
        vrLog(`▶️ ${track?.name}`);
        state.debug('▶️ ' + (track?.name || 'Playing'));
    }
    updateUIPlayButton();
}

// Passe à la piste suivante
export function nextTrack() {
    vrLog(`⏭️ NEXT (was ${currentTrackIndex})`);
    const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length;
    loadTrack(nextIndex);
    if (isPlaying) {
        vrLog('▶️ Auto-play next');
        speakerAudio.play().then(() => vrLog('✅ Next playing'))
            .catch(e => vrLog(`❌ Next err: ${e.message}`));
    }
}

// Passe à la piste précédente
export function prevTrack() {
    vrLog(`⏮️ PREV (was ${currentTrackIndex})`);
    const prevIndex = (currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    loadTrack(prevIndex);
    if (isPlaying) {
        vrLog('▶️ Auto-play prev');
        speakerAudio.play().then(() => vrLog('✅ Prev playing'))
            .catch(e => vrLog(`❌ Prev err: ${e.message}`));
    }
}

// Sélectionne et joue une piste spécifique
export function selectTrack(index) {
    loadTrack(index);
    stopBgMusic();
    speakerAudio.play().catch(() => {});
    isPlaying = true;
    updateUIPlayButton();
}

function updateUITrackName() {
    if (!speakerUI) return;
    const trackText = speakerUI.querySelector('#speaker-track-name');
    if (trackText) {
        const track = PLAYLIST[currentTrackIndex];
        trackText.setAttribute('value', track ? track.name : 'No Track');
    }
}

function updateUIPlayButton() {
    if (!speakerUI) return;
    const playBtn = speakerUI.querySelector('#speaker-play-btn-text');
    if (playBtn) {
        playBtn.setAttribute('value', isPlaying ? '⏸' : '▶');
    }
}

// Crée l'interface UI au-dessus du speaker
export function createSpeakerUI(speakerEntity) {
    state.debug('🔊 Creating Speaker UI...');
    if (!speakerEntity || !speakerEntity.object3D) {
        vrLog('❌ No speakerEntity or object3D!');
        state.debug('❌ No speakerEntity');
        return;
    }
    if (speakerUI && speakerUI.parentNode) speakerUI.parentNode.removeChild(speakerUI);
    currentSpeakerEntity = speakerEntity;
    speakerUI = document.createElement('a-entity');
    speakerUI.id = 'speaker-ui';
    speakerUI.setAttribute('position', '0 0.8 0');
    const bg = document.createElement('a-plane');
    bg.setAttribute('width', '0.5');
    bg.setAttribute('height', '0.25');
    bg.setAttribute('color', '#1a1a2e');
    bg.setAttribute('material', 'shader: flat; opacity: 0.95');
    speakerUI.appendChild(bg);
    const border = document.createElement('a-plane');
    border.setAttribute('width', '0.52');
    border.setAttribute('height', '0.27');
    border.setAttribute('color', '#e94560');
    border.setAttribute('material', 'shader: flat');
    border.setAttribute('position', '0 0 -0.001');
    speakerUI.appendChild(border);
    const title = document.createElement('a-text');
    title.setAttribute('value', '🔊 SPEAKER');
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 0.08 0.01');
    title.setAttribute('width', '1.2');
    title.setAttribute('color', '#e94560');
    speakerUI.appendChild(title);
    const trackName = document.createElement('a-text');
    trackName.id = 'speaker-track-name';
    trackName.setAttribute('value', PLAYLIST[currentTrackIndex]?.name || 'Select a track');
    trackName.setAttribute('align', 'center');
    trackName.setAttribute('position', '0 0.01 0.01');
    trackName.setAttribute('width', '0.8');
    trackName.setAttribute('color', '#ffffff');
    speakerUI.appendChild(trackName);
    const controlsY = -0.07;
    speakerUI.appendChild(createControlButton('⏮', -0.12, controlsY, 'prev'));
    const playBtn = createControlButton(isPlaying ? '⏸' : '▶', 0, controlsY, 'toggle');
    playBtn.querySelector('a-text').id = 'speaker-play-btn-text';
    speakerUI.appendChild(playBtn);
    speakerUI.appendChild(createControlButton('⏭', 0.12, controlsY, 'next'));
    vrLog('📎 Attaching UI to speaker');
    speakerEntity.appendChild(speakerUI);
    state.setSpeakerUI(speakerUI);
    speakerUI.setAttribute('look-at', '#cam');
    vrLog('✅ Speaker UI OK!');
    state.debug('🔊 Speaker UI OK!');
}

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

// Supprime l'UI du speaker
export function removeSpeakerUI() {
    if (speakerUI && speakerUI.parentNode) {
        speakerUI.parentNode.removeChild(speakerUI);
        speakerUI = null;
    }
}

// Arrête complètement le speaker
export function stopSpeaker() {
    if (speakerAudio) {
        speakerAudio.pause();
        speakerAudio.currentTime = 0;
        isPlaying = false;
    }
    playBgMusic();
}

export function isSpeakerPlaying() {
    return isPlaying;
}

export function getPlaylist() {
    return PLAYLIST;
}
