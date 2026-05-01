'use strict';

/**
 * ui.js — Pure rendering: turns app data + uiState into DOM nodes.
 *
 * Public API:
 *   UI.render(data, uiState)           — full re-render of #app
 *   UI.updateTimerDisplay(taskId, s)   — targeted time display update
 */
const UI = (() => {

    // ── Main render ────────────────────────────────────────────────────────────

    function render(data, uiState) {
        const app = document.getElementById('app');
        const frag = document.createDocumentFragment();

        if (data.groups.length === 0) {
            frag.appendChild(createEmptyState());
        } else {
            const grid = document.createElement('div');
            grid.className = 'group-grid';
            const sortedGroups = [...data.groups].sort((a, b) => a.name.localeCompare(b.name));
            sortedGroups.forEach(group => {
                grid.appendChild(createGroupView(group, uiState));
            });
            frag.appendChild(grid);
        }

        app.innerHTML = '';
        app.appendChild(frag);
    }

    // ── Empty state ────────────────────────────────────────────────────────────

    function createEmptyState() {
        const div = document.createElement('div');
        div.className = 'empty-state';
        const p = document.createElement('p');
        p.textContent = 'No groups yet — click "+ New Group" to get started.';
        div.appendChild(p);
        return div;
    }

    // ── Group form (create / edit) ─────────────────────────────────────────────

    function createGroupForm(group) {
        const isNew = group == null;

        const div = document.createElement('div');

        const h3 = document.createElement('h3');
        h3.textContent = isNew ? 'New Group' : 'Edit Group';
        div.appendChild(h3);

        const label = document.createElement('label');
        label.textContent = 'Group Name';
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'group-name-input';
        input.placeholder = 'e.g. Work, Personal…';
        input.value = isNew ? '' : group.name;
        label.appendChild(input);
        div.appendChild(label);

        const actions = document.createElement('div');
        actions.className = 'form-actions';
        const btnSave = mkBtn(
            isNew ? 'Create Group' : 'Save',
            '',
            isNew ? 'save-new-group' : 'save-edit-group',
            isNew ? {} : { groupId: group.id },
            isNew ? 'add' : 'check'
        );
        const btnCancel = mkBtn('Cancel', 'secondary outline', 'cancel-group', {}, 'close');
        actions.appendChild(btnSave);
        actions.appendChild(btnCancel);
        div.appendChild(actions);

        return div;
    }

    // ── Group view ─────────────────────────────────────────────────────────────

    function createGroupView(group, uiState) {
        const isCollapsed = uiState.collapsedGroups.has(group.id);

        const article = document.createElement('article');
        article.className = 'group-card';
        article.dataset.groupId = group.id;

        // Header: toggle chevron + name | (Edit / Delete stacked)
        const header = document.createElement('header');

        const headerLeft = document.createElement('div');
        headerLeft.className = 'group-header-left';
        const btnToggle = mkBtn(
            '',
            'outline secondary small group-toggle btn-icon',
            'toggle-group',
            { groupId: group.id },
            isCollapsed ? 'chevron_right' : 'expand_more'
        );
        headerLeft.appendChild(btnToggle);
        const h2 = document.createElement('h2');
        h2.textContent = group.name;
        headerLeft.appendChild(h2);
        header.appendChild(headerLeft);

        const groupActions = document.createElement('div');
        groupActions.className = 'group-actions';
        groupActions.appendChild(mkBtn('', 'outline secondary small btn-icon', 'edit-group', { groupId: group.id }, 'edit'));
        groupActions.appendChild(mkBtn('', 'outline contrast  small btn-icon', 'delete-group', { groupId: group.id }, 'delete'));
        header.appendChild(groupActions);
        article.appendChild(header);

        if (!isCollapsed) {
            if (group.tasks.length > 0) {
                const taskList = document.createElement('div');
                taskList.className = 'task-list';

                const sortedTasks = [...group.tasks].sort((a, b) => a.name.localeCompare(b.name));
                sortedTasks.forEach(task => {
                    taskList.appendChild(createTaskView(task, group.id));
                });

                article.appendChild(taskList);
            }

            // Footer: add-task button
            const footer = document.createElement('footer');
            footer.appendChild(mkBtn('Add Task', 'outline', 'add-task', { groupId: group.id }, 'add'));
            article.appendChild(footer);
        }

        return article;
    }

    // ── Task form (create / edit) ──────────────────────────────────────────────

    function createTaskForm(task, groupId) {
        const isNew = task == null;

        const div = document.createElement('div');

        const h4 = document.createElement('h4');
        h4.textContent = isNew ? 'New Task' : 'Edit Task';
        div.appendChild(h4);

        div.appendChild(mkLabeledInput('Task Name', 'text', 'task-name-input', 'Task name', isNew ? '' : task.name));
        div.appendChild(mkLabeledInput('URL', 'url', 'task-url-input', 'https://example.com', isNew ? '' : task.url));
        div.appendChild(mkLabeledTextarea('Description', 'task-desc-input', 'Task description…', isNew ? '' : task.description));

        const actions = document.createElement('div');
        actions.className = 'form-actions';

        const btnSave = mkBtn(
            isNew ? 'Create Task' : 'Save',
            '',
            isNew ? 'save-new-task' : 'save-edit-task',
            isNew ? { groupId } : { groupId, taskId: task.id },
            isNew ? 'add' : 'check'
        );
        const btnCancel = mkBtn('Cancel', 'secondary outline', 'cancel-task', {}, 'close');
        actions.appendChild(btnSave);
        actions.appendChild(btnCancel);
        div.appendChild(actions);

        return div;
    }

    // ── Task view ──────────────────────────────────────────────────────────────

    function createTaskView(task, groupId) {
        const isRunning = task.timerStart != null;

        const row = document.createElement('div');
        row.className = 'task-row';
        row.dataset.taskId = task.id;

        // Name cell
        const nameCell = document.createElement('div');
        nameCell.className = 'task-cell task-name-cell';
        nameCell.textContent = task.name;
        row.appendChild(nameCell);

        // Link cell
        const linkCell = document.createElement('div');
        linkCell.className = 'task-cell task-link-cell';
        if (task.url) {
            const a = document.createElement('a');
            a.href = task.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.setAttribute('aria-label', 'Open link');
            const linkIcon = document.createElement('span');
            linkIcon.className = 'material-icons';
            linkIcon.setAttribute('aria-hidden', 'true');
            linkIcon.textContent = 'link2';
            a.appendChild(linkIcon);
            linkCell.appendChild(a);
        }
        row.appendChild(linkCell);

        // Description cell (white-space: pre-wrap via CSS)
        const descCell = document.createElement('div');
        descCell.className = 'task-cell task-desc-cell';
        descCell.textContent = task.description || '';
        row.appendChild(descCell);

        // Time cell
        const timeCell = document.createElement('div');
        timeCell.className = 'task-cell task-time-cell';
        const timeDisplay = document.createElement('span');
        timeDisplay.className = 'time-display';
        timeDisplay.dataset.taskId = task.id;
        timeDisplay.textContent = Timer.formatTime(Timer.getElapsed(task));
        timeCell.appendChild(timeDisplay);
        row.appendChild(timeCell);

        // Timer button cell
        const timerCell = document.createElement('div');
        timerCell.className = 'task-cell task-timer-cell';
        const btnTimer = mkBtn(
            '',
            isRunning ? 'timer-stop btn-icon' : 'timer-start btn-icon',
            isRunning ? 'stop-timer' : 'start-timer',
            { taskId: task.id, groupId },
            isRunning ? 'stop' : 'play_arrow'
        );
        timerCell.appendChild(btnTimer);
        row.appendChild(timerCell);

        // Actions cell
        const actionsCell = document.createElement('div');
        actionsCell.className = 'task-cell task-actions-cell';
        actionsCell.appendChild(mkBtn('', 'outline secondary small btn-icon', 'edit-task', { taskId: task.id, groupId }, 'edit'));
        actionsCell.appendChild(mkBtn('', 'outline contrast small btn-icon', 'delete-task', { taskId: task.id, groupId }, 'delete'));
        row.appendChild(actionsCell);

        return row;
    }

    // ── DOM helpers ────────────────────────────────────────────────────────────

    function mkBtn(text, className, action, data = {}, icon = '') {
        const btn = document.createElement('button');
        if (icon) {
            const iconEl = document.createElement('span');
            iconEl.className = 'material-icons';
            iconEl.setAttribute('aria-hidden', 'true');
            iconEl.textContent = icon;
            btn.appendChild(iconEl);
            if (text) {
                const textEl = document.createElement('span');
                textEl.className = 'btn-text';
                textEl.textContent = text;
                btn.appendChild(textEl);
            } else {
                btn.setAttribute('aria-label', icon.replace(/_/g, ' '));
            }
        } else {
            btn.textContent = text;
        }
        if (className) btn.className = className;
        btn.dataset.action = action;
        Object.entries(data).forEach(([k, v]) => { btn.dataset[k] = v; });
        return btn;
    }

    function mkLabeledInput(labelText, type, className, placeholder, value) {
        const label = document.createElement('label');
        label.textContent = labelText;
        const input = document.createElement('input');
        input.type = type;
        input.className = className;
        input.placeholder = placeholder;
        input.value = value;
        label.appendChild(input);
        return label;
    }

    function mkLabeledTextarea(labelText, className, placeholder, value) {
        const label = document.createElement('label');
        label.textContent = labelText;
        const ta = document.createElement('textarea');
        ta.className = className;
        ta.placeholder = placeholder;
        ta.rows = 3;
        ta.value = value;
        label.appendChild(ta);
        return label;
    }

    // ── Modal ─────────────────────────────────────────────────────────────────────

    function openModal(contentNode) {
        const body = document.getElementById('app-modal-body');
        body.innerHTML = '';
        body.appendChild(contentNode);
        document.getElementById('app-modal').showModal();
    }

    function closeModal() {
        document.getElementById('app-modal').close();
        document.getElementById('app-modal-body').innerHTML = '';
    }

    // ── Targeted timer update (avoids full re-render every second) ─────────────

    function updateTimerDisplay(taskId, totalSeconds) {
        const el = document.querySelector(`.time-display[data-task-id="${taskId}"]`);
        if (el) el.textContent = Timer.formatTime(totalSeconds);
    }

    return { render, openModal, closeModal, createGroupForm, createTaskForm, updateTimerDisplay };
})();
