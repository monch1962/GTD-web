import { test as base } from '@playwright/test';

/**
 * Custom fixture for GTD-web application
 * Provides helper methods for common GTD operations
 */
export const test = base.extend({
  gtdApp: async ({ page }, use) => {
    const app = new GTDApp(page);
    await use(app);
  },
});

export const expect = test.expect;

/**
 * GTD App Helper Class
 * Encapsulates common actions and assertions for the GTD application
 */
class GTDApp {
  constructor(page) {
    this.page = page;
    this.selectors = {
      // Navigation
      inbox: 'a[data-view="inbox"]',
      next: 'a[data-view="next"]',
      waiting: 'a[data-view="waiting"]',
      someday: 'a[data-view="someday"]',
      projects: 'a[data-view="projects"]',
      reference: 'a[data-view="reference"]',
      allItems: 'a[data-view="all"]',

      // Counters
      inboxCount: '#inbox-count',
      nextCount: '#next-count',
      waitingCount: '#waiting-count',
      somedayCount: '#someday-count',
      projectsCount: '#projects-count',
      referenceCount: '#reference-count',

      // Quick add
      quickAddInput: '#quick-add-input',

      // Task elements
      tasksContainer: '#tasks-container',
      taskItem: '.task-item',
      taskCheckbox: '.task-checkbox',
      taskTitle: '.task-title',
      taskContextMenu: '.task-context-menu',

      // Modals
      taskModal: '#task-modal',
      projectModal: '#project-modal',
      modalOverlay: '.modal-overlay',

      // Forms
      taskForm: '#task-form',
      projectForm: '#project-form',

      // Buttons
      newProjectBtn: '#btn-new-project',
      saveTaskBtn: '#save-task',
      cancelBtn: '#cancel-btn',

      // Accessibility
      announcer: '#announcer',
      skipLink: '.skip-link',
      mainContent: '#main-content',

      // Storage
      userId: '#user-id',
      syncStatus: '#sync-status',
      exportBtn: '#btn-export',
      importBtn: '#btn-import',

      // Search
      globalSearch: '#global-search',
      clearSearch: '#clear-search',

      // Other features
      focusModeBtn: '#btn-focus-mode',
      suggestionsBtn: '#btn-suggestions',
      archiveBtn: '#archive-button',
      templatesBtn: '#templates-button',
      dailyReviewBtn: '#btn-daily-review',
      weeklyReviewBtn: '#btn-weekly-review',
      dashboardBtn: '#btn-dashboard',
      dependenciesBtn: '#btn-dependencies',
      heatmapBtn: '#btn-heatmap',
      undoBtn: '#btn-undo',
      redoBtn: '#btn-redo',
    };
  }

  /**
   * Navigate to the application and wait for it to load
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
    await this.waitForAppReady();
  }

  /**
   * Wait for the app to be ready (user ID loaded, elements visible)
   */
  async waitForAppReady() {
    await this.page.waitForSelector(this.selectors.userId, { timeout: 5000 });
    await this.page.waitForSelector(this.selectors.quickAddInput, { timeout: 5000 });
  }

  /**
   * Get the current user ID
   */
  async getUserId() {
    const userIdElement = await this.page.textContent(this.selectors.userId);
    return userIdElement.trim();
  }

  /**
   * Get count for a specific view
   */
  async getCount(view) {
    const countSelector = `${view}-count`;
    const countElement = await this.page.textContent(countSelector);
    return parseInt(countElement.trim(), 10);
  }

