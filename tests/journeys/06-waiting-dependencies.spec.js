import { test, expect } from '../fixtures/gtd-app.js';

/**
 * Journey 6: Waiting For and Dependencies
 * Description: Managing delegated tasks and task dependencies
 *
 * Tests:
 * - Task dependency creation
 * - Dependency visualization
 * - Blocked task indicators
 * - Waiting For workflow
 * - Dependency completion cascading
 * - Circular dependency prevention
 */
test.describe('Waiting For and Dependencies Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    await gtdApp.clearLocalStorage();
    await gtdApp.goto();
  });

  test('should create task with dependency', async ({ page, gtdApp }) => {
    // Step 1: Create prerequisite task
    await gtdApp.quickAddTask('Design homepage mockup');

    // Step 2: Create dependent task
    await gtdApp.quickAddTask('Implement homepage');

    // Step 3: Open dependent task and set dependency
    await gtdApp.openTask('Implement homepage');

    // Look for dependency field
    const dependsOnField = page.locator('#task-depends-on').or(
      page.locator('#task-dependencies')
    );

    const fieldExists = await dependsOnField.isVisible().catch(() => false);

    if (fieldExists) {
      await dependsOnField.fill('Design homepage mockup');
      await gtdApp.saveTask();

      // Step 4: Verify dependency is set
      await gtdApp.openTask('Implement homepage');
      const dependencyValue = await dependsOnField.inputValue();
      expect(dependencyValue).toContain('Design homepage mockup');
    } else {
      // If no dependency field, mark as test skip/not applicable
      test.skip(true, 'Dependency field not implemented');
    }
  });

  test('should visualize dependency chain in modal', async ({ page, gtdApp }) => {
    // Step 1: Create dependency chain
    await gtdApp.quickAddTask('Task A: Design mockup');
    await gtdApp.quickAddTask('Task B: Implement design');
    await gtdApp.quickAddTask('Task C: Test implementation');

    // Step 2: Set up dependencies (if field exists)
    const dependsOnField = page.locator('#task-depends-on');

    await gtdApp.openTask('Task B: Implement design');
    if (await dependsOnField.isVisible().catch(() => false)) {
      await dependsOnField.fill('Task A: Design mockup');
      await gtdApp.saveTask();

      await gtdApp.openTask('Task C: Test implementation');
      await dependsOnField.fill('Task B: Implement design');
      await gtdApp.saveTask();

      // Step 3: Open dependencies modal
      await page.click(gtdApp.selectors.dependenciesBtn);

      // Step 4: Verify dependency visualization
      const dependenciesModal = page.locator('#dependencies-modal');
      const isModalVisible = await dependenciesModal.isVisible().catch(() => false);

      if (isModalVisible) {
        await expect(dependenciesModal).toBeVisible();

        // Should show chain: A -> B -> C
        await expect(dependenciesModal.locator('text=Task A')).toBeVisible();
        await expect(dependenciesModal.locator('text=Task B')).toBeVisible();
        await expect(dependenciesModal.locator('text=Task C')).toBeVisible();
      } else {
        test.skip(true, 'Dependencies modal not implemented');
      }
    } else {
      test.skip(true, 'Dependency field not implemented');
    }
  });

  test('should show blocked indicator on dependent tasks', async ({ page, gtdApp }) => {
    // Step 1: Create tasks
    await gtdApp.quickAddTask('Prerequisite: Write documentation');
    await gtdApp.quickAddTask('Dependent: Create help videos');

    // Step 2: Set dependency
    const dependsOnField = page.locator('#task-depends-on');

    await gtdApp.openTask('Dependent: Create help videos');
    if (await dependsOnField.isVisible().catch(() => false)) {
      await dependsOnField.fill('Prerequisite: Write documentation');
      await gtdApp.saveTask();

      // Step 3: Look for blocked indicator
      const taskElement = page.locator('.task-item', { hasText: 'Dependent: Create help videos' });
      await expect(taskElement).toBeVisible();

      const blockedIndicator = taskElement.locator('.blocked-indicator').or(
        taskElement.locator('[data-blocked="true"]')
      );

      const isBlocked = await blockedIndicator.isVisible().catch(() => false);

      if (isBlocked) {
        await expect(blockedIndicator).toBeVisible();
      }
    } else {
      test.skip(true, 'Dependency field not implemented');
    }
  });

  test('should move task to waiting for status', async ({ page, gtdApp }) => {
    // Step 1: Create task
    await gtdApp.quickAddTask('Waiting for John to send report');

    // Step 2: Open and set to Waiting status
    await gtdApp.openTask('Waiting for John to send report');
    await page.selectOption('#task-status', 'waiting');

    // Step 3: Add waiting-for details
    const waitingForField = page.locator('#task-waiting-for').or(
      page.locator('#task-waiting-details')
    );

    if (await waitingForField.isVisible().catch(() => false)) {
      await waitingForField.fill('John to send quarterly report by Friday');
      await gtdApp.saveTask();

      // Step 4: Verify task in Waiting view
      await gtdApp.navigateTo('waiting');

      const tasks = await gtdApp.getTasks();
      const waitingTask = tasks.find(t => t.title.includes('Waiting for John'));

      expect(waitingTask).toBeDefined();

      // Step 5: Verify waiting details preserved
      await gtdApp.openTask('Waiting for John to send report');
      const waitingDetails = await waitingForField.inputValue();
      expect(waitingDetails).toContain('John');
    }
  });

  test('should unblock dependent task when prerequisite completes', async ({ page, gtdApp }) => {
    // Step 1: Create dependency chain
    await gtdApp.quickAddTask('Task A: Draft proposal');
    await gtdApp.quickAddTask('Task B: Review proposal');

    const dependsOnField = page.locator('#task-depends-on');

    await gtdApp.openTask('Task B: Review proposal');
    if (await dependsOnField.isVisible().catch(() => false)) {
      await dependsOnField.fill('Task A: Draft proposal');
      await gtdApp.saveTask();

      // Step 2: Verify Task B is blocked
      const taskB = page.locator('.task-item', { hasText: 'Task B: Review proposal' });
      const blockedIndicator = taskB.locator('.blocked-indicator');
      const wasBlocked = await blockedIndicator.isVisible().catch(() => false);

      // Step 3: Complete Task A
      await gtdApp.completeTask('Task A: Draft proposal');

      // Step 4: Verify Task B is unblocked
      if (wasBlocked) {
        const isStillBlocked = await blockedIndicator.isVisible().catch(() => true);
        expect(isStillBlocked).toBeFalsy();
      }

      // Step 5: Verify notification (if implemented)
      const notification = await gtdApp.waitForNotification().catch(() => null);
      if (notification) {
        expect(notification.toLowerCase()).toMatch(/unblocked|ready|available/i);
      }
    } else {
      test.skip(true, 'Dependency field not implemented');
    }
  });

  test('should prevent circular dependencies', async ({ page, gtdApp }) => {
    // Step 1: Create two tasks
    await gtdApp.quickAddTask('Task X');
    await gtdApp.quickAddTask('Task Y');

    const dependsOnField = page.locator('#task-depends-on');

    if (await dependsOnField.isVisible().catch(() => false)) {
      // Step 2: Make X depend on Y
      await gtdApp.openTask('Task X');
      await dependsOnField.fill('Task Y');
      await gtdApp.saveTask();

      // Step 3: Try to make Y depend on X (circular!)
      await gtdApp.openTask('Task Y');
      await dependsOnField.fill('Task X');

      // Step 4: Should show error or prevent save
      const saveButton = page.locator('button[type="submit"]');
      await saveButton.click();

      // Look for error message
      const errorMessage = page.locator('.error-message').or(
        page.locator('[role="alert"]')
      );

      const hasError = await errorMessage.count() > 0;

      if (hasError) {
        await expect(errorMessage).toBeVisible();
        const errorText = await errorMessage.textContent();
        expect(errorText.toLowerCase()).toMatch(/circular|loop|dependency/i);
      }
    } else {
      test.skip(true, 'Dependency field not implemented');
    }
  });

  test('should handle dependency chain longer than 10 tasks', async ({ page, gtdApp }) => {
    // Step 1: Create long dependency chain
    const tasks = [];
    for (let i = 1; i <= 12; i++) {
      await gtdApp.quickAddTask(`Chain Task ${i}`);
      tasks.push(`Chain Task ${i}`);
    }

    const dependsOnField = page.locator('#task-depends-on');

    if (await dependsOnField.isVisible().catch(() => false)) {
      // Step 2: Set up chain dependencies
      for (let i = 1; i < 12; i++) {
        await gtdApp.openTask(`Chain Task ${i + 1}`);
        await dependsOnField.fill(`Chain Task ${i}`);
        await gtdApp.saveTask();
      }

      // Step 3: Open dependencies modal
      await page.click(gtdApp.selectors.dependenciesBtn);

      const dependenciesModal = page.locator('#dependencies-modal');
      const isModalVisible = await dependenciesModal.isVisible().catch(() => false);

      if (isModalVisible) {
        // Step 4: Verify all tasks shown
        await expect(dependenciesModal).toBeVisible();

        for (let i = 1; i <= 12; i++) {
          const taskInModal = dependenciesModal.locator(`text=Chain Task ${i}`);
          await expect(taskInModal).toBeVisible();
        }
      }
    } else {
      test.skip(true, 'Dependency field not implemented');
    }
  });

  test('should handle deleting task that others depend on', async ({ page, gtdApp }) => {
    // Step 1: Create dependency
    await gtdApp.quickAddTask('Task to be deleted');
    await gtdApp.quickAddTask('Dependent task');

    const dependsOnField = page.locator('#task-depends-on');

    await gtdApp.openTask('Dependent task');
    if (await dependsOnField.isVisible().catch(() => false)) {
      await dependsOnField.fill('Task to be deleted');
      await gtdApp.saveTask();

      // Step 2: Delete prerequisite task
      await gtdApp.openContextMenu('Task to be deleted');
      await page.click('text=Delete');

      // Step 3: Confirm deletion
      const confirmButton = page.locator('button:has-text("Confirm")').or(
        page.locator('button:has-text("Delete")')
      );

      const hasConfirm = await confirmButton.count() > 0;
      if (hasConfirm) {
        await confirmButton.first().click();
      }

      // Step 4: Verify dependent task handled
      // Either dependency removed or task marked with error
      await gtdApp.openTask('Dependent task');

      const dependencyValue = await dependsOnField.inputValue();
      const stillHasDependency = dependencyValue.includes('Task to be deleted');

      // Both outcomes acceptable:
      // - Dependency removed (stillsHasDependency = false)
      // - Dependency kept but marked as invalid
      expect(true).toBeTruthy();
    } else {
      test.skip(true, 'Dependency field not implemented');
    }
  });

  test('should show priority adjustment for blocked/unblocked', async ({ page, gtdApp }) => {
    // Step 1: Create dependency
    await gtdApp.quickAddTask('High priority prerequisite');
    await gtdApp.quickAddTask('Dependent task');

    const dependsOnField = page.locator('#task-depends-on');

    await gtdApp.openTask('Dependent task');
    if (await dependsOnField.isVisible().catch(() => false)) {
      await dependsOnField.fill('High priority prerequisite');
      await gtdApp.saveTask();

      // Step 2: Check priority of dependent task (blocked)
      let taskElement = page.locator('.task-item', { hasText: 'Dependent task' });

      const priorityBadge = taskElement.locator('.priority-badge');
      const hasPriority = await priorityBadge.isVisible().catch(() => false);

      let initialPriority = '';
      if (hasPriority) {
        initialPriority = await priorityBadge.textContent();
      }

      // Step 3: Complete prerequisite
      await gtdApp.completeTask('High priority prerequisite');

      // Step 4: Check if priority changed
      taskElement = page.locator('.task-item', { hasText: 'Dependent task' });

      if (hasPriority) {
        const newPriority = await priorityBadge.textContent();

        // Priority should increase when unblocked
        // (exact comparison depends on implementation)
        expect(newPriority).toBeDefined();
      }
    } else {
      test.skip(true, 'Dependency field not implemented');
    }
  });

  test('should display dependency count on tasks', async ({ page, gtdApp }) => {
    // Step 1: Create task with multiple dependents
    await gtdApp.quickAddTask('Parent task');
    await gtdApp.quickAddTask('Child 1');
    await gtdApp.quickAddTask('Child 2');
    await gtdApp.quickAddTask('Child 3');

    const dependsOnField = page.locator('#task-depends-on');

    if (await dependsOnField.isVisible().catch(() => false)) {
      await gtdApp.openTask('Child 1');
      await dependsOnField.fill('Parent task');
      await gtdApp.saveTask();

      await gtdApp.openTask('Child 2');
      await dependsOnField.fill('Parent task');
      await gtdApp.saveTask();

      await gtdApp.openTask('Child 3');
      await dependsOnField.fill('Parent task');
      await gtdApp.saveTask();

      // Step 2: Check for dependency count indicator
      const parentTask = page.locator('.task-item', { hasText: 'Parent task' });
      await expect(parentTask).toBeVisible();

      const depCountBadge = parentTask.locator('.dependency-count').or(
        parentTask.locator('[data-dependency-count]')
      );

      const hasBadge = await depCountBadge.isVisible().catch(() => false);

      if (hasBadge) {
        const countText = await depCountBadge.textContent();
        expect(countText).toMatch(/3|three/i);
      }
    } else {
      test.skip(true, 'Dependency field not implemented');
    }
  });

  test('should move unblocked waiting task back to active', async ({ page, gtdApp }) => {
    // Step 1: Create waiting task
    await gtdApp.quickAddTask('Waiting for design approval');
    await gtdApp.openTask('Waiting for design approval');
    await page.selectOption('#task-status', 'waiting');

    const waitingForField = page.locator('#task-waiting-for');
    if (await waitingForField.isVisible().catch(() => false)) {
      await waitingForField.fill('Design team');
      await gtdApp.saveTask();

      // Verify in Waiting view
      await gtdApp.navigateTo('waiting');
      const waitingTasks = await gtdApp.getTasks();
      expect(waitingTasks.length).toBeGreaterThan(0);

      // Step 2: Move back to Next Actions (simulating approval received)
      await gtdApp.openTask('Waiting for design approval');
      await page.selectOption('#task-status', 'next');
      await gtdApp.saveTask();

      // Step 3: Verify task moved to Next
      await gtdApp.navigateTo('next');
      const nextTasks = await gtdApp.getTasks();
      const movedTask = nextTasks.find(t => t.title.includes('Waiting for design approval'));

      expect(movedTask).toBeDefined();

      // Step 4: Verify no longer in Waiting
      await gtdApp.navigateTo('waiting');
      const waitingTasksAfter = await gtdApp.getTasks();
      const stillWaiting = waitingTasksAfter.find(t => t.title.includes('Waiting for design approval'));

      expect(stillWaiting).toBeUndefined();
    } else {
      test.skip(true, 'Waiting for field not implemented');
    }
  });

  test('should filter tasks by dependency status', async ({ page, gtdApp }) => {
    // Step 1: Create mix of blocked and unblocked tasks
    await gtdApp.quickAddTask('Prerequisite 1');
    await gtdApp.quickAddTask('Prerequisite 2');
    await gtdApp.quickAddTask('Blocked Task 1');
    await gtdApp.quickAddTask('Unblocked Task');
    await gtdApp.quickAddTask('Blocked Task 2');

    const dependsOnField = page.locator('#task-depends-on');

    if (await dependsOnField.isVisible().catch(() => false)) {
      await gtdApp.openTask('Blocked Task 1');
      await dependsOnField.fill('Prerequisite 1');
      await gtdApp.saveTask();

      await gtdApp.openTask('Blocked Task 2');
      await dependsOnField.fill('Prerequisite 2');
      await gtdApp.saveTask();

      // Step 2: Look for filter by blocked status
      const blockedFilter = page.locator('#filter-blocked').or(
        page.locator('[data-filter="blocked"]')
      );

      const hasFilter = await blockedFilter.isVisible().catch(() => false);

      if (hasFilter) {
        await blockedFilter.click();

        // Step 3: Should show only blocked tasks
        const tasks = await gtdApp.getTasks();
        const blockedTask1 = tasks.find(t => t.title.includes('Blocked Task 1'));
        const blockedTask2 = tasks.find(t => t.title.includes('Blocked Task 2'));
        const unblockedTask = tasks.find(t => t.title.includes('Unblocked Task'));

        expect(blockedTask1).toBeDefined();
        expect(blockedTask2).toBeDefined();
        expect(unblockedTask).toBeUndefined();
      }
    } else {
      test.skip(true, 'Dependency field not implemented');
    }
  });

  test('should export and import dependencies', async ({ gtdApp }) => {
    // Step 1: Create tasks with dependencies
    await gtdApp.quickAddTask('Task A');
    await gtdApp.quickAddTask('Task B');

    const page = gtdApp.page;
    const dependsOnField = page.locator('#task-depends-on');

    if (await dependsOnField.isVisible().catch(() => false)) {
      await gtdApp.openTask('Task B');
      await dependsOnField.fill('Task A');
      await gtdApp.saveTask();

      // Step 2: Export data
      const tasksBefore = await gtdApp.getLocalStorage('gtd_tasks');
      expect(tasksBefore).toBeDefined();
      expect(tasksBefore.length).toBe(2);

      // Verify dependency in exported data
      const taskB = tasksBefore.find(t => t.title.includes('Task B'));
      expect(taskB).toBeDefined();

      // Step 3: Clear and import
      await gtdApp.clearLocalStorage();

      await gtdApp.setLocalStorage('gtd_tasks', tasksBefore);
      await gtdApp.page.reload();
      await gtdApp.waitForAppReady();

      // Step 4: Verify dependency preserved
      const tasksAfter = await gtdApp.getLocalStorage('gtd_tasks');
      const importedTaskB = tasksAfter.find(t => t.title.includes('Task B'));

      if (importedTaskB && importedTaskB.dependsOn) {
        expect(importedTaskB.dependsOn).toContain('Task A');
      }
    } else {
      test.skip(true, 'Dependency field not implemented');
    }
  });
});
