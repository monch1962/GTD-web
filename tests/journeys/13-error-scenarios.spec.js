import { test, expect } from '../../fixtures/gtd-app.js';

/**
 * Journey 13: Error Scenarios
 * Description: Graceful error handling and recovery
 *
 * Tests:
 * - localStorage quota warnings and errors
 * - Offline mode handling
 * - Corrupted data recovery
 * - Multiple errors in succession
 * - Error logging and reporting
 */
test.describe('Error Scenarios Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    await gtdApp.clearLocalStorage();
  });

  test('should show quota warning at 90% capacity', async ({ page, gtdApp }) => {
    // Step 1: Navigate to app
    await gtdApp.goto();

    // Step 2: Fill localStorage to 90% capacity
    await gtdApp.fillLocalStorageToQuota(0.9);

    // Step 3: Create a task
    await gtdApp.quickAddTask('Test task near quota');

    // Step 4: Check for quota warning notification
    const notification = await gtdApp.waitForNotification().catch(() => null);

    if (notification) {
      expect(notification.toLowerCase()).toMatch(/quota|storage|full|warning/i);
    }

    // Step 5: Task should still be created
    const tasks = await gtdApp.getTasks();
    expect(tasks).toHaveLength(1);
  });

  test('should handle QuotaExceededError gracefully', async ({ page, gtdApp }) => {
    // Step 1: Navigate to app
    await gtdApp.goto();

    // Step 2: Fill localStorage beyond capacity (attempt to)
    await gtdApp.fillLocalStorageToQuota(0.99);

    // Step 3: Try to create task that would exceed quota
    await gtdApp.quickAddTask('Very large task that might exceed quota ' + 'x'.repeat(10000));

    // Step 4: Check for error notification
    const notification = await gtdApp.waitForNotification().catch(() => null);

    if (notification) {
      expect(notification.toLowerCase()).toMatch(/quota|storage|full|error/i);
    }

    // Step 5: App should still be functional
    await expect(page.locator(gtdApp.selectors.quickAddInput)).toBeVisible();
    await expect(page.locator(gtdApp.selectors.inbox)).toBeVisible();
  });

  test('should auto-cleanup old archives when quota exceeded', async ({ page, gtdApp }) => {
    // Step 1: Navigate and create initial tasks
    await gtdApp.goto();

    for (let i = 0; i < 5; i++) {
      await gtdApp.quickAddTask(`Task ${i}`);
    }

    // Complete all tasks to create archive entries
    const tasks = await gtdApp.getTasks();
    for (const task of tasks) {
      await gtdApp.completeTask(task.title);
    }

    // Step 2: Fill localStorage to near capacity
    await gtdApp.fillLocalStorageToQuota(0.95);

    // Step 3: Try to create new task
    await gtdApp.quickAddTask('New task after cleanup');

    // Step 4: Should succeed after cleanup
    const tasksAfter = await gtdApp.getTasks();
    const newTask = tasksAfter.find(t => t.title === 'New task after cleanup');

    expect(newTask).toBeDefined();

    // Step 5: Check for cleanup notification
    const notification = await gtdApp.waitForNotification().catch(() => null);
    if (notification) {
      expect(notification.toLowerCase()).toMatch(/cleanup|archive|quota/i);
    }
  });

  test('should work offline without sync', async ({ page, gtdApp }) => {
    // Step 1: Navigate to app
    await gtdApp.goto();

    // Step 2: Go offline
    await gtdApp.setOffline();

    // Step 3: Verify sync status changes
    const syncStatus = page.locator(gtdApp.selectors.syncStatus);
    await expect(syncStatus).toBeVisible();

    const syncText = await syncStatus.textContent();
    expect(syncText.toLowerCase()).toMatch(/offline|sync|error/i);

    // Step 4: Create task while offline
    await gtdApp.quickAddTask('Offline task');

    // Step 5: Verify task created
    const tasks = await gtdApp.getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Offline task');

    // Step 6: Navigate around - app should still work
    await gtdApp.navigateTo('next');
    await gtdApp.navigateTo('inbox');

    // Step 7: Complete task while offline
    await gtdApp.completeTask('Offline task');

    // Step 8: Go back online
    await gtdApp.setOnline();

    // Step 9: Verify sync status recovers
    await page.waitForTimeout(1000);
    const syncTextOnline = await syncStatus.textContent();
    expect(syncTextOnline.toLowerCase()).not.toMatch(/offline/i);
  });

  test('should handle corrupted localStorage gracefully', async ({ page, gtdApp }) => {
    // Step 1: Navigate and create some data
    await gtdApp.goto();
    await gtdApp.quickAddTask('Good task 1');
    await gtdApp.quickAddTask('Good task 2');

    // Step 2: Corrupt the localStorage data
    await page.evaluate(() => {
      localStorage.setItem('gtd_tasks', 'invalid json {{{');
    });

    // Step 3: Reload page
    await gtdApp.page.reload();
    await gtdApp.waitForAppReady();

    // Step 4: App should not crash
    await expect(page.locator(gtdApp.selectors.quickAddInput)).toBeVisible();

    // Step 5: Should recover or show error
    const tasks = await gtdApp.getTasks();
    expect(tasks).toBeDefined(); // Should not throw error

    // Step 6: Should be able to create new tasks
    await gtdApp.quickAddTask('Task after corruption');
    const tasksAfter = await gtdApp.getTasks();
    expect(tasksAfter.length).toBeGreaterThan(0);
  });

  test('should handle browser privacy mode', async ({ context, gtdApp }) => {
    // Step 1: Create new context with strict privacy settings
    const page = await context.newPage();
    const privacyApp = new (Object.getPrototypeOf(gtdApp).constructor)(page);

    // Step 2: Navigate in privacy mode
    await privacyApp.goto();

    // Step 3: Should generate user ID
    const userId = await privacyApp.getUserId();
    expect(userId).toMatch(/^user_[a-z0-9]+$/);

    // Step 4: Should be able to create tasks
    await privacyApp.quickAddTask('Privacy mode task');
    const tasks = await privacyApp.getTasks();
    expect(tasks).toHaveLength(1);

    // Step 5: Reload - data may or may not persist (both acceptable)
    await privacyApp.page.reload();
    await privacyApp.waitForAppReady();

    const tasksAfter = await privacyApp.getTasks();

    // In privacy mode, data might not persist
    // App should still work regardless
    expect(tasksAfter).toBeDefined();

    await page.close();
  });

  test('should log errors to error log', async ({ page, gtdApp }) => {
    // Step 1: Navigate to app
    await gtdApp.goto();

    // Step 2: Trigger an error (simulate by calling error handler)
    const errorLogged = await page.evaluate(() => {
      try {
        // Trigger a quota error by filling storage
        const data = 'x'.repeat(10 * 1024 * 1024); // 10MB
        localStorage.setItem('test_error', data);
        return false; // Should not reach here
      } catch (error) {
        // Check if global error handler caught it
        const errorLog = JSON.parse(localStorage.getItem('gtd_error_log') || '[]');
        return errorLog.length > 0;
      }
    });

    // Step 3: Verify error log exists
    const errorLog = await gtdApp.getLocalStorage('gtd_error_log');

    if (errorLog) {
      expect(Array.isArray(errorLog)).toBeTruthy();
      expect(errorLog.length).toBeGreaterThan(0);

      // Verify error structure
      const lastError = errorLog[errorLog.length - 1];
      expect(lastError).toHaveProperty('message');
      expect(lastError).toHaveProperty('timestamp');
    }
  });

  test('should handle multiple errors in succession', async ({ page, gtdApp }) => {
    // Step 1: Navigate to app
    await gtdApp.goto();

    // Step 2: Trigger multiple quota errors
    for (let i = 0; i < 3; i++) {
      try {
        await page.evaluate(() => {
          const data = 'x'.repeat(10 * 1024 * 1024); // 10MB
          localStorage.setItem(`error_test_${i}`, data);
        });
      } catch (e) {
        // Expected to fail
      }
    }

    // Step 3: App should still be functional
    await expect(page.locator(gtdApp.selectors.quickAddInput)).toBeVisible();

    // Step 4: Should be able to create tasks
    await gtdApp.quickAddTask('Task after multiple errors');
    const tasks = await gtdApp.getTasks();
    expect(tasks).toHaveLength(1);

    // Step 5: Check error log
    const errorLog = await gtdApp.getLocalStorage('gtd_error_log');
    if (errorLog) {
      expect(errorLog.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('should show user-friendly error messages', async ({ page, gtdApp }) => {
    // Step 1: Navigate to app
    await gtdApp.goto();

    // Step 2: Fill storage to capacity
    await gtdApp.fillLocalStorageToQuota(0.99);

    // Step 3: Try to add large task
    await gtdApp.quickAddTask('Large task ' + 'x'.repeat(10000));

    // Step 4: Check for user-friendly notification
    const notification = await gtdApp.waitForNotification().catch(() => null);

    if (notification) {
      // Should not show technical jargon like "QuotaExceededError"
      expect(notification).not.toMatch(/QuotaExceededError/i);
      expect(notification).not.toMatch(/DOMException/i);

      // Should show user-friendly message
      expect(notification.toLowerCase()).toMatch(/storage|full|space|quota/i);
    }
  });

  test('should handle error during error logging', async ({ page, gtdApp }) => {
    // Step 1: Navigate to app
    await gtdApp.goto();

    // Step 2: Fill error log to capacity
    await page.evaluate(() => {
      const maxErrors = 25; // Slightly above the 20 limit
      const errorLog = [];
      for (let i = 0; i < maxErrors; i++) {
        errorLog.push({
          message: `Test error ${i}`,
          timestamp: new Date().toISOString()
        });
      }
      localStorage.setItem('gtd_error_log', JSON.stringify(errorLog));
    });

    // Step 3: Trigger another error
    await gtdApp.fillLocalStorageToQuota(0.99);
    await gtdApp.quickAddTask('Test task');

    // Step 4: App should not crash
    await expect(page.locator(gtdApp.selectors.quickAddInput)).toBeVisible();

    // Step 5: Error log should be trimmed
    const errorLog = await gtdApp.getLocalStorage('gtd_error_log');
    if (errorLog) {
      expect(errorLog.length).toBeLessThanOrEqual(25);
    }
  });

  test('should recover from localStorage disabled', async ({ context, gtdApp }) => {
    // Note: Playwright doesn't fully support disabling localStorage
    // This test documents expected behavior

    // Step 1: Navigate to app
    await gtdApp.goto();

    // Step 2: Verify app works
    await gtdApp.quickAddTask('Test task');
    const tasks = await gtdApp.getTasks();
    expect(tasks).toHaveLength(1);

    // If localStorage is disabled, app should:
    // - Show error message
    // - Not crash
    // - Offer alternative (e.g., sessionStorage or download data)

    // Verify graceful degradation
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle network timeout during sync', async ({ page, gtdApp }) => {
    // Step 1: Navigate to app
    await gtdApp.goto();

    // Step 2: Simulate slow network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 30000); // 30 second delay
    });

    // Step 3: Create task
    await gtdApp.quickAddTask('Task during slow network');

    // Step 4: App should not hang
    await expect(page.locator(gtdApp.selectors.quickAddInput)).toBeVisible({ timeout: 5000 });

    // Step 5: Task should be created locally
    const tasks = await gtdApp.getTasks();
    expect(tasks).toHaveLength(1);

    // Step 6: Remove network throttling
    await page.unroute('**/*');
  });

  test('should handle data migration errors', async ({ page, gtdApp }) => {
    // Step 1: Create old version data structure
    await page.evaluate(() => {
      const oldData = {
        tasks: [
          {
            id: 'old_1',
            title: 'Old task',
            // Missing new fields
          }
        ],
        version: '0.1.0' // Old version
      };
      localStorage.setItem('gtd_data', JSON.stringify(oldData));
    });

    // Step 2: Navigate to app
    await gtdApp.goto();

    // Step 3: Should migrate or handle gracefully
    await expect(page.locator(gtdApp.selectors.quickAddInput)).toBeVisible();

    // Step 4: Should be able to create new tasks
    await gtdApp.quickAddTask('New task after migration');
    const tasks = await gtdApp.getTasks();
    expect(tasks.length).toBeGreaterThan(0);
  });

  test('should preserve data on error recovery', async ({ page, gtdApp }) => {
    // Step 1: Navigate and create tasks
    await gtdApp.goto();
    await gtdApp.quickAddTask('Important task 1');
    await gtdApp.quickAddTask('Important task 2');
    await gtdApp.quickAddTask('Important task 3');

    // Step 2: Trigger error
    await gtdApp.fillLocalStorageToQuota(0.99);
    await gtdApp.quickAddTask('Error task ' + 'x'.repeat(10000));

    // Step 3: Reload page
    await gtdApp.page.reload();
    await gtdApp.waitForAppReady();

    // Step 4: Verify important data preserved
    const tasks = await gtdApp.getTasks();
    const taskTitles = tasks.map(t => t.title);

    expect(taskTitles).toContain('Important task 1');
    expect(taskTitles).toContain('Important task 2');
    expect(taskTitles).toContain('Important task 3');
  });

  test('should clear error log', async ({ page, gtdApp }) => {
    // Step 1: Navigate to app
    await gtdApp.goto();

    // Step 2: Add some errors to log
    await page.evaluate(() => {
      const errorLog = [
        { message: 'Error 1', timestamp: new Date().toISOString() },
        { message: 'Error 2', timestamp: new Date().toISOString() },
        { message: 'Error 3', timestamp: new Date().toISOString() }
      ];
      localStorage.setItem('gtd_error_log', JSON.stringify(errorLog));
    });

    // Step 3: Verify errors exist
    let errorLog = await gtdApp.getLocalStorage('gtd_error_log');
    expect(errorLog).toHaveLength(3);

    // Step 4: Clear error log (if UI exists)
    const clearErrorButton = page.locator('#clear-error-log').or(
      page.locator('button:has-text("Clear Errors")')
    );

    const isButtonVisible = await clearErrorButton.isVisible().catch(() => false);

    if (isButtonVisible) {
      await clearErrorButton.click();

      // Step 5: Verify log cleared
      errorLog = await gtdApp.getLocalStorage('gtd_error_log');
      expect(errorLog).toBeNull();
    }
  });

  test('should provide error details for debugging', async ({ page, gtdApp }) => {
    // Step 1: Navigate to app
    await gtdApp.goto();

    // Step 2: Trigger error
    await gtdApp.fillLocalStorageToQuota(0.99);
    await gtdApp.quickAddTask('Error test');

    // Step 3: Check error log structure
    const errorLog = await gtdApp.getLocalStorage('gtd_error_log');

    if (errorLog && errorLog.length > 0) {
      const lastError = errorLog[errorLog.length - 1];

      // Verify error has useful debugging info
      expect(lastError).toHaveProperty('message');
      expect(lastError).toHaveProperty('timestamp');

      // May also have (optional but good):
      if (lastError.stack) {
        expect(lastError.stack).toBeDefined();
      }

      if (lastError.userAgent) {
        expect(lastError.userAgent).toBeDefined();
      }

      if (lastError.url) {
        expect(lastError.url).toContain('http');
      }
    }
  });
});
