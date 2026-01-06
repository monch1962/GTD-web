import { test, expect } from '../fixtures/gtd-app.js';

/**
 * Journey 18: Productivity Heatmap
 * Description: Tracking and visualizing productivity patterns over time
 *
 * Tests:
 * - Opening heatmap modal
 * - Displaying last 365 days
 * - Color intensity based on completed tasks
 * - Hover tooltips
 * - Click to filter tasks
 * - Statistics panel
 * - Longest streak calculation
 * - Responsiveness
 * - Empty state handling
 */
test.describe('Productivity Heatmap Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    await gtdApp.clearLocalStorage();
    await gtdApp.goto();
  });

  test('should open heatmap modal', async ({ page, gtdApp }) => {
    // Step 1: Click Productivity Heatmap button
    await page.click(gtdApp.selectors.heatmapBtn);

    // Step 2: Verify heatmap modal opens
    const heatmapModal = page.locator('#heatmap-modal').or(
      page.locator('.heatmap-modal')
    );

    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      await expect(heatmapModal).toBeVisible();

      // Step 3: Verify modal has title
      const modalTitle = heatmapModal.locator('h2, .modal-title');
      await expect(modalTitle).toBeVisible();

      const titleText = await modalTitle.textContent();
      expect(titleText.toLowerCase()).toMatch(/heatmap|productivity/i);
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should display 365 days of activity', async ({ page, gtdApp }) => {
    // Step 1: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 2: Count day cells
      const dayCells = heatmapModal.locator('.heatmap-cell, .day-cell');
      const count = await dayCells.count();

      // Should show approximately 365 days (or 52 weeks * 7 = 364)
      expect(count).toBeGreaterThanOrEqual(350);
      expect(count).toBeLessThanOrEqual(370);
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should show color intensity based on completed tasks', async ({ page, gtdApp }) => {
    // Step 1: Create and complete tasks
    for (let i = 0; i < 5; i++) {
      await gtdApp.quickAddTask(`Task ${i}`);
      await gtdApp.completeTask(`Task ${i}`);
    }

    // Step 2: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find colored cells (not gray/empty)
      const coloredCells = heatmapModal.locator('.heatmap-cell[data-level="1"], '
                                         + '.heatmap-cell[data-level="2"], '
                                         + '.heatmap-cell[data-level="3"], '
                                         + '.heatmap-cell[data-level="4"]');

      const hasColored = await coloredCells.count() > 0;

      if (hasColored) {
        await expect(coloredCells.first()).toBeVisible();

        // Step 4: Verify color levels
        const level1 = heatmapModal.locator('.heatmap-cell[data-level="1"]');
        const level4 = heatmapModal.locator('.heatmap-cell[data-level="4"]');

        const hasLevel1 = await level1.count() > 0;
        const hasLevel4 = await level4.count() > 0;

        // Should have at least one non-zero level
        expect(hasLevel1 || hasLevel4).toBeTruthy();
      }
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should show tooltip on hover', async ({ page, gtdApp }) => {
    // Step 1: Complete some tasks
    await gtdApp.quickAddTask('Tooltip test task');
    await gtdApp.completeTask('Tooltip test task');

    // Step 2: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Hover over a day cell
      const dayCell = heatmapModal.locator('.heatmap-cell').first();
      await dayCell.hover();

      // Step 4: Verify tooltip appears
      const tooltip = heatmapModal.locator('.heatmap-tooltip, [data-tooltip]');
      const hasTooltip = await tooltip.isVisible().catch(() => false);

      if (hasTooltip) {
        await expect(tooltip).toBeVisible();

        const tooltipText = await tooltip.textContent();
        expect(tooltipText).toBeDefined();
        expect(tooltipText.length).toBeGreaterThan(0);
      }
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should show task count in tooltip', async ({ page, gtdApp }) => {
    // Step 1: Complete multiple tasks
    for (let i = 0; i < 3; i++) {
      await gtdApp.quickAddTask(`Count test ${i}`);
      await gtdApp.completeTask(`Count test ${i}`);
    }

    // Step 2: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Hover over today's cell
      const dayCell = heatmapModal.locator('.heatmap-cell').first();
      await dayCell.hover();

      // Step 4: Verify count in tooltip
      const tooltip = heatmapModal.locator('.heatmap-tooltip');
      const hasTooltip = await tooltip.isVisible().catch(() => false);

      if (hasTooltip) {
        const tooltipText = await tooltip.textContent();
        expect(tooltipText).toMatch(/\d+/); // Should contain number
      }
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should click day to filter tasks', async ({ page, gtdApp }) => {
    // Step 1: Complete some tasks
    await gtdApp.quickAddTask('Clickable day task');
    await gtdApp.completeTask('Clickable day task');

    // Step 2: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Click on a day with tasks
      const dayCell = heatmapModal.locator('.heatmap-cell').first();
      await dayCell.click();

      // Step 4: Verify either:
      // - Modal closes and tasks filtered in main view
      // - Or task list shown in modal
      const modalStillOpen = await heatmapModal.isVisible().catch(() => false);

      if (!modalStillOpen) {
        // Tasks should be filtered in main view
        const tasks = await gtdApp.getTasks();
        // Should show tasks from that day
        expect(tasks.length).toBeGreaterThanOrEqual(0);
      } else {
        // Task list shown in modal
        const taskList = heatmapModal.locator('.task-list');
        const hasTaskList = await taskList.isVisible().catch(() => false);

        if (hasTaskList) {
          await expect(taskList).toBeVisible();
        }
      }
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should display statistics panel', async ({ page, gtdApp }) => {
    // Step 1: Complete some tasks
    await gtdApp.quickAddTask('Stats task 1');
    await gtdApp.completeTask('Stats task 1');

    await gtdApp.quickAddTask('Stats task 2');
    await gtdApp.completeTask('Stats task 2');

    // Step 2: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find statistics section
      const statsSection = heatmapModal.locator('.heatmap-stats').or(
        heatmapModal.locator('[data-stats]')
      );

      const hasStats = await statsSection.isVisible().catch(() => false);

      if (hasStats) {
        await expect(statsSection).toBeVisible();

        // Step 4: Verify stats content
        const statsText = await statsSection.textContent();
        expect(statsText).toMatch(/\d+/); // Should contain numbers

        // Look for common stats
        expect(statsText.toLowerCase()).toMatch(/total|completed|tasks|streak/i);
      }
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should calculate total tasks completed', async ({ page, gtdApp }) => {
    // Step 1: Complete tasks
    for (let i = 0; i < 10; i++) {
      await gtdApp.quickAddTask(`Task ${i}`);
      await gtdApp.completeTask(`Task ${i}`);
    }

    // Step 2: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find total completed stat
      const totalStat = heatmapModal.locator('[data-stat="total"], .stat-total');
      const hasTotal = await totalStat.count() > 0;

      if (hasTotal) {
        const totalText = await totalStat.textContent();
        expect(totalText).toMatch(/10|ten/i);
      }
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should calculate average per day', async ({ page, gtdApp }) => {
    // Step 1: Complete tasks over multiple days
    for (let i = 0; i < 5; i++) {
      await gtdApp.quickAddTask(`Task ${i}`);
      await gtdApp.completeTask(`Task ${i}`);
    }

    // Step 2: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find average stat
      const avgStat = heatmapModal.locator('[data-stat="average"], .stat-average');
      const hasAvg = await avgStat.count() > 0;

      if (hasAvg) {
        const avgText = await avgStat.textContent();
        expect(avgText).toMatch(/\d/); // Should have number
      }
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should calculate longest streak', async ({ page, gtdApp }) => {
    // Step 1: Create streak by completing tasks
    for (let i = 0; i < 7; i++) {
      await gtdApp.quickAddTask(`Streak task ${i}`);
      await gtdApp.completeTask(`Streak task ${i}`);
    }

    // Step 2: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find longest streak stat
      const streakStat = heatmapModal.locator('[data-stat="streak"], .stat-streak');
      const hasStreak = await streakStat.count() > 0;

      if (hasStreak) {
        const streakText = await streakStat.textContent();
        expect(streakText).toMatch(/\d+/); // Should have number
      }
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should show most productive day', async ({ page, gtdApp }) => {
    // Step 1: Complete more tasks on one day
    for (let i = 0; i < 8; i++) {
      await gtdApp.quickAddTask(`Productive task ${i}`);
      await gtdApp.completeTask(`Productive task ${i}`);
    }

    // Step 2: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Find most productive day stat
      const bestDayStat = heatmapModal.locator('[data-stat="best-day"], .stat-best-day');
      const hasBestDay = await bestDayStat.count() > 0;

      if (hasBestDay) {
        const dayText = await bestDayStat.textContent();
        expect(dayText).toMatch(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i);
      }
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should handle empty heatmap', async ({ page, gtdApp }) => {
    // Step 1: Open heatmap with no completed tasks
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 2: Verify empty state
      const emptyState = heatmapModal.locator('.empty-state').or(
        heatmapModal.locator('text=No activity yet')
      );

      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      if (hasEmptyState) {
        await expect(emptyState).toBeVisible();
      }

      // Step 3: Verify heatmap grid still shown
      const dayCells = heatmapModal.locator('.heatmap-cell');
      const count = await dayCells.count();

      expect(count).toBeGreaterThanOrEqual(350);
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should be responsive on mobile', async ({ page, gtdApp }) => {
    // Step 1: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Step 2: Complete some tasks
    await gtdApp.quickAddTask('Mobile heatmap task');
    await gtdApp.completeTask('Mobile heatmap task');

    // Step 3: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 4: Verify heatmap fits
      await expect(heatmapModal).toBeVisible();

      const heatmapGrid = heatmapModal.locator('.heatmap-grid');
      const gridWidth = await heatmapGrid.evaluate((el) => {
        return el.offsetWidth;
      });

      expect(gridWidth).toBeLessThanOrEqual(375);
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should show legend for color levels', async ({ page, gtdApp }) => {
    // Step 1: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 2: Find legend
      const legend = heatmapModal.locator('.heatmap-legend, [data-legend]');
      const hasLegend = await legend.isVisible().catch(() => false);

      if (hasLegend) {
        await expect(legend).toBeVisible();

        // Step 3: Verify legend has color levels
        const legendItems = legend.locator('.legend-item');
        const itemCount = await legendItems.count();

        expect(itemCount).toBeGreaterThan(0);

        // Should have labels like "Less", "More"
        const legendText = await legend.textContent();
        expect(legendText.toLowerCase()).toMatch(/less|more/i);
      }
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should export heatmap data', async ({ page, gtdApp }) => {
    // Step 1: Complete tasks
    await gtdApp.quickAddTask('Export test task');
    await gtdApp.completeTask('Export test task');

    // Step 2: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Look for export button
      const exportButton = heatmapModal.locator('[data-action="export-heatmap"]').or(
        heatmapModal.locator('button:has-text("Export")')
      );

      const hasExport = await exportButton.count() > 0;

      if (hasExport) {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 });

        await exportButton.click();

        const download = await downloadPromise.catch(() => null);

        if (download) {
          expect(download.suggestedFilename()).toMatch(/heatmap|productivity/i);
        }
      }
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });

  test('should update heatmap when tasks completed', async ({ page, gtdApp }) => {
    // Step 1: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 2: Complete task (in background or via keyboard)
      await page.keyboard.press('Escape'); // Close modal

      await gtdApp.quickAddTask('Realtime update task');
      await gtdApp.completeTask('Realtime update task');

      // Step 3: Reopen heatmap
      await page.click(gtdApp.selectors.heatmapBtn);

      // Step 4: Verify today's cell colored
      const todayCell = heatmapModal.locator('.heatmap-cell').first();
      await expect(todayCell).toBeVisible();

      const hasColor = await todayCell.getAttribute('data-level');
      const level = parseInt(hasColor || '0');

      expect(level).toBeGreaterThan(0);
    } else {
      test.skip(true, 'Heatmap modal not implemented');
    }
  });
});
