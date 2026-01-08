/**
 * E2E Tests for View Navigation and Project Management
 * Tests navigation between views and project operations
 */

import { test, expect } from '@playwright/test';

test.describe('View Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate between views', async ({ page }) => {
    // Create test tasks in different statuses
    await page.evaluate(() => {
      const tasks = [
        { title: 'Inbox task', status: 'inbox' },
        { title: 'Next action', status: 'next' },
        { title: 'Waiting task', status: 'waiting' },
        { title: 'Someday task', status: 'someday' }
      ];

      tasks.forEach(t => {
        const task = new Task(t);
        window.app.tasks.push(task);
      });

      window.app.saveTasks();
    });

    await page.waitForTimeout(500);

    // Navigate to Inbox
    await page.click('[data-view="inbox"]');
    await page.waitForTimeout(300);
    await expect(page.locator('.nav-item.active[data-view="inbox"]')).toBeVisible();
    await expect(page.locator('.task-title').first()).toContainText('Inbox task');

    // Navigate to Next
    await page.click('[data-view="next"]');
    await page.waitForTimeout(300);
    await expect(page.locator('.nav-item.active[data-view="next"]')).toBeVisible();
    await expect(page.locator('.task-title').first()).toContainText('Next action');

    // Navigate to Waiting
    await page.click('[data-view="waiting"]');
    await page.waitForTimeout(300);
    await expect(page.locator('.nav-item.active[data-view="waiting"]')).toBeVisible();
    await expect(page.locator('.task-title').first()).toContainText('Waiting task');

    // Navigate to Someday
    await page.click('[data-view="someday"]');
    await page.waitForTimeout(300);
    await expect(page.locator('.nav-item.active[data-view="someday"]')).toBeVisible();
    await expect(page.locator('.task-title').first()).toContainText('Someday task');
  });

  test('should update task counts when tasks change', async ({ page }) => {
    // Check initial counts
    const initialInboxCount = await page.locator('#inbox-count').textContent();

    // Create task
    await page.fill('#quick-add-input', 'New inbox task');
    await page.press('#quick-add-input', 'Enter');
    await page.waitForTimeout(500);

    // Verify count increased
    const newInboxCount = await page.locator('#inbox-count').textContent();
    expect(parseInt(newInboxCount || '0')).toBeGreaterThan(parseInt(initialInboxCount || '0'));
  });

  test('should display empty state for views with no tasks', async ({ page }) => {
    // Clear all tasks
    await page.evaluate(() => {
      window.app.tasks = [];
      window.app.saveTasks();
    });
    await page.waitForTimeout(500);

    // Navigate to Inbox
    await page.click('[data-view="inbox"]');
    await page.waitForTimeout(300);

    // Should show empty state
    const emptyState = page.locator('.empty-state, .no-tasks-message');
    await expect(emptyState).toBeVisible();
  });

  test('should use keyboard shortcuts to navigate views', async ({ page }) => {
    // Press 'n' to go to Next Actions
    await page.keyboard.press('n');
    await page.waitForTimeout(300);
    await expect(page.locator('.nav-item.active[data-view="next"]')).toBeVisible();

    // Press 'i' to go to Inbox
    await page.keyboard.press('i');
    await page.waitForTimeout(300);
    await expect(page.locator('.nav-item.active[data-view="inbox"]')).toBeVisible();
  });

  test('should filter by selected contexts in sidebar', async ({ page }) => {
    // Create tasks with different contexts
    await page.evaluate(() => {
      const tasks = [
        { title: 'Work task 1', contexts: ['@work'] },
        { title: 'Work task 2', contexts: ['@work'] },
        { title: 'Home task', contexts: ['@home'] }
      ];

      tasks.forEach(t => {
        const task = new Task(t);
        window.app.tasks.push(task);
      });

      window.app.saveTasks();
    });

    await page.waitForTimeout(500);

    // Select @work context filter
    const workContextCheckbox = page.locator('#context-filter-\\@work');
    await workContextCheckbox.click();
    await page.waitForTimeout(300);

    // Should only show work tasks
    const tasks = page.locator('.task');
    const taskCount = await tasks.count();
    expect(taskCount).toBe(2);

    // Clear filters
    await page.click('#clear-context-filters');
    await page.waitForTimeout(300);

    // Should show all 3 tasks
    const allTasks = page.locator('.task');
    const allTaskCount = await allTasks.count();
    expect(allTaskCount).toBe(3);
  });
});

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
  });

  test('should create new project', async ({ page }) => {
    // Click "New Project" button
    await page.click('button:has-text("New Project")');
    await page.waitForTimeout(300);

    // Wait for modal
    const modal = page.locator('#project-modal');
    await expect(modal).toBeVisible({ timeout: 2000 });

    // Fill project details
    await page.fill('#project-title', 'Test Project');
    await page.fill('#project-description', 'This is a test project');

    // Set status to active
    await page.selectOption('#project-status', 'active');

    // Save
    await page.click('button:text("Save Project")');
    await page.waitForTimeout(500);

    // Verify project created
    const projectTitle = page.locator('.project-title').first();
    await expect(projectTitle).toContainText('Test Project');
  });

  test('should assign task to project', async ({ page }) => {
    // Create a project first
    await page.evaluate(() => {
      const project = new Project({
        title: 'Test Project',
        status: 'active'
      });
      window.app.projects.push(project);
      window.app.saveProjects();
    });

    await page.waitForTimeout(300);

    // Create task
    await page.fill('#quick-add-input', 'Task for project');
    await page.press('#quick-add-input', 'Enter');
    await page.waitForTimeout(500);

    // Edit task to assign to project
    const taskElement = page.locator('.task').first();
    await taskElement.dblclick();
    await page.waitForTimeout(300);

    // Select project
    await page.selectOption('#task-project', 'Test Project');

    // Save
    await page.click('button:text("Save Task")');
    await page.waitForTimeout(500);

    // Verify task shows project badge
    const projectBadge = page.locator('.task-project').first();
    await expect(projectBadge).toContainText('Test Project');

    // Verify task moved to Next Actions (from Inbox)
    await page.click('[data-view="next"]');
    await page.waitForTimeout(300);

    const nextTasks = page.locator('.task');
    await expect(nextTasks).toContainText('Task for project');
  });

  test('should view project details', async ({ page }) => {
    // Create a project with tasks
    await page.evaluate(() => {
      const project = new Project({
        title: 'Project Alpha',
        status: 'active'
      });
      window.app.projects.push(project);

      const task = new Task({
        title: 'Project task',
        status: 'next',
        projectId: project.id
      });
      window.app.tasks.push(task);

      window.app.saveProjects();
      window.app.saveTasks();
    });

    await page.waitForTimeout(500);

    // Navigate to Projects view
    await page.click('[data-view="projects"]');
    await page.waitForTimeout(300);

    // Click on project
    await page.click('.project:has-text("Project Alpha")');
    await page.waitForTimeout(500);

    // Should show project tasks
    const projectTasks = page.locator('.task');
    await expect(projectTasks).toContainText('Project task');
  });

  test('should archive project', async ({ page }) => {
    // Create a project
    await page.evaluate(() => {
      const project = new Project({
        title: 'Project to Archive',
        status: 'active'
      });
      window.app.projects.push(project);
      window.app.saveProjects();
    });

    await page.waitForTimeout(500);

    // Navigate to Projects view
    await page.click('[data-view="projects"]');
    await page.waitForTimeout(300);

    // Right-click project
    const projectElement = page.locator('.project:has-text("Project to Archive")');
    await projectElement.click({ button: 'right' });
    await page.waitForTimeout(200);

    // Click archive
    await page.click('button:text("Archive")');
    await page.waitForTimeout(500);

    // Verify project archived (should disappear from active list)
    const activeProjects = page.locator('.project');
    const count = await activeProjects.count();
    expect(count).toBe(0);
  });

  test('should show project dropdown with task counts', async ({ page }) => {
    // Create project with tasks
    await page.evaluate(() => {
      const project = new Project({
        title: 'Active Project',
        status: 'active'
      });
      window.app.projects.push(project);

      for (let i = 0; i < 3; i++) {
        const task = new Task({
          title: `Project task ${i + 1}`,
          status: 'next',
          projectId: project.id
        });
        window.app.tasks.push(task);
      }

      window.app.saveProjects();
      window.app.saveTasks();
    });

    await page.waitForTimeout(500);

    // Click projects dropdown toggle
    const dropdownToggle = page.locator('.projects-dropdown-toggle');
    await dropdownToggle.click();
    await page.waitForTimeout(300);

    // Verify dropdown shows project
    const projectItem = page.locator('.project-dropdown-item:has-text("Active Project")');
    await expect(projectItem).toBeVisible();

    // Should show task count
    const taskCount = projectItem.locator('.project-task-count');
    await expect(taskCount).toContainText('3');
  });
});

