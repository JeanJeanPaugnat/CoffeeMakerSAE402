/**
 * Système de gestion des clients (DÉSACTIVÉ - Mode Dark Kitchen)
 * Les commandes sont gérées en ligne via wrist-tablet.js
 * Ce fichier conserve les exports pour compatibilité avec les autres modules
 */

// --- FONCTIONS STUB POUR COMPATIBILITÉ ---

/**
 * @deprecated Plus de clients visibles en mode dark kitchen
 */
export function spawnCustomer() {
    // Dark kitchen - pas de clients visibles
    console.log('📦 Dark Kitchen mode - no visible customers');
}

/**
 * @deprecated Plus de clients visibles en mode dark kitchen
 */
export function removeCustomer(customer, satisfied = true) {
    // Dark kitchen - pas de clients visibles
}

/**
 * @deprecated Livraison gérée par wrist-tablet.js
 */
export function checkCoffeeDelivery() {
    // Dark kitchen - livraison gérée par le système de commandes
}

/**
 * @deprecated 
 */
export function deliverItem(customer, item) {
    // Dark kitchen - pas utilisé
}

/**
 * @deprecated 
 */
export function deliverCoffee(customer, cupEl) {
    // Dark kitchen - pas utilisé
}

/**
 * @deprecated 
 */
export function startDeliveryCheck() {
    // Dark kitchen - pas utilisé
}

/**
 * @deprecated 
 */
export function stopDeliveryCheck() {
    // Dark kitchen - pas utilisé
}

/**
 * Score géré par wrist-tablet.js maintenant
 */
export function getScore() {
    // Utiliser wrist-tablet.getScore() à la place
    return { score: 0, served: 0 };
}
