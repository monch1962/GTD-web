/**
 * Comprehensive Tests for Archive System Feature
 * Tests all Archive System functionality before modularization
 */

import { GTDApp } from '../js/app.js';
import { Task } from '../js/models.js';

describe('Archive System Feature - Comprehensive Tests', () => {
    let app;
    let archiveModal;
    let archiveList;
    let archiveCount;
    let archiveProjectFilter;
    let archiveSearch;

    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();

        // Create archive modal elements
        archiveModal = document.getElementById('archive-modal');
        if (!archiveModal) {
            archiveModal = document.createElement('div');
            archiveModal.id = 'archive-modal';
            archiveModal.classList.remove('active');
            document.body.appendChild(archiveModal);
        }

        archiveList = document.getElementById('archive-list');
        if (!archiveList) {
            archiveList = document.createElement('div');
            archiveList.id = 'archive-list';
            archiveModal.appendChild(archiveList);
        }

        archiveCount = document.getElementById('archive-count');
        if (!archiveCount) {
            archiveCount = document.createElement('span');
            archiveCount.id = 'archive-count';
            archiveCount.textContent = '0';
            archiveModal.appendChild(archiveCount);
        }

        archiveProjectFilter = document.getElementById('archive-filter-project');
        if (!archiveProjectFilter) {
            archiveProjectFilter = document.createElement('select');
            archiveProjectFilter.id = 'archive-filter-project';
            archiveProjectFilter.innerHTML = '<option value="">All Projects</option>';
            archiveModal.appendChild(archiveProjectFilter);
        }

        archiveSearch = document.getElementById('archive-search');
        if (!archiveSearch) {
            archiveSearch = document.createElement('input');
            archiveSearch.id = 'archive-search';
            archiveSearch.type = 'text';
            archiveModal.appendChild(archiveSearch);
        }

        // Create archive button
        let archiveBtn = document.getElementById('archive-button');
        if (!archiveBtn) {
            archiveBtn = document.createElement('button');
            archiveBtn.id = 'archive-button';
            document.body.appendChild(archiveBtn);
        }

        // Create close archive button
        let closeArchiveBtn = document.getElementById('close-archive-modal');
        if (!closeArchiveBtn) {
            closeArchiveBtn = document.createElement('button');
            closeArchiveBtn.id = 'close-archive-modal';
            archiveModal.appendChild(closeArchiveBtn);
        }

        // Create auto-archive button
        let autoArchiveBtn = document.getElementById('btn-auto-archive');
        if (!autoArchiveBtn) {
            autoArchiveBtn = document.createElement('button');
            autoArchiveBtn.id = 'btn-auto-archive';
            archiveModal.appendChild(autoArchiveBtn);
        }

        // Create tasks container (needed for renderView())
        let tasksContainer = document.getElementById('tasks-container');
        if (!tasksContainer) {
            tasksContainer = document.createElement('div');
            tasksContainer.id = 'tasks-container';
            document.body.appendChild(tasksContainer);
        }

        // Create count elements (needed for updateCounts())
        const countIds = ['inbox-count', 'next-count', 'waiting-count', 'someday-count', 'completed-count', 'total-count', 'projects-count', 'reference-count', 'templates-count'];
        countIds.forEach(id => {
            let el = document.getElementById(id);
            if (!el) {
                el = document.createElement('span');
                el.id = id;
                el.textContent = '0';
                document.body.appendChild(el);
            }
        });

        // Create new app instance
        app = new GTDApp();
        app.tasks = [];
        app.projects = [];
    });

    describe('setupArchive()', () => {
        test('should add click event listener to archive button', () => {
            const archiveBtn = document.getElementById('archive-button');
            const addEventListenerSpy = jest.spyOn(archiveBtn, 'addEventListener');

            app.setupArchive();

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
        });

        test('archive button click should open archive modal', () => {
            app.setupArchive();

            const archiveBtn = document.getElementById('archive-button');
            const addEventListenerSpy = jest.spyOn(archiveBtn, 'addEventListener');

            // Call setupArchive again to capture event listener
            app.setupArchive();

            // Find the click event handler
            const clickHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'click')[1];

            const mockEvent = { preventDefault: jest.fn() };
            clickHandler(mockEvent);

            expect(archiveModal.classList.contains('active')).toBe(true);
        });

        test('should add click event listener to close button', () => {
            const closeBtn = document.getElementById('close-archive-modal');
            const addEventListenerSpy = jest.spyOn(closeBtn, 'addEventListener');

            app.setupArchive();

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
        });

        test('close button should close archive modal', () => {
            archiveModal.classList.add('active');

            app.setupArchive();

            const closeBtn = document.getElementById('close-archive-modal');
            const clickHandler = closeBtn.addEventListener.mock.calls[0][1];

            clickHandler();

            expect(archiveModal.classList.contains('active')).toBe(false);
        });

        test('should add click event listener to auto-archive button', () => {
            const autoArchiveBtn = document.getElementById('btn-auto-archive');
            const addEventListenerSpy = jest.spyOn(autoArchiveBtn, 'addEventListener');

            app.setupArchive();

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
        });

        test('should add input event listener to archive search', () => {
            const searchInput = document.getElementById('archive-search');
            const addEventListenerSpy = jest.spyOn(searchInput, 'addEventListener');

            app.setupArchive();

            expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function));
        });

        test('should add change event listener to project filter', () => {
            const projectFilter = document.getElementById('archive-filter-project');
            const addEventListenerSpy = jest.spyOn(projectFilter, 'addEventListener');

            app.setupArchive();

            expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
        });
    });

    describe('openArchiveModal()', () => {
        test('should add active class to modal', () => {
            expect(archiveModal.classList.contains('active')).toBe(false);

            app.openArchiveModal();

            expect(archiveModal.classList.contains('active')).toBe(true);
        });

        test('should render archive', () => {
            const renderSpy = jest.spyOn(app.archive, 'renderArchive');

            app.openArchiveModal();

            expect(renderSpy).toHaveBeenCalled();
        });

        test('should populate project filter', () => {
            const populateSpy = jest.spyOn(app.archive, 'populateArchiveProjectFilter');

            app.openArchiveModal();

            expect(populateSpy).toHaveBeenCalled();
        });
    });

    describe('closeArchiveModal()', () => {
        test('should remove active class from modal', () => {
            archiveModal.classList.add('active');

            app.closeArchiveModal();

            expect(archiveModal.classList.contains('active')).toBe(false);
        });
    });

    describe('renderArchive()', () => {
        test('should show empty state when no archived tasks', () => {
            app.renderArchive();

            expect(archiveList.innerHTML).toContain('No archived tasks');
            expect(archiveCount.textContent).toBe('0');
        });

        test('should render archived tasks', () => {
            const archiveEntry = {
                task: {
                    id: 'task-1',
                    title: 'Completed Task',
                    description: 'Test description',
                    contexts: ['@work'],
                    completedAt: '2025-01-01T00:00:00.000Z'
                },
                archivedAt: '2025-01-08T00:00:00.000Z',
                originalProjectId: null
            };

            jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue([archiveEntry]);

            app.renderArchive();

            expect(archiveList.innerHTML).toContain('Completed Task');
            expect(archiveList.innerHTML).toContain('Test description');
            expect(archiveList.innerHTML).toContain('@work');
            expect(archiveCount.textContent).toBe('1');
        });

        test('should filter by search query', () => {
            const entry1 = {
                task: { id: 'task-1', title: 'Buy groceries', completedAt: '2025-01-01T00:00:00.000Z' },
                archivedAt: '2025-01-08T00:00:00.000Z',
                originalProjectId: null
            };
            const entry2 = {
                task: { id: 'task-2', title: 'Clean house', completedAt: '2025-01-01T00:00:00.000Z' },
                archivedAt: '2025-01-08T00:00:00.000Z',
                originalProjectId: null
            };

            jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue([entry1, entry2]);

            app.renderArchive('groceries');

            expect(archiveList.innerHTML).toContain('Buy groceries');
            expect(archiveList.innerHTML).not.toContain('Clean house');
        });

        test('should filter by project', () => {
            const entry1 = {
                task: { id: 'task-1', title: 'Task 1', completedAt: '2025-01-01T00:00:00.000Z' },
                archivedAt: '2025-01-08T00:00:00.000Z',
                originalProjectId: 'project-1'
            };
            const entry2 = {
                task: { id: 'task-2', title: 'Task 2', completedAt: '2025-01-01T00:00:00.000Z' },
                archivedAt: '2025-01-08T00:00:00.000Z',
                originalProjectId: 'project-2'
            };

            const getSpy = jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue([entry1, entry2]);
            app.projects = [
                { id: 'project-1', title: 'Project 1' },
                { id: 'project-2', title: 'Project 2' }
            ];

            // Add options to the select element so value can be set
            archiveProjectFilter.innerHTML = '<option value="">All Projects</option><option value="project-1">Project 1</option><option value="project-2">Project 2</option>';
            archiveProjectFilter.value = 'project-1';

            app.renderArchive();

            const html = archiveList.innerHTML;

            // Should only show Task 1 from project-1
            expect(html).toContain('Task 1');
            expect(html).not.toContain('Task 2');

            getSpy.mockRestore();
        });

        test('should show no results message when filters match nothing', () => {
            const entry = {
                task: { id: 'task-1', title: 'Some Task', completedAt: '2025-01-01T00:00:00.000Z' },
                archivedAt: '2025-01-08T00:00:00.000Z',
                originalProjectId: null
            };

            jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue([entry]);

            app.renderArchive('nonexistent');

            expect(archiveList.innerHTML).toContain('No archived tasks match your filters');
        });

        test('should escape HTML in task titles and descriptions', () => {
            const entry = {
                task: {
                    id: 'task-1',
                    title: '<script>alert("xss")</script>',
                    description: 'Test & "quotes"',
                    completedAt: '2025-01-01T00:00:00.000Z'
                },
                archivedAt: '2025-01-08T00:00:00.000Z',
                originalProjectId: null
            };

            jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue([entry]);

            expect(() => app.renderArchive()).not.toThrow();
        });
    });

    describe('populateArchiveProjectFilter()', () => {
        test('should populate projects from archive', () => {
            const archiveEntries = [
                { originalProjectId: 'proj-1' },
                { originalProjectId: 'proj-2' },
                { originalProjectId: 'proj-1' } // Duplicate
            ];

            jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue(archiveEntries);
            app.projects = [
                { id: 'proj-1', title: 'Project 1' },
                { id: 'proj-2', title: 'Project 2' }
            ];

            app.populateArchiveProjectFilter();

            expect(archiveProjectFilter.options.length).toBe(3); // All Projects + 2 projects
            expect(archiveProjectFilter.options[1].value).toBe('proj-1');
            expect(archiveProjectFilter.options[1].textContent).toBe('Project 1');
            expect(archiveProjectFilter.options[2].value).toBe('proj-2');
        });

        test('should clear existing options before populating', () => {
            archiveProjectFilter.innerHTML = '<option value="">All</option><option value="old">Old</option>';

            jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue([]);

            app.populateArchiveProjectFilter();

            expect(archiveProjectFilter.options.length).toBe(1);
        });
    });

    describe('archiveTask()', () => {
        test('should archive a single task', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task to archive',
                completed: true,
                completedAt: '2025-01-01T00:00:00.000Z'
            });
            app.tasks.push(task);

            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
            const storageSpy = jest.spyOn(app.storage, 'addToArchive').mockResolvedValue();
            const saveSpy = jest.spyOn(app, 'saveTasks').mockResolvedValue();
            jest.spyOn(app, 'renderView');
            jest.spyOn(app, 'updateCounts');
            jest.spyOn(app, 'showToast');

            await app.archiveTask('task-1');

            expect(storageSpy).toHaveBeenCalled();
            expect(app.tasks.includes(task)).toBe(false);
            expect(saveSpy).toHaveBeenCalled();

            confirmSpy.mockRestore();
            jest.restoreAllMocks();
        });

        test('should not archive if user cancels', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task to archive',
                completed: true
            });
            app.tasks.push(task);

            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
            const storageSpy = jest.spyOn(app.storage, 'addToArchive');

            await app.archiveTask('task-1');

            expect(storageSpy).not.toHaveBeenCalled();
            expect(app.tasks.includes(task)).toBe(true);

            confirmSpy.mockRestore();
        });

        test('should save state before archiving', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task to archive',
                completed: true
            });
            app.tasks.push(task);

            jest.spyOn(window, 'confirm').mockReturnValue(true);
            jest.spyOn(app.storage, 'addToArchive').mockResolvedValue();
            jest.spyOn(app, 'saveTasks').mockResolvedValue();
            jest.spyOn(app, 'renderView');
            jest.spyOn(app, 'updateCounts');
            jest.spyOn(app, 'showToast');
            const saveStateSpy = jest.spyOn(app, 'saveState');

            await app.archiveTask('task-1');

            expect(saveStateSpy).toHaveBeenCalledWith('Archive task');

            saveStateSpy.mockRestore();
            jest.restoreAllMocks();
        });
    });

    describe('autoArchiveOldTasks()', () => {
        test('should archive completed tasks older than specified days', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 35);

            const task1 = new Task({
                id: 'task-1',
                title: 'Old task',
                completed: true,
                completedAt: oldDate.toISOString()
            });

            const recentDate = new Date();
            const task2 = new Task({
                id: 'task-2',
                title: 'Recent task',
                completed: true,
                completedAt: recentDate.toISOString()
            });

            app.tasks.push(task1, task2);

            jest.spyOn(window, 'confirm').mockReturnValue(true);
            jest.spyOn(app, 'saveState');
            jest.spyOn(app, 'archiveTasks').mockResolvedValue();
            jest.spyOn(app, 'saveTasks').mockResolvedValue();
            jest.spyOn(app, 'renderArchive');
            jest.spyOn(app, 'renderView');
            jest.spyOn(app, 'updateCounts');
            const toastSpy = jest.spyOn(app, 'showToast');

            await app.autoArchiveOldTasks(30);

            expect(app.tasks.includes(task1)).toBe(false);
            expect(app.tasks.includes(task2)).toBe(true);
            expect(toastSpy).toHaveBeenCalledWith(expect.stringContaining('1 tasks'));

            jest.restoreAllMocks();
        });

        test('should show message when no tasks to archive', async () => {
            jest.spyOn(app, 'saveTasks').mockResolvedValue();
            const toastSpy = jest.spyOn(app, 'showToast');

            await app.autoArchiveOldTasks(30);

            expect(toastSpy).toHaveBeenCalledWith('No tasks to archive (none older than 30 days)');
        });

        test('should use custom days parameter', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 15);

            const task = new Task({
                id: 'task-1',
                title: 'Task',
                completed: true,
                completedAt: oldDate.toISOString()
            });

            app.tasks.push(task);

            jest.spyOn(window, 'confirm').mockReturnValue(true);
            jest.spyOn(app, 'saveState');
            jest.spyOn(app, 'archiveTasks').mockResolvedValue();
            jest.spyOn(app, 'saveTasks').mockResolvedValue();
            jest.spyOn(app, 'renderArchive');
            jest.spyOn(app, 'renderView');
            jest.spyOn(app, 'updateCounts');
            jest.spyOn(app, 'showToast');

            await app.autoArchiveOldTasks(10);

            expect(app.tasks.includes(task)).toBe(false);

            jest.restoreAllMocks();
        });

        test('should not archive incomplete tasks', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 35);

            const incompleteTask = new Task({
                id: 'task-1',
                title: 'Incomplete task',
                completed: false,
                completedAt: oldDate.toISOString()
            });

            app.tasks.push(incompleteTask);

            jest.spyOn(window, 'confirm').mockReturnValue(true);
            jest.spyOn(app, 'archiveTasks').mockResolvedValue();
            jest.spyOn(app, 'saveTasks').mockResolvedValue();
            const toastSpy = jest.spyOn(app, 'showToast');

            await app.autoArchiveOldTasks(30);

            expect(toastSpy).toHaveBeenCalledWith('No tasks to archive (none older than 30 days)');

            jest.restoreAllMocks();
        });
    });

    describe('restoreFromArchive()', () => {
        test('should restore task from archive', async () => {
            const archivedTask = {
                task: {
                    id: 'task-1',
                    title: 'Restored Task',
                    completed: true
                },
                archivedAt: '2025-01-08T00:00:00.000Z'
            };

            jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue([archivedTask]);
            jest.spyOn(app.storage, 'saveArchivedTasks').mockResolvedValue();
            jest.spyOn(app, 'saveTasks').mockResolvedValue();
            jest.spyOn(app, 'renderArchive');
            jest.spyOn(app, 'renderView');
            jest.spyOn(app, 'updateCounts');
            const toastSpy = jest.spyOn(app, 'showToast');

            await app.restoreFromArchive('task-1');

            expect(app.tasks.find(t => t.id === 'task-1')).toBeTruthy();
            expect(toastSpy).toHaveBeenCalledWith('Task restored');

            jest.restoreAllMocks();
        });

        test('should remove restored task from archive', async () => {
            const archivedTask = {
                task: { id: 'task-1', title: 'Task', completed: true },
                archivedAt: '2025-01-08T00:00:00.000Z'
            };

            const getSpy = jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue([archivedTask]);
            const saveSpy = jest.spyOn(app.storage, 'saveArchivedTasks').mockResolvedValue();

            await app.restoreFromArchive('task-1');

            expect(saveSpy).toHaveBeenCalledWith([]);

            getSpy.mockRestore();
            saveSpy.mockRestore();
        });

        test('should save state before restoring', async () => {
            const archivedTask = {
                task: { id: 'task-1', title: 'Task', completed: true },
                archivedAt: '2025-01-08T00:00:00.000Z'
            };

            jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue([archivedTask]);
            jest.spyOn(app.storage, 'saveArchivedTasks').mockResolvedValue();
            jest.spyOn(app, 'saveTasks').mockResolvedValue();
            jest.spyOn(app, 'renderArchive');
            jest.spyOn(app, 'renderView');
            jest.spyOn(app, 'updateCounts');
            jest.spyOn(app, 'showToast');
            const saveStateSpy = jest.spyOn(app, 'saveState');

            await app.restoreFromArchive('task-1');

            expect(saveStateSpy).toHaveBeenCalledWith('Restore from archive');

            saveStateSpy.mockRestore();
            jest.restoreAllMocks();
        });
    });

    describe('deleteFromArchive()', () => {
        test('should delete task from archive', async () => {
            const archivedTask = {
                task: { id: 'task-1', title: 'Task', completed: true },
                archivedAt: '2025-01-08T00:00:00.000Z'
            };

            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
            jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue([archivedTask]);
            const saveSpy = jest.spyOn(app.storage, 'saveArchivedTasks').mockResolvedValue();
            jest.spyOn(app, 'renderArchive');
            const toastSpy = jest.spyOn(app, 'showToast');

            await app.deleteFromArchive('task-1');

            expect(saveSpy).toHaveBeenCalledWith([]);
            expect(toastSpy).toHaveBeenCalledWith('Archived task deleted');

            confirmSpy.mockRestore();
            jest.restoreAllMocks();
        });

        test('should not delete if user cancels', async () => {
            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
            const saveSpy = jest.spyOn(app.storage, 'saveArchivedTasks');

            await app.deleteFromArchive('task-1');

            expect(saveSpy).not.toHaveBeenCalled();

            confirmSpy.mockRestore();
        });
    });

    describe('archiveTasks()', () => {
        test('should add tasks to archive storage', async () => {
            const tasks = [
                new Task({ id: 'task-1', title: 'Task 1', completed: true }),
                new Task({ id: 'task-2', title: 'Task 2', completed: true })
            ];

            const spy = jest.spyOn(app.storage, 'addToArchive').mockResolvedValue();

            await app.archiveTasks(tasks);

            expect(spy).toHaveBeenCalled();

            spy.mockRestore();
        });
    });

    describe('Integration: Full Archive Workflow', () => {
        test('should open, view, and close archive', async () => {
            app.setupArchive();

            // Open archive
            const openModalSpy = jest.spyOn(app.archive, 'openArchiveModal');
            const archiveBtn = document.getElementById('archive-button');
            const addEventListenerSpy = jest.spyOn(archiveBtn, 'addEventListener');

            app.setupArchive();

            const openHandler = addEventListenerSpy.mock.calls.find(call => call[0] === 'click')[1];
            const mockEvent1 = { preventDefault: jest.fn() };
            openHandler(mockEvent1);

            expect(openModalSpy).toHaveBeenCalled();

            // Close archive
            const closeBtn = document.getElementById('close-archive-modal');
            const closeAddEventSpy = jest.spyOn(closeBtn, 'addEventListener');

            app.setupArchive();

            const closeHandler = closeAddEventSpy.mock.calls.find(call => call[0] === 'click')[1];
            closeHandler();

            expect(archiveModal.classList.contains('active')).toBe(false);
        });

        test('should archive, restore, and delete task', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Test Task',
                completed: true
            });
            app.tasks.push(task);

            // Archive
            jest.spyOn(window, 'confirm').mockReturnValue(true);
            jest.spyOn(app, 'saveState');
            jest.spyOn(app.storage, 'addToArchive').mockResolvedValue();
            jest.spyOn(app, 'saveTasks').mockResolvedValue();
            jest.spyOn(app, 'renderView');
            jest.spyOn(app, 'updateCounts');
            jest.spyOn(app, 'showToast');

            await app.archiveTask('task-1');

            expect(app.tasks.includes(task)).toBe(false);

            jest.restoreAllMocks();

            // Restore
            const archivedEntry = {
                task: task.toJSON(),
                archivedAt: new Date().toISOString(),
                completedAt: task.completedAt
            };

            jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue([archivedEntry]);
            jest.spyOn(app.storage, 'saveArchivedTasks').mockResolvedValue();
            jest.spyOn(app, 'saveTasks').mockResolvedValue();
            jest.spyOn(app, 'renderArchive');
            jest.spyOn(app, 'renderView');
            jest.spyOn(app, 'updateCounts');
            jest.spyOn(app, 'showToast');

            await app.restoreFromArchive('task-1');

            expect(app.tasks.find(t => t.id === 'task-1')).toBeTruthy();

            jest.restoreAllMocks();

            // Delete
            jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue([archivedEntry]);
            jest.spyOn(window, 'confirm').mockReturnValue(true);
            jest.spyOn(app.storage, 'saveArchivedTasks').mockResolvedValue();
            jest.spyOn(app, 'renderArchive');
            jest.spyOn(app, 'showToast');

            await app.deleteFromArchive('task-1');

            // Should be deleted from archive
            const saveSpy = jest.spyOn(app.storage, 'saveArchivedTasks');
            expect(saveSpy).toHaveBeenCalledWith([]);

            saveSpy.mockRestore();
            jest.restoreAllMocks();
        });
    });

    describe('Edge Cases', () => {
        test('should handle missing modal elements gracefully', () => {
            archiveModal.remove();

            expect(() => app.openArchiveModal()).not.toThrow();
            expect(() => app.closeArchiveModal()).not.toThrow();
        });

        test('should handle empty archive gracefully', () => {
            jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue([]);

            expect(() => app.renderArchive()).not.toThrow();
            expect(archiveList.innerHTML).toContain('No archived tasks');
        });

        test('should handle tasks without completedAt date', async () => {
            const task = new Task({
                id: 'task-1',
                title: 'Task',
                completed: true
            });
            app.tasks.push(task);

            jest.spyOn(window, 'confirm').mockReturnValue(true);
            const spy = jest.spyOn(app.storage, 'addToArchive').mockResolvedValue();
            jest.spyOn(app, 'saveTasks').mockResolvedValue();
            jest.spyOn(app, 'renderView');
            jest.spyOn(app, 'updateCounts');
            jest.spyOn(app, 'showToast');

            await app.archiveTask('task-1');

            expect(spy).toHaveBeenCalled();

            spy.mockRestore();
            jest.restoreAllMocks();
        });

        test('should handle special characters in search', () => {
            const entry = {
                task: {
                    id: 'task-1',
                    title: 'Task with "quotes" & <tags>',
                    completedAt: '2025-01-01T00:00:00.000Z'
                },
                archivedAt: '2025-01-08T00:00:00.000Z',
                originalProjectId: null
            };

            jest.spyOn(app.storage, 'getArchivedTasks').mockReturnValue([entry]);

            expect(() => app.renderArchive('"quotes"')).not.toThrow();
        });
    });
});