  /**
   * Navigate to a specific view
   */
  async navigateTo(view) {
    const viewSelector = `a[data-view="${view}"]`;
    await this.page.click(viewSelector);
    await this.page.waitForURL(`?view=${view}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Create a task using quick add
   */
  async quickAddTask(taskText) {
    await this.page.fill(this.selectors.quickAddInput, taskText);
    await this.page.press(this.selectors.quickAddInput, 'Enter');
    await this.page.waitForTimeout(500); // Wait for task to be added
  }

  /**
   * Get all tasks in the current view
   */
  async getTasks() {
    const tasks = await this.page.locator(this.selectors.taskItem).all();
    const taskData = [];

    for (const task of tasks) {
      const title = await task.locator(this.selectors.taskTitle).textContent();
      const checkbox = task.locator(this.selectors.taskCheckbox);
      const isChecked = await checkbox.isChecked();

      taskData.push({
        title: title.trim(),
        completed: isChecked,
        element: task,
      });
    }

    return taskData;
  }

  /**
   * Click on a task to open it for editing
   */
  async openTask(taskTitle) {
    const task = await this.page.locator(this.selectors.taskItem, { hasText: taskTitle });
    await task.click();
    await this.page.waitForSelector(this.selectors.taskModal);
  }

  /**
   * Complete a task by clicking its checkbox
   */
  async completeTask(taskTitle) {
    const task = await this.page.locator(this.selectors.taskItem, { hasText: taskTitle });
    await task.locator(this.selectors.taskCheckbox).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Open context menu for a task
   */
  async openContextMenu(taskTitle) {
    const task = await this.page.locator(this.selectors.taskItem, { hasText: taskTitle });
    await task.click({ button: 'right' });
    await this.page.waitForSelector('.context-menu');
  }

  /**
   * Create a new project
   */
  async createProject(projectData) {
    await this.page.click(this.selectors.newProjectBtn);
    await this.page.waitForSelector(this.selectors.projectModal);

    // Fill in project details
    await this.page.fill('#project-title', projectData.title);

    if (projectData.description) {
      await this.page.fill('#project-description', projectData.description);
    }

    if (projectData.status) {
      await this.page.selectOption('#project-status', projectData.status);
    }

    if (projectData.contexts && projectData.contexts.length > 0) {
      const contextInput = this.page.locator('#project-contexts');
      for (const context of projectData.contexts) {
        await contextInput.fill(context);
        await this.page.keyboard.press('Enter');
      }
    }

    // Save project
    await this.page.click('button[type="submit"]');
    await this.page.waitForSelector(this.selectors.projectModal, { state: 'hidden' });
    await this.page.waitForTimeout(500);
  }

  /**
   * Open task modal and fill in details
   */
  async openTaskModal() {
    await this.page.click(this.selectors.quickAddInput);
    await this.page.keyboard.press('Control+KeyM');
    await this.page.waitForSelector(this.selectors.taskModal);
  }

  /**
   * Fill task form with data
   */
  async fillTaskForm(taskData) {
    if (taskData.title) {
      await this.page.fill('#task-title', taskData.title);
    }

    if (taskData.description) {
      await this.page.fill('#task-description', taskData.description);
    }

    if (taskData.status) {
      await this.page.selectOption('#task-status', taskData.status);
    }

    if (taskData.energy) {
      await this.page.selectOption('#task-energy', taskData.energy);
    }

    if (taskData.time) {
      await this.page.selectOption('#task-time', taskData.time.toString());
    }

    if (taskData.project) {
      await this.page.selectOption('#task-project', taskData.project);
    }

    if (taskData.dueDate) {
      await this.page.fill('#task-due-date', taskData.dueDate);
    }

    if (taskData.recurrence) {
      await this.page.selectOption('#task-recurrence', taskData.recurrence);
    }

    if (taskData.contexts && taskData.contexts.length > 0) {
      const contextInput = this.page.locator('#task-contexts');
      for (const context of taskData.contexts) {
        await contextInput.fill(context);
        await this.page.keyboard.press('Enter');
      }
    }
  }

  /**
   * Save task from modal
   */
  async saveTask() {
    await this.page.click(this.selectors.saveTaskBtn);
    await this.page.waitForSelector(this.selectors.taskModal, { state: 'hidden' });
    await this.page.waitForTimeout(500);
  }

  /**
   * Cancel task from modal
   */
  async cancelTask() {
    await this.page.click(this.selectors.cancelBtn);
    await this.page.waitForSelector(this.selectors.taskModal, { state: 'hidden' });
  }

  /**
   * Search for tasks
   */
  async search(query) {
    await this.page.fill(this.selectors.globalSearch, query);
    await this.page.waitForTimeout(300); // Wait for search debounce
  }

  /**
   * Clear search
   */
  async clearSearch() {
    const clearBtn = this.page.locator(this.selectors.clearSearch);
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * Get announcer text (for accessibility testing)
   */
  async getAnnouncement() {
    const announcer = this.page.locator(this.selectors.announcer);
    return await announcer.textContent();
  }

  /**
   * Fill localStorage with test data
   */
  async setLocalStorage(key, value) {
    await this.page.evaluate(
      ({ key, value }) => {
        localStorage.setItem(key, JSON.stringify(value));
      },
      { key, value }
    );
  }

  /**
   * Get localStorage value
   */
  async getLocalStorage(key) {
    return await this.page.evaluate((key) => {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }, key);
  }

  /**
   * Clear all localStorage
   */
  async clearLocalStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
    });
  }

  /**
   * Wait for toast notification
   */
  async waitForNotification() {
    await this.page.waitForSelector('.toast', { timeout: 3000 });
    const toast = await this.page.textContent('.toast');
    return toast;
  }

  /**
   * Take screenshot on failure
   */
  async captureFailure(testName) {
    await this.page.screenshot({
      path: `test-results/screenshots/${testName}-failure.png`,
      fullPage: true,
    });
  }

  /**
   * Fill localStorage to simulate quota usage
   */
  async fillLocalStorageToQuota(percentage = 0.9) {
    await this.page.evaluate(({ targetPercentage }) => {
      // Estimate 5MB total
      const total = 5 * 1024 * 1024;
      const targetBytes = total * targetPercentage;
      let currentBytes = 0;

      // Count existing data
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          currentBytes += key.length + localStorage[key].length;
        }
      }

      // Fill remaining space with dummy data
      const bytesToAdd = targetBytes - currentBytes;
      if (bytesToAdd > 0) {
        const dummyData = 'x'.repeat(1000);
        let i = 0;
        while (currentBytes < targetBytes) {
          const key = `dummy_${i}`;
          localStorage.setItem(key, dummyData);
          currentBytes += key.length + dummyData.length;
          i++;
        }
      }
    }, { targetPercentage: percentage });
  }

  /**
   * Simulate network offline condition
   */
  async setOffline() {
    await this.page.context().setOffline(true);
  }

  /**
   * Simate network online condition
   */
  async setOnline() {
    await this.page.context().setOffline(false);
  }

  /**
   * Switch to dark mode
   */
  async enableDarkMode() {
    const darkModeBtn = this.page.locator('#btn-dark-mode');
    await darkModeBtn.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Switch to light mode
   */
  async disableDarkMode() {
    const darkModeBtn = this.page.locator('#btn-dark-mode');
    const currentClass = await darkModeBtn.getAttribute('class');
    if (currentClass && currentClass.includes('active')) {
      await darkModeBtn.click();
      await this.page.waitForTimeout(300);
    }
  }
}
