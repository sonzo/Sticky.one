'use strict';

/**
 * storage.js — Persist app data to localStorage.
 */
const Storage = (() => {
    const KEY = 'sticky_tasks_v1';
    const COLLAPSED_KEY = 'sticky_collapsed_v1';

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : { groups: [] };
        } catch (e) {
            console.error('[Storage] load failed:', e);
            return { groups: [] };
        }
    }

    function save(data) {
        try {
            localStorage.setItem(KEY, JSON.stringify(data));
        } catch (e) {
            console.error('[Storage] save failed:', e);
        }
    }

    function loadCollapsed() {
        try {
            const raw = localStorage.getItem(COLLAPSED_KEY);
            return raw ? new Set(JSON.parse(raw)) : new Set();
        } catch (e) {
            return new Set();
        }
    }

    function saveCollapsed(collapsedSet) {
        try {
            localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsedSet]));
        } catch (e) {
            console.error('[Storage] saveCollapsed failed:', e);
        }
    }

    return { load, save, loadCollapsed, saveCollapsed };
})();
