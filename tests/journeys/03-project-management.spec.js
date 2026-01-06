import { test, expect } from '../../fixtures/gtd-app.js';

/**
 * Journey 3: Project Management
 * Description: Creating and managing projects with multiple tasks
 *
 * Tests:
 * - Creating new projects
 * - Associating tasks with projects
 * - Project filtering and sidebar display
 * - Changing project status
 * - Project completion cascading to tasks
 */
test.describe('Project Management Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    await gtdApp.clearLocalStorage();
    await gtdApp.goto();
  });

  test('should create new project with all attributes', async ({ page, gtdApp }) => {
    // Step 1: Click "New Project" button
    await page.click(gtdApp.selectors.newProjectBtn);

    // Step 2: Verify project modal opens
    await expect(page.locator(gtdApp.selectors.projectModal)).toBeVisible();

    // Step 3: Fill in project details
    await page.fill('#project-title', 'Website Redesign');
    await page.fill('#project-description', 'Complete overhaul of company website');
    await page.selectOption('#project-status', 'active');

    // Add contexts
    const contextInput = page.locator('#project-contexts');
    await contextInput.fill('work');
    await page.keyboard.press('Enter');
    await contextInput.fill('important');
    await page.keyboard.press('Enter');

    // Step 4: Save project
    await page.click('button[type="submit"]');

    // Step 5: Verify modal closes and project created
    await expect(page.locator(gtdApp.selectors.projectModal)).not.toBeVisible();

    // Verify notification
    const notification = await gtdApp.waitForNotification().catch(() => null);
    if (notification) {
      expect(notification.toLowerCase()).toContain('project created');
    }

    // Step 6: Navigate to Projects view
    await gtdApp.navigateTo('projects');

    // Verify project appears
    const projectsContainer = page.locator('#projects-container');
    await expect(projectsContainer.locator('text=Website Redesign')).toBeVisible();
  });

  test('should add tasks to project via quick-add', async ({ page, gtdApp }) => {
    // Step 1: Create project first
    await gtdApp.createProject({
      title: 'Website Redesign',
      description: 'Complete overhaul',
      status: 'active',
      contexts: ['work', 'important']
    });

    // Step 2: Add tasks using project hash syntax
    await gtdApp.quickAddTask('Design homepage mockup #Website Redesign');
    await gtdApp.quickAddTask('Implement homepage #Website Redesign @work');
    await gtdApp.quickAddTask('Write content #Website Redesign @work high energy');
    await gtdApp.quickAddTask('Test all pages #Website Redesign');
    await gtdApp.quickAddTask('Deploy to production #Website Redesign');

    // Step 3: Navigate to Projects view
    await gtdApp.navigateTo('projects');

    // Step 4: Verify project appears with task count
    const projectItem = page.locator('.project-item', { hasText: 'Website Redesign' });
    await expect(projectItem).toBeVisible();

    const taskCount = projectItem.locator('.task-count');
    const countText = await taskCount.textContent();
    expect(parseInt(countText)).toBe(5);

    // Step 5: Click project to view only its tasks
    await projectItem.click();

    // Verify only project tasks are shown
    const tasks = await gtdApp.getTasks();
    expect(tasks).toHaveLength(5);

    const taskTitles = tasks.map(t => t.title);
    expect(taskTitles).toContain('Design homepage mockup #Website Redesign');
    expect(taskTitles).toContain('Implement homepage #Website Redesign @work');
  });

  test('should display project in sidebar dropdown', async ({ page, gtdApp }) => {
    // Step 1: Create project
    await gtdApp.createProject({
      title: 'Website Redesign',
      status: 'active',
      contexts: ['work']
    });

    // Step 2: Click projects dropdown toggle
    const dropdownToggle = page.locator('.projects-dropdown-toggle');
    await dropdownToggle.click();

    // Step 3: Verify project appears in dropdown
    const dropdown = page.locator('#projects-dropdown');
    await expect(dropdown).toBeVisible();

    await expect(dropdown.locator('text=Website Redesign')).toBeVisible();

    // Step 4: Verify task count in dropdown
    const projectLink = dropdown.locator('a', { hasText: 'Website Redesign' });
    const count = projectLink.locator('.count');
    await expect(count).toBeVisible();
  });

  test('should change project status and update visibility', async ({ page, gtdApp }) => {
    // Step 1: Create active project with tasks
    await gtdApp.createProject({
      title: 'Active Project',
      status: 'active',
      contexts: ['work']
    });

    await gtdApp.quickAddTask('Task 1 #Active Project');
    await gtdApp.quickAddTask('Task 2 #Active Project');

    // Step 2: Navigate to Projects view
    await gtdApp.navigateTo('projects');

    // Verify project in active section
    await expect(page.locator('.project-item', { hasText: 'Active Project' })).toBeVisible();

    // Step 3: Open project for editing
    await gtdApp.openTask('Active Project'); // This opens the project modal

    // Step 4: Change status to Someday
    await page.selectOption('#project-status', 'someday');
    await gtdApp.saveTask();

    // Step 5: Verify project moved to Someday section
    await gtdApp.navigateTo('projects');
    const somedaySection = page.locator('.projects-section', { hasText: 'Someday' });
    await expect(somedaySection.locator('text=Active Project')).toBeVisible();
  });

  test('should archive tasks when project completed', async ({ page, gtdApp }) => {
    // Step 1: Create project with tasks
    await gtdApp.createProject({
      title: 'Completed Project',
      status: 'active',
      contexts: ['work']
    });

    await gtdApp.quickAddTask('Task 1 #Completed Project');
    await gtdApp.quickAddTask('Task 2 #Completed Project');
    await gtdApp.quickAddTask('Task 3 #Completed Project');

    // Verify tasks are active
    await gtdApp.navigateTo('all');
    let allTasks = await gtdApp.getTasks();
    expect(allTasks.length).toBeGreaterThanOrEqual(3);

    // Step 2: Mark project as completed
    await gtdApp.navigateTo('projects');
    await gtdApp.openTask('Completed Project');
    await page.selectOption('#project-status', 'completed');
    await gtdApp.saveTask();

    // Step 3: Verify tasks are archived
    await gtdApp.navigateTo('all');

    // Active tasks should not include the completed project tasks
    allTasks = await gtdApp.getTasks();
    const completedProjectTasks = allTasks.filter(t => t.title.includes('#Completed Project'));
    expect(completedProjectTasks).toHaveLength(0);
  });

  test('should handle creating project with duplicate name', async ({ page, gtdApp }) => {
    // Step 1: Create first project
    await gtdApp.createProject({
      title: 'My Project',
      status: 'active'
    });

    // Step 2: Try to create duplicate project
    await page.click(gtdApp.selectors.newProjectBtn);
    await page.fill('#project-title', 'My Project');
    await page.click('button[type="submit"]');

    // Step 3: Should either allow it (with different ID) or show error
    // Both behaviors are acceptable
    await expect(page.locator(gtdApp.selectors.projectModal)).not.toBeVisible();

    // Navigate to projects and verify
    await gtdApp.navigateTo('projects');
    const projectElements = page.locator('.project-item', { hasText: 'My Project' });
    const count = await projectElements.count();

    // Either 1 (error prevented duplicate) or 2 (duplicates allowed)
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(2);
  });

  test('should handle deleting project with active tasks', async ({ page, gtdApp }) => {
    // Step 1: Create project with tasks
    await gtdApp.createProject({
      title: 'To Be Deleted',
      status: 'active'
    });

    await gtdApp.quickAddTask('Task 1 #To Be Deleted');
    await gtdApp.quickAddTask('Task 2 #To Be Deleted');

    // Step 2: Delete project (via context menu or edit modal)
    await gtdApp.navigateTo('projects');
    await gtdApp.openContextMenu('To Be Deleted');

    // Click delete option
    await page.click('text=Delete');

    // Step 3: Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Step 4: Verify project is gone
    await expect(page.locator('.project-item', { hasText: 'To Be Deleted' })).not.toBeVisible();

    // Step 5: Verify tasks are either deleted or orphaned (both acceptable)
    await gtdApp.navigateTo('all');
    const tasks = await gtdApp.getTasks();
    const deletedProjectTasks = tasks.filter(t => t.title.includes('#To Be Deleted'));

    // Tasks should be deleted or have no project
    if (deletedProjectTasks.length > 0) {
      // Orphaned tasks - acceptable behavior
      for (const task of deletedProjectTasks) {
        expect(task.title).not.toContain('#To Be Deleted'); // Hash should be removed
      }
    }
  });

  test('should move tasks between projects', async ({ page, gtdApp }) => {
    // Step 1: Create two projects
    await gtdApp.createProject({
      title: 'Project A',
      status: 'active'
    });

    await gtdApp.createProject({
      title: 'Project B',
      status: 'active'
    });

    // Step 2: Add task to Project A
    await gtdApp.quickAddTask('Shared task #Project A');

    // Step 3: Move task to Project B
    await gtdApp.openTask('Shared task #Project A');
    await page.selectOption('#task-project', 'Project B');
    await gtdApp.saveTask();

    // Step 4: Verify task in Project B
    await gtdApp.navigateTo('all');
    const tasks = await gtdApp.getTasks();
    const sharedTask = tasks.find(t => t.title.includes('Shared task'));

    expect(sharedTask).toBeDefined();

    // Open and verify project
    await gtdApp.openTask('Shared task');
    const project = await page.inputValue('#task-project');
    expect(project).toBe('Project B');
  });

  test('should handle long project names', async ({ page, gtdApp }) => {
    // Step 1: Create project with very long name
    const longName = 'This is a very long project name that might break the layout or cause display issues in the sidebar and project views';

    await gtdApp.createProject({
      title: longName,
      status: 'active'
    });

    // Step 2: Navigate to Projects view
    await gtdApp.navigateTo('projects');

    // Step 3: Verify project is visible (text may be truncated)
    const projectElement = page.locator('.project-item');
    await expect(projectElement).toBeVisible();

    // The long name should be present (possibly truncated with CSS)
    const projectText = await projectElement.textContent();
    expect(projectText).toContain(longName.substring(0, 50));
  });

  test('should filter view by project', async ({ page, gtdApp }) => {
    // Step 1: Create two projects with tasks
    await gtdApp.createProject({
      title: 'Work Project',
      status: 'active'
    });

    await gtdApp.createProject({
      title: 'Personal Project',
      status: 'active'
    });

    // Add tasks to both
    await gtdApp.quickAddTask('Work task 1 #Work Project');
    await gtdApp.quickAddTask('Work task 2 #Work Project');
    await gtdApp.quickAddTask('Personal task #Personal Project');
    await gtdApp.quickAddTask('Task with no project');

    // Step 2: Filter by Work Project
    await gtdApp.navigateTo('all');

    // Click on Work Project in sidebar
    const dropdownToggle = page.locator('.projects-dropdown-toggle');
    await dropdownToggle.click();

    const workProjectLink = page.locator('#projects-dropdown a', { hasText: 'Work Project' });
    await workProjectLink.click();

    // Step 3: Verify only Work Project tasks shown
    const tasks = await gtdApp.getTasks();
    expect(tasks).toHaveLength(2);

    const taskTitles = tasks.map(t => t.title);
    expect(taskTitles).toContain('Work task 1 #Work Project');
    expect(taskTitles).toContain('Work task 2 #Work Project');
    expect(taskTitles).not.toContain('Personal task #Personal Project');
  });
});
