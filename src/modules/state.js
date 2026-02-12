/**
 * État global partagé de l'application
 * Centralise toutes les variables d'état pour éviter les dépendances circulaires
 */

// --- SCENE ELEMENTS ---
export let sceneEl = null;
export let cubeEl = null;
export let cursorEl = null;
export let debugEl = null;

// --- XR STATE ---
export let xrSession = null;
export let xrRefSpace = null;
export let hitTestSource = null;

// --- GRAB STATE ---
export let grabbed = false;
export let grabController = null;
export let currentGrabbedEl = null;
export let velocities = [];

// --- OBJECTS COLLECTIONS ---
export const surfaces = [];
export const spawnedObjects = [];
export const trashcans = [];
export const customers = [];
export const stains = [];

// --- LOCKS (prevent double triggers) ---
export let menuToggleLock = false;
export let coffeeMachineLock = false;
export let giveCoffeeLock = false;
export let uiClickLock = false;
export let lastSpawnTime = 0;

// --- UI ENTITIES ---
export let inventoryEntity = null;
export let welcomePanel = null;

// --- AUDIO ---
export let coffeeAudio = null;
export let bgMusic = null;

// --- CONSTANTS ---
export const TRASH_RADIUS = 0.2;
export const QUEUE_POS = { x: 0, y: 0.75, z: -1.5 };

// --- SETTERS (pour modifier l'état depuis d'autres modules) ---
export function setSceneElements(scene, cube, cursor, debug) {
    sceneEl = scene;
    cubeEl = cube;
    cursorEl = cursor;
    debugEl = debug;
}

export function setXRState(session, refSpace, hitSource) {
    xrSession = session;
    xrRefSpace = refSpace;
    hitTestSource = hitSource;
}

export function setXRSession(session) {
    xrSession = session;
}

export function setXRRefSpace(refSpace) {
    xrRefSpace = refSpace;
}

export function setHitTestSource(source) {
    hitTestSource = source;
}

export function setGrabState(isGrabbed, controller, element) {
    grabbed = isGrabbed;
    grabController = controller;
    currentGrabbedEl = element;
}

export function setGrabbed(value) {
    grabbed = value;
}

export function setGrabController(controller) {
    grabController = controller;
}

export function setCurrentGrabbedEl(element) {
    currentGrabbedEl = element;
}

export function resetVelocities() {
    velocities = [];
}

export function addVelocity(v) {
    velocities.push(v);
    if (velocities.length > 10) velocities.shift();
}

export function getVelocities() {
    return velocities;
}

export function setMenuToggleLock(value) {
    menuToggleLock = value;
}

export function setCoffeeMachineLock(value) {
    coffeeMachineLock = value;
}

export function setGiveCoffeeLock(value) {
    giveCoffeeLock = value;
}

export function setUIClickLock(value) {
    uiClickLock = value;
}

export function setLastSpawnTime(time) {
    lastSpawnTime = time;
}

export function setInventoryEntity(entity) {
    inventoryEntity = entity;
}

export function setWelcomePanel(panel) {
    welcomePanel = panel;
}

export function setCoffeeAudio(audio) {
    coffeeAudio = audio;
}

export function setBgMusic(audio) {
    bgMusic = audio;
}

export function setCursor(cursor) {
    cursorEl = cursor;
}

// --- DEBUG HELPER ---
export function debug(message) {
    console.log(message);
    if (debugEl) debugEl.textContent = message;
}
