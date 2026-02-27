
// État global partagé de l'application
export let sceneEl = null, cubeEl = null, cursorEl = null, debugEl = null;
export let xrSession = null, xrRefSpace = null, hitTestSource = null;
export let grabbed = false, grabController = null, currentGrabbedEl = null, velocities = [];
export const surfaces = [], spawnedObjects = [], trashcans = [], customers = [], stains = [];
export let menuToggleLock = false, coffeeMachineLock = false, giveCoffeeLock = false, uiClickLock = false, lastSpawnTime = 0;
export let inventoryEntity = null, welcomePanel = null, speakerUIEntity = null;
export let coffeeAudio = null, bgMusic = null;
export const TRASH_RADIUS = 0.2;
export const QUEUE_POS = { x: 0, y: 0.75, z: -1.5 };

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
export function setXRSession(session) { xrSession = session; }
export function setXRRefSpace(refSpace) { xrRefSpace = refSpace; }
export function setHitTestSource(source) { hitTestSource = source; }
export function setGrabState(isGrabbed, controller, element) {
    grabbed = isGrabbed;
    grabController = controller;
    currentGrabbedEl = element;
}
export function setGrabbed(value) { grabbed = value; }
export function setGrabController(controller) { grabController = controller; }
export function setCurrentGrabbedEl(element) { currentGrabbedEl = element; }
export function resetVelocities() { velocities = []; }
export function addVelocity(v) {
    velocities.push(v);
    if (velocities.length > 10) velocities.shift();
}
export function getVelocities() { return velocities; }
export function setMenuToggleLock(value) { menuToggleLock = value; }
export function setCoffeeMachineLock(value) { coffeeMachineLock = value; }
export function setGiveCoffeeLock(value) { giveCoffeeLock = value; }
export function setUIClickLock(value) { uiClickLock = value; }
export function setLastSpawnTime(time) { lastSpawnTime = time; }
export function setInventoryEntity(entity) { inventoryEntity = entity; }
export function setWelcomePanel(panel) { welcomePanel = panel; }
export function setSpeakerUI(ui) { speakerUIEntity = ui; }
export function setCoffeeAudio(audio) { coffeeAudio = audio; }
export function setBgMusic(audio) { bgMusic = audio; }
export function setCursor(cursor) { cursorEl = cursor; }
export function debug(message) {
    console.log(message);
    if (debugEl) debugEl.textContent = message;
}
