/**
 * Module de gestion du profil joueur
 * Stocke le pseudo en localStorage — pas de système de compte
 */

const STORAGE_KEY = 'holobarista_username';

/**
 * Retourne le pseudo du joueur depuis localStorage
 * @returns {string|null}
 */
export function getUsername() {
    return localStorage.getItem(STORAGE_KEY);
}

/**
 * Sauvegarde le pseudo du joueur dans localStorage
 * @param {string} name
 */
export function setUsername(name) {
    const clean = name.trim().substring(0, 20);
    if (clean.length > 0) {
        localStorage.setItem(STORAGE_KEY, clean);
    }
}

/**
 * Vérifie si un pseudo existe
 * @returns {boolean}
 */
export function hasUsername() {
    const name = getUsername();
    return name !== null && name.trim().length > 0;
}
