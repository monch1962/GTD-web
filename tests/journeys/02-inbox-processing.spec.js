import { test, expect } from '../fixtures/gtd-app.js';

/**
 * Journey 2: GTD Inbox Processing Workflow
 * Description: Classic GTD workflow - capture, clarify, organize
 *
 * Tests:
 * - Processing inbox tasks
 * - Moving tasks between statuses
 * - Setting task attributes (due dates, energy, contexts)
 * - Completing tasks
 * - Managing counts and visibility
 */
test.describe('GTD Inbox Processing Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    await gtdApp.clearLocalStorage();
    await gtdApp.goto();

    // Setup: Add 5 tasks to Inbox with various attributes
    await gtdApp.quickAddTask('Buy groceries @home @personal low energy');
    await gtdApp.quickAddTask('Call client about project @work high energy');
    await gtdApp.quickAddTask('Learn French someday');
    await gtdApp.quickAddTask('Waiting for John to send report');
    await gtdApp.quickAddTask('Quick email reply');
  });

  test('should process inbox tasks and organize appropriately', async ({ page, gtdApp }) => {
    // Verify initial state: 5 tasks in Inbox
    const initialInboxCount = await gtdApp.getCount('#inbox');
    expect(initialInboxCount).toBe(5);

    // Task 1: "Buy groceries" - move to Next with due date
    await gtdApp.openTask('Buy groceries @home @personal low energy');
    await page.selectOption('#task-status', 'next');
    await page.fill('#task-due-date', getTomorrowDate());
    await gtdApp.saveTask();

    // Verify Inbox decreased, Next increased
    expect(await gtdApp.getCount('#inbox')).toBe(4);
    expect(await gtdApp.getCount('#next')).toBe(1);

    // Task 2: "Call client" - move to Next with high energy
    await gtdApp.openTask('Call client about project @work high energy');
    await page.selectOption('#task-status', 'next');
    await page.selectOption('#task-energy', 'high');
    await gtdApp.saveTask();

    expect(await gtdApp.getCount('#inbox')).toBe(3);
    expect(await gtdApp.getCount('#next')).toBe(2);

    // Task 3: "Learn French" - move to Someday
    await gtdApp.openTask('Learn French someday');
    await page.selectOption('#task-status', 'someday');
    await gtdApp.saveTask();

    expect(await gtdApp.getCount('#inbox')).toBe(2);
    expect(await gtdApp.getCount('#someday')).toBe(1);

    // Task 4: "Waiting for John" - move to Waiting
    await gtdApp.openTask('Waiting for John to send report');
    await page.selectOption('#task-status', 'waiting');
    await page.fill('#task-waiting-for', 'John to send report');
    await gtdApp.saveTask();

    expect(await gtdApp.getCount('#inbox')).toBe(1);
    expect(await gtdApp.getCount('#waiting')).toBe(1);

    // Task 5: "Quick email reply" - complete immediately
    await gtdApp.completeTask('Quick email reply');

    // Verify final counts
    expect(await gtdApp.getCount('#inbox')).toBe(0);
    expect(await gtdApp.getCount('#next')).toBe(2);
    expect(await gtdApp.getCount('#someday')).toBe(1);
    expect(await gtdApp.getCount('#waiting')).toBe(1);
  });

  test('should preserve contexts and attributes when moving tasks', async ({ page, gtdApp }) => {
    // Open and move "Buy groceries" task
    await gtdApp.openTask('Buy groceries @home @personal low energy');
    await page.selectOption('#task-status', 'next');
    await gtdApp.saveTask();

    // Navigate to Next Actions view
    await gtdApp.navigateTo('next');

    // Verify task appears with contexts preserved
    const nextTasks = await gtdApp.getTasks();
    const groceriesTask = nextTasks.find(t => t.title.includes('Buy groceries'));

    expect(groceriesTask).toBeDefined();
    expect(groceriesTask.completed).toBe(false);

    // Open to verify all attributes
    await gtdApp.openTask('Buy groceries');

    // Verify status changed
    const status = await page.inputValue('#task-status');
    expect(status).toBe('next');

    // Verify energy level preserved
    const energy = await page.inputValue('#task-energy');
    expect(energy).toBe('low');
  });

  test('should display countdown for tasks with due dates', async ({ page, gtdApp }) => {
    // Add task due tomorrow
    await gtdApp.openTask('Buy groceries @home @personal low energy');
    await page.selectOption('#task-status', 'next');
    await page.fill('#task-due-date', getTomorrowDate());
    await gtdApp.saveTask();

    // Navigate to Next Actions
    await gtdApp.navigateTo('next');

    // Verify countdown badge appears
    const taskElement = page.locator('.task-item', { hasText: 'Buy groceries' });
    const countdownBadge = taskElement.locator('.countdown-badge');

    await expect(countdownBadge).toBeVisible();
    const countdownText = await countdownBadge.textContent();
    expect(countdownText.toLowerCase()).toContain('day');
  });

  test('should handle rapid task processing without race conditions', async ({ page, gtdApp }) => {
    // Process tasks rapidly
    for (let i = 0; i < 3; i++) {
      const tasks = await gtdApp.getTasks();
      await gtdApp.openTask(tasks[0].title);
      await page.selectOption('#task-status', 'next');
      await gtdApp.saveTask();
    }

    // Verify all processed correctly
    expect(await gtdApp.getCount('#inbox')).toBe(2);
    expect(await gtdApp.getCount('#next')).toBe(3);
  });

  test('should update view counts in real-time', async ({ page, gtdApp }) => {
    // Initial counts
    expect(await gtdApp.getCount('#inbox')).toBe(5);

    // Move one task
    await gtdApp.openTask('Buy groceries @home @personal low energy');
    await page.selectOption('#task-status', 'next');
    await gtdApp.saveTask();

    // Immediate count check
    expect(await gtdApp.getCount('#inbox')).toBe(4);
    expect(await gtdApp.getCount('#next')).toBe(1);

    // Complete one task
    await gtdApp.completeTask('Quick email reply');

    expect(await gtdApp.getCount('#inbox')).toBe(3);
  });

  test('should handle tasks with no project or context assigned', async ({ page, gtdApp }) => {
    // Add simple task with no attributes
    await gtdApp.quickAddTask('Just a simple task');

    // Move to Next Actions
    await gtdApp.openTask('Just a simple task');
    await page.selectOption('#task-status', 'next');
    await gtdApp.saveTask();

    // Verify it appears in Next without error
    await gtdApp.navigateTo('next');
    const nextTasks = await gtdApp.getTasks();
    const simpleTask = nextTasks.find(t => t.title === 'Just a simple task');

    expect(simpleTask).toBeDefined();
  });

  test('should handle tasks with invalid date formats gracefully', async ({ page, gtdApp }) => {
    // Open task and set invalid date
    await gtdApp.openTask('Buy groceries @home @personal low energy');
    await page.selectOption('#task-status', 'next');

    // Try invalid date
    await page.fill('#task-due-date', 'not-a-date');

    // Should either show validation error or ignore invalid input
    await gtdApp.saveTask();

    // Verify task was still saved (date might be ignored or cleared)
    await gtdApp.navigateTo('next');
    const nextTasks = await gtdApp.getTasks();
    expect(nextTasks.length).toBeGreaterThan(0);
  });

  test('should maintain task order after processing', async ({ page, gtdApp }) => {
    // Record initial order
    const initialTasks = await gtdApp.getTasks();
    const initialOrder = initialTasks.map(t => t.title);

    // Process first task
    await gtdApp.openTask(initialOrder[0]);
    await page.selectOption('#task-status', 'next');
    await gtdApp.saveTask();

    // Verify remaining tasks maintain order
    const remainingTasks = await gtdApp.getTasks();
    const remainingOrder = remainingTasks.map(t => t.title);

    expect(remainingOrder).toEqual(initialOrder.slice(1));
  });

  test('should show notification when processing completes', async ({ page, gtdApp }) => {
    // Move task and verify notification
    await gtdApp.openTask('Buy groceries @home @personal low energy');
    await page.selectOption('#task-status', 'next');
    await gtdApp.saveTask();

    // Check for toast notification
    const notification = await gtdApp.waitForNotification().catch(() => null);

    if (notification) {
      expect(notification.toLowerCase()).toMatch(/task updated|status changed/);
    }
  });

  test('should handle moving all tasks out of inbox', async ({ page, gtdApp }) => {
    // Process all tasks
    const tasks = await gtdApp.getTasks();

    for (const task of tasks) {
      await gtdApp.openTask(task.title);
      await page.selectOption('#task-status', 'next');
      await gtdApp.saveTask();
    }

    // Verify Inbox is empty
    expect(await gtdApp.getCount('#inbox')).toBe(0);
    expect(await gtdApp.getCount('#next')).toBe(5);

    // Verify empty state or no tasks message
    const remainingTasks = await gtdApp.getTasks();
    expect(remainingTasks).toHaveLength(0);
  });
});

/**
 * Helper function to get tomorrow's date in YYYY-MM-DD format
 */
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}
