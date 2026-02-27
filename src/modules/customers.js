
// Fonctions stub pour compatibilité (mode Dark Kitchen)
export function spawnCustomer() {
    // Dark kitchen - pas de clients visibles
    console.log('📦 Dark Kitchen mode - no visible customers');
}
export function removeCustomer(customer, satisfied = true) {}
export function checkCoffeeDelivery() {}
export function deliverItem(customer, item) {}
export function deliverCoffee(customer, cupEl) {}
export function startDeliveryCheck() {}
export function stopDeliveryCheck() {}
export function getScore() {
    // Utiliser wrist-tablet.getScore() à la place
    return { score: 0, served: 0 };
}
