

const STORAGE_KEY = 'holobarista_username';

export function getUsername() {
    return localStorage.getItem(STORAGE_KEY);
}

export function setUsername(name) {
    const clean = name.trim().substring(0, 20);
    if (clean.length > 0) {
        localStorage.setItem(STORAGE_KEY, clean);
    }
}

export function hasUsername() {
    const name = getUsername();
    return name !== null && name.trim().length > 0;
}
