'use strict';

/**
 * app.js — State management, event handling, and initialisation.
 *
 * appData  — persisted to localStorage (groups / tasks / timer state)
 * uiState  — transient edit/create mode flags (not persisted)
 */

let appData = { groups: [] };

let uiState = {
    editingGroupId: null,        // id of group currently being edited
    editingTaskId: null,         // id of task currently being edited
    addingGroup: false,          // true when new-group form is visible
    addingTaskToGroupId: null,   // groupId when new-task form is visible
    collapsedGroups: new Set(),  // set of group ids that are collapsed
};

// ── Helpers ────────────────────────────────────────────────────────────────

function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function resetUI() {
    return {
        editingGroupId: null,
        editingTaskId: null,
        addingGroup: false,
        addingTaskToGroupId: null,
        collapsedGroups: uiState.collapsedGroups,  // preserve across resets
    };
}

function findGroup(id) {
    return appData.groups.find(g => g.id === id) || null;
}

function findTask(id) {
    for (const group of appData.groups) {
        const task = group.tasks.find(t => t.id === id);
        if (task) return { task, group };
    }
    return null;
}

function saveAndRender() {
    Storage.save(appData);
    UI.render(appData, uiState);
}

// ── Timer tick (called by interval every second) ───────────────────────────

function onTimerTick(taskId) {
    const found = findTask(taskId);
    if (found) {
        UI.updateTimerDisplay(taskId, Timer.getElapsed(found.task));
    }
}

// ── Group handlers ─────────────────────────────────────────────────────────

function handleToggleGroup(groupId) {
    if (uiState.collapsedGroups.has(groupId)) {
        uiState.collapsedGroups.delete(groupId);
    } else {
        uiState.collapsedGroups.add(groupId);
    }
    Storage.saveCollapsed(uiState.collapsedGroups);
    UI.render(appData, uiState);
}

function handleAddGroup() {
    uiState = { ...resetUI(), addingGroup: true };
    UI.render(appData, uiState);
    document.getElementById('group-name-input')?.focus();
}

function handleSaveNewGroup() {
    const input = document.getElementById('group-name-input');
    const name = (input?.value ?? '').trim();
    if (!name) { input?.focus(); return; }

    appData.groups.push({ id: genId(), name, tasks: [] });
    uiState = resetUI();
    saveAndRender();
}

function handleSaveEditGroup(groupId) {
    const input = document.getElementById('group-name-input');
    const name = (input?.value ?? '').trim();
    if (!name) { input?.focus(); return; }

    const group = findGroup(groupId);
    if (group) group.name = name;
    uiState = resetUI();
    saveAndRender();
}

function handleEditGroup(groupId) {
    uiState = { ...resetUI(), editingGroupId: groupId };
    UI.render(appData, uiState);
    document.getElementById('group-name-input')?.focus();
}

function handleDeleteGroup(groupId) {
    if (!confirm('Delete this group and all its tasks?')) return;

    const group = findGroup(groupId);
    if (group) group.tasks.forEach(t => Timer.stopInterval(t.id));

    appData.groups = appData.groups.filter(g => g.id !== groupId);
    uiState = resetUI();
    saveAndRender();
}

function handleCancelGroup() {
    uiState = resetUI();
    UI.render(appData, uiState);
}

// ── Task handlers ──────────────────────────────────────────────────────────

function handleAddTask(groupId) {
    uiState = { ...resetUI(), addingTaskToGroupId: groupId };
    UI.render(appData, uiState);
    document.querySelector('.task-name-input')?.focus();
}

/** Reads the single visible task form from the DOM. */
function getTaskFormValues() {
    const form = document.querySelector('.task-form');
    if (!form) return null;
    return {
        name: (form.querySelector('.task-name-input')?.value ?? '').trim(),
        url: (form.querySelector('.task-url-input')?.value ?? '').trim(),
        description: form.querySelector('.task-desc-input')?.value ?? '',
    };
}

function handleSaveNewTask(groupId) {
    const values = getTaskFormValues();
    if (!values || !values.name) { document.querySelector('.task-name-input')?.focus(); return; }

    const group = findGroup(groupId);
    if (!group) return;

    group.tasks.push({
        id: genId(),
        name: values.name,
        url: values.url,
        description: values.description,
        time: 0,
        timerStart: null,
    });

    uiState = resetUI();
    saveAndRender();
}

