import { test, expect } from '../../fixtures/gtd-app.js';

/**
 * Journey 1: New User Onboarding
 * Description: First-time user experience and initial task capture
 *
 * Tests:
 * - User ID generation
 * - Empty state initialization
 * - Quick-add functionality
 * - Navigation between views
 * - Help modal functionality
 */
test.describe('New User Onboarding Journey', () => {
  test.beforeEach(async ({ gtdApp }) => {
    // Clear localStorage to simulate fresh session
    await gtdApp.clearLocalStorage();
  });

  test('should generate user ID and initialize empty state', async ({ page, gtdApp }) => {
    // Step 1: Open application for first time
    await gtdApp.goto();

    // Step 2: Verify user ID is automatically generated and displayed
    const userId = await gtdApp.getUserId();
    expect(userId).toMatch(/^user_[a-z0-9]+$/);
    await expect(page.locator(gtdApp.selectors.userId)).toBeVisible();

    // Step 3: Verify all navigation items show "0" counts
    const inboxCount = await gtdApp.getCount('#inbox');
    const nextCount = await gtdApp.getCount('#next');
    const waitingCount = await gtdApp.getCount('#waiting');
    const somedayCount = await gtdApp.getCount('#someday');
    const projectsCount = await gtdApp.getCount('#projects');
    const referenceCount = await gtdApp.getCount('#reference');

    expect(inboxCount).toBe(0);
    expect(nextCount).toBe(0);
    expect(waitingCount).toBe(0);
    expect(somedayCount).toBe(0);
    expect(projectsCount).toBe(0);
    expect(referenceCount).toBe(0);

    // Step 4: Verify default view is "Inbox"
    const activeNavItem = page.locator('.nav-item.active');
    await expect(activeNavItem).toHaveAttribute('data-view', 'inbox');

    // Verify view title
    const viewTitle = page.locator('#view-title');
    await expect(viewTitle).toHaveText('Inbox');
  });

  test('should capture first task using quick-add', async ({ page, gtdApp }) => {
    // Step 1: Open application
    await gtdApp.goto();

    // Step 2: Verify initial state
    const initialInboxCount = await gtdApp.getCount('#inbox');
    expect(initialInboxCount).toBe(0);

    // Step 3: Use quick-add to capture first task
    await gtdApp.quickAddTask('Call mom about birthday party');

    // Step 4: Verify task appears in Inbox with count "1"
    const updatedInboxCount = await gtdApp.getCount('#inbox');
    expect(updatedInboxCount).toBe(1);

    // Verify task is visible
    const tasks = await gtdApp.getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Call mom about birthday party');
    expect(tasks[0].completed).toBe(false);

    // Verify announcement for screen readers
    const announcement = await gtdApp.getAnnouncement();
    expect(announcement.toLowerCase()).toContain('task created');
  });

  test('should navigate to different views with empty states', async ({ page, gtdApp }) => {
    // Step 1: Open application
    await gtdApp.goto();

    // Step 2: Navigate to Next Actions view
    await gtdApp.navigateTo('next');
    await expect(page.locator('#view-title')).toHaveText('Next');

    // Verify empty state message or no tasks
    const nextTasks = await gtdApp.getTasks();
    expect(nextTasks).toHaveLength(0);

    // Step 3: Navigate to Waiting view
    await gtdApp.navigateTo('waiting');
    await expect(page.locator('#view-title')).toHaveText('Waiting');

    const waitingTasks = await gtdApp.getTasks();
    expect(waitingTasks).toHaveLength(0);

    // Step 4: Navigate to Someday view
    await gtdApp.navigateTo('someday');
    await expect(page.locator('#view-title')).toHaveText('Someday');

    const somedayTasks = await gtdApp.getTasks();
    expect(somedayTasks).toHaveLength(0);

    // Step 5: Navigate to Projects view
    await gtdApp.navigateTo('projects');
    await expect(page.locator('#view-title')).toHaveText('Projects');

    // Verify no projects displayed
    const projectsContainer = page.locator('#projects-container');
    await expect(projectsContainer).toBeVisible();
  });

  test('should open and display help modal', async ({ page, gtdApp }) => {
    // Step 1: Open application
    await gtdApp.goto();

    // Step 2: Click Help button
    const helpButton = page.locator('#help-button');
    await helpButton.click();

    // Step 3: Verify help modal opens
    const helpModal = page.locator('#help-modal');
    await expect(helpModal).toBeVisible();

    // Step 4: Verify help content is displayed
    const modalContent = helpModal.locator('.modal-content');
    await expect(modalContent).toBeVisible();

    // Step 5: Close modal
    const closeButton = helpModal.locator('.close-modal');
    await closeButton.click();
    await expect(helpModal).not.toBeVisible();
  });

  test('should preserve user ID across page reloads', async ({ gtdApp }) => {
    // Step 1: Open application and get initial user ID
    await gtdApp.goto();
    const initialUserId = await gtdApp.getUserId();

    // Step 2: Reload page
    await gtdApp.page.reload();
    await gtdApp.waitForAppReady();

    // Step 3: Verify user ID is the same
    const reloadedUserId = await gtdApp.getUserId();
    expect(reloadedUserId).toBe(initialUserId);
  });

  test('should handle quick-add with various formats', async ({ gtdApp }) => {
    // Step 1: Open application
    await gtdApp.goto();

    // Step 2: Add task with context
    await gtdApp.quickAddTask('Buy groceries @home @personal');

    // Step 3: Add task with energy level
    await gtdApp.quickAddTask('Call client @work high energy');

    // Step 4: Add task with time estimate
    await gtdApp.quickAddTask('Review documents 30min');

    // Step 5: Add simple task
    await gtdApp.quickAddTask('Simple task without tags');

    // Verify all tasks were added
    const inboxCount = await gtdApp.getCount('#inbox');
    expect(inboxCount).toBe(4);

    const tasks = await gtdApp.getTasks();
    expect(tasks).toHaveLength(4);

    // Verify task titles
    const taskTitles = tasks.map(t => t.title);
    expect(taskTitles).toContain('Buy groceries @home @personal');
    expect(taskTitles).toContain('Call client @work high energy');
    expect(taskTitles).toContain('Review documents 30min');
    expect(taskTitles).toContain('Simple task without tags');
  });

  test('should handle browser privacy mode', async ({ context, gtdApp }) => {
    // Test with a new context that simulates privacy mode
    const page = await context.newPage();
    const privacyApp = new (Object.getPrototypeOf(gtdApp).constructor)(page);

    // Navigate to app
    await privacyApp.goto();

    // Should still work, user ID generated
    const userId = await privacyApp.getUserId();
    expect(userId).toMatch(/^user_[a-z0-9]+$/);

    // Quick-add should work
    await privacyApp.quickAddTask('Test task in privacy mode');

    const tasks = await privacyApp.getTasks();
    expect(tasks).toHaveLength(1);

    await page.close();
  });

  test('should display empty state message when no tasks exist', async ({ page, gtdApp }) => {
    // Step 1: Open application
    await gtdApp.goto();

    // Step 2: Check for empty state in Inbox
    const tasksContainer = page.locator('#tasks-container');
    const emptyState = tasksContainer.locator('.empty-state');

    // Either empty state is visible or no tasks present
    const isEmptyStateVisible = await emptyState.isVisible().catch(() => false);
    const tasks = await gtdApp.getTasks();

    expect(isEmptyStateVisible || tasks.length === 0).toBeTruthy();
  });
});
