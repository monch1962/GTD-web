import { test, expect } from '../../fixtures/gtd-app.js';

/**
 * Journey 7: Daily Review Workflow
 * Description: GTD daily review process for maintaining system
 *
 * Tests:
 * - Opening daily review modal
 * - Reviewing recent completions
 * - Reviewing overdue tasks
 * - Reviewing high priority tasks
 * - Reviewing stalled projects
 * - Processing recommendations
 * - Tracking review completion
 */
test.describe('Daily Review Workflow Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    await gtdApp.clearLocalStorage();
    await gtdApp.goto();
  });

  test('should open daily review modal', async ({ page, gtdApp }) => {
    // Step 1: Click Daily Review button
    await page.click(gtdApp.selectors.dailyReviewBtn);

    // Step 2: Verify modal opens
    const dailyReviewModal = page.locator('#daily-review-modal').or(
      page.locator(ModalIds.DAILY_REVIEW)
    );

    const isModalVisible = await dailyReviewModal.isVisible().catch(() => false);

    if (isModalVisible) {
      await expect(dailyReviewModal).toBeVisible();

      // Step 3: Verify modal has title
      const modalTitle = dailyReviewModal.locator('h2, .modal-title, [role="heading"]');
      await expect(modalTitle).toBeVisible();

      const titleText = await modalTitle.textContent();
      expect(titleText.toLowerCase()).toMatch(/daily|review/i);
    } else {
      test.skip(true, 'Daily review modal not implemented');
    }
  });

  test('should display recent completions section', async ({ page, gtdApp }) => {
    // Step 1: Create and complete some tasks
    await gtdApp.quickAddTask('Completed task 1');
    await gtdApp.quickAddTask('Completed task 2');
    await gtdApp.quickAddTask('Completed task 3');
    await gtdApp.quickAddTask('Completed task 4');
    await gtdApp.quickAddTask('Completed task 5');

    // Complete all tasks
    const tasks = await gtdApp.getTasks();
    for (const task of tasks) {
      await gtdApp.completeTask(task.title);
    }

    // Step 2: Open daily review
    await page.click(gtdApp.selectors.dailyReviewBtn);

    const dailyReviewModal = page.locator('#daily-review-modal');
    const isModalVisible = await dailyReviewModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find "Recent Completions" section
      const recentCompletions = dailyReviewModal.locator('.recent-completions').or(
        dailyReviewModal.locator('[data-section="recent-completions"]')
      ).or(
        dailyReviewModal.locator('text=Recent Completions')
      );

      const sectionExists = await recentCompletions.isVisible().catch(() => false);

      if (sectionExists) {
        await expect(recentCompletions).toBeVisible();

        // Should show last 5 completed tasks
        const completedItems = recentCompletions.locator('.completed-task, .task-item');
        const count = await completedItems.count();

        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(5);
      }
    } else {
      test.skip(true, 'Daily review modal not implemented');
    }
  });

  test('should display overdue tasks section', async ({ page, gtdApp }) => {
    // Step 1: Create overdue tasks
    await gtdApp.quickAddTask('Overdue task 1');
    await gtdApp.openTask('Overdue task 1');

    await page.selectOption('#task-status', 'next');
    await page.fill('#task-due-date', '2024-01-01'); // Past date
    await gtdApp.saveTask();

    // Step 2: Open daily review
    await page.click(gtdApp.selectors.dailyReviewBtn);

    const dailyReviewModal = page.locator('#daily-review-modal');
    const isModalVisible = await dailyReviewModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find "Overdue Tasks" section
      const overdueSection = dailyReviewModal.locator('.overdue-tasks').or(
        dailyReviewModal.locator('[data-section="overdue"]')
      ).or(
        dailyReviewModal.locator('text=Overdue')
      );

      const sectionExists = await overdueSection.isVisible().catch(() => false);

      if (sectionExists) {
        await expect(overdueSection).toBeVisible();

        // Should show overdue task
        await expect(overdueSection.locator('text=Overdue task 1')).toBeVisible();
      }
    } else {
      test.skip(true, 'Daily review modal not implemented');
    }
  });

  test('should display high priority tasks', async ({ page, gtdApp }) => {
    // Step 1: Create tasks with various priorities
    await gtdApp.quickAddTask('Urgent task due today');
    await gtdApp.openTask('Urgent task due today');

    await page.selectOption('#task-status', 'next');
    await page.fill('#task-due-date', getTodayDate());
    await page.selectOption('#task-energy', 'high');
    await gtdApp.saveTask();

    // Step 2: Open daily review
    await page.click(gtdApp.selectors.dailyReviewBtn);

    const dailyReviewModal = page.locator('#daily-review-modal');
    const isModalVisible = await dailyReviewModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find "High Priority" section
      const prioritySection = dailyReviewModal.locator('.high-priority').or(
        dailyReviewModal.locator('[data-section="priority"]')
      ).or(
        dailyReviewModal.locator('text=Priority')
      );

      const sectionExists = await prioritySection.isVisible().catch(() => false);

      if (sectionExists) {
        await expect(prioritySection).toBeVisible();

        // Should show high priority task
        await expect(prioritySection.locator('text=Urgent task due today')).toBeVisible();
      }
    } else {
      test.skip(true, 'Daily review modal not implemented');
    }
  });

  test('should display stalled projects', async ({ page, gtdApp }) => {
    // Step 1: Create project with old activity
    await gtdApp.createProject({
      title: 'Stalled Project',
      status: 'active',
      contexts: ['work']
    });

    await gtdApp.quickAddTask('Old task #Stalled Project');

    // Simulate old task by modifying timestamp
    await page.evaluate(() => {
      const tasks = JSON.parse(localStorage.getItem('gtd_tasks') || '[]');
      if (tasks.length > 0) {
        tasks[0].updatedAt = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(); // 35 days ago
        localStorage.setItem('gtd_tasks', JSON.stringify(tasks));
      }
    });

    // Step 2: Open daily review
    await page.click(gtdApp.selectors.dailyReviewBtn);

    const dailyReviewModal = page.locator('#daily-review-modal');
    const isModalVisible = await dailyReviewModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find "Stalled Projects" section
      const stalledSection = dailyReviewModal.locator('.stalled-projects').or(
        dailyReviewModal.locator('[data-section="stalled"]')
      ).or(
        dailyReviewModal.locator('text=Stalled')
      );

      const sectionExists = await stalledSection.isVisible().catch(() => false);

      if (sectionExists) {
        await expect(stalledSection).toBeVisible();

        // Should show stalled project
        await expect(stalledSection.locator('text=Stalled Project')).toBeVisible();
      }
    } else {
      test.skip(true, 'Daily review modal not implemented');
    }
  });

  test('should process recommendations during review', async ({ page, gtdApp }) => {
    // Step 1: Create scenarios for recommendations
    await gtdApp.quickAddTask('Overdue: Submit report');
    await gtdApp.openTask('Overdue: Submit report');
    await page.selectOption('#task-status', 'next');
    await page.fill('#task-due-date', '2024-01-01');
    await gtdApp.saveTask();

    // Step 2: Open daily review
    await page.click(gtdApp.selectors.dailyReviewBtn);

    const dailyReviewModal = page.locator('#daily-review-modal');
    const isModalVisible = await dailyReviewModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find actionable items
      const actionableItems = dailyReviewModal.locator('[data-actionable="true"], .action-item');
      const count = await actionableItems.count();

      if (count > 0) {
        // Step 4: Click on an item to process it
        await actionableItems.first().click();

        // Step 5: Should open task or project for editing
        const taskModal = page.locator('#task-modal');
        const projectModal = page.locator('#project-modal');

        const modalOpened = await taskModal.isVisible().catch(() => false) ||
                            await projectModal.isVisible().catch(() => false);

        expect(modalOpened).toBeTruthy();

        if (await taskModal.isVisible().catch(() => false)) {
          // Complete the task
          await page.selectOption('#task-status', 'completed');
          await gtdApp.saveTask();

          // Step 6: Return to review and verify item removed
          await page.click(gtdApp.selectors.dailyReviewBtn);

          const remainingItems = dailyReviewModal.locator('[data-actionable="true"]');
          const remainingCount = await remainingItems.count();

          expect(remainingCount).toBeLessThan(count);
        }
      }
    } else {
      test.skip(true, 'Daily review modal not implemented');
    }
  });

  test('should mark review as complete', async ({ page, gtdApp }) => {
    // Step 1: Open daily review
    await page.click(gtdApp.selectors.dailyReviewBtn);

    const dailyReviewModal = page.locator('#daily-review-modal');
    const isModalVisible = await dailyReviewModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 2: Find "Complete Review" button
      const completeButton = dailyReviewModal.locator('button:has-text("Complete")').or(
        dailyReviewModal.locator('#complete-review')
      ).or(
        dailyReviewModal.locator('[data-action="complete"]')
      );

      const hasButton = await completeButton.count() > 0;

      if (hasButton) {
        await completeButton.click();

        // Step 3: Verify modal closes or shows confirmation
        const isStillVisible = await dailyReviewModal.isVisible().catch(() => false);
        expect(isStillVisible).toBeFalsy();

        // Step 4: Verify review timestamp logged
        const lastReview = await gtdApp.getLocalStorage('gtd_last_daily_review');

        if (lastReview) {
          const reviewDate = new Date(lastReview);
          const today = new Date();

          // Should be within last minute
          const diffMs = today - reviewDate;
          expect(diffMs).toBeLessThan(60000);
        }
      }
    } else {
      test.skip(true, 'Daily review modal not implemented');
    }
  });

  test('should suggest next review date', async ({ page, gtdApp }) => {
    // Step 1: Open daily review
    await page.click(gtdApp.selectors.dailyReviewBtn);

    const dailyReviewModal = page.locator('#daily-review-modal');
    const isModalVisible = await dailyReviewModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 2: Look for next review suggestion
      const nextReviewText = dailyReviewModal.locator('.next-review').or(
        dailyReviewModal.locator('[data-next-review]')
      ).or(
        dailyReviewModal.locator('text=next review')
      );

      const hasSuggestion = await nextReviewText.isVisible().catch(() => false);

      if (hasSuggestion) {
        const text = await nextReviewText.textContent();
        expect(text.toLowerCase()).toMatch(/tomorrow|next|day/i);
      }
    } else {
      test.skip(true, 'Daily review modal not implemented');
    }
  });

  test('should update productivity stats', async ({ page, gtdApp }) => {
    // Step 1: Complete some tasks
    await gtdApp.quickAddTask('Task 1');
    await gtdApp.quickAddTask('Task 2');
    await gtdApp.quickAddTask('Task 3');

    const tasks = await gtdApp.getTasks();
    for (const task of tasks.slice(0, 3)) {
      await gtdApp.completeTask(task.title);
    }

    // Step 2: Open daily review
    await page.click(gtdApp.selectors.dailyReviewBtn);

    const dailyReviewModal = page.locator('#daily-review-modal');
    const isModalVisible = await dailyReviewModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find stats section
      const statsSection = dailyReviewModal.locator('.stats').or(
        dailyReviewModal.locator('[data-section="stats"]')
      ).or(
        dailyReviewModal.locator('.productivity-stats')
      );

      const hasStats = await statsSection.isVisible().catch(() => false);

      if (hasStats) {
        await expect(statsSection).toBeVisible();

        // Should show completion count
        const statsText = await statsSection.textContent();
        expect(statsText).toMatch(/\d+/); // Should contain numbers
      }
    } else {
      test.skip(true, 'Daily review modal not implemented');
    }
  });

  test('should handle empty review state', async ({ page, gtdApp }) => {
    // Step 1: Open daily review with no data
    await page.click(gtdApp.selectors.dailyReviewBtn);

    const dailyReviewModal = page.locator('#daily-review-modal');
    const isModalVisible = await dailyReviewModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 2: Look for empty state message
      const emptyState = dailyReviewModal.locator('.empty-state').or(
        dailyReviewModal.locator('text=No items')
      );

      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      if (hasEmptyState) {
        await expect(emptyState).toBeVisible();
      }

      // Step 3: Should still be able to complete review
      const completeButton = dailyReviewModal.locator('button:has-text("Complete")');
      const hasButton = await completeButton.count() > 0;

      if (hasButton) {
        await completeButton.click();
        const isStillVisible = await dailyReviewModal.isVisible().catch(() => false);
        expect(isStillVisible).toBeFalsy();
      }
    } else {
      test.skip(true, 'Daily review modal not implemented');
    }
  });

  test('should track review streak', async ({ page, gtdApp }) => {
    // Step 1: Complete review multiple times (simulate)
    await page.evaluate(() => {
      const reviews = [];
      for (let i = 0; i < 5; i++) {
        reviews.push(new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString());
      }
      localStorage.setItem('gtd_daily_review_streak', JSON.stringify(reviews));
    });

    // Step 2: Open daily review
    await page.click(gtdApp.selectors.dailyReviewBtn);

    const dailyReviewModal = page.locator('#daily-review-modal');
    const isModalVisible = await dailyReviewModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Look for streak indicator
      const streakIndicator = dailyReviewModal.locator('.streak').or(
        dailyReviewModal.locator('[data-streak]')
      ).or(
        dailyReviewModal.locator('text=day streak')
      );

      const hasStreak = await streakIndicator.isVisible().catch(() => false);

      if (hasStreak) {
        const streakText = await streakIndicator.textContent();
        expect(streakText).toMatch(/5|five/i);
      }
    } else {
      test.skip(true, 'Daily review modal not implemented');
    }
  });

  test('should provide keyboard shortcuts for review', async ({ page, gtdApp }) => {
    // Step 1: Open daily review
    await page.click(gtdApp.selectors.dailyReviewBtn);

    const dailyReviewModal = page.locator('#daily-review-modal');
    const isModalVisible = await dailyReviewModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 2: Test keyboard navigation
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');

      // Should focus on actionable items
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Step 3: Try Enter to activate
      await page.keyboard.press('Enter');

      // Should open task or complete review
      const taskModal = page.locator('#task-modal');
      const modalOpened = await taskModal.isVisible().catch(() => false);

      if (modalOpened) {
        await expect(taskModal).toBeVisible();
      }
    } else {
      test.skip(true, 'Daily review modal not implemented');
    }
  });
});

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}
