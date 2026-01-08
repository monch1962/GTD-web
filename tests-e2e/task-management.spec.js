/**
 * E2E Tests for Task Management
 * Tests critical task CRUD operations
 */

import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:8080');

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Clear any existing tasks for clean test
    await page.evaluate(() => {
      if (window.app && window.app.tasks) {
        window.app.tasks = [];
        window.app.saveTasks();
      }
    });

    // Wait for clear
    await page.waitForTimeout(100);
  });

  test('should create task via quick add', async ({ page }) => {
    // Find quick add input
    const quickAddInput = page.locator('#quick-add-input');
    await expect(quickAddInput).toBeVisible();

    // Type task with NLP parsing
    await quickAddInput.fill('Test task @work high priority');
    await quickAddInput.press('Enter');

    // Wait for task to appear
    await page.waitForTimeout(500);

    // Verify task created
    const taskTitle = page.locator('.task-title').first();
    await expect(taskTitle).toContainText('Test task');

    // Verify context badge
    const contextBadge = page.locator('.task-context').first();
    await expect(contextBadge).toContainText('@work');

    // Verify count updated
    const inboxCount = page.locator('#inbox-count');
    const countText = await inboxCount.textContent();
    expect(parseInt(countText || '0')).toBeGreaterThan(0);
  });

  test('should complete task via checkbox', async ({ page }) => {
    // Create a task first
    await page.fill('#quick-add-input', 'Task to complete');
    await page.press('#quick-add-input', 'Enter');
    await page.waitForTimeout(500);

    // Get initial count
    const initialCount = parseInt(await page.locator('#inbox-count').textContent() || '0');

    // Complete task
    const checkbox = page.locator('.task-checkbox').first();
    await checkbox.click();

    // Wait for update
    await page.waitForTimeout(300);

    // Verify task is completed (should disappear from active view)
    const tasks = page.locator('.task');
    const taskCount = await tasks.count();

    // Task should be gone from view
    expect(taskCount).toBe(initialCount - 1);
  });

  test('should edit task via modal', async ({ page }) => {
    // Create a task
    await page.fill('#quick-add-input', 'Original task title');
    await page.press('#quick-add-input', 'Enter');
    await page.waitForTimeout(500);

    // Double-click to edit
    const taskElement = page.locator('.task').first();
    await taskElement.dblclick();

    // Wait for modal
    const modal = page.locator('#task-modal');
    await expect(modal).toBeVisible({ timeout: 2000 });

    // Update title
    const titleInput = page.locator('#task-title');
    await titleInput.clear();
    await titleInput.fill('Updated task title');

    // Save
    await page.click('button:text("Save Task")');

    // Wait for modal close and update
    await page.waitForTimeout(500);

    // Verify task updated
    const taskTitle = page.locator('.task-title').first();
    await expect(taskTitle).toContainText('Updated task title');
  });

  test('should delete task via context menu', async ({ page }) => {
    // Create a task
    await page.fill('#quick-add-input', 'Task to delete');
    await page.press('#quick-add-input', 'Enter');
    await page.waitForTimeout(500);

    // Right-click to open context menu
    const taskElement = page.locator('.task').first();
    await taskElement.click({ button: 'right' });

    // Wait for context menu
    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 1000 });

    // Click delete
    await page.click('button:text("Delete")');

    // Wait for confirmation dialog
    await page.waitForTimeout(200);

    // Confirm delete (Enter key)
    await page.keyboard.press('Enter');

    // Wait for update
    await page.waitForTimeout(500);

    // Verify task deleted
    const tasks = page.locator('.task');
    const taskCount = await tasks.count();
    expect(taskCount).toBe(0);
  });

  test('should handle recurring task completion', async ({ page }) => {
    // Create recurring task via modal
    await page.click('button:has-text("Add Task")');
    await page.waitForTimeout(300);

    const modal = page.locator('#task-modal');
    await expect(modal).toBeVisible();

    // Fill task details
    await page.fill('#task-title', 'Daily standup');

    // Set recurrence
    await page.selectOption('#task-recurrence', 'weekly');

    // Select days
    await page.check('.recurrence-day-checkbox[value="1"]'); // Monday
    await page.check('.recurrence-day-checkbox[value="3"]'); // Wednesday
    await page.check('.recurrence-day-checkbox[value="5"]'); // Friday

    // Save
    await page.click('button:text("Save Task")');
    await page.waitForTimeout(500);

    // Verify recurring badge
    const taskElement = page.locator('.task').first();
    const recurringBadge = taskElement.locator('.task-recurring');
    await expect(recurringBadge).toBeVisible();

    // Complete task
    const checkbox = page.locator('.task-checkbox').first();
    await checkbox.click();
    await page.waitForTimeout(500);

    // Verify new task created
    const tasks = page.locator('.task');
    const taskCount = await tasks.count();
    expect(taskCount).toBeGreaterThan(0); // New recurring task should appear
  });

  test('should search tasks', async ({ page }) => {
    // Create multiple tasks
    await page.fill('#quick-add-input', 'Important meeting');
    await page.press('#quick-add-input', 'Enter');
    await page.waitForTimeout(200);

    await page.fill('#quick-add-input', 'Important document');
    await page.press('#quick-add-input', 'Enter');
    await page.waitForTimeout(200);

    await page.fill('#quick-add-input', 'Regular task');
    await page.press('#quick-add-input', 'Enter');
    await page.waitForTimeout(500);

    // Search for "Important"
    const searchInput = page.locator('#search-input');
    await searchInput.fill('Important');
    await page.waitForTimeout(300);

    // Should show 2 tasks
    const tasks = page.locator('.task');
    const taskCount = await tasks.count();
    expect(taskCount).toBe(2);

    // Verify search term in titles
    for (let i = 0; i < taskCount; i++) {
      const taskTitle = tasks.nth(i).locator('.task-title');
      await expect(taskTitle).toContainText('Important');
    }

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(300);

    // Should show all 3 tasks
    const allTasks = page.locator('.task');
    const allTaskCount = await allTasks.count();
    expect(allTaskCount).toBe(3);
  });

  test('should filter by context', async ({ page }) => {
    // Create tasks with different contexts
    await page.fill('#quick-add-input', 'Work task @work');
    await page.press('#quick-add-input', 'Enter');
    await page.waitForTimeout(200);

    await page.fill('#quick-add-input', 'Home task @home');
    await page.press('#quick-add-input', 'Enter');
    await page.waitForTimeout(500);

    // Filter by @work context
    const contextFilter = page.locator('#context-filter');
    await contextFilter.selectOption('@work');
    await page.waitForTimeout(300);

    // Should only show work task
    const tasks = page.locator('.task');
    const taskCount = await tasks.count();
    expect(taskCount).toBe(1);
    await expect(tasks.first()).toContainText('Work task');

    // Clear filter
    await contextFilter.selectOption('');
    await page.waitForTimeout(300);

    // Should show both tasks
    const allTasks = page.locator('.task');
    const allTaskCount = await allTasks.count();
    expect(allTaskCount).toBe(2);
  });

  test('should star and unstar task', async ({ page }) => {
    // Create a task
    await page.fill('#quick-add-input', 'Important task');
    await page.press('#quick-add-input', 'Enter');
    await page.waitForTimeout(500);

    const taskElement = page.locator('.task').first();

    // Star task
    const starBtn = taskElement.locator('.task-star');
    await starBtn.click();
    await page.waitForTimeout(200);

    // Verify starred (icon should be filled)
    await expect(starBtn).toHaveClass(/starred/);

    // Unstar task
    await starBtn.click();
    await page.waitForTimeout(200);

    // Verify unstarred
    await expect(starBtn).not.toHaveClass(/starred/);
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Create a task
    await page.fill('#quick-add-input', 'Keyboard test task');
    await page.press('#quick-add-input', 'Enter');
    await page.waitForTimeout(500);

    // Press 'c' to focus quick add
    await page.keyboard.press('c');
    const quickAddInput = page.locator('#quick-add-input');
    await expect(quickAddInput).toBeFocused();

    // Press Escape to unfocus
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Press '/' to focus search
    await page.keyboard.press('/');
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeFocused();
  });

  test('should create task with subtasks', async ({ page }) => {
    // Create task via modal
    await page.click('button:has-text("Add Task")');
    await page.waitForTimeout(300);

    const modal = page.locator('#task-modal');
    await expect(modal).toBeVisible();

    // Fill task details
    await page.fill('#task-title', 'Parent task');

    // Add subtasks
    const addSubtaskBtn = page.locator('button:has-text("Add Subtask")');
    await addSubtaskBtn.click();
    await page.waitForTimeout(100);

    const subtaskInputs = page.locator('.subtask-input');
    await subtaskInputs.nth(0).fill('Subtask 1');

    await addSubtaskBtn.click();
    await page.waitForTimeout(100);
    await subtaskInputs.nth(1).fill('Subtask 2');

    // Save
    await page.click('button:text("Save Task")');
    await page.waitForTimeout(500);

    // Verify task created with subtasks
    const taskElement = page.locator('.task').first();
    await expect(taskElement).toContainText('Parent task');

    // Should show subtask count
    const subtaskCount = taskElement.locator('.task-subtasks');
    await expect(subtaskCount).toContainText('2');
  });
});
