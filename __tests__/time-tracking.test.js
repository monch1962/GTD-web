/**
 * Comprehensive Tests for Time Tracking Feature
 */

import { TimeTrackingManager } from '../js/modules/features/time-tracking.js';
import { GTDApp } from '../js/app.js';

describe('TimeTrackingManager - Initialization', () => {
    let manager;
    let mockState;
    let mockApp;

    beforeEach(() => {
        localStorage.clear();

        mockState = {
            tasks: [],
            timerInterval: null,
            currentTimerTask: null,
            timerStartTime: null
        };

        mockApp = new GTDApp();
        manager = new TimeTrackingManager(mockState, mockApp);
    });

    test('should initialize successfully', () => {
        expect(manager).toBeDefined();
        expect(manager.state).toBe(mockState);
    });

    test('should initialize timer state properties', () => {
        expect(mockState.timerInterval).toBeNull();
        expect(mockState.currentTimerTask).toBeNull();
        expect(mockState.timerStartTime).toBeNull();
    });
});

describe('TimeTrackingManager - Start Timer', () => {
    let manager;
    let mockState;
    let mockApp;

    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = '';
        jest.useFakeTimers();

        mockState = {
            tasks: [
                { id: 'task1', title: 'Task 1', completed: false, timeSpent: 0 },
                { id: 'task2', title: 'Task 2', completed: false, timeSpent: 30 }
            ],
            timerInterval: null,
            currentTimerTask: null,
            timerStartTime: null
        };

        mockApp = new GTDApp();
        mockApp.saveTasks = jest.fn().mockResolvedValue(undefined);
        mockApp.renderView = jest.fn();
        mockApp.showToast = jest.fn();

        manager = new TimeTrackingManager(mockState, mockApp);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.useRealTimers();
    });

    describe('startTaskTimer()', () => {
        test('should start timer for valid task', () => {
            manager.startTaskTimer('task1');

            expect(mockState.currentTimerTask).toBe('task1');
            expect(mockState.timerStartTime).toBeDefined();
            expect(mockState.timerInterval).not.toBeNull();
        });

        test('should not start timer for non-existent task', () => {
            manager.startTaskTimer('nonexistent');

            expect(mockState.currentTimerTask).toBeNull();
            expect(mockState.timerStartTime).toBeNull();
        });

        test('should stop existing timer before starting new one', () => {
            mockState.timerInterval = setInterval(() => {}, 1000);
            mockState.currentTimerTask = 'task1';

            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

            manager.startTaskTimer('task2');

            expect(clearIntervalSpy).toHaveBeenCalled();
            expect(mockState.currentTimerTask).toBe('task2');

            clearIntervalSpy.mockRestore();
        });

        test('should update timer button UI', () => {
            // Create task element with timer button
            const taskItem = document.createElement('div');
            taskItem.dataset.taskId = 'task1';

            const timerBtn = document.createElement('button');
            timerBtn.className = 'btn-timer';
            timerBtn.innerHTML = '<i class="fas fa-play"></i>';
            taskItem.appendChild(timerBtn);

            document.body.appendChild(taskItem);

            manager.startTaskTimer('task1');

            expect(timerBtn.classList.contains('active')).toBe(true);
            expect(timerBtn.innerHTML).toContain('fa-stop');
        });

        test('should update timer display every second', () => {
            const taskItem = document.createElement('div');
            taskItem.dataset.taskId = 'task1';

            const timerDisplay = document.createElement('span');
            timerDisplay.className = 'timer-display';
            taskItem.appendChild(timerDisplay);

            document.body.appendChild(taskItem);

            manager.startTaskTimer('task1');

            // Fast-forward 1 second
            jest.advanceTimersByTime(1000);

            expect(timerDisplay.textContent).toBe('0:01');

            // Fast-forward another 59 seconds
            jest.advanceTimersByTime(59000);

            expect(timerDisplay.textContent).toBe('1:00');
        });

        test('should format time correctly', () => {
            const taskItem = document.createElement('div');
            taskItem.dataset.taskId = 'task1';

            const timerDisplay = document.createElement('span');
            timerDisplay.className = 'timer-display';
            taskItem.appendChild(timerDisplay);

            document.body.appendChild(taskItem);

            manager.startTaskTimer('task1');

            // Test at various intervals
            jest.advanceTimersByTime(3000);
            expect(timerDisplay.textContent).toBe('0:03');

            jest.advanceTimersByTime(57000);
            expect(timerDisplay.textContent).toBe('1:00');

            jest.advanceTimersByTime(60000);
            expect(timerDisplay.textContent).toBe('2:00');
        });

        test('should show toast notification', () => {
            manager.startTaskTimer('task1');

            expect(mockApp.showToast).toHaveBeenCalledWith('Timer started', 'info');
        });
    });
});

