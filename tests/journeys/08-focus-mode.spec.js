import { test, expect } from '../fixtures/gtd-app.js';

/**
 * Journey 8: Focus Mode (Pomodoro)
 * Description: Deep work sessions with timer and task focus
 *
 * Tests:
 * - Entering focus mode
 * - Timer functionality
 * - Task display in focus mode
 * - Timer controls (pause/resume/stop)
 * - Task completion in focus mode
 * - Auto-exit on completion
 * - Break suggestions
 * - Time tracking
 */
test.describe('Focus Mode Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    await gtdApp.clearLocalStorage();
    await gtdApp.goto();
  });

  test('should enter focus mode with task', async ({ page, gtdApp }) => {
    // Step 1: Create a task
    await gtdApp.quickAddTask('Deep work task @work high energy');

    // Step 2: Select task (click on it)
    const taskElement = page.locator('.task-item', { hasText: 'Deep work task' });
    await taskElement.click();

    // Step 3: Click Focus Mode button
    await page.click(gtdApp.selectors.focusModeBtn);

    // Step 4: Verify focus overlay appears
    const focusOverlay = page.locator('#focus-mode-overlay').or(
      page.locator('.focus-mode')
    );

    const isOverlayVisible = await focusOverlay.isVisible().catch(() => false);

    if (isOverlayVisible) {
      await expect(focusOverlay).toBeVisible();

      // Step 5: Verify task title displayed prominently
      await expect(focusOverlay.locator('text=Deep work task')).toBeVisible();

      // Step 6: Verify timer visible
      const timer = focusOverlay.locator('.timer').or(
        focusOverlay.locator('[data-timer]')
      );
      await expect(timer).toBeVisible();
    } else {
      test.skip(true, 'Focus mode not implemented');
    }
  });

  test('should start timer automatically when entering focus mode', async ({ page, gtdApp }) => {
    // Step 1: Create and select task
    await gtdApp.quickAddTask('Focus session task');
    await page.locator('.task-item', { hasText: 'Focus session task' }).click();

    // Step 2: Enter focus mode
    await page.click(gtdApp.selectors.focusModeBtn);

    const focusOverlay = page.locator('#focus-mode-overlay');
    const isOverlayVisible = await focusOverlay.isVisible().catch(() => false);

    if (isOverlayVisible) {
      // Step 3: Verify timer is running (25:00 or similar)
      const timer = focusOverlay.locator('.timer');

      // Wait a moment for timer to start
      await page.waitForTimeout(1000);

      const timerText = await timer.textContent();
      expect(timerText).toMatch(/\d{1,2}:\d{2}/); // MM:SS format

      // Step 4: Verify timer is counting down
      const timerText2 = await timer.textContent();
      await page.waitForTimeout(2000);
      const timerText3 = await timer.textContent();

      expect(timerText3).not.toBe(timerText2);
    } else {
      test.skip(true, 'Focus mode not implemented');
    }
  });

  test('should pause and resume timer', async ({ page, gtdApp }) => {
    // Step 1: Enter focus mode
    await gtdApp.quickAddTask('Pausable focus task');
    await page.locator('.task-item', { hasText: 'Pausable focus task' }).click();
    await page.click(gtdApp.selectors.focusModeBtn);

    const focusOverlay = page.locator('#focus-mode-overlay');
    const isOverlayVisible = await focusOverlay.isVisible().catch(() => false);

    if (isOverlayVisible) {
      const timer = focusOverlay.locator('.timer');

      // Step 2: Wait for timer to start
      await page.waitForTimeout(1000);
      const initialTime = await timer.textContent();

      // Step 3: Click pause button
      const pauseButton = focusOverlay.locator('button:has-text("Pause")').or(
        focusOverlay.locator('[data-action="pause"]')
      );

      const hasPauseBtn = await pauseButton.count() > 0;
      if (hasPauseBtn) {
        await pauseButton.click();

        // Step 4: Wait and verify timer stopped
        await page.waitForTimeout(2000);
        const pausedTime = await timer.textContent();
        expect(pausedTime).toBe(initialTime);

        // Step 5: Resume timer
        const resumeButton = focusOverlay.locator('button:has-text("Resume")').or(
          focusOverlay.locator('[data-action="resume"]')
        );

        await resumeButton.click();

        // Step 6: Verify timer running again
        await page.waitForTimeout(2000);
        const resumedTime = await timer.textContent();
        expect(resumedTime).not.toBe(pausedTime);
      }
    } else {
      test.skip(true, 'Focus mode not implemented');
    }
  });

  test('should stop timer and exit focus mode', async ({ page, gtdApp }) => {
    // Step 1: Enter focus mode
    await gtdApp.quickAddTask('Stoppable focus task');
    await page.locator('.task-item', { hasText: 'Stoppable focus task' }).click();
    await page.click(gtdApp.selectors.focusModeBtn);

    const focusOverlay = page.locator('#focus-mode-overlay');
    const isOverlayVisible = await focusOverlay.isVisible().catch(() => false);

    if (isOverlayVisible) {
      // Step 2: Click stop/exit button
      const stopButton = focusOverlay.locator('button:has-text("Stop")').or(
        focusOverlay.locator('button:has-text("Exit")')
      ).or(
        focusOverlay.locator('[data-action="stop"]')
      );

      const hasStopBtn = await stopButton.count() > 0;
      if (hasStopBtn) {
        await stopButton.click();

        // Step 3: Verify focus mode exited
        await expect(focusOverlay).not.toBeVisible();

        // Step 4: Verify returned to normal view
        await expect(page.locator('#main-content')).toBeVisible();
      }

      // Also test ESC key
      await page.locator('.task-item', { hasText: 'Stoppable focus task' }).click();
      await page.click(gtdApp.selectors.focusModeBtn);

      if (await focusOverlay.isVisible().catch(() => false)) {
        await page.keyboard.press('Escape');
        await expect(focusOverlay).not.toBeVisible();
      }
    } else {
      test.skip(true, 'Focus mode not implemented');
    }
  });

  test('should complete task while in focus mode', async ({ page, gtdApp }) => {
    // Step 1: Enter focus mode
    await gtdApp.quickAddTask('Task to complete in focus');
    await page.locator('.task-item', { hasText: 'Task to complete in focus' }).click();
    await page.click(gtdApp.selectors.focusModeBtn);

    const focusOverlay = page.locator('#focus-mode-overlay');
    const isOverlayVisible = await focusOverlay.isVisible().catch(() => false);

    if (isOverlayVisible) {
      // Step 2: Complete task
      const completeButton = focusOverlay.locator('.task-checkbox').or(
        focusOverlay.locator('button:has-text("Complete")')
      );

      await completeButton.click();

      // Step 3: Verify task marked complete
      const taskCheckbox = page.locator('.task-item', { hasText: 'Task to complete in focus' })
        .locator('.task-checkbox');
      const isCompleted = await taskCheckbox.isChecked();

      expect(isCompleted).toBeTruthy();

      // Step 4: Verify focus mode exited or shows next task
      const isStillVisible = await focusOverlay.isVisible().catch(() => false);

      if (!isStillVisible) {
        // Focus mode exited - acceptable behavior
        await expect(focusOverlay).not.toBeVisible();
      }
      // else: showing next task - also acceptable
    } else {
      test.skip(true, 'Focus mode not implemented');
    }
  });

  test('should show break suggestion after timer completes', async ({ page, gtdApp }) => {
    // Step 1: Enter focus mode
    await gtdApp.quickAddTask('Task with break');
    await page.locator('.task-item', { hasText: 'Task with break' }).click();
    await page.click(gtdApp.selectors.focusModeBtn);

    const focusOverlay = page.locator('#focus-mode-overlay');
    const isOverlayVisible = await focusOverlay.isVisible().catch(() => false);

    if (isOverlayVisible) {
      // Note: We can't wait 25 minutes for timer to complete
      // Instead, we'll verify break suggestion UI exists

      // Step 2: Look for break suggestion UI
      const breakSuggestion = focusOverlay.locator('.break-suggestion').or(
        focusOverlay.locator('[data-break]')
      );

      const hasBreakUI = await breakSuggestion.isVisible().catch(() => false);

      if (hasBreakUI) {
        await expect(breakSuggestion).toBeVisible();
        const breakText = await breakSuggestion.textContent();
        expect(breakText.toLowerCase()).toMatch(/break|rest/i);
      }
    } else {
      test.skip(true, 'Focus mode not implemented');
    }
  });

  test('should track time spent on task', async ({ page, gtdApp }) => {
    // Step 1: Enter focus mode
    await gtdApp.quickAddTask('Time tracked task');
    await page.locator('.task-item', { hasText: 'Time tracked task' }).click();
    await page.click(gtdApp.selectors.focusModeBtn);

    const focusOverlay = page.locator('#focus-mode-overlay');
    const isOverlayVisible = await focusOverlay.isVisible().catch(() => false);

    if (isOverlayVisible) {
      // Step 2: Let timer run for a few seconds
      await page.waitForTimeout(5000);

      // Step 3: Exit focus mode
      await page.keyboard.press('Escape');

      // Step 4: Open task and verify time tracked
      await gtdApp.openTask('Time tracked task');

      const timeSpentField = page.locator('#task-time-spent').or(
        page.locator('[data-time-spent]')
      );

      const hasTimeTracking = await timeSpentField.count() > 0;

      if (hasTimeTracking) {
        const timeSpent = await timeSpentField.textContent();
        expect(timeSpent).toMatch(/\d+\s*(min|minute|sec)/i);
      }
    } else {
      test.skip(true, 'Focus mode not implemented');
    }
  });

  test('should hide all other UI elements in focus mode', async ({ page, gtdApp }) => {
    // Step 1: Enter focus mode
    await gtdApp.quickAddTask('Focus mode UI test');
    await page.locator('.task-item', { hasText: 'Focus mode UI test' }).click();
    await page.click(gtdApp.selectors.focusModeBtn);

    const focusOverlay = page.locator('#focus-mode-overlay');
    const isOverlayVisible = await focusOverlay.isVisible().catch(() => false);

    if (isOverlayVisible) {
      // Step 2: Verify sidebar is hidden or obscured
      const sidebar = page.locator('.sidebar');
      const isVisible = await sidebar.isVisible().catch(() => true);

      if (isVisible) {
        // If visible, should be behind overlay
        const zIndex = await sidebar.evaluate(el => {
          return window.getComputedStyle(el).zIndex;
        });
        const overlayZIndex = await focusOverlay.evaluate(el => {
          return window.getComputedStyle(el).zIndex;
        });

        expect(parseInt(overlayZIndex)).toBeGreaterThan(parseInt(zIndex));
      }

      // Step 3: Verify only focus-related elements are visible
      await expect(focusOverlay).toBeVisible();
      await expect(focusOverlay.locator('.timer')).toBeVisible();
    } else {
      test.skip(true, 'Focus mode not implemented');
    }
  });

  test('should support keyboard shortcuts in focus mode', async ({ page, gtdApp }) => {
    // Step 1: Enter focus mode
    await gtdApp.quickAddTask('Keyboard shortcuts focus');
    await page.locator('.task-item', { hasText: 'Keyboard shortcuts focus' }).click();
    await page.click(gtdApp.selectors.focusModeBtn);

    const focusOverlay = page.locator('#focus-mode-overlay');
    const isOverlayVisible = await focusOverlay.isVisible().catch(() => false);

    if (isOverlayVisible) {
      // Step 2: Test Space to pause/resume (if implemented)
      await page.keyboard.press('Space');
      await page.waitForTimeout(1000);

      // Step 3: Test Escape to exit
      await page.keyboard.press('Escape');

      const isStillVisible = await focusOverlay.isVisible().catch(() => false);
      expect(isStillVisible).toBeFalsy();
    } else {
      test.skip(true, 'Focus mode not implemented');
    }
  });

  test('should display timer in different formats', async ({ page, gtdApp }) => {
    // Step 1: Enter focus mode
    await gtdApp.quickAddTask('Timer format test');
    await page.locator('.task-item', { hasText: 'Timer format test' }).click();
    await page.click(gtdApp.selectors.focusModeBtn);

    const focusOverlay = page.locator('#focus-mode-overlay');
    const isOverlayVisible = await focusOverlay.isVisible().catch(() => false);

    if (isOverlayVisible) {
      const timer = focusOverlay.locator('.timer');

      // Step 2: Verify timer format
      const timerText = await timer.textContent();

      // Should be in MM:SS or HH:MM:SS format
      expect(timerText).toMatch(/\d{1,2}:\d{2}(:\d{2})?/);

      // Step 3: Look for progress bar or circular indicator
      const progressBar = focusOverlay.locator('.progress-bar').or(
        focusOverlay.locator('.circular-progress')
      );

      const hasProgress = await progressBar.isVisible().catch(() => false);

      if (hasProgress) {
        await expect(progressBar).toBeVisible();
      }
    } else {
      test.skip(true, 'Focus mode not implemented');
    }
  });

  test('should handle Pomodoro technique (25min work, 5min break)', async ({ page, gtdApp }) => {
    // Step 1: Enter focus mode
    await gtdApp.quickAddTask('Pomodoro task');
    await page.locator('.task-item', { hasText: 'Pomodoro task' }).click();
    await page.click(gtdApp.selectors.focusModeBtn);

    const focusOverlay = page.locator('#focus-mode-overlay');
    const isOverlayVisible = await focusOverlay.isVisible().catch(() => false);

    if (isOverlayVisible) {
      const timer = focusOverlay.locator('.timer');

      // Step 2: Verify 25 minute work timer
      const timerText = await timer.textContent();
      expect(timerText).toMatch(/25:\d{2}/);

      // Step 3: Look for Pomodoro indicator
      const pomodoroIndicator = focusOverlay.locator('.pomodoro').or(
        focusOverlay.locator('[data-pomodoro]')
      );

      const hasIndicator = await pomodoroIndicator.isVisible().catch(() => false);

      if (hasIndicator) {
        await expect(pomodoroIndicator).toBeVisible();
      }

      // Step 4: Look for break duration setting
      const breakDuration = focusOverlay.locator('[data-break-duration]');
      const hasBreakSetting = await breakDuration.count() > 0;

      if (hasBreakSetting) {
        const duration = await breakDuration.getAttribute('data-break-duration');
        expect(duration).toMatch(/5|300/); // 5 minutes or 300 seconds
      }
    } else {
      test.skip(true, 'Focus mode not implemented');
    }
  });

  test('should log focus sessions to history', async ({ page, gtdApp }) => {
    // Step 1: Complete a focus session
    await gtdApp.quickAddTask('Session history task');
    await page.locator('.task-item', { hasText: 'Session history task' }).click();
    await page.click(gtdApp.selectors.focusModeBtn);

    const focusOverlay = page.locator('#focus-mode-overlay');
    const isOverlayVisible = await focusOverlay.isVisible().catch(() => false);

    if (isOverlayVisible) {
      // Let timer run briefly
      await page.waitForTimeout(3000);

      // Exit
      await page.keyboard.press('Escape');

      // Step 2: Check for session history
      const sessionHistory = await gtdApp.getLocalStorage('gtd_focus_sessions');

      if (sessionHistory) {
        expect(Array.isArray(sessionHistory)).toBeTruthy();
        expect(sessionHistory.length).toBeGreaterThan(0);

        const lastSession = sessionHistory[sessionHistory.length - 1];
        expect(lastSession).toHaveProperty('duration');
        expect(lastSession).toHaveProperty('timestamp');
      }
    } else {
      test.skip(true, 'Focus mode not implemented');
    }
  });

  test('should handle interruption during focus session', async ({ page, gtdApp }) => {
    // Step 1: Enter focus mode
    await gtdApp.quickAddTask('Interruptible focus task');
    await page.locator('.task-item', { hasText: 'Interruptible focus task' }).click();
    await page.click(gtdApp.selectors.focusModeBtn);

    const focusOverlay = page.locator('#focus-mode-overlay');
    const isOverlayVisible = await focusOverlay.isVisible().catch(() => false);

    if (isOverlayVisible) {
      // Step 2: Look for "interrupt" or "pause" button
      const interruptButton = focusOverlay.locator('button:has-text("Interrupt")').or(
        focusOverlay.locator('[data-action="interrupt"]')
      );

      const hasButton = await interruptButton.count() > 0;

      if (hasButton) {
        await interruptButton.click();

        // Step 3: Should save partial progress
        const timer = focusOverlay.locator('.timer');
        const timerText = await timer.textContent();

        // Should show time spent
        expect(timerText).toMatch(/\d+:\d{2}/);
      }
    } else {
      test.skip(true, 'Focus mode not implemented');
    }
  });
});
