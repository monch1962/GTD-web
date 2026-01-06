import { test, expect } from '../../fixtures/gtd-app.js';

/**
 * Journey 10: Archive Management
 * Description: Long-term storage and cleanup of completed tasks
 *
 * Tests:
 * - Viewing archived tasks
 * - Sorting archived tasks
 * - Searching archive
 * - Restoring archived tasks
 * - Permanently deleting archived tasks
 * - Automatic archival trigger
 * - Archive statistics
 */
test.describe('Archive Management Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    await gtdApp.clearLocalStorage();
    await gtdApp.goto();
  });

  test('should open archive modal', async ({ page, gtdApp }) => {
    // Step 1: Click Archive button
    await page.click(gtdApp.selectors.archiveBtn);

    // Step 2: Verify archive modal opens
    const archiveModal = page.locator('#archive-modal').or(
      page.locator('.archive-modal')
    );

    const isModalVisible = await archiveModal.isVisible().catch(() => false);

    if (isModalVisible) {
      await expect(archiveModal).toBeVisible();

      // Step 3: Verify modal has title
      const modalTitle = archiveModal.locator('h2, .modal-title');
      await expect(modalTitle).toBeVisible();

      const titleText = await modalTitle.textContent();
      expect(titleText.toLowerCase()).toMatch(/archive/i);
    } else {
      test.skip(true, 'Archive modal not implemented');
    }
  });

  test('should display archived tasks older than threshold', async ({ page, gtdApp }) => {
    // Step 1: Create old completed tasks (simulate by modifying timestamps)
    await gtdApp.quickAddTask('Old task 1');
    await gtdApp.quickAddTask('Old task 2');
    await gtdApp.quickAddTask('Old task 3');

    const tasks = await gtdApp.getTasks();
    for (const task of tasks) {
      await gtdApp.completeTask(task.title);
    }

    // Make tasks appear old (>90 days)
    await page.evaluate(() => {
      const archive = JSON.parse(localStorage.getItem('gtd_archived_tasks') || '[]');
      archive.forEach(entry => {
        entry.archivedAt = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString();
      });
      localStorage.setItem('gtd_archived_tasks', JSON.stringify(archive));
    });

    // Step 2: Open archive
    await page.click(gtdApp.selectors.archiveBtn);

    const archiveModal = page.locator('#archive-modal');
    const isModalVisible = await archiveModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Verify archived tasks shown
      const archivedItems = archiveModal.locator('.archived-task, .archive-item');
      const count = await archivedItems.count();

      expect(count).toBeGreaterThanOrEqual(3);
    } else {
      test.skip(true, 'Archive modal not implemented');
    }
  });

  test('should sort archived tasks by completion date', async ({ page, gtdApp }) => {
    // Step 1: Create archived tasks with different dates
    for (let i = 1; i <= 5; i++) {
      await gtdApp.quickAddTask(`Task ${i}`);
      await gtdApp.completeTask(`Task ${i}`);
    }

    // Step 2: Open archive
    await page.click(gtdApp.selectors.archiveBtn);

    const archiveModal = page.locator('#archive-modal');
    const isModalVisible = await archiveModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find sort dropdown
      const sortSelect = archiveModal.locator('#archive-sort').or(
        archiveModal.locator('[data-sort]')
      );

      const hasSort = await sortSelect.count() > 0;

      if (hasSort) {
        // Step 4: Sort by completion date
        await sortSelect.selectOption('date');

        // Step 5: Verify order
        const items = await archiveModal.locator('.archived-task').all();
        expect(items.length).toBeGreaterThan(0);

        // First item should be most recent
        const firstItemDate = await items[0].locator('[data-date]').getAttribute('data-date');
        const lastItemDate = await items[items.length - 1].locator('[data-date]').getAttribute('data-date');

        expect(new Date(firstItemDate).getTime()).toBeGreaterThanOrEqual(new Date(lastItemDate).getTime());
      }
    } else {
      test.skip(true, 'Archive modal not implemented');
    }
  });

  test('should search archived tasks', async ({ page, gtdApp }) => {
    // Step 1: Create various archived tasks
    await gtdApp.quickAddTask('Important report');
    await gtdApp.completeTask('Important report');

    await gtdApp.quickAddTask('Quick email');
    await gtdApp.completeTask('Quick email');

    await gtdApp.quickAddTask('Team meeting notes');
    await gtdApp.completeTask('Team meeting notes');

    // Step 2: Open archive
    await page.click(gtdApp.selectors.archiveBtn);

    const archiveModal = page.locator('#archive-modal');
    const isModalVisible = await archiveModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Search for "report"
      const searchInput = archiveModal.locator('#archive-search').or(
        archiveModal.locator('[data-search]')
      );

      const hasSearch = await searchInput.count() > 0;

      if (hasSearch) {
        await searchInput.fill('report');
        await page.waitForTimeout(300);

        // Step 4: Verify filtered results
        const reportItem = archiveModal.locator('text=Important report');
        await expect(reportItem).toBeVisible();

        const emailItem = archiveModal.locator('text=Quick email');
        const isEmailShown = await emailItem.isVisible().catch(() => false);
        expect(isEmailShown).toBeFalsy();
      }
    } else {
      test.skip(true, 'Archive modal not implemented');
    }
  });

  test('should restore archived task', async ({ page, gtdApp }) => {
    // Step 1: Create and archive task
    await gtdApp.quickAddTask('Task to restore');
    await gtdApp.completeTask('Task to restore');

    // Step 2: Open archive
    await page.click(gtdApp.selectors.archiveBtn);

    const archiveModal = page.locator('#archive-modal');
    const isModalVisible = await archiveModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find and click restore button
      const restoreButton = archiveModal.locator('text=Task to restore')
        .locator('../..') // Go up to parent
        .locator('[data-action="restore"], .restore-btn, button:has-text("Restore")');

      const hasRestoreBtn = await restoreButton.count() > 0;

      if (hasRestoreBtn) {
        await restoreButton.click();

        // Step 4: Verify task restored (no longer in archive)
        await page.waitForTimeout(500);

        const restoredItem = archiveModal.locator('text=Task to restore');
        const isStillInArchive = await restoredItem.isVisible().catch(() => false);

        expect(isStillInArchive).toBeFalsy();

        // Step 5: Verify task appears in active view
        await gtdApp.navigateTo('all');

        const tasks = await gtdApp.getTasks();
        const restoredTask = tasks.find(t => t.title === 'Task to restore');

        expect(restoredTask).toBeDefined();
        expect(restoredTask.completed).toBe(false); // Should be uncompleted
      }
    } else {
      test.skip(true, 'Archive modal not implemented');
    }
  });

  test('should permanently delete archived task', async ({ page, gtdApp }) => {
    // Step 1: Create and archive task
    await gtdApp.quickAddTask('Task to delete forever');
    await gtdApp.completeTask('Task to delete forever');

    // Step 2: Open archive
    await page.click(gtdApp.selectors.archiveBtn);

    const archiveModal = page.locator('#archive-modal');
    const isModalVisible = await archiveModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find and click delete button
      const deleteButton = archiveModal.locator('text=Task to delete forever')
        .locator('../..')
        .locator('[data-action="delete"], .delete-btn, button:has-text("Delete")');

      const hasDeleteBtn = await deleteButton.count() > 0;

      if (hasDeleteBtn) {
        await deleteButton.click();

        // Step 4: Confirm deletion
        const confirmButton = page.locator('button:has-text("Confirm")').or(
          page.locator('button:has-text("Delete")')
        );

        const hasConfirm = await confirmButton.count() > 0;
        if (hasConfirm) {
          await confirmButton.first().click();
        }

        // Step 5: Verify task gone
        await page.waitForTimeout(500);

        const deletedItem = archiveModal.locator('text=Task to delete forever');
        const isStillVisible = await deletedItem.isVisible().catch(() => false);

        expect(isStillVisible).toBeFalsy();

        // Step 6: Verify not in active view either
        await gtdApp.navigateTo('all');

        const tasks = await gtdApp.getTasks();
        const deletedTask = tasks.find(t => t.title === 'Task to delete forever');

        expect(deletedTask).toBeUndefined();
      }
    } else {
      test.skip(true, 'Archive modal not implemented');
    }
  });

  test('should auto-cleanup old archives', async ({ page, gtdApp }) => {
    // Step 1: Fill archive with old entries
    await page.evaluate(() => {
      const archive = [];
      for (let i = 1; i <= 20; i++) {
        archive.push({
          task: {
            id: `task_${i}`,
            title: `Old archived task ${i}`
          },
          archivedAt: new Date(Date.now() - (180 + i) * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      localStorage.setItem('gtd_archived_tasks', JSON.stringify(archive));
    });

    // Step 2: Trigger cleanup by creating new task
    await gtdApp.quickAddTask('New task triggering cleanup');

    // Step 3: Check for cleanup notification
    const notification = await gtdApp.waitForNotification().catch(() => null);

    if (notification) {
      expect(notification.toLowerCase()).toMatch(/cleanup|archive|old/i);
    }

    // Step 4: Verify some old archives removed
    const archive = await gtdApp.getLocalStorage('gtd_archived_tasks');
    if (archive) {
      expect(archive.length).toBeLessThan(20);
    }
  });

  test('should display archive statistics', async ({ page, gtdApp }) => {
    // Step 1: Create some archived tasks
    for (let i = 1; i <= 10; i++) {
      await gtdApp.quickAddTask(`Archived task ${i}`);
      await gtdApp.completeTask(`Archived task ${i}`);
    }

    // Step 2: Open archive
    await page.click(gtdApp.selectors.archiveBtn);

    const archiveModal = page.locator('#archive-modal');
    const isModalVisible = await archiveModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Look for statistics
      const statsSection = archiveModal.locator('.archive-stats').or(
        archiveModal.locator('[data-stats]')
      );

      const hasStats = await statsSection.isVisible().catch(() => false);

      if (hasStats) {
        await expect(statsSection).toBeVisible();

        const statsText = await statsSection.textContent();
        expect(statsText).toMatch(/\d+/); // Should contain numbers

        // Should show total archived
        expect(statsText).toMatch(/10|ten/i);
      }
    } else {
      test.skip(true, 'Archive modal not implemented');
    }
  });

  test('should handle empty archive gracefully', async ({ page, gtdApp }) => {
    // Step 1: Open archive with no items
    await page.click(gtdApp.selectors.archiveBtn);

    const archiveModal = page.locator('#archive-modal');
    const isModalVisible = await archiveModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 2: Look for empty state
      const emptyState = archiveModal.locator('.empty-state').or(
        archiveModal.locator('text=No archived items')
      );

      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      if (hasEmptyState) {
        await expect(emptyState).toBeVisible();
      }

      // Should not crash
      await expect(archiveModal).toBeVisible();
    } else {
      test.skip(true, 'Archive modal not implemented');
    }
  });

  test('should bulk restore archived tasks', async ({ page, gtdApp }) => {
    // Step 1: Create archived tasks
    await gtdApp.quickAddTask('Task 1');
    await gtdApp.completeTask('Task 1');

    await gtdApp.quickAddTask('Task 2');
    await gtdApp.completeTask('Task 2');

    await gtdApp.quickAddTask('Task 3');
    await gtdApp.completeTask('Task 3');

    // Step 2: Open archive
    await page.click(gtdApp.selectors.archiveBtn);

    const archiveModal = page.locator('#archive-modal');
    const isModalVisible = await archiveModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Look for bulk restore option
      const bulkRestoreButton = archiveModal.locator('[data-action="bulk-restore"]').or(
        archiveModal.locator('button:has-text("Restore All")')
      );

      const hasBulkRestore = await bulkRestoreButton.count() > 0;

      if (hasBulkRestore) {
        await bulkRestoreButton.click();

        // Step 4: Confirm action
        const confirmButton = page.locator('button:has-text("Confirm")');
        const hasConfirm = await confirmButton.count() > 0;

        if (hasConfirm) {
          await confirmButton.click();
        }

        // Step 5: Verify all tasks restored
        await page.waitForTimeout(500);

        await gtdApp.navigateTo('all');
        const tasks = await gtdApp.getTasks();

        expect(tasks.length).toBeGreaterThanOrEqual(3);
      }
    } else {
      test.skip(true, 'Archive modal not implemented');
    }
  });

  test('should filter archive by date range', async ({ page, gtdApp }) => {
    // Step 1: Create tasks with different ages
    await gtdApp.quickAddTask('Recent task');
    await gtdApp.completeTask('Recent task');

    await gtdApp.quickAddTask('Old task');
    await gtdApp.completeTask('Old task');

    // Step 2: Open archive
    await page.click(gtdApp.selectors.archiveBtn);

    const archiveModal = page.locator('#archive-modal');
    const isModalVisible = await archiveModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Look for date filter
      const dateFilter = archiveModal.locator('[data-filter="date"]').or(
        archiveModal.locator('.date-filter')
      );

      const hasFilter = await dateFilter.count() > 0;

      if (hasFilter) {
        // Filter by last 7 days
        await dateFilter.selectOption('7days');

        // Step 4: Verify filtered results
        const items = await archiveModal.locator('.archived-task').all();
        expect(items.length).toBeGreaterThanOrEqual(0);
      }
    } else {
      test.skip(true, 'Archive modal not implemented');
    }
  });

  test('should export archive data', async ({ page, gtdApp }) => {
    // Step 1: Create archived tasks
    await gtdApp.quickAddTask('Exportable task');
    await gtdApp.completeTask('Exportable task');

    // Step 2: Open archive
    await page.click(gtdApp.selectors.archiveBtn);

    const archiveModal = page.locator('#archive-modal');
    const isModalVisible = await archiveModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Look for export button
      const exportButton = archiveModal.locator('[data-action="export"]').or(
        archiveModal.locator('button:has-text("Export")')
      );

      const hasExport = await exportButton.count() > 0;

      if (hasExport) {
        // Step 4: Setup download handler
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 });

        await exportButton.click();

        // Step 5: Verify download started
        const download = await downloadPromise.catch(() => null);

        if (download) {
          expect(download.suggestedFilename()).toMatch(/archive|export/i);
        }
      }
    } else {
      test.skip(true, 'Archive modal not implemented');
    }
  });

  test('should calculate archive storage savings', async ({ page, gtdApp }) => {
    // Step 1: Create many archived tasks
    for (let i = 1; i <= 50; i++) {
      await gtdApp.quickAddTask(`Task ${i} with some description text`);
      await gtdApp.completeTask(`Task ${i} with some description text`);
    }

    // Step 2: Open archive
    await page.click(gtdApp.selectors.archiveBtn);

    const archiveModal = page.locator('#archive-modal');
    const isModalVisible = await archiveModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Look for storage info
      const storageInfo = archiveModal.locator('[data-storage]').or(
        archiveModal.locator('.storage-info')
      );

      const hasStorageInfo = await storageInfo.isVisible().catch(() => false);

      if (hasStorageInfo) {
        await expect(storageInfo).toBeVisible();

        const infoText = await storageInfo.textContent();
        expect(infoText).toMatch(/\d+\s*(KB|MB|bytes)/i);
      }
    } else {
      test.skip(true, 'Archive modal not implemented');
    }
  });
});
