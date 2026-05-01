'use strict';

/**
 * timer.js — Manage per-task countdown intervals and time formatting.
 *
 * Elapsed time is the sum of:
 *   task.time          — accumulated seconds from previous sessions
 *   Date.now() - task.timerStart  — seconds since last start (when running)
 */
const Timer = (() => {
    /** Map of taskId → intervalId for all currently ticking tasks. */
    const _intervals = {};

    /** Format a total-seconds value as HH:MM:SS. */
    function formatTime(totalSeconds) {
        const t = Math.max(0, Math.floor(totalSeconds));
        const h = Math.floor(t / 3600);
        const m = Math.floor((t % 3600) / 60);
        const s = t % 60;
        return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
    }

    /** Get the current elapsed seconds for a task object. */
    function getElapsed(task) {
        if (task.timerStart != null) {
            return task.time + Math.floor((Date.now() - task.timerStart) / 1000);
        }
        return task.time;
    }

    /** Start the 1-second display interval for a task. */
    function startInterval(taskId, callback) {
        if (_intervals[taskId]) return;
        _intervals[taskId] = setInterval(() => callback(taskId), 1000);
    }

    /** Clear the display interval for a task. */
    function stopInterval(taskId) {
        if (_intervals[taskId]) {
            clearInterval(_intervals[taskId]);
            delete _intervals[taskId];
        }
    }

    /** Stop all running intervals except the given task. */
    function stopAllExcept(exceptId) {
        Object.keys(_intervals).forEach(id => {
            if (id !== exceptId) stopInterval(id);
        });
    }

    /** Returns true if a display interval is active for this task. */
    function hasInterval(taskId) {
        return !!_intervals[taskId];
    }

    return { formatTime, getElapsed, startInterval, stopInterval, stopAllExcept, hasInterval };
})();
