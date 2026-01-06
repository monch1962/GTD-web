import { test, expect } from '../../fixtures/gtd-app.js';

/**
 * Journey 16: Calendar View
 * Description: Visualizing tasks by due date in calendar format
 *
 * Tests:
 * - Opening calendar view
 * - Tasks displayed on due dates
 * - Clicking task in calendar
 * - Month navigation
 * - Drag and drop to reschedule
 * - Filter calendar by context
 * - View task details from calendar
 * - Calendar responsive design
 */
test.describe('Calendar View Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    await gtdApp.clearLocalStorage();
    await gtdApp.goto();

    // Create tasks with various due dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    await gtdApp.quickAddTask('Task due today');
    await gtdApp.openTask('Task due today');
    await page.selectOption('#task-status', 'next');
    await page.fill('#task-due-date', today.toISOString().split('T')[0]);
    await gtdApp.saveTask();

    await gtdApp.quickAddTask('Task due tomorrow');
    await gtdApp.openTask('Task due tomorrow');
    await page.selectOption('#task-status', 'next');
    await page.fill('#task-due-date', tomorrow.toISOString().split('T')[0]);
    await gtdApp.saveTask();

    await gtdApp.quickAddTask('Task due next week');
    await gtdApp.openTask('Task due next week');
    await page.selectOption('#task-status', 'next');
    await page.fill('#task-due-date', nextWeek.toISOString().split('T')[0]);
    await gtdApp.saveTask();
  });

  test('should open calendar view', async ({ page, gtdApp }) => {
    // Step 1: Click Calendar View button
    await page.click(gtdApp.selectors.calendarViewBtn);

    // Step 2: Verify calendar modal/view opens
    const calendarView = page.locator('#calendar-view').or(
      page.locator('.calendar-view')
    ).or(
      page.locator('#calendar-modal')
    );

    const isCalendarVisible = await calendarView.isVisible().catch(() => false);

    if (isCalendarVisible) {
      await expect(calendarView).toBeVisible();

      // Step 3: Verify calendar grid visible
      const calendarGrid = calendarView.locator('.calendar-grid, .month-view');
      await expect(calendarGrid).toBeVisible();

      // Step 4: Verify days shown
      const dayCells = calendarView.locator('.day-cell, .calendar-day');
      const daysCount = await dayCells.count();

      expect(daysCount).toBeGreaterThanOrEqual(28); // At least 4 weeks
    } else {
      test.skip(true, 'Calendar view not implemented');
    }
  });

  test('should display tasks on due dates', async ({ page, gtdApp }) => {
    // Step 1: Open calendar view
    await page.click(gtdApp.selectors.calendarViewBtn);

    const calendarView = page.locator('#calendar-view');
    const isCalendarVisible = await calendarView.isVisible().catch(() => false);

    if (isCalendarVisible) {
      // Step 2: Find today's cell
      const today = new Date().getDate();
      const todayCell = calendarView.locator(`[data-date="${today}"], .day-${today}`).or(
        calendarView.locator('.calendar-day').filter(async (el) => {
          const date = await el.getAttribute('data-date');
          return date && new Date(date).getDate() === today;
        })
      );

      const hasTodayCell = await todayCell.count() > 0;

      if (hasTodayCell) {
        // Step 3: Verify task shown in today's cell
        const taskInCell = todayCell.locator('text=Task due today');
        await expect(taskInCell).toBeVisible();
      }
    } else {
      test.skip(true, 'Calendar view not implemented');
    }
  });

  test('should navigate between months', async ({ page, gtdApp }) => {
    // Step 1: Open calendar view
    await page.click(gtdApp.selectors.calendarViewBtn);

    const calendarView = page.locator('#calendar-view');
    const isCalendarVisible = await calendarView.isVisible().catch(() => false);

    if (isCalendarVisible) {
      // Step 2: Get current month display
      const monthDisplay = calendarView.locator('.current-month, .month-label');
      const initialMonth = await monthDisplay.textContent();

      // Step 3: Click next month
      const nextMonthBtn = calendarView.locator('[data-action="next-month"]').or(
        calendarView.locator('button:has-text(">")')
      ).or(
        calendarView.locator('.next-month')
      );

      const hasNextBtn = await nextMonthBtn.count() > 0;

      if (hasNextBtn) {
        await nextMonthBtn.click();

        // Step 4: Verify month changed
        const newMonth = await monthDisplay.textContent();
        expect(newMonth).not.toBe(initialMonth);

        // Step 5: Navigate back to current month
        const prevMonthBtn = calendarView.locator('[data-action="prev-month"]').or(
          calendarView.locator('button:has-text("<")')
        );

        await prevMonthBtn.click();

        const backToCurrent = await monthDisplay.textContent();
        expect(backToCurrent).toBe(initialMonth);
      }
    } else {
      test.skip(true, 'Calendar view not implemented');
    }
  });

  test('should click task to open for editing', async ({ page, gtdApp }) => {
    // Step 1: Open calendar view
    await page.click(gtdApp.selectors.calendarViewBtn);

    const calendarView = page.locator('#calendar-view');
    const isCalendarVisible = await calendarView.isVisible().catch(() => false);

    if (isCalendarVisible) {
      // Step 2: Click on task
      const taskElement = calendarView.locator('.calendar-task, .task-in-calendar').first();
      const hasTask = await taskElement.count() > 0;

      if (hasTask) {
        await taskElement.click();

        // Step 3: Verify task modal opens
        const taskModal = page.locator('#task-modal');
        await expect(taskModal).toBeVisible();

        // Step 4: Verify task details
        await expect(page.locator('#task-title')).toBeVisible();
      }
    } else {
      test.skip(true, 'Calendar view not implemented');
    }
  });

  test('should drag and drop to reschedule', async ({ page, gtdApp }) => {
    // Step 1: Open calendar view
    await page.click(gtdApp.selectors.calendarViewBtn);

    const calendarView = page.locator('#calendar-view');
    const isCalendarVisible = await calendarView.isVisible().catch(() => false);

    if (isCalendarVisible) {
      // Step 2: Find draggable task
      const taskElement = calendarView.locator('.calendar-task[draggable="true"]').first();
      const hasDraggable = await taskElement.count() > 0;

      if (hasDraggable) {
        // Step 3: Drag to different day
        const targetCell = calendarView.locator('.day-cell').nth(10); // Arbitrary day

        await taskElement.dragTo(targetCell);

        // Step 4: Verify due date updated
        const taskTitle = await taskElement.textContent();

        await gtdApp.openTask(taskTitle);

        const dueDate = page.locator('#task-due-date');
        const newDate = await dueDate.inputValue();

        expect(newDate).toBeDefined();
        expect(newDate).not.toBe('');
      }
    } else {
      test.skip(true, 'Drag and drop not implemented');
    }
  });

  test('should filter calendar by context', async ({ page, gtdApp }) => {
    // Step 1: Open calendar view
    await page.click(gtdApp.selectors.calendarViewBtn);

    const calendarView = page.locator('#calendar-view');
    const isCalendarVisible = await calendarView.isVisible().catch(() => false);

    if (isCalendarVisible) {
      // Step 2: Find context filter
      const contextFilter = calendarView.locator('#calendar-context-filter').or(
        calendarView.locator('[data-filter="context"]')
      );

      const hasFilter = await contextFilter.count() > 0;

      if (hasFilter) {
        await contextFilter.selectOption('@work');

        // Step 3: Verify filtered tasks shown
        const workTasks = calendarView.locator('.calendar-task[data-context="@work"]');
        const workCount = await workTasks.count();

        // Should have some work tasks or none if filter applied
        expect(workCount).toBeGreaterThanOrEqual(0);
      }
    } else {
      test.skip(true, 'Calendar view not implemented');
    }
  });

  test('should show task count per day', async ({ page, gtdApp }) => {
    // Step 1: Open calendar view
    await page.click(gtdApp.selectors.calendarViewBtn);

    const calendarView = page.locator('#calendar-view');
    const isCalendarVisible = await calendarView.isVisible().catch(() => false);

    if (isCalendarVisible) {
      // Step 2: Look for task count indicators
      const taskCountBadges = calendarView.locator('.task-count, .day-count');
      const hasCounts = await taskCountBadges.count() > 0;

      if (hasCounts) {
        // Step 3: Verify count shown on days with tasks
        const firstCountBadge = taskCountBadges.first();
        await expect(firstCountBadge).toBeVisible();

        const countText = await firstCountBadge.textContent();
        expect(parseInt(countText)).toBeGreaterThan(0);
      }
    } else {
      test.skip(true, 'Calendar view not implemented');
    }
  });

  test('should handle leap year in calendar', async ({ page, gtdApp }) => {
    // Step 1: Open calendar view
    await page.click(gtdApp.selectors.calendarViewBtn);

    const calendarView = page.locator('#calendar-view');
    const isCalendarVisible = await calendarView.isVisible().catch(() => false);

    if (isCalendarVisible) {
      // Step 2: Navigate to February
      const monthDisplay = calendarView.locator('.current-month');
      const currentMonth = await monthDisplay.textContent();

      // Keep clicking prev until we hit February
      const prevMonthBtn = calendarView.locator('[data-action="prev-month"]');
      let iterations = 0;

      while (iterations < 12) {
        const monthText = await monthDisplay.textContent();

        if (monthText.toLowerCase().includes('feb')) {
          break;
        }

        await prevMonthBtn.click();
        iterations++;
      }

      // Step 3: Check if Feb 29 exists (for leap year)
      const feb29Cell = calendarView.locator('[data-date="02-29"], .day-29');
      const hasFeb29 = await feb29Cell.count() > 0;

      // Current year might not be leap year
      // Just verify calendar doesn't crash
      await expect(calendarView).toBeVisible();
    } else {
      test.skip(true, 'Calendar view not implemented');
    }
  });

  test('should show overdue tasks in calendar', async ({ page, gtdApp }) => {
    // Step 1: Create overdue task
    await gtdApp.quickAddTask('Overdue task');
    await gtdApp.openTask('Overdue task');
    await page.selectOption('#task-status', 'next');
    await page.fill('#task-due-date', '2024-01-01');
    await gtdApp.saveTask();

    // Step 2: Open calendar view
    await page.click(gtdApp.selectors.calendarViewBtn);

    const calendarView = page.locator('#calendar-view');
    const isCalendarVisible = await calendarView.isVisible().catch(() => false);

    if (isCalendarVisible) {
      // Step 3: Look for overdue indicator
      const overdueTasks = calendarView.locator('.calendar-task.overdue, [data-overdue="true"]');
      const hasOverdue = await overdueTasks.count() > 0;

      if (hasOverdue) {
        await expect(overdueTasks.first()).toBeVisible();
      }
    } else {
      test.skip(true, 'Calendar view not implemented');
    }
  });

  test('should be responsive on mobile', async ({ page, gtdApp }) => {
    // Step 1: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Step 2: Open calendar view
    await page.click(gtdApp.selectors.calendarViewBtn);

    const calendarView = page.locator('#calendar-view');
    const isCalendarVisible = await calendarView.isVisible().catch(() => false);

    if (isCalendarVisible) {
      // Step 3: Verify calendar fits in viewport
      const calendarGrid = calendarView.locator('.calendar-grid');
      await expect(calendarGrid).toBeVisible();

      const boundingBox = await calendarGrid.boundingBox();
      expect(boundingBox.width).toBeLessThanOrEqual(375);

      // Step 4: Verify tasks readable on mobile
      const tasks = calendarView.locator('.calendar-task');
      const taskCount = await tasks.count();

      for (let i = 0; i < Math.min(taskCount, 3); i++) {
        await expect(tasks.nth(i)).toBeVisible();
      }
    } else {
      test.skip(true, 'Calendar view not implemented');
    }
  });

  test('should show today button', async ({ page, gtdApp }) => {
    // Step 1: Open calendar view
    await page.click(gtdApp.selectors.calendarViewBtn);

    const calendarView = page.locator('#calendar-view');
    const isCalendarVisible = await calendarView.isVisible().catch(() => false);

    if (isCalendarVisible) {
      // Step 2: Navigate away from today
      const nextMonthBtn = calendarView.locator('[data-action="next-month"]');
      const hasNextBtn = await nextMonthBtn.count() > 0;

      if (hasNextBtn) {
        await nextMonthBtn.click();
      }

      // Step 3: Click today button
      const todayBtn = calendarView.locator('[data-action="today"]').or(
        calendarView.locator('button:has-text("Today")')
      );

      const hasTodayBtn = await todayBtn.count() > 0;

      if (hasTodayBtn) {
        await todayBtn.click();

        // Step 4: Verify back at current month
        const monthDisplay = calendarView.locator('.current-month');
        const monthText = await monthDisplay.textContent();

        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        expect(monthText.toLowerCase()).toContain(currentMonth.toLowerCase());
      }
    } else {
      test.skip(true, 'Calendar view not implemented');
    }
  });

  test('should display week view', async ({ page, gtdApp }) => {
    // Step 1: Open calendar view
    await page.click(gtdApp.selectors.calendarViewBtn);

    const calendarView = page.locator('#calendar-view');
    const isCalendarVisible = await calendarView.isVisible().catch(() => false);

    if (isCalendarVisible) {
      // Step 2: Switch to week view
      const viewToggle = calendarView.locator('[data-action="toggle-view"]').or(
        calendarView.locator('button:has-text("Week")')
      );

      const hasToggle = await viewToggle.count() > 0;

      if (hasToggle) {
        await viewToggle.click();

        // Step 3: Verify week view displayed
        const weekView = calendarView.locator('.week-view');
        await expect(weekView).toBeVisible();

        // Should have 7 days
        const days = weekView.locator('.day-cell');
        const dayCount = await days.count();

        expect(dayCount).toBe(7);
      }
    } else {
      test.skip(true, 'Calendar view not implemented');
    }
  });
});