test.describe('Calendar and Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
  });

  test('should open calendar view', async ({ page }) => {
    // Click calendar button
    await page.click('#btn-calendar');
    await page.waitForTimeout(500);

    // Wait for calendar modal
    const modal = page.locator('#calendar-modal');
    await expect(modal).toBeVisible();

    // Should show calendar grid
    const calendarGrid = page.locator('.calendar-grid, .calendar-month');
    await expect(calendarGrid).toBeVisible();

    // Close calendar
    await page.click('#close-calendar');
    await page.waitForTimeout(300);

    // Verify closed
    await expect(modal).not.toBeVisible();
  });

  test('should open dashboard', async ({ page }) => {
    // Click dashboard button
    await page.click('#btn-dashboard');
    await page.waitForTimeout(500);

    // Wait for dashboard modal
    const modal = page.locator('#dashboard-modal');
    await expect(modal).toBeVisible();

    // Should show statistics
    const statsCards = page.locator('.stat-card, .dashboard-stat');
    await expect(statsCards.first()).toBeVisible();

    // Close dashboard
    await page.click('#close-dashboard');
    await page.waitForTimeout(300);

    // Verify closed
    await expect(modal).not.toBeVisible();
  });

  test('should display tasks on calendar by due date', async ({ page }) => {
    // Create task with due date
    await page.evaluate(() => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const task = new Task({
        title: 'Task due tomorrow',
        status: 'next',
        dueDate: tomorrow.toISOString().split('T')[0]
      });
      window.app.tasks.push(task);
      window.app.saveTasks();
    });

    await page.waitForTimeout(500);

    // Open calendar
    await page.click('#btn-calendar');
    await page.waitForTimeout(500);

    // Should show task on calendar
    const calendarTask = page.locator('.calendar-task:has-text("Task due tomorrow")');
    await expect(calendarTask).toBeVisible();
  });
});

test.describe('Undo and Redo', () => {
  test('should undo and redo task operations', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');

    // Create task
    await page.fill('#quick-add-input', 'Undo test task');
    await page.press('#quick-add-input', 'Enter');
    await page.waitForTimeout(500);

    // Verify task exists
    const tasksBefore = await page.locator('.task').count();
    expect(tasksBefore).toBeGreaterThan(0);

    // Complete task
    const checkbox = page.locator('.task-checkbox').first();
    await checkbox.click();
    await page.waitForTimeout(300);

    // Verify task gone
    const tasksAfterComplete = await page.locator('.task').count();
    expect(tasksAfterComplete).toBeLessThan(tasksBefore);

    // Undo (Ctrl+Z)
    await page.keyboard.press('Control+Z');
    await page.waitForTimeout(500);

    // Task should reappear
    const tasksAfterUndo = await page.locator('.task').count();
    expect(tasksAfterUndo).toBe(tasksBefore);

    // Redo (Ctrl+Y)
    await page.keyboard.press('Control+Y');
    await page.waitForTimeout(500);

    // Task should be gone again
    const tasksAfterRedo = await page.locator('.task').count();
    expect(tasksAfterRedo).toBeLessThan(tasksBefore);
  });
});
