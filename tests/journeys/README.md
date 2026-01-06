# GTD-web User Journey Tests

End-to-end tests using Playwright to validate critical user workflows in the GTD-web application.

## Overview

These tests simulate real user journeys through the application, ensuring that core workflows function correctly from start to finish. Unlike unit tests (in `__tests__/`), these tests exercise the entire application stack including UI, storage, and user interactions.

## Test Journeys

### Phase 1: Critical Core Workflows ✅

1. **New User Onboarding** (`01-new-user-onboarding.spec.js`)
   - User ID generation
   - Empty state initialization
   - First task capture
   - Navigation basics

2. **GTD Inbox Processing** (`02-inbox-processing.spec.js`)
   - Processing inbox tasks
   - Moving tasks between statuses (Inbox → Next/Waiting/Someday)
   - Setting attributes (due dates, energy, contexts)
   - Task completion

3. **Project Management** (`03-project-management.spec.js`)
   - Creating projects
   - Associating tasks with projects
   - Project filtering
   - Project status changes
   - Completion cascading to tasks

4. **Task Completion and Recurrence** (`04-task-completion-recurrence.spec.js`)
   - Daily/weekly/monthly/yearly recurrence
   - Recurrence chains
   - Attribute preservation
   - Stopping recurrence
   - Edge cases (leap years, month-end)

5. **Context-Based Filtering** (`05-context-filtering.spec.js`)
   - Global search by context
   - Advanced search filters
   - Multiple filter combinations
   - Real-time search updates
   - Search accessibility

### Phase 2: Quality Assurance ✅

13. **Error Scenarios** (`13-error-scenarios.spec.js`)
    - localStorage quota management
    - Offline mode handling
    - Corrupted data recovery
    - Multiple errors in succession
    - Error logging

14. **Accessibility** (`14-accessibility.spec.js`)
    - Keyboard navigation
    - Screen reader support
    - ARIA labels and roles
    - Focus management
    - Skip links
    - Color contrast

## Installation

First, install Playwright browsers:

```bash
npm run test:e2e:install
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug specific test
```bash
npm run test:e2e:debug -- 01-new-user-onboarding.spec.js
```

### Run specific test file
```bash
npx playwright test 01-new-user-onboarding.spec.js
```

### Run tests on specific browser
```bash
# Chromium (default)
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# WebKit (Safari)
npx playwright test --project=webkit
```

### View test report
```bash
npm run test:e2e:report
```

## Test Structure

```
tests/
├── fixtures/
│   └── gtd-app.js          # Custom helper class with common actions
└── journeys/
    ├── 01-new-user-onboarding.spec.js
    ├── 02-inbox-processing.spec.js
    ├── 03-project-management.spec.js
    ├── 04-task-completion-recurrence.spec.js
    ├── 05-context-filtering.spec.js
    ├── 13-error-scenarios.spec.js
    └── 14-accessibility.spec.js
```

## GTDApp Helper Class

The `GTDApp` fixture (`tests/fixtures/gtd-app.js`) provides convenient methods for common actions:

```javascript
// Navigation
await gtdApp.goto();
await gtdApp.navigateTo('next');

// Task operations
await gtdApp.quickAddTask('Task title');
await gtdApp.openTask('Task title');
await gtdApp.completeTask('Task title');

// Projects
await gtdApp.createProject({
  title: 'My Project',
  status: 'active',
  contexts: ['work']
});

// Storage
await gtdApp.clearLocalStorage();
await gtdApp.setLocalStorage(key, value);
await gtdApp.getLocalStorage(key);

// Utilities
await gtdApp.search('@work');
await gtdApp.clearSearch();
const tasks = await gtdApp.getTasks();
```

## Configuration

Playwright is configured in `playwright.config.js`:

- **Base URL**: `http://localhost:8080`
- **Test timeout**: 10s (actions), 30s (navigation)
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Auto-waiting**: Enabled
- **Screenshots/Videos**: On failure only

## Writing New Tests

When adding new user journey tests:

1. **Name it descriptively**: Use the journey number prefix (e.g., `06-calendar-view.spec.js`)
2. **Follow the pattern**:
   ```javascript
   import { test, expect } from '../../fixtures/gtd-app.js';

   test.describe('Journey Name', () => {
     test.beforeEach(async ({ gtdApp }) => {
       await gtdApp.clearLocalStorage();
       await gtdApp.goto();
     });

     test('should do something specific', async ({ page, gtdApp }) => {
       // Test steps...
     });
   });
   ```

3. **Use the helper methods**: Prefer `gtdApp.*` methods over raw Playwright commands
4. **Test user outcomes**: Focus on what users experience, not implementation details
5. **Include edge cases**: Test error conditions and boundary cases
6. **Add assertions**: Verify expected outcomes at each step

## CI/CD Integration

To run in CI environments:

```yaml
# Example GitHub Actions
- name: Install Playwright browsers
  run: npm run test:e2e:install

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Tests fail with "Target closed"
- Ensure the dev server is running on port 8080
- Check that no other service is using the port
- Try increasing the timeout in `playwright.config.js`

### Tests timeout
- Check if the app is loading slowly
- Increase timeout in config or use `test.setTimeout(30000)`
- Verify localStorage isn't full

### Browser not found
- Run `npm run test:e2e:install` to download browsers
- Check system requirements for Playwright

### Flaky tests
- Some tests depend on timing - increase wait times
- Use `waitForSelector` instead of fixed timeouts
- Check for race conditions in async operations

## Accessibility Testing

The accessibility journey (`14-accessibility.spec.js`) includes:

- Keyboard-only navigation
- Screen reader announcements (ARIA live regions)
- Focus management
- Skip links
- Modal focus trapping
- Form labels
- Color contrast (requires `@axe-core/playwright`)

To install axe-core for automated accessibility testing:

```bash
npm install -D @axe-core/playwright
```

## Coverage

Current test coverage by feature:

- ✅ User onboarding
- ✅ Inbox processing
- ✅ Task management
- ✅ Project management
- ✅ Context filtering
- ✅ Recurrence
- ✅ Error handling
- ✅ Accessibility (keyboard, screen readers)

### Planned (not yet implemented)

- Calendar view
- Focus mode (Pomodoro)
- Smart suggestions
- Archive management
- Import/Export
- Templates
- Daily/Weekly review
- Dependencies visualization
- Productivity heatmap
- Bulk operations
- Dark mode

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [GTD Methodology](https://gettingthingsdone.com/)
