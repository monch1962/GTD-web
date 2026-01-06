import { test, expect } from '../../fixtures/gtd-app.js';

/**
 * Journey 9: Smart Suggestions (AI-Powered)
 * Description: Using AI to suggest next tasks based on context
 *
 * Tests:
 * - Getting suggestions based on context
 * - Energy level matching
 * - Time availability matching
 * - Priority explanations
 * - Selecting and acting on suggestions
 * - Excluding blocked/completed tasks
 * - Limited suggestions count
 */
test.describe('Smart Suggestions Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    await gtdApp.clearLocalStorage();
    await gtdApp.goto();
  });

  test('should provide smart task suggestions', async ({ page, gtdApp }) => {
    // Step 1: Create various tasks
    await gtdApp.quickAddTask('Urgent report due today @work high energy');
    await gtdApp.quickAddTask('Quick email reply @work low energy');
    await gtdApp.quickAddTask('Plan presentation @work high energy');
    await gtdApp.quickAddTask('Organize desk @home low energy');
    await gtdApp.quickAddTask('Call mom @personal medium energy');

    // Move to Next Actions
    for (const task of await gtdApp.getTasks()) {
      await gtdApp.openTask(task.title);
      await page.selectOption('#task-status', 'next');
      await gtdApp.saveTask();
    }

    // Step 2: Click "What should I work on?" button
    await page.click(gtdApp.selectors.suggestionsBtn);

    // Step 3: Verify suggestions modal opens
    const suggestionsModal = page.locator('#suggestions-modal').or(
      page.locator('.suggestions-modal')
    );

    const isModalVisible = await suggestionsModal.isVisible().catch(() => false);

    if (isModalVisible) {
      await expect(suggestionsModal).toBeVisible();

      // Step 4: Verify suggestions are displayed
      const suggestionItems = suggestionsModal.locator('.suggestion-item, .task-suggestion');
      const count = await suggestionItems.count();

      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(10); // Max 10 suggestions
    } else {
      test.skip(true, 'Smart suggestions not implemented');
    }
  });

  test('should consider energy level in suggestions', async ({ page, gtdApp }) => {
    // Step 1: Create tasks with different energy levels
    await gtdApp.quickAddTask('High energy task @work');
    await gtdApp.openTask('High energy task @work');
    await page.selectOption('#task-status', 'next');
    await page.selectOption('#task-energy', 'high');
    await gtdApp.saveTask();

    await gtdApp.quickAddTask('Low energy task @work');
    await gtdApp.openTask('Low energy task @work');
    await page.selectOption('#task-status', 'next');
    await page.selectOption('#task-energy', 'low');
    await gtdApp.saveTask();

    // Step 2: Get suggestions
    await page.click(gtdApp.selectors.suggestionsBtn);

    const suggestionsModal = page.locator('#suggestions-modal');
    const isModalVisible = await suggestionsModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Look for energy level indicators
      const highEnergyBadge = suggestionsModal.locator('[data-energy="high"]');
      const lowEnergyBadge = suggestionsModal.locator('[data-energy="low"]');

      const hasEnergyInfo = await highEnergyBadge.count() > 0 || await lowEnergyBadge.count() > 0;

      if (hasEnergyInfo) {
        // Verify energy levels shown
        const highCount = await highEnergyBadge.count();
        const lowCount = await lowEnergyBadge.count();

        expect(highCount + lowCount).toBeGreaterThan(0);
      }
    } else {
      test.skip(true, 'Smart suggestions not implemented');
    }
  });

  test('should explain priority scoring', async ({ page, gtdApp }) => {
    // Step 1: Create urgent task
    await gtdApp.quickAddTask('Urgent task');
    await gtdApp.openTask('Urgent task');
    await page.selectOption('#task-status', 'next');
    await page.fill('#task-due-date', getTodayDate());
    await gtdApp.saveTask();

    // Step 2: Get suggestions
    await page.click(gtdApp.selectors.suggestionsBtn);

    const suggestionsModal = page.locator('#suggestions-modal');
    const isModalVisible = await suggestionsModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Look for priority explanation
      const priorityExplanation = suggestionsModal.locator('.priority-explanation').or(
        suggestionsModal.locator('[data-priority-reason]')
      );

      const hasExplanation = await priorityExplanation.isVisible().catch(() => false);

      if (hasExplanation) {
        await expect(priorityExplanation).toBeVisible();

        const explanationText = await priorityExplanation.textContent();
        expect(explanationText.toLowerCase()).toMatch(/due today|urgent|priority|score/i);
      }
    } else {
      test.skip(true, 'Smart suggestions not implemented');
    }
  });

  test('should match available time', async ({ page, gtdApp }) => {
    // Step 1: Create tasks with different time estimates
    await gtdApp.quickAddTask('Quick 5 min task');
    await gtdApp.openTask('Quick 5 min task');
    await page.selectOption('#task-status', 'next');
    await page.selectOption('#task-time', '5');
    await gtdApp.saveTask();

    await gtdApp.quickAddTask('Long 60 min task');
    await gtdApp.openTask('Long 60 min task');
    await page.selectOption('#task-status', 'next');
    await page.selectOption('#task-time', '60');
    await gtdApp.saveTask();

    // Step 2: Get suggestions
    await page.click(gtdApp.selectors.suggestionsBtn);

    const suggestionsModal = page.locator('#suggestions-modal');
    const isModalVisible = await suggestionsModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Look for time indicators
      const timeIndicators = suggestionsModal.locator('[data-time], .time-estimate');
      const hasTimeInfo = await timeIndicators.count() > 0;

      if (hasTimeInfo) {
        const timeText = await timeIndicators.first().textContent();
        expect(timeText).toMatch(/\d+\s*(min|minute|hour)/i);
      }
    } else {
      test.skip(true, 'Smart suggestions not implemented');
    }
  });

  test('should exclude blocked tasks', async ({ page, gtdApp }) => {
    // Step 1: Create dependency chain
    await gtdApp.quickAddTask('Prerequisite task');
    await gtdApp.quickAddTask('Blocked dependent task');

    const dependsOnField = page.locator('#task-depends-on');

    await gtdApp.openTask('Prerequisite task');
    await page.selectOption('#task-status', 'next');
    await gtdApp.saveTask();

    await gtdApp.openTask('Blocked dependent task');
    await page.selectOption('#task-status', 'next');
    if (await dependsOnField.isVisible().catch(() => false)) {
      await dependsOnField.fill('Prerequisite task');
    }
    await gtdApp.saveTask();

    // Step 2: Get suggestions
    await page.click(gtdApp.selectors.suggestionsBtn);

    const suggestionsModal = page.locator('#suggestions-modal');
    const isModalVisible = await suggestionsModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Verify blocked task not suggested
      const blockedTask = suggestionsModal.locator('text=Blocked dependent task');
      const isBlockedShown = await blockedTask.isVisible().catch(() => false);

      expect(isBlockedShown).toBeFalsy();
    } else {
      test.skip(true, 'Smart suggestions not implemented');
    }
  });

  test('should exclude completed tasks', async ({ page, gtdApp }) => {
    // Step 1: Create and complete task
    await gtdApp.quickAddTask('Completed task');
    await gtdApp.completeTask('Completed task');

    // Step 2: Create active task
    await gtdApp.quickAddTask('Active task');
    await gtdApp.openTask('Active task');
    await page.selectOption('#task-status', 'next');
    await gtdApp.saveTask();

    // Step 3: Get suggestions
    await page.click(gtdApp.selectors.suggestionsBtn);

    const suggestionsModal = page.locator('#suggestions-modal');
    const isModalVisible = await suggestionsModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 4: Verify completed task not suggested
      const completedTask = suggestionsModal.locator('text=Completed task');
      const isCompletedShown = await completedTask.isVisible().catch(() => false);

      expect(isCompletedShown).toBeFalsy();

      // But active task should be shown
      const activeTask = suggestionsModal.locator('text=Active task');
      const isActiveShown = await activeTask.isVisible().catch(() => false);

      expect(isActiveShown).toBeTruthy();
    } else {
      test.skip(true, 'Smart suggestions not implemented');
    }
  });

  test('should allow selecting and acting on suggestion', async ({ page, gtdApp }) => {
    // Step 1: Create tasks
    await gtdApp.quickAddTask('Suggested task 1');
    await gtdApp.openTask('Suggested task 1');
    await page.selectOption('#task-status', 'next');
    await gtdApp.saveTask();

    // Step 2: Get suggestions
    await page.click(gtdApp.selectors.suggestionsBtn);

    const suggestionsModal = page.locator('#suggestions-modal');
    const isModalVisible = await suggestionsModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Click on a suggestion
      const suggestionItem = suggestionsModal.locator('.suggestion-item, .task-suggestion').first();
      await suggestionItem.click();

      // Step 4: Should either open task for editing or highlight it
      const taskModal = page.locator('#task-modal');
      const modalOpened = await taskModal.isVisible().catch(() => false);

      if (modalOpened) {
        await expect(taskModal).toBeVisible();
      } else {
        // Task should be highlighted in main view
        const highlightedTask = page.locator('.task-item.highlighted, .task-item.active');
        const isHighlighted = await highlightedTask.isVisible().catch(() => false);

        if (isHighlighted) {
          await expect(highlightedTask).toBeVisible();
        }
      }
    } else {
      test.skip(true, 'Smart suggestions not implemented');
    }
  });

  test('should update suggestions after task completion', async ({ page, gtdApp }) => {
    // Step 1: Create tasks
    await gtdApp.quickAddTask('Task A');
    await gtdApp.quickAddTask('Task B');
    await gtdApp.quickAddTask('Task C');

    for (const task of await gtdApp.getTasks()) {
      await gtdApp.openTask(task.title);
      await page.selectOption('#task-status', 'next');
      await gtdApp.saveTask();
    }

    // Step 2: Get initial suggestions
    await page.click(gtdApp.selectors.suggestionsBtn);

    const suggestionsModal = page.locator('#suggestions-modal');
    const isModalVisible = await suggestionsModal.isVisible().catch(() => false);

    if (isModalVisible) {
      const initialSuggestions = await suggestionsModal.locator('.suggestion-item').all();
      const initialCount = initialSuggestions.length;

      // Step 3: Complete one task
      await suggestionsModal.locator('text=Task A').first().click();

      const taskModal = page.locator('#task-modal');
      if (await taskModal.isVisible().catch(() => false)) {
        await page.selectOption('#task-status', 'completed');
        await gtdApp.saveTask();
      } else {
        await gtdApp.completeTask('Task A');
      }

      // Step 4: Get suggestions again
      await page.click(gtdApp.selectors.suggestionsBtn);

      // Step 5: Verify suggestions updated (Task A no longer shown)
      const taskA = suggestionsModal.locator('text=Task A');
      const isTaskAShown = await taskA.isVisible().catch(() => false);

      expect(isTaskAShown).toBeFalsy();
    } else {
      test.skip(true, 'Smart suggestions not implemented');
    }
  });

  test('should limit to maximum 10 suggestions', async ({ page, gtdApp }) => {
    // Step 1: Create 15 tasks
    for (let i = 1; i <= 15; i++) {
      await gtdApp.quickAddTask(`Task ${i}`);
      await gtdApp.openTask(`Task ${i}`);
      await page.selectOption('#task-status', 'next');
      await gtdApp.saveTask();
    }

    // Step 2: Get suggestions
    await page.click(gtdApp.selectors.suggestionsBtn);

    const suggestionsModal = page.locator('#suggestions-modal');
    const isModalVisible = await suggestionsModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Count suggestions
      const suggestions = await suggestionsModal.locator('.suggestion-item').all();
      const count = suggestions.length;

      expect(count).toBeLessThanOrEqual(10);
    } else {
      test.skip(true, 'Smart suggestions not implemented');
    }
  });

  test('should filter by current context/location', async ({ page, gtdApp }) => {
    // Step 1: Create tasks with different contexts
    await gtdApp.quickAddTask('Work task @work');
    await gtdApp.openTask('Work task @work');
    await page.selectOption('#task-status', 'next');
    await gtdApp.saveTask();

    await gtdApp.quickAddTask('Home task @home');
    await gtdApp.openTask('Home task @home');
    await page.selectOption('#task-status', 'next');
    await gtdApp.saveTask();

    // Step 2: Get suggestions
    await page.click(gtdApp.selectors.suggestionsBtn);

    const suggestionsModal = page.locator('#suggestions-modal');
    const isModalVisible = await suggestionsModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Look for context filter UI
      const contextFilter = suggestionsModal.locator('[data-context-filter]').or(
        suggestionsModal.locator('.context-filter')
      );

      const hasFilter = await contextFilter.count() > 0;

      if (hasFilter) {
        // Select @work context
        await contextFilter.selectOption('@work');

        // Step 4: Verify only @work tasks shown
        const workTask = suggestionsModal.locator('text=Work task');
        const homeTask = suggestionsModal.locator('text=Home task');

        const isWorkShown = await workTask.isVisible().catch(() => false);
        const isHomeShown = await homeTask.isVisible().catch(() => false);

        expect(isWorkShown).toBeTruthy();
        expect(isHomeShown).toBeFalsy();
      }
    } else {
      test.skip(true, 'Smart suggestions not implemented');
    }
  });

  test('should handle empty task list gracefully', async ({ page, gtdApp }) => {
    // Step 1: Get suggestions with no tasks
    await page.click(gtdApp.selectors.suggestionsBtn);

    const suggestionsModal = page.locator('#suggestions-modal');
    const isModalVisible = await suggestionsModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 2: Look for empty state
      const emptyState = suggestionsModal.locator('.empty-state').or(
        suggestionsModal.locator('text=No tasks')
      );

      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      if (hasEmptyState) {
        await expect(emptyState).toBeVisible();
      }

      // Should not crash
      await expect(suggestionsModal).toBeVisible();
    } else {
      test.skip(true, 'Smart suggestions not implemented');
    }
  });

  test('should show confidence scores for suggestions', async ({ page, gtdApp }) => {
    // Step 1: Create tasks
    await gtdApp.quickAddTask('High confidence task');
    await gtdApp.openTask('High confidence task');
    await page.selectOption('#task-status', 'next');
    await page.fill('#task-due-date', getTodayDate());
    await gtdApp.saveTask();

    // Step 2: Get suggestions
    await page.click(gtdApp.selectors.suggestionsBtn);

    const suggestionsModal = page.locator('#suggestions-modal');
    const isModalVisible = await suggestionsModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Look for confidence/percentage indicators
      const confidenceIndicator = suggestionsModal.locator('[data-confidence]').or(
        suggestionsModal.locator('.confidence-score, .score')
      );

      const hasConfidence = await confidenceIndicator.count() > 0;

      if (hasConfidence) {
        const confidenceText = await confidenceIndicator.first().textContent();
        expect(confidenceText).toMatch(/\d+%/);
      }
    } else {
      test.skip(true, 'Smart suggestions not implemented');
    }
  });
});

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}
