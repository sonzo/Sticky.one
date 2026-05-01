'use strict';

/**
 * storage.js — Persist app data to IndexedDB.
 */
const Storage = (() => {
    const DB_NAME = 'sticky_one';
    const DB_VERSION = 1;
    const STORE = 'kv';

    let dbPromise = null;

    function openDB() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    db.createObjectStore(STORE, { keyPath: 'key' });
                }
            };
            req.onsuccess = e => resolve(e.target.result);
            req.onerror = e => reject(e.target.error);
        });
        return dbPromise;
    }

    async function idbGet(key) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
            req.onsuccess = () => resolve(req.result?.value ?? null);
            req.onerror = e => reject(e.target.error);
        });
    }

    async function idbSet(key, value) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put({ key, value });
            req.onsuccess = () => resolve();
            req.onerror = e => reject(e.target.error);
        });
    }

    async function load() {
        try {
            const data = await idbGet('appdata');
            return data ?? { groups: [] };
        } catch (e) {
            console.error('[Storage] load failed:', e);
            return { groups: [] };
        }
    }

    async function save(data) {
        try {
            await idbSet('appdata', data);
        } catch (e) {
            console.error('[Storage] save failed:', e);
        }
    }

    async function loadCollapsed() {
        try {
            const arr = await idbGet('collapsed');
            return arr ? new Set(arr) : new Set();
        } catch (e) {
            return new Set();
        }
    }

    async function saveCollapsed(collapsedSet) {
        try {
            await idbSet('collapsed', [...collapsedSet]);
        } catch (e) {
            console.error('[Storage] saveCollapsed failed:', e);
        }
    }

    return { load, save, loadCollapsed, saveCollapsed };
})();
