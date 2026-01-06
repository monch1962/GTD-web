import { test, expect } from '../../fixtures/gtd-app.js';

/**
 * Journey 5: Context-Based Filtering
 * Description: Using contexts to organize and filter tasks
 *
 * Tests:
 * - Global search by context
 * - Advanced search filters
 * - Clickable context tags
 * - Multiple filter combinations
 * - Clear search functionality
 * - Results count display
 */
test.describe('Context-Based Filtering Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    await gtdApp.clearLocalStorage();
    await gtdApp.goto();

    // Setup: Add tasks across different contexts
    await gtdApp.quickAddTask('Buy groceries @home @personal low energy');
    await gtdApp.quickAddTask('Call mom @home @personal');
    await gtdApp.quickAddTask('Clean house @home');
    await gtdApp.quickAddTask('Write report @work high energy');
    await gtdApp.quickAddTask('Team meeting @work @meetings');
    await gtdApp.quickAddTask('Code review @work');
    await gtdApp.quickAddTask('Read article @computer @personal');
    await gtdApp.quickAddTask('Update software @computer');
    await gtdApp.quickAddTask('Call client @phone @work');
    await gtdApp.quickAddTask('Order pizza @phone @personal');
    await gtdApp.quickAddTask('Exercise @home high energy');
    await gtdApp.quickAddTask('Meditation @personal');
    await gtdApp.quickAddTask('Backup data @computer @work');
    await gtdApp.quickAddTask('Email support @work');
  });

  test('should filter tasks by context using global search', async ({ page, gtdApp }) => {
    // Step 1: Search for @work context
    await gtdApp.search('@work');

    // Step 2: Verify only @work tasks displayed
    const tasks = await gtdApp.getTasks();
    expect(tasks.length).toBeGreaterThan(0);

    for (const task of tasks) {
      expect(task.title.toLowerCase()).toContain('@work');
    }

    // Step 3: Verify results count or indication
    const searchInput = page.locator(gtdApp.selectors.globalSearch);
    await expect(searchInput).toHaveValue('@work');

    // Step 4: Clear button should be visible
    const clearBtn = page.locator(gtdApp.selectors.clearSearch);
    await expect(clearBtn).toBeVisible();
  });

  test('should use advanced search with context filter', async ({ page, gtdApp }) => {
    // Step 1: Open advanced search panel
    const advancedPanel = page.locator('#advanced-search-panel');
    const toggleBtn = page.locator('button:has-text("Advanced")').or(
      page.locator('#advanced-search-toggle')
    );

    const isToggleVisible = await toggleBtn.isVisible().catch(() => false);

    if (isToggleVisible) {
      await toggleBtn.click();
      await expect(advancedPanel).toBeVisible();

      // Step 2: Filter by context
      await page.selectOption('#search-context', '@home');

      // Step 3: Filter by energy
      await page.selectOption('#search-energy', 'high');

      // Step 4: Filter by status
      await page.selectOption('#search-status', 'inbox');

      // Step 5: Verify filtered results
      const tasks = await gtdApp.getTasks();

      // Should show tasks with @home, high energy, in inbox
      for (const task of tasks) {
        expect(task.title.toLowerCase()).toContain('@home');
      }

      // Exercise should be one of the results
      const exerciseTask = tasks.find(t => t.title.includes('Exercise'));
      expect(exerciseTask).toBeDefined();
    } else {
      // Advanced panel not available, use basic search
      await gtdApp.search('@home high energy');
      const tasks = await gtdApp.getTasks();
      expect(tasks.length).toBeGreaterThan(0);
    }
  });

  test('should filter by single context', async ({ page, gtdApp }) => {
    // Step 1: Search for @computer context
    await gtdApp.search('@computer');

    // Step 2: Verify results
    const tasks = await gtdApp.getTasks();

    // Should include Read article, Update software, Backup data
    expect(tasks.length).toBeGreaterThanOrEqual(3);

    const taskTitles = tasks.map(t => t.title);
    expect(taskTitles.some(t => t.includes('Read article'))).toBeTruthy();
    expect(taskTitles.some(t => t.includes('Update software'))).toBeTruthy();
    expect(taskTitles.some(t => t.includes('Backup data'))).toBeTruthy();

    // Should not include @work or @home tasks
    expect(taskTitles.some(t => t.includes('Write report'))).toBeFalsy();
    expect(taskTitles.some(t => t.includes('Buy groceries'))).toBeFalsy();
  });

  test('should filter by multiple contexts (AND logic)', async ({ page, gtdApp }) => {
    // Step 1: Search for tasks with both @work AND @phone
    await gtdApp.search('@work @phone');

    // Step 2: Verify results
    const tasks = await gtdApp.getTasks();

    // Should only include "Call client @phone @work"
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toContain('Call client');
    expect(tasks[0].title).toContain('@work');
    expect(tasks[0].title).toContain('@phone');
  });

  test('should handle clickable context tags on tasks', async ({ page, gtdApp }) => {
    // Step 1: Navigate to a view with tasks
    await gtdApp.navigateTo('inbox');

    // Step 2: Find a task with a context tag
    const taskWithWork = page.locator('.task-item', { hasText: '@work' }).first();
    await expect(taskWithWork).toBeVisible();

    // Step 3: Click on @work context tag
    const workTag = taskWithWork.locator('.context-tag', { hasText: '@work' });
    const isTagClickable = await workTag.isVisible().catch(() => false);

    if (isTagClickable) {
      await workTag.click();

      // Step 4: Verify filtered to @work tasks
      const tasks = await gtdApp.getTasks();
      for (const task of tasks) {
        expect(task.title.toLowerCase()).toContain('@work');
      }
    }
  });

  test('should clear search and show all tasks', async ({ page, gtdApp }) => {
    // Step 1: Search for context
    await gtdApp.search('@work');

    const filteredTasks = await gtdApp.getTasks();
    expect(filteredTasks.length).toBeGreaterThan(0);
    expect(filteredTasks.length).toBeLessThan(15); // Not all tasks

    // Step 2: Clear search
    await gtdApp.clearSearch();

    // Step 3: Verify all tasks shown
    const allTasks = await gtdApp.getTasks();
    expect(allTasks.length).toBe(15); // All setup tasks

    // Step 4: Verify clear button hidden
    const clearBtn = page.locator(gtdApp.selectors.clearSearch);
    await expect(clearBtn).not.toBeVisible();
  });

  test('should display search results count', async ({ page, gtdApp }) => {
    // Step 1: Search for context
    await gtdApp.search('@work');

    // Step 2: Check for results count display
    const resultsCount = page.locator('.search-results-count').or(
      page.locator('#results-count')
    );

    const isCountVisible = await resultsCount.isVisible().catch(() => false);

    if (isCountVisible) {
      const countText = await resultsCount.textContent();
      expect(countText).toMatch(/\d+/); // Should contain a number

      // Verify count matches actual results
      const tasks = await gtdApp.getTasks();
      expect(countText).toContain(tasks.length.toString());
    }
  });

  test('should handle search with no results', async ({ page, gtdApp }) => {
    // Step 1: Search for non-existent context
    await gtdApp.search('@nonexistent');

    // Step 2: Verify no results
    const tasks = await gtdApp.getTasks();
    expect(tasks).toHaveLength(0);

    // Step 3: Verify empty state or no results message
    const emptyState = page.locator('.empty-state').or(
      page.locator('.no-results')
    );

    const isEmptyVisible = await emptyState.isVisible().catch(() => false);
    if (isEmptyVisible) {
      await expect(emptyState).toContainText(/no results|empty/i);
    }
  });

  test('should handle context with special characters', async ({ gtdApp }) => {
    // Step 1: Add task with special context
    await gtdApp.quickAddTask('Test task @special-context_123');

    // Step 2: Search for special context
    await gtdApp.search('@special-context_123');

    // Step 3: Verify task found
    const tasks = await gtdApp.getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toContain('@special-context_123');

    // Step 4: Clear search
    await gtdApp.clearSearch();
  });

  test('should handle empty search query', async ({ page, gtdApp }) => {
    // Step 1: Search and then clear
    await gtdApp.search('@work');
    expect((await gtdApp.getTasks()).length).toBeLessThan(15);

    // Step 2: Clear the search input
    await page.fill(gtdApp.selectors.globalSearch, '');

    // Step 3: Verify all tasks shown after short delay
    await page.waitForTimeout(500);
    const allTasks = await gtdApp.getTasks();
    expect(allTasks.length).toBe(15);
  });

  test('should filter by energy level', async ({ page, gtdApp }) => {
    // Step 1: Search for high energy tasks
    await gtdApp.search('high energy');

    // Step 2: Verify results
    const tasks = await gtdApp.getTasks();
    expect(tasks.length).toBeGreaterThan(0);

    // Should include: Exercise, Write report
    const taskTitles = tasks.map(t => t.title);
    expect(taskTitles.some(t => t.includes('Exercise'))).toBeTruthy();
    expect(taskTitles.some(t => t.includes('Write report'))).toBeTruthy();

    // Should not include low energy tasks like "Buy groceries"
    expect(taskTitles.some(t => t.includes('Buy groceries'))).toBeFalsy();
  });

  test('should handle very long search strings', async ({ page, gtdApp }) => {
    // Step 1: Create very long search query
    const longSearch = '@work ' + 'extra '.repeat(50);

    // Step 2: Execute search
    await gtdApp.search(longSearch);

    // Step 3: Should handle gracefully (no crash)
    const tasks = await gtdApp.getTasks();
    // Either no results or handled without error
    expect(tasks).toBeDefined();

    // Step 4: Clear and verify still works
    await gtdApp.clearSearch();
    const allTasks = await gtdApp.getTasks();
    expect(allTasks.length).toBe(15);
  });

  test('should handle Unicode characters in search', async ({ gtdApp }) => {
    // Step 1: Add task with Unicode
    await gtdApp.quickAddTask('Tâsk with Ûñîçödé @spëciål');

    // Step 2: Search for Unicode context
    await gtdApp.search('@spëciål');

    // Step 3: Verify task found
    const tasks = await gtdApp.getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toContain('Tâsk with Ûñîçödé');
  });

  test('should filter tasks in different views', async ({ page, gtdApp }) => {
    // Step 1: Move some tasks to Next Actions
    await gtdApp.openTask('Write report @work high energy');
    await page.selectOption('#task-status', 'next');
    await gtdApp.saveTask();

    await gtdApp.openTask('Exercise @home high energy');
    await page.selectOption('#task-status', 'next');
    await gtdApp.saveTask();

    // Step 2: Navigate to Next Actions
    await gtdApp.navigateTo('next');

    // Step 3: Search within Next Actions view
    await gtdApp.search('@work');

    // Step 4: Verify only Next Actions with @work shown
    const tasks = await gtdApp.getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toContain('Write report');

    // Step 5: Clear search
    await gtdApp.clearSearch();

    // Step 6: Verify all Next Actions shown
    const allNextTasks = await gtdApp.getTasks();
    expect(allNextTasks.length).toBeGreaterThanOrEqual(2);
  });

  test('should update search results in real-time', async ({ page, gtdApp }) => {
    // Step 1: Start with @work search
    await gtdApp.search('@work');
    let workTasks = await gtdApp.getTasks();
    expect(workTasks.length).toBeGreaterThan(0);

    // Step 2: Modify search to @home
    await page.fill(gtdApp.selectors.globalSearch, '@home');
    await page.waitForTimeout(300); // Wait for debounce

    // Step 3: Verify results updated
    let homeTasks = await gtdApp.getTasks();
    expect(homeTasks.length).toBeGreaterThan(0);
    expect(homeTasks.length).not.toBe(workTasks.length);

    // Step 4: Modify to @phone
    await page.fill(gtdApp.selectors.globalSearch, '@phone');
    await page.waitForTimeout(300);

    let phoneTasks = await gtdApp.getTasks();
    expect(phoneTasks.length).toBeGreaterThan(0);

    // Step 5: Clear completely
    await page.fill(gtdApp.selectors.globalSearch, '');
    await page.waitForTimeout(300);

    const allTasks = await gtdApp.getTasks();
    expect(allTasks.length).toBe(15);
  });

  test('should maintain search across navigation', async ({ page, gtdApp }) => {
    // Step 1: Search in Inbox
    await gtdApp.search('@work');
    const inboxResults = await gtdApp.getTasks();

    // Step 2: Navigate to Next Actions
    await gtdApp.navigateTo('next');
    await page.waitForTimeout(300);

    // Step 3: Verify search still active
    const searchValue = await page.inputValue(gtdApp.selectors.globalSearch);
    expect(searchValue).toBe('@work');

    // Step 4: Results should be for Next Actions view
    const nextResults = await gtdApp.getTasks();
    // May have different count or be empty
    expect(nextResults).toBeDefined();
  });

  test('should combine context with status filter', async ({ page, gtdApp }) => {
    // Step 1: Move tasks to different statuses
    await gtdApp.openTask('Write report @work high energy');
    await page.selectOption('#task-status', 'next');
    await gtdApp.saveTask();

    await gtdApp.openTask('Team meeting @work @meetings');
    await page.selectOption('#task-status', 'waiting');
    await gtdApp.saveTask();

    // Step 2: Navigate to All Items view
    await gtdApp.navigateTo('all');

    // Step 3: Search for @work tasks
    await gtdApp.search('@work');

    // Step 4: Verify all @work tasks shown regardless of status
    const tasks = await gtdApp.getTasks();
    expect(tasks.length).toBeGreaterThanOrEqual(4); // At least the @work tasks

    const taskTitles = tasks.map(t => t.title);
    expect(taskTitles.some(t => t.includes('Write report'))).toBeTruthy();
    expect(taskTitles.some(t => t.includes('Team meeting'))).toBeTruthy();
    expect(taskTitles.some(t => t.includes('Code review'))).toBeTruthy();
    expect(taskTitles.some(t => t.includes('Email support'))).toBeTruthy();
  });

  test('should display search instructions for accessibility', async ({ page, gtdApp }) => {
    // Step 1: Focus on search input
    await page.focus(gtdApp.selectors.globalSearch);

    // Step 2: Verify aria-describedby points to instructions
    const searchInput = page.locator(gtdApp.selectors.globalSearch);
    const describedBy = await searchInput.getAttribute('aria-describedby');

    expect(describedBy).toBeTruthy();

    // Step 3: Verify instructions element exists
    const instructions = page.locator(`#${describedBy}`);
    await expect(instructions).toBeVisible();

    // Step 4: Verify instructions content
    const instructionsText = await instructions.textContent();
    expect(instructionsText.toLowerCase()).toMatch(/search|navigate|arrow/i);
  });
});
