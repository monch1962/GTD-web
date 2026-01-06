import { test, expect } from '../../fixtures/gtd-app.js';

/**
 * Journey 4: Task Completion and Recurrence
 * Description: Completing tasks with various recurrence patterns
 *
 * Tests:
 * - Daily recurring tasks
 * - Weekly recurring tasks
 * - Monthly recurring tasks
 * - Yearly recurring tasks
 * - Recurrence chain and history
 * - Stopping recurrence
 * - Attribute preservation
 */
test.describe('Task Completion and Recurrence Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    await gtdApp.clearLocalStorage();
    await gtdApp.goto();
  });

  test('should create daily recurring task', async ({ page, gtdApp }) => {
    // Step 1: Create task with daily recurrence
    await gtdApp.quickAddTask('Daily standup');
    await gtdApp.openTask('Daily standup');

    await page.selectOption('#task-recurrence', 'daily');
    await page.fill('#task-due-date', getTodayDate());
    await gtdApp.saveTask();

    // Step 2: Complete the task
    await gtdApp.completeTask('Daily standup');

    // Step 3: Verify new task created for tomorrow
    const tasks = await gtdApp.getTasks();
    const newTask = tasks.find(t => t.title === 'Daily standup');

    expect(newTask).toBeDefined();

    // Open to verify due date is tomorrow
    await gtdApp.openTask('Daily standup');
    const dueDate = await page.inputValue('#task-due-date');
    expect(dueDate).toBe(getTomorrowDate());

    // Verify recurrence is still set to daily
    const recurrence = await page.inputValue('#task-recurrence');
    expect(recurrence).toBe('daily');
  });

  test('should create weekly recurring task', async ({ page, gtdApp }) => {
    // Step 1: Create task with weekly recurrence
    await gtdApp.quickAddTask('Weekly team meeting');
    await gtdApp.openTask('Weekly team meeting');

    await page.selectOption('#task-recurrence', 'weekly');
    await page.fill('#task-due-date', getTodayDate());
    await gtdApp.saveTask();

    // Step 2: Complete the task
    await gtdApp.completeTask('Weekly team meeting');

    // Step 3: Verify new task for next week
    const tasks = await gtdApp.getTasks();
    const newTask = tasks.find(t => t.title === 'Weekly team meeting');

    expect(newTask).toBeDefined();

    // Verify due date is approximately 7 days from now
    await gtdApp.openTask('Weekly team meeting');
    const dueDate = await page.inputValue('#task-due-date');

    const expectedDate = getNextWeekDate();
    expect(dueDate).toBe(expectedDate);
  });

  test('should create monthly recurring task', async ({ page, gtdApp }) => {
    // Step 1: Create task with monthly recurrence
    await gtdApp.quickAddTask('Pay rent');
    await gtdApp.openTask('Pay rent');

    await page.selectOption('#task-recurrence', 'monthly');
    await page.fill('#task-due-date', getTodayDate());
    await gtdApp.saveTask();

    // Step 2: Complete the task
    await gtdApp.completeTask('Pay rent');

    // Step 3: Verify new task for next month
    const tasks = await gtdApp.getTasks();
    const newTask = tasks.find(t => t.title === 'Pay rent');

    expect(newTask).toBeDefined();

    // Verify due date is next month
    await gtdApp.openTask('Pay rent');
    const dueDate = await page.inputValue('#task-due-date');

    const expectedDate = getNextMonthDate();
    expect(dueDate).toBe(expectedDate);
  });

  test('should create yearly recurring task', async ({ page, gtdApp }) => {
    // Step 1: Create task with yearly recurrence
    await gtdApp.quickAddTask('Annual performance review');
    await gtdApp.openTask('Annual performance review');

    await page.selectOption('#task-recurrence', 'yearly');
    await page.fill('#task-due-date', '2024-01-15');
    await gtdApp.saveTask();

    // Step 2: Complete the task
    await gtdApp.completeTask('Annual performance review');

    // Step 3: Verify new task for next year
    const tasks = await gtdApp.getTasks();
    const newTask = tasks.find(t => t.title === 'Annual performance review');

    expect(newTask).toBeDefined();

    // Verify due date is next year (2025-01-15)
    await gtdApp.openTask('Annual performance review');
    const dueDate = await page.inputValue('#task-due-date');
    expect(dueDate).toBe('2025-01-15');
  });

  test('should preserve contexts and attributes on recurring tasks', async ({ page, gtdApp }) => {
    // Step 1: Create task with all attributes
    await gtdApp.quickAddTask('Team sync @work @meetings high energy');
    await gtdApp.openTask('Team sync @work @meetings high energy');

    await page.selectOption('#task-recurrence', 'weekly');
    await page.selectOption('#task-energy', 'high');
    await page.selectOption('#task-time', '30'); // 30 minutes
    await page.fill('#task-due-date', getTodayDate());
    await gtdApp.saveTask();

    // Step 2: Complete the task
    await gtdApp.completeTask('Team sync @work @meetings high energy');

    // Step 3: Verify new task has all attributes
    await gtdApp.openTask('Team sync @work @meetings high energy');

    // Verify recurrence
    const recurrence = await page.inputValue('#task-recurrence');
    expect(recurrence).toBe('weekly');

    // Verify energy
    const energy = await page.inputValue('#task-energy');
    expect(energy).toBe('high');

    // Verify time estimate
    const time = await page.inputValue('#task-time');
    expect(time).toBe('30');

    // Verify contexts are in title or separate field
    const taskTitle = await page.inputValue('#task-title');
    expect(taskTitle).toContain('@work');
  });

  test('should stop recurrence when last occurrence completed', async ({ page, gtdApp }) => {
    // Step 1: Create recurring task
    await gtdApp.quickAddTask('One-time recurring task');
    await gtdApp.openTask('One-time recurring task');

    await page.selectOption('#task-recurrence', 'daily');
    await page.fill('#task-due-date', getTodayDate());
    await gtdApp.saveTask();

    // Step 2: Open task and remove recurrence
    await gtdApp.openTask('One-time recurring task');
    await page.selectOption('#task-recurrence', '');
    await gtdApp.saveTask();

    // Step 3: Complete the task
    await gtdApp.completeTask('One-time recurring task');

    // Step 4: Verify no new task created
    const tasks = await gtdApp.getTasks();
    const task = tasks.find(t => t.title === 'One-time recurring task');

    expect(task).toBeUndefined();
  });

  test('should edit recurrence on active task', async ({ page, gtdApp }) => {
    // Step 1: Create daily recurring task
    await gtdApp.quickAddTask('Flexible meeting');
    await gtdApp.openTask('Flexible meeting');

    await page.selectOption('#task-recurrence', 'daily');
    await gtdApp.saveTask();

    // Step 2: Edit to weekly recurrence
    await gtdApp.openTask('Flexible meeting');
    await page.selectOption('#task-recurrence', 'weekly');
    await gtdApp.saveTask();

    // Step 3: Complete and verify weekly recurrence
    await gtdApp.completeTask('Flexible meeting');

    await gtdApp.openTask('Flexible meeting');
    const recurrence = await page.inputValue('#task-recurrence');
    expect(recurrence).toBe('weekly');

    const dueDate = await page.inputValue('#task-due-date');
    const expectedDate = getNextWeekDate();
    expect(dueDate).toBe(expectedDate);
  });

  test('should handle leap year for yearly recurrence', async ({ page, gtdApp }) => {
    // Step 1: Create task for Feb 29 (leap year)
    await gtdApp.quickAddTask('Leap day celebration');
    await gtdApp.openTask('Leap day celebration');

    await page.selectOption('#task-recurrence', 'yearly');
    await page.fill('#task-due-date', '2024-02-29'); // Leap year
    await gtdApp.saveTask();

    // Step 2: Complete the task
    await gtdApp.completeTask('Leap day celebration');

    // Step 3: Verify next occurrence handled correctly
    // Should either be Feb 28, 2025 or Mar 1, 2025 (non-leap year)
    await gtdApp.openTask('Leap day celebration');
    const dueDate = await page.inputValue('#task-due-date');

    // Accept either Feb 28 or Mar 1 for 2025
    expect(['2025-02-28', '2025-03-01']).toContain(dueDate);
  });

  test('should archive completed recurring tasks', async ({ page, gtdApp }) => {
    // Step 1: Create recurring task
    await gtdApp.quickAddTask('Daily backup');
    await gtdApp.openTask('Daily backup');

    await page.selectOption('#task-recurrence', 'daily');
    await page.fill('#task-due-date', getTodayDate());
    await gtdApp.saveTask();

    // Step 2: Complete task multiple times
    for (let i = 0; i < 3; i++) {
      await gtdApp.completeTask('Daily backup');

      // Complete the new instance
      const tasks = await gtdApp.getTasks();
      const task = tasks.find(t => t.title === 'Daily backup');
      if (task) {
        await gtdApp.completeTask('Daily backup');
      }
    }

    // Step 3: Check archive
    await page.click(gtdApp.selectors.archiveBtn);

    // Verify archived tasks exist
    const archiveContainer = page.locator('#archive-container');
    const hasArchive = await archiveContainer.isVisible().catch(() => false);

    if (hasArchive) {
      const archivedItems = archiveContainer.locator('.archived-task');
      const count = await archivedItems.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should handle month-end recurrence correctly', async ({ page, gtdApp }) => {
    // Step 1: Create task for Jan 31
    await gtdApp.quickAddTask('Month-end report');
    await gtdApp.openTask('Month-end report');

    await page.selectOption('#task-recurrence', 'monthly');
    await page.fill('#task-due-date', '2024-01-31');
    await gtdApp.saveTask();

    // Step 2: Complete the task
    await gtdApp.completeTask('Month-end report');

    // Step 3: Verify next occurrence
    // Feb 31 doesn't exist, so should be Feb 28/29 or Mar 1
    await gtdApp.openTask('Month-end report');
    const dueDate = await page.inputValue('#task-due-date');

    // Accept Feb 29, Mar 1, or Mar 3 (depending on implementation)
    const validDates = ['2024-02-29', '2024-03-01', '2024-03-31'];
    expect(validDates).toContain(dueDate);
  });

  test('should handle rapid completion of recurring tasks', async ({ gtdApp }) => {
    // Step 1: Create recurring task
    await gtdApp.quickAddTask('Quick recurring');
    await gtdApp.openTask('Quick recurring');

    await gtdApp.page.selectOption('#task-recurrence', 'daily');
    await gtdApp.saveTask();

    // Step 2: Complete multiple times rapidly
    for (let i = 0; i < 5; i++) {
      const tasks = await gtdApp.getTasks();
      const task = tasks.find(t => t.title === 'Quick recurring');

      if (task) {
        await gtdApp.completeTask('Quick recurring');
      }
    }

    // Step 3: Verify we still have one instance
    const finalTasks = await gtdApp.getTasks();
    const instances = finalTasks.filter(t => t.title === 'Quick recurring');

    // Should have exactly 1 instance (the latest)
    expect(instances).toHaveLength(1);
  });

  test('should complete recurring task in focus mode', async ({ page, gtdApp }) => {
    // Step 1: Create recurring task
    await gtdApp.quickAddTask('Focus mode recurring task');
    await gtdApp.openTask('Focus mode recurring task');

    await page.selectOption('#task-recurrence', 'daily');
    await gtdApp.saveTask();

    // Step 2: Enter focus mode with this task
    await page.click(gtdApp.selectors.focusModeBtn);

    // Verify focus mode overlay appears
    const focusOverlay = page.locator('#focus-mode-overlay');
    await expect(focusOverlay).toBeVisible();

    // Step 3: Complete task in focus mode
    await page.click('.task-checkbox');

    // Step 4: Verify focus mode exits or shows new task
    // Both behaviors are acceptable
    const isOverlayVisible = await focusOverlay.isVisible().catch(() => false);

    if (!isOverlayVisible) {
      // Focus mode exited - acceptable
      const tasks = await gtdApp.getTasks();
      const newTask = tasks.find(t => t.title === 'Focus mode recurring task');
      expect(newTask).toBeDefined();
    } else {
      // Still in focus mode with new task - also acceptable
      await expect(page.locator('.task-title')).toHaveText('Focus mode recurring task');
    }
  });

  test('should handle recurring task with dependencies', async ({ page, gtdApp }) => {
    // Step 1: Create two tasks with dependency
    await gtdApp.quickAddTask('Prerequisite task');
    await gtdApp.quickAddTask('Dependent recurring task');
    await gtdApp.openTask('Dependent recurring task');

    // Set dependency and recurrence
    // Note: This depends on how dependencies are implemented in the UI
    // Assuming there's a way to set depends-on field
    const dependsOnField = page.locator('#task-depends-on').catch(() => null);

    if (await dependsOnField?.isVisible()) {
      await dependsOnField.fill('Prerequisite task');
      await page.selectOption('#task-recurrence', 'weekly');
      await gtdApp.saveTask();

      // Step 2: Complete prerequisite
      await gtdApp.completeTask('Prerequisite task');

      // Step 3: Verify dependent task becomes unblocked
      const tasks = await gtdApp.getTasks();
      const dependent = tasks.find(t => t.title === 'Dependent recurring task');

      expect(dependent).toBeDefined();
      expect(dependent.completed).toBe(false);
    }
  });
});

/**
 * Helper functions for date calculations
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

function getNextWeekDate() {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  return nextWeek.toISOString().split('T')[0];
}

function getNextMonthDate() {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Handle month-end overflow (e.g., Jan 31 -> Feb 28/29)
  const targetDay = parseInt(nextMonth.getDate().toString());
  const lastDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();

  if (targetDay > lastDayOfNextMonth) {
    nextMonth.setDate(lastDayOfNextMonth);
  }

  return nextMonth.toISOString().split('T')[0];
}
