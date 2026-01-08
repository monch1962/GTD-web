# E2E Tests for GTD Web

This directory contains end-to-end tests using Playwright.

## Setup

### Install Dependencies

```bash
npm install
```

### Install Playwright Browsers

```bash
npm run test:e2e:install
```

## Running Tests

### Start Development Server

First, start the development server in a terminal:

```bash
npm start
```

The server should run on http://localhost:8080

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Tests in UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

This opens the Playwright UI where you can:
- Visualize test steps
- Debug tests
- Run specific tests
- View traces and screenshots

### Run Tests in Headed Mode (With Browser Window)

```bash
npm run test:e2e:headed
```

### Run Tests in Debug Mode

```bash
npm run test:e2e:debug
```

This launches the Playwright Inspector for step-by-step debugging.

### View Test Report

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

## Test Suites

### `task-management.spec.js`

Tests for task CRUD operations:
- ✅ Quick add task with NLP parsing
- ✅ Complete task via checkbox
- ✅ Edit task via modal
- ✅ Delete task via context menu
- ✅ Recurring task completion
- ✅ Search tasks
- ✅ Filter by context
- ✅ Star and unstar tasks
- ✅ Keyboard shortcuts
- ✅ Tasks with subtasks

### `navigation.spec.js`

Tests for view navigation and projects:
- ✅ Navigate between views (Inbox, Next, Waiting, Someday)
- ✅ Task count updates
- ✅ Empty state display
- ✅ Keyboard navigation shortcuts
- ✅ Context filtering in sidebar
- ✅ Create new project
- ✅ Assign task to project
- ✅ View project details
- ✅ Archive project
- ✅ Project dropdown with task counts
- ✅ Calendar view
- ✅ Dashboard analytics
- ✅ Tasks on calendar by due date
- ✅ Undo and redo operations

## Writing New Tests

### Test Structure

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Test steps
    await page.click('button');
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

### Best Practices

1. **Wait for App Load**: Always use `waitForLoadState('networkidle')` after navigation
2. **Use Locators**: Prefer semantic locators like `#task-modal` over CSS selectors
3. **Assertions**: Use `expect().toBeVisible()` with timeout for async operations
4. **Cleanup**: Clean up test data in `beforeEach` or `afterEach`
5. **Describe Tests**: Use descriptive test names that explain what is being tested

### Common Patterns

#### Create Test Data

```javascript
await page.evaluate(() => {
  const task = new Task({
    title: 'Test task',
    status: 'next',
    contexts: ['@work']
  });
  window.app.tasks.push(task);
  window.app.saveTasks();
});
```

#### Clear Data

```javascript
await page.evaluate(() => {
  window.app.tasks = [];
  window.app.saveTasks();
});
```

#### Wait for Updates

```javascript
await page.waitForTimeout(500); // Wait for async operations
```

#### Check Console

```javascript
// Listen for console messages
page.on('console', msg => {
  if (msg.type() === 'log') {
    console.log('PAGE LOG:', msg.text());
  }
});
```

## Debugging Tips

### Visual Debugging

Use headed mode to see what's happening:

```bash
npm run test:e2e:headed
```

### Step-by-Step Debugging

Use debug mode to pause at each step:

```bash
npm run test:e2e:debug
```

### Screenshots on Failure

Playwright automatically takes screenshots on test failure. Find them in:
```
test-results/
  ├── task-management-*/
  │   └── screenshot.png
  └── navigation-*/
      └── screenshot.png
```

### Traces

Enable traces for detailed debugging:

```javascript
test('should do something', async ({ page }) => {
  await page.context().tracing.start({ screenshots: true, snapshots: true });
  // ... test code ...
  await page.context().tracing.stop({ path: 'trace.zip' });
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:e2e:install
      - run: npm start &
      - run: npm run test:e2e
        env:
          CI: true
```

## Troubleshooting

### Server Not Running

```
Error: connect ECONNREFUSED ::1:8080
```

**Solution**: Start the dev server with `npm start` before running tests

### Tests Timing Out

```
Error: Test timeout of 30000ms exceeded
```

**Solution**: Increase timeout or check if server is responsive

### Elements Not Found

```
Error: locator.click: Target closed
```

**Solution**: Add `await page.waitForTimeout(500)` before action, or use `waitForSelector`

### Browser Not Installed

```
Error: Executable doesn't exist at /path/to/chrome
```

**Solution**: Run `npm run test:e2e:install` to install browsers

## Contributing

When adding new E2E tests:

1. Follow existing test structure
2. Use descriptive test names
3. Clean up test data in `beforeEach`
4. Test both positive and negative cases
5. Add assertions to verify expected outcomes
6. Run tests locally before committing

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Locator Strategies](https://playwright.dev/docs/locators)
- [GTD Web Application](http://localhost:8080)