describe('TimeTrackingManager - Stop Timer', () => {
    let manager;
    let mockState;
    let mockApp;

    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = '';
        jest.useFakeTimers();

        mockState = {
            tasks: [
                { id: 'task1', title: 'Task 1', completed: false, timeSpent: 0 }
            ],
            timerInterval: null,
            currentTimerTask: null,
            timerStartTime: null
        };

        mockApp = new GTDApp();
        mockApp.saveTasks = jest.fn().mockResolvedValue(undefined);
        mockApp.renderView = jest.fn();
        mockApp.showToast = jest.fn();

        manager = new TimeTrackingManager(mockState, mockApp);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.useRealTimers();
    });

    describe('stopTaskTimer()', () => {
        test('should stop active timer', async () => {
            // Start timer
            manager.startTaskTimer('task1');
            expect(mockState.timerInterval).not.toBeNull();

            // Stop timer
            await manager.stopTaskTimer();

            expect(mockState.timerInterval).toBeNull();
            expect(mockState.currentTimerTask).toBeNull();
            expect(mockState.timerStartTime).toBeNull();
        });

        test('should do nothing if no timer running', async () => {
            await manager.stopTaskTimer();

            expect(mockState.timerInterval).toBeNull();
            expect(mockState.currentTimerTask).toBeNull();
        });

        test('should add elapsed time to task.timeSpent', async () => {
            jest.useRealTimers(); // Use real timers for accurate timing

            manager.startTaskTimer('task1');

            // Wait 2 seconds
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Stop timer
            await manager.stopTaskTimer();

            // Should add at least 0 minutes (2 seconds < 1 minute)
            // The elapsed time is floored, so 2 seconds = 0 minutes
            expect(mockState.tasks[0].timeSpent).toBe(0);

            jest.useFakeTimers();
        });

        test('should accumulate time correctly', async () => {
            mockState.tasks[0].timeSpent = 30; // Already has 30 minutes

            jest.useRealTimers();
            manager.startTaskTimer('task1');

            // Wait enough time to add 1 more minute
            await new Promise(resolve => setTimeout(resolve, 65000));

            await manager.stopTaskTimer();

            // Should now have 31 minutes
            expect(mockState.tasks[0].timeSpent).toBe(31);

            jest.useFakeTimers();
        });

        test('should update task timestamp', async () => {
            manager.startTaskTimer('task1');

            await manager.stopTaskTimer();

            expect(mockState.tasks[0].updatedAt).toBeDefined();
        });

        test('should persist changes', async () => {
            manager.startTaskTimer('task1');

            await manager.stopTaskTimer();

            expect(mockApp.saveTasks).toHaveBeenCalled();
        });

        test('should update timer button UI', async () => {
            const taskItem = document.createElement('div');
            taskItem.dataset.taskId = 'task1';

            const timerBtn = document.createElement('button');
            timerBtn.className = 'btn-timer active';
            timerBtn.innerHTML = '<i class="fas fa-stop"></i>';
            taskItem.appendChild(timerBtn);

            document.body.appendChild(taskItem);

            manager.startTaskTimer('task1');

            await manager.stopTaskTimer();

            expect(timerBtn.classList.contains('active')).toBe(false);
            expect(timerBtn.innerHTML).toContain('fa-play');
        });

        test('should show toast with elapsed time', async () => {
            manager.startTaskTimer('task1');

            await manager.stopTaskTimer();

            expect(mockApp.showToast).toHaveBeenCalledWith(
                expect.stringContaining('Timer stopped'),
                'success'
            );
            expect(mockApp.showToast).toHaveBeenCalledWith(
                expect.stringContaining('minutes'),
                'success'
            );
        });
    });
});