function handleSaveEditTask(groupId, taskId) {
    const values = getTaskFormValues();
    if (!values || !values.name) { document.querySelector('.task-name-input')?.focus(); return; }

    const found = findTask(taskId);
    if (!found) return;

    found.task.name = values.name;
    found.task.url = values.url;
    found.task.description = values.description;

    uiState = resetUI();
    saveAndRender();
}

function handleEditTask(taskId) {
    uiState = { ...resetUI(), editingTaskId: taskId };
    UI.render(appData, uiState);
    document.querySelector('.task-name-input')?.focus();
}

function handleDeleteTask(groupId, taskId) {
    if (!confirm('Delete this task?')) return;

    Timer.stopInterval(taskId);

    const group = findGroup(groupId);
    if (group) group.tasks = group.tasks.filter(t => t.id !== taskId);

    uiState = resetUI();
    saveAndRender();
}

function handleCancelTask() {
    uiState = resetUI();
    UI.render(appData, uiState);
}

// ── Timer handlers ─────────────────────────────────────────────────────────

function handleStartTimer(taskId) {
    const now = Date.now();

    // Stop every other running timer and bank their accumulated time
    appData.groups.forEach(group => {
        group.tasks.forEach(task => {
            if (task.id !== taskId && task.timerStart != null) {
                Timer.stopInterval(task.id);
                task.time += Math.floor((now - task.timerStart) / 1000);
                task.timerStart = null;
            }
        });
    });

    const found = findTask(taskId);
    if (!found) return;

    found.task.timerStart = now;
    Timer.startInterval(taskId, onTimerTick);
    saveAndRender();
}

function handleStopTimer(taskId) {
    const now = Date.now();
    const found = findTask(taskId);
    if (!found) return;

    Timer.stopInterval(taskId);

    if (found.task.timerStart != null) {
        found.task.time += Math.floor((now - found.task.timerStart) / 1000);
        found.task.timerStart = null;
    }

    saveAndRender();
}

// ── Event delegation ───────────────────────────────────────────────────────

document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const { action, groupId, taskId } = btn.dataset;

    switch (action) {
        case 'toggle-group': handleToggleGroup(groupId); break;
        case 'add-group': handleAddGroup(); break;
        case 'save-new-group': handleSaveNewGroup(); break;
        case 'save-edit-group': handleSaveEditGroup(groupId); break;
        case 'edit-group': handleEditGroup(groupId); break;
        case 'delete-group': handleDeleteGroup(groupId); break;
        case 'cancel-group': handleCancelGroup(); break;

        case 'add-task': handleAddTask(groupId); break;
        case 'save-new-task': handleSaveNewTask(groupId); break;
        case 'save-edit-task': handleSaveEditTask(groupId, taskId); break;
        case 'edit-task': handleEditTask(taskId); break;
        case 'delete-task': handleDeleteTask(groupId, taskId); break;
        case 'cancel-task': handleCancelTask(); break;

        case 'start-timer': handleStartTimer(taskId); break;
        case 'stop-timer': handleStopTimer(taskId); break;
    }
});

// Keyboard shortcuts: Enter to save, Escape to cancel
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'group-name-input') {
        e.preventDefault();
        if (uiState.addingGroup) handleSaveNewGroup();
        else if (uiState.editingGroupId) handleSaveEditGroup(uiState.editingGroupId);
    }

    if (e.key === 'Escape') {
        if (uiState.addingGroup || uiState.editingGroupId) handleCancelGroup();
        else if (uiState.addingTaskToGroupId || uiState.editingTaskId) handleCancelTask();
    }
});

// ── Init ───────────────────────────────────────────────────────────────────

function init() {
    appData = Storage.load();
    uiState.collapsedGroups = Storage.loadCollapsed();

    // Resume any timers that were still running when the page was last closed
    appData.groups.forEach(group => {
        group.tasks.forEach(task => {
            if (task.timerStart != null) {
                Timer.startInterval(task.id, onTimerTick);
            }
        });
    });

    UI.render(appData, uiState);
}

init();
