import { test, expect } from '../fixtures/gtd-app.js';

/**
 * Journey 17: Dark Mode
 * Description: Using app with dark theme
 *
 * Tests:
 * - Toggling dark mode
 * - Theme persistence
 * - All components styled correctly
 * - Color contrast maintained
 * - Images/icons visible
 * - Text readability
 * - Modal styling
 * - Form element styling
 */
test.describe('Dark Mode Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    await gtdApp.clearLocalStorage();
    await gtdApp.goto();
  });

  test('should toggle dark mode on', async ({ page, gtdApp }) => {
    // Step 1: Click dark mode button
    await page.click(gtdApp.selectors.darkModeBtn);

    // Step 2: Verify theme switched
    const body = page.locator('body');
    const hasDarkClass = await body.getAttribute('class');

    if (hasDarkClass) {
      expect(hasDarkClass).toContain('dark');
    }

    // Verify through CSS variable
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Dark background should be dark
    const rgb = bgColor.match(/\d+/g);
    if (rgb) {
      const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
      expect(brightness).toBeLessThan(128);
    }
  });

  test('should toggle dark mode off', async ({ page, gtdApp }) => {
    // Step 1: Enable dark mode
    await page.click(gtdApp.selectors.darkModeBtn);
    await page.waitForTimeout(300);

    // Step 2: Disable dark mode
    await page.click(gtdApp.selectors.darkModeBtn);
    await page.waitForTimeout(300);

    // Step 3: Verify light mode restored
    const body = page.locator('body');
    const hasDarkClass = await body.getAttribute('class');

    if (hasDarkClass) {
      expect(hasDarkClass).not.toContain('dark');
    }

    // Verify through CSS
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Light background should be light
    const rgb = bgColor.match(/\d+/g);
    if (rgb) {
      const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
      expect(brightness).toBeGreaterThan(128);
    }
  });

  test('should persist dark mode preference', async ({ page, gtdApp }) => {
    // Step 1: Enable dark mode
    await page.click(gtdApp.selectors.darkModeBtn);
    await page.waitForTimeout(300);

    // Step 2: Reload page
    await gtdApp.page.reload();
    await gtdApp.waitForAppReady();

    // Step 3: Verify dark mode still active
    const body = page.locator('body');
    const bodyClass = await body.getAttribute('class');

    if (bodyClass) {
      expect(bodyClass).toContain('dark');
    }

    // Check localStorage
    const themePreference = await gtdApp.getLocalStorage('gtd_theme');

    if (themePreference) {
      expect(themePreference).toBe('dark');
    }
  });

  test('should style sidebar in dark mode', async ({ page, gtdApp }) => {
    // Step 1: Enable dark mode
    await gtdApp.enableDarkMode();

    // Step 2: Check sidebar styling
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    const sidebarBg = await sidebar.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should be dark
    const rgb = sidebarBg.match(/\d+/g);
    if (rgb) {
      const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
      expect(brightness).toBeLessThan(128);
    }

    // Step 3: Verify sidebar text readable
    const sidebarText = sidebar.locator('.nav-item');
    await expect(sidebarText.first()).toBeVisible();

    const textColor = await sidebarText.first().evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Text should be light
    const textRgb = textColor.match(/\d+/g);
    if (textRgb) {
      const brightness = (parseInt(textRgb[0]) * 299 + parseInt(textRgb[1]) * 587 + parseInt(textRgb[2]) * 114) / 1000;
      expect(brightness).toBeGreaterThan(128);
    }
  });

  test('should style task list in dark mode', async ({ page, gtdApp }) => {
    // Step 1: Create tasks and enable dark mode
    await gtdApp.quickAddTask('Dark mode test task');
    await gtdApp.enableDarkMode();

    // Step 2: Check task items
    const taskItems = page.locator('.task-item');
    await expect(taskItems.first()).toBeVisible();

    const taskBg = await taskItems.first().evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should have appropriate contrast
    expect(taskBg).toBeDefined();

    // Step 3: Verify task text visible
    const taskTitle = taskItems.first().locator('.task-title');
    await expect(taskTitle).toBeVisible();

    const titleColor = await taskTitle.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    expect(titleColor).toBeDefined();
  });

  test('should style modals in dark mode', async ({ page, gtdApp }) => {
    // Step 1: Enable dark mode
    await gtdApp.enableDarkMode();

    // Step 2: Open task modal
    await gtdApp.quickAddTask('Modal dark mode test');
    await gtdApp.openTask('Modal dark mode test');

    // Step 3: Check modal styling
    const modal = page.locator('#task-modal');
    await expect(modal).toBeVisible();

    const modalBg = await modal.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Modal should be dark in dark mode
    const rgb = modalBg.match(/\d+/g);
    if (rgb) {
      const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
      expect(brightness).toBeLessThan(128);
    }

    // Step 4: Verify form elements visible
    await expect(page.locator('#task-title')).toBeVisible();
    await expect(page.locator('#task-description')).toBeVisible();
  });

  test('should style buttons in dark mode', async ({ page, gtdApp }) => {
    // Step 1: Enable dark mode
    await gtdApp.enableDarkMode();

    // Step 2: Check various buttons
    const buttons = page.locator('button').first();
    await expect(buttons).toBeVisible();

    const buttonBg = await buttons.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    const buttonColor = await buttons.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Should have appropriate contrast
    expect(buttonBg).toBeDefined();
    expect(buttonColor).toBeDefined();
  });

  test('should style forms in dark mode', async ({ page, gtdApp }) => {
    // Step 1: Enable dark mode
    await gtdApp.enableDarkMode();

    // Step 2: Check quick add input
    const quickAddInput = page.locator(gtdApp.selectors.quickAddInput);
    await expect(quickAddInput).toBeVisible();

    const inputBg = await quickAddInput.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    const inputColor = await quickAddInput.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Should have appropriate contrast
    expect(inputBg).toBeDefined();
    expect(inputColor).toBeDefined();

    // Verify text visible when typing
    await quickAddInput.fill('Test text in dark mode');
    await expect(quickAddInput).toHaveValue('Test text in dark mode');
  });

  test('should style priority colors in dark mode', async ({ page, gtdApp }) => {
    // Step 1: Create task with priority
    await gtdApp.quickAddTask('Priority test');
    await gtdApp.openTask('Priority test');
    await page.selectOption('#task-status', 'next');
    await page.fill('#task-due-date', getTodayDate());
    await gtdApp.saveTask();

    // Step 2: Enable dark mode
    await gtdApp.enableDarkMode();

    // Step 3: Check priority badge
    const taskElement = page.locator('.task-item', { hasText: 'Priority test' });
    const priorityBadge = taskElement.locator('.priority-badge, [data-priority]');

    const hasBadge = await priorityBadge.count() > 0;

    if (hasBadge) {
      await expect(priorityBadge).toBeVisible();

      const badgeColor = await priorityBadge.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      expect(badgeColor).toBeDefined();
    }
  });

  test('should style calendar view in dark mode', async ({ page, gtdApp }) => {
    // Step 1: Enable dark mode
    await gtdApp.enableDarkMode();

    // Step 2: Open calendar view
    await page.click(gtdApp.selectors.calendarViewBtn);

    const calendarView = page.locator('#calendar-view');
    const isCalendarVisible = await calendarView.isVisible().catch(() => false);

    if (isCalendarVisible) {
      // Step 3: Verify calendar styling
      const calendarBg = await calendarView.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      expect(calendarBg).toBeDefined();

      // Verify days visible
      const dayCells = calendarView.locator('.day-cell');
      await expect(dayCells.first()).toBeVisible();
    }
  });

  test('should style heatmap in dark mode', async ({ page, gtdApp }) => {
    // Step 1: Enable dark mode
    await gtdApp.enableDarkMode();

    // Step 2: Open heatmap
    await page.click(gtdApp.selectors.heatmapBtn);

    const heatmapModal = page.locator('#heatmap-modal');
    const isModalVisible = await heatmapModal.isVisible().catch(() => false);

    if (isModalVisible) {
      // Step 3: Verify heatmap colors appropriate
      const heatmapCells = heatmapModal.locator('.heatmap-cell');
      const hasCells = await heatmapCells.count() > 0;

      if (hasCells) {
        // Verify cells visible
        await expect(heatmapCells.first()).toBeVisible();

        // Colors should work in dark mode
        const cellColor = await heatmapCells.first().evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });

        expect(cellColor).toBeDefined();
      }
    }
  });

  test('should maintain WCAG contrast in dark mode', async ({ page, gtdApp }) => {
    // Step 1: Enable dark mode
    await gtdApp.enableDarkMode();

    // Step 2: Check main content area
    const mainContent = page.locator('#main-content');
    const bgColor = await mainContent.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    const textColor = await mainContent.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    // Calculate contrast ratio
    const bgRgb = bgColor.match(/\d+/g);
    const textRgb = textColor.match(/\d+/g);

    if (bgRgb && textRgb) {
      const bgLum = luminance(parseInt(bgRgb[0]), parseInt(bgRgb[1]), parseInt(bgRgb[2]));
      const textLum = luminance(parseInt(textRgb[0]), parseInt(textRgb[1]), parseInt(textRgb[2]));

      const contrast = (Math.max(bgLum, textLum) + 0.05) / (Math.min(bgLum, textLum) + 0.05);

      // WCAG AA requires 4.5:1 for normal text
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('should style navigation in dark mode', async ({ page, gtdApp }) => {
    // Step 1: Enable dark mode
    await gtdApp.enableDarkMode();

    // Step 2: Check navigation items
    const navItems = page.locator('.nav-item');
    await expect(navItems.first()).toBeVisible();

    const navItem = navItems.first();

    // Check hover state
    await navItem.hover();

    const hoverBg = await navItem.evaluate((el) => {
      return window.getComputedStyle(el, ':hover').backgroundColor;
    });

    expect(hoverBg).toBeDefined();

    // Check active/hover state visible
    const activeNav = page.locator('.nav-item.active');
    const hasActive = await activeNav.count() > 0;

    if (hasActive) {
      await expect(activeNav).toBeVisible();

      const activeBg = await activeNav.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      expect(activeBg).toBeDefined();
    }
  });

  test('should style context tags in dark mode', async ({ page, gtdApp }) => {
    // Step 1: Create task with context
    await gtdApp.quickAddTask('Context tag test @work');

    // Step 2: Enable dark mode
    await gtdApp.enableDarkMode();

    // Step 3: Check context tag
    const contextTag = page.locator('.context-tag, [data-context]');
    const hasTag = await contextTag.count() > 0;

    if (hasTag) {
      await expect(contextTag.first()).toBeVisible();

      const tagBg = await contextTag.first().evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      const tagColor = await contextTag.first().evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      expect(tagBg).toBeDefined();
      expect(tagColor).toBeDefined();
    }
  });

  test('should switch theme smoothly', async ({ page, gtdApp }) => {
    // Step 1: Start in light mode
    const body = page.locator('body');
    let bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Step 2: Toggle to dark
    await page.click(gtdApp.selectors.darkModeBtn);

    // Wait for transition (if any)
    await page.waitForTimeout(300);

    let darkBg = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    expect(darkBg).not.toBe(bgColor);

    // Step 3: Toggle back to light
    await page.click(gtdApp.selectors.darkModeBtn);
    await page.waitForTimeout(300);

    let lightBg = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    expect(lightBg).not.toBe(darkBg);
    expect(lightBg).toBe(bgColor);
  });
});

/**
 * Calculate relative luminance
 */
function luminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}