describe('TimeTrackingManager - Timer State Management', () => {
    let manager;
    let mockState;
    let mockApp;

    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = '';
        jest.useFakeTimers();

        mockState = {
            tasks: [
                { id: 'task1', title: 'Task 1', completed: false, timeSpent: 0 },
                { id: 'task2', title: 'Task 2', completed: false, timeSpent: 0 }
            ],
            timerInterval: null,
            currentTimerTask: null,
            timerStartTime: null
        };

        mockApp = new GTDApp();
        mockApp.saveTasks = jest.fn().mockResolvedValue(undefined);
        mockApp.renderView = jest.fn();
        mockApp.showToast = jest.fn();

        manager = new TimeTrackingManager(mockState, mockApp);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.useRealTimers();
    });

    test('should handle switching between tasks', async () => {
        manager.startTaskTimer('task1');
        expect(mockState.currentTimerTask).toBe('task1');

        // Switch to task2
        await manager.stopTaskTimer();
        manager.startTaskTimer('task2');

        expect(mockState.currentTimerTask).toBe('task2');
    });

    test('should maintain separate time tracking for each task', async () => {
        jest.useRealTimers();

        // Track time on task1
        manager.startTaskTimer('task1');
        await new Promise(resolve => setTimeout(resolve, 1100));
        await manager.stopTaskTimer();

        // Track time on task2
        manager.startTaskTimer('task2');
        await new Promise(resolve => setTimeout(resolve, 1100));
        await manager.stopTaskTimer();

        // Each should have its own time
        expect(mockState.tasks[0].timeSpent).toBe(0); // 1.1s = 0 min
        expect(mockState.tasks[1].timeSpent).toBe(0); // 1.1s = 0 min

        jest.useFakeTimers();
    });

    test('should handle rapid start/stop cycles', async () => {
        manager.startTaskTimer('task1');
        await manager.stopTaskTimer();

        manager.startTaskTimer('task1');
        await manager.stopTaskTimer();

        manager.startTaskTimer('task2');
        await manager.stopTaskTimer();

        expect(mockState.currentTimerTask).toBeNull();
    });
});

describe('TimeTrackingManager - Edge Cases', () => {
    let manager;
    let mockState;
    let mockApp;

    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = '';
        jest.useFakeTimers();

        mockState = {
            tasks: [
                { id: 'task1', title: 'Task 1', completed: false, timeSpent: 0 }
            ],
            timerInterval: null,
            currentTimerTask: null,
            timerStartTime: null
        };

        mockApp = new GTDApp();
        mockApp.saveTasks = jest.fn().mockResolvedValue(undefined);
        mockApp.renderView = jest.fn();
        mockApp.showToast = jest.fn();

        manager = new TimeTrackingManager(mockState, mockApp);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.useRealTimers();
    });

    test('should handle tasks without DOM elements', () => {
        manager.startTaskTimer('task1');

        // Should not throw even without timer display element
        expect(mockState.currentTimerTask).toBe('task1');
    });

    test('should handle missing timer button gracefully', () => {
        // No DOM elements created

        expect(() => {
            manager.startTaskTimer('task1');
        }).not.toThrow();
    });

    test('should handle completed tasks', () => {
        mockState.tasks[0].completed = true;

        manager.startTaskTimer('task1');

        // Timer still starts even for completed tasks
        expect(mockState.currentTimerTask).toBe('task1');
    });

    test('should handle tasks with existing timeSpent', async () => {
        mockState.tasks[0].timeSpent = 120; // 2 hours

        manager.startTaskTimer('task1');
        await manager.stopTaskTimer();

        // Should accumulate, not replace
        expect(mockState.tasks[0].timeSpent).toBeGreaterThanOrEqual(120);
    });
});
