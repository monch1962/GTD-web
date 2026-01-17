# CLAUDE.md - GTD Web Application Guide

This file provides essential information for Claude Code instances working on
the GTD-web codebase.

## Quick Start

### Essential Commands

```bash
# Development
npm run dev                  # Start Vite dev server on http://localhost:8080
npm run build                # Build for production (single-file bundle)
npm run preview              # Preview production build locally

# Testing
npm test                     # Run all Jest unit tests (51 test files)
npm test:coverage            # Run tests with coverage report
npm test:watch               # Run tests in watch mode
npm test -- __tests__/filename.test.js  # Run single test file

# E2E Testing (Playwright)
npm run test:e2e             # Run all E2E tests
npm run test:e2e:ui          # Run E2E tests with UI
npm run test:e2e:headed      # Run E2E tests in headed mode
npm run test:e2e:debug       # Run E2E tests in debug mode

# Code Quality
npm run lint                 # Check for linting issues
npm run lint:fix             # Auto-fix linting issues
npm run lint:check           # Strict linting (fails on warnings)
```

## Project Overview

### Application Type

**Getting Things Done (GTD) Web App** - Single-page productivity application
implementing David Allen's GTD methodology.

### Tech Stack

- **Build Tool**: Vite 7.3.1 (fast HMR, optimized bundling)
- **Bundler**: Rollup (via Vite) with single-file output plugin
- **Testing**: Jest 29.7.0 (unit), Playwright 1.57.0 (E2E)
- **Language**: ES6+ JavaScript (modules)
- **Storage**: localStorage (offline-first, no backend)
- **PWA**: Service worker for offline support

### Build & Deployment

```bash
# Development (with Hot Module Replacement)
npm run dev                  # Starts Vite dev server on port 8080

# Production Build
npm run build                # Creates dist/ with single HTML file
                            # Output: ~425 KB (84 KB gzipped)
                            # All CSS/JS inlined, ready for deployment

# Preview Production Build
npm run preview              # Test production build locally

# Deployment
# Deploy dist/ directory to any static hosting:
# - GitHub Pages, Netlify, Vercel, AWS S3+CloudFront, etc.
```

**Build Output:**

- `dist/index.html` - Single file with all CSS/JS inlined
- `dist/assets/manifest.*.json` - PWA manifest (browser requirement)

## High-Level Architecture

### Module Structure (42 Modules)

```
js/
├── app.js                           # Main application controller (delegates to managers)
├── models.js                        # Data models (Task, Project, Reference)
├── storage.js                       # LocalStorage wrapper with persistence
├── constants.js                     # Configuration constants
├── dom-utils.js                     # DOM manipulation utilities
├── nlp-parser.js                    # Natural language parser for quick capture
├── template-helpers.js              # HTML template helpers
└── modules/
    ├── core/                        # Core application logic
    │   ├── app-state.js            # Centralized state management
    │   └── storage-ops.js          # Storage operations wrapper
    │
    ├── features/                    # Feature-specific managers (29 modules)
    │   ├── archive.js              # Archive completed tasks
    │   ├── bulk-operations.js      # Bulk task operations
    │   ├── calendar.js             # Calendar view modal
    │   ├── context-filter.js       # Context filtering sidebar
    │   ├── daily-review.js         # Daily review workflow
    │   ├── dashboard.js            # Analytics dashboard
    │   ├── data-export-import.js   # Backup/restore functionality
    │   ├── dependencies.js         # Task dependency management
    │   ├── focus-pomodoro.js       # Focus mode + Pomodoro timer
    │   ├── global-quick-capture.js # Alt+N global hotkey capture
    │   ├── navigation.js           # View navigation
    │   ├── new-project-button.js   # New project button handler
    │   ├── priority-scoring.js     # Automatic 0-100 priority scores
    │   ├── productivity-heatmap.js # 365-day contribution calendar
    │   ├── project-modal.js        # Project creation/edit modal
    │   ├── project-operations.js   # Project CRUD operations
    │   ├── quick-capture-widget.js # Floating + button
    │   ├── search.js               # Advanced search & saved searches
    │   ├── smart-date-suggestions.js # Natural language date parsing
    │   ├── smart-suggestions.js    # AI-powered task recommendations
    │   ├── subtasks.js             # Subtask management
    │   ├── task-modal.js           # Task creation/edit modal
    │   ├── task-operations.js      # Task CRUD operations
    │   ├── templates.js            # Reusable task templates
    │   ├── time-tracking.js        # Time tracking & analytics
    │   ├── undo-redo.js            # Undo/redo history
    │   └── weekly-review.js        # Weekly review workflow
    │
    ├── ui/                          # UI-specific managers (8 modules)
    │   ├── bulk-selection.js       # Bulk selection mode
    │   ├── context-menu.js         # Right-click context menu
    │   ├── dark-mode.js            # Dark mode toggle
    │   ├── keyboard-nav.js         # Keyboard shortcuts
    │   ├── mobile-navigation.js    # Mobile hamburger menu
    │   ├── notifications.js        # Toast notifications
    │   ├── undo-redo.js            # Undo/redo UI controls
    │   └── virtual-scroll.js       # Virtual scrolling for large lists
    │
    ├── views/                       # View rendering logic (3 modules)
    │   ├── project-renderer.js     # Project list rendering
    │   ├── task-renderer.js        # Task list rendering with virtual scroll
    │   └── view-manager.js         # View switching and filtering
    │
    └── utils/                       # Utility modules (2 modules)
        ├── logger.js               # Logging utility
        └── validation.js           # Input validation
```

### State Management

- **Centralized State**: `AppState` class in `js/modules/core/app-state.js`
- **Storage**: `StorageManager` in `js/storage.js` wraps localStorage
- **Flow**: UI → Manager Method → State Update → Storage → Render

```javascript
// Example pattern
async someAction(taskId) {
    const task = this.state.tasks.find(t => t.id === taskId);
    task.status = 'next';  // Modify state directly
    await this.app.saveTasks();  // Persist to localStorage
    this.app.renderView();  // Re-render current view
}
```

### Key Design Patterns

#### 1. Manager Pattern (Feature Modules)

All feature modules follow this consistent structure:

```javascript
export class FeatureManager {
    constructor(state, app) {
        this.state = state // Reference to AppState
        this.app = app // Reference to main app (for delegation)
    }

    setupFeature() {
        // Initialize event listeners and DOM elements
    }

    featureMethod() {
        // Business logic implementation
        // Access state via: this.state.tasks, this.state.projects
        // Delegate to app via: this.app.showNotification?.(), this.app.renderView?.()
    }
}
```

**Examples:**

- `DarkModeManager` (97% test coverage)
- `CalendarManager` (40 tests)
- `ArchiveManager` (38 tests)
- `ContextMenuManager` (46 tests)

#### 2. Delegation Pattern

Main app.js delegates to specialized managers:

```javascript
// In app.js constructor
this.contextMenu = new ContextMenuManager(this.state, this);
this.calendar = new CalendarManager(this.state, this);
this.archive = new ArchiveManager(this.state, this);

// Delegated methods
setupContextMenu() {
    this.contextMenu.setupContextMenu();
}

showContextMenu(event, taskId) {
    this.contextMenu.showContextMenu(event, taskId);
}
```

#### 3. Virtual Scrolling

Large task lists (50+ items) use virtual scrolling for performance:

- Activates at 50+ tasks
- Renders only visible items + buffer
- Implemented in `js/modules/ui/virtual-scroll.js`
- Managed by `TaskRenderer` class

## Important Conventions

### Code Style

- **ES6 Modules**: Use `import/export` for all modules
- **Async/Await**: Use async/await for async operations (not Promises)
- **Optional Chaining**: Use `?.()` for defensive calls (e.g.,
  `this.app.showNotification?.()`)
- **Consistent Naming**: Manager classes end with `Manager`, test files end with
  `.test.js`
- **Private Methods**: Prefix with underscore (`_method`) for internal methods

### Method Naming

- **Notifications**: Use `showNotification(message, type)` (type: 'success',
  'error', 'info')
- **Persistence**: Use `saveTasks()` to persist to localStorage
- **Rendering**: Use `renderView()` to re-render current view
- **State Updates**: Use `saveState(action)` to track undo/redo history

### Testing Conventions

- **Unit Tests**: Located in `__tests__/` directory (51 test files)
- **Test Environment**: Jest 29.7.0 with jsdom
- **E2E Tests**: Playwright in `tests-e2e/` directory
- **Coverage**: Run `npm test:coverage` before committing (aim for >80%)
- **Manual Testing**: Always test on desktop and mobile browsers after changes

### Touch/Mobile Support

- **Touch Targets**: Minimum 44px for buttons
- **Long-Press**: 500ms delay for context menu on mobile
- **Passive Listeners**: Use `{ passive: true }` for touch events to improve
  scroll performance
- **Responsive Design**: Test on mobile (<768px), tablet (768-1024px), desktop
  (>1024px)
- **Synthetic Events**: Store touch coordinates at touchstart, create synthetic
  event for setTimeout callbacks

Example mobile long-press pattern:

```javascript
let touchStartPos = null

document.addEventListener(
    'touchstart',
    (e) => {
        if (taskItem && e.touches.length > 0) {
            touchStartPos = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            }

            this.longPressTimer = setTimeout(() => {
                // Verify still on same task
                const currentTaskItem = document
                    .elementFromPoint(touchStartPos.x, touchStartPos.y)
                    ?.closest('.task-item')

                if (
                    currentTaskItem &&
                    currentTaskItem.dataset.taskId === taskItem.dataset.taskId
                ) {
                    const syntheticEvent = {
                        clientX: touchStartPos.x,
                        clientY: touchStartPos.y,
                        preventDefault: () => {}
                    }
                    this.showContextMenu(syntheticEvent, taskId)
                }
                touchStartPos = null
            }, 500)
        }
    },
    { passive: true }
)

document.addEventListener('touchend', () => {
    clearTimeout(this.longPressTimer)
    touchStartPos = null
})

document.addEventListener(
    'touchmove',
    (e) => {
        // Cancel if moved more than 10px
        if (touchStartPos && e.touches.length > 0) {
            const moveX = Math.abs(e.touches[0].clientX - touchStartPos.x)
            const moveY = Math.abs(e.touches[0].clientY - touchStartPos.y)
            if (moveX > 10 || moveY > 10) {
                clearTimeout(this.longPressTimer)
                touchStartPos = null
            }
        }
    },
    { passive: true }
)
```

### DOM Manipulation

- **Use escapeHtml()**: Always escape user-generated content with `escapeHtml()`
  from `dom-utils.js`
- **Safe DOM Creation**: Prefer `document.createElement()` over `innerHTML` for
  user content
- **Event Delegation**: Use event delegation for dynamic content
- **XSS Prevention**: Never inject unescaped user input into innerHTML

### State Management

- **Read State**: Access via `this.state.tasks`, `this.state.projects`, etc.
- **Update State**: Modify state objects directly (they're mutable references)
- **Persist State**: Call `await this.app.saveTasks()` after modifications
- **Undo/Redo**: Call `this.app.saveState('Action description')` before changes

## Drag-and-Drop Behavior

### Current Implementation (as of January 2025)

**All views**: Drag-and-drop reorders tasks

- **Inbox, Next Actions, Waiting, Someday**: Reorders tasks within the view
- **Project view**: Reorders tasks within the project (changed from creating
  dependencies)
- **Sidebar projects dropdown**: Drag task onto project to assign it

**Implementation**: `js/modules/views/task-renderer.js` (lines 655-754)

- Uses HTML5 drag-and-drop API
- Visual feedback with `.dragging` class
- Position persisted to localStorage via `updateTaskPositions()`
- Compatible with virtual scrolling

**Note**: Task dependencies can still be created via the task modal
(Dependencies section), not via drag-and-drop.

## GTD Methodology Context

This app implements David Allen's **Getting Things Done** methodology:

### Core Workflow

1. **Capture** - Collect all tasks, ideas, commitments in Inbox
2. **Clarify** - Process inbox items: actionable? delete? delegate? defer?
3. **Organize** - Put tasks in right buckets (Next Actions, Waiting, Someday,
   Projects)
4. **Reflect** - Weekly review to keep system current
5. **Engage** - Do tasks based on context, time, energy

### Key Concepts

- **Inbox**: Unprocessed items
- **Next Actions**: Physically actionable tasks you can do now
- **Waiting For**: Tasks blocked on external factors
- **Someday/Maybe**: Future ideas not actionable now
- **Projects**: Multi-step outcomes requiring multiple tasks
- **Contexts**: Situations/location (e.g., @home, @work, @phone)
- **Dependencies**: Tasks that must complete before others become actionable

## Application Features

### Core Features

- **Task Management**: GTD statuses, contexts, energy levels, time estimates
- **Project Management**: Multi-step outcomes with health indicators
- **Context System**: Default contexts (@home, @work, @personal, @computer,
  @phone, @errand) + custom
- **Task Dependencies**: Create task dependencies via modal (drag-and-drop
  reorders)
- **Recurring Tasks**: Daily, weekly, monthly, yearly with specific day
  selection
- **Natural Language Parsing**: Quick entry with smart context/energy/time
  extraction
- **Time Tracking**: Track time spent on tasks with analytics

### Advanced Features

- **Dark Mode**: Toggle with system preference detection (97% test coverage)
- **Calendar View**: Visual calendar showing tasks by due date (40 tests)
- **Focus Mode**: Full-screen single-task focus with Pomodoro timer
- **Archive System**: Archive completed tasks to reduce clutter (38 tests)
- **Quick Actions Context Menu**: Right-click (desktop) / Long-press (mobile)
  (46 tests)
- **Productivity Heatmap**: GitHub-style contribution calendar (365 days)
- **Global Quick Capture**: Alt+N hotkey for instant task capture from anywhere
- **Task Priority Scoring**: Automatic 0-100 scores based on multiple factors
- **Smart Date Suggestions**: Natural language date parsing (in 3 days,
  tomorrow, next week)
- **Task Templates**: Reusable task templates for repetitive workflows
- **Daily Review Mode**: Quick daily workflow with urgent tasks overview
- **Undo/Redo System**: Full history tracking with Ctrl+Z/Ctrl+Y (100% coverage)
- **Bulk Operations**: Set status, energy, context, due dates on multiple tasks
- **Virtual Scrolling**: Efficient rendering of 50+ task lists
- **PWA Support**: Install as Progressive Web App for offline use

## CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/ci.yml`)

1. **Lint & Code Quality**: ESLint + Prettier checks
2. **Unit Tests**: Jest with coverage, uploads to Codecov
3. **E2E Tests**: Playwright browser tests
4. **Build Verification**: Vite build with bundle size tracking
5. **Security Audit**: npm audit for vulnerabilities

### Pre-commit Hooks (Husky)

- Runs ESLint on staged JavaScript files
- Runs Prettier on all files
- Blocks commits if linting fails

## Testing Strategy

### Unit Tests (Jest)

- **Location**: `__tests__/` directory
- **Count**: 51 test files
- **Framework**: Jest 29.7.0 with jsdom environment
- **Coverage Target**: >80% for new code
- **High Coverage Modules**:
    - navigation.js: 100%
    - undo-redo.js: 100%
    - dark-mode.js: 97%
    - models.js: 95%
    - mobile-navigation.js: 95%

### E2E Tests (Playwright)

- **Location**: `tests-e2e/` directory
- **Framework**: Playwright 1.57.0
- **Command**: `npm run test:e2e`
- **Browsers**: Chromium, Firefox, WebKit
- **Features Tested**:
    - Task CRUD operations
    - Navigation
    - Project management
    - Mobile interactions

### Manual Testing Checklist

After code changes, always test:

1. **Desktop**: Chrome, Firefox, Safari
2. **Mobile**: iOS Safari, Android Chrome
3. **Key Interactions**:
    - Context menu (right-click desktop, long-press mobile)
    - Touch targets (44px minimum)
    - Responsive layout (mobile, tablet, desktop)
    - Form inputs (no accidental zoom on focus)
    - Scroll performance (passive event listeners)
    - Drag-and-drop reordering
    - Undo/redo functionality

## Recent Modularization (Complete)

All 42 modules have been refactored to follow the Manager pattern:

**Core (2 modules)**:

- app-state.js, storage-ops.js

**Features (29 modules)**:

- archive.js, bulk-operations.js, calendar.js, context-filter.js,
  daily-review.js, dashboard.js, data-export-import.js, dependencies.js,
  focus-pomodoro.js, global-quick-capture.js, navigation.js,
  new-project-button.js, priority-scoring.js, productivity-heatmap.js,
  project-modal.js, project-operations.js, quick-capture-widget.js, search.js,
  smart-date-suggestions.js, smart-suggestions.js, subtasks.js, task-modal.js,
  task-operations.js, templates.js, time-tracking.js, undo-redo.js,
  weekly-review.js

**UI (8 modules)**:

- bulk-selection.js, context-menu.js, dark-mode.js, keyboard-nav.js,
  mobile-navigation.js, notifications.js, undo-redo.js, virtual-scroll.js

**Views (3 modules)**:

- project-renderer.js, task-renderer.js, view-manager.js

**Utils (2 modules)**:

- logger.js, validation.js

## Common Tasks

### Adding a New Feature

1. Write tests in `__tests__/feature-name.test.js`
2. Run tests to establish baseline
3. Create manager in `js/modules/[type]/feature-name.js`
4. Follow the Manager pattern (constructor, setup, methods)
5. Import and delegate in app.js
6. Run tests again to verify
7. Manual browser testing (desktop + mobile)
8. Check for E2E test coverage

### Fixing a Bug

1. Write a failing test that reproduces the bug
2. Fix the bug
3. Verify test passes
4. Check for related code that might have same issue
5. Manual browser testing
6. Run `npm run lint:fix` before committing

### Updating UI

1. Modify CSS in `css/styles.css`
2. Update DOM manipulation in relevant manager
3. Test on multiple screen sizes (mobile, tablet, desktop)
4. Verify touch interactions on mobile
5. Check dark mode compatibility

### Running Tests

```bash
# All unit tests
npm test

# Specific test file
npm test -- __tests__/task-renderer.test.js

# With coverage
npm test:coverage

# E2E tests
npm run test:e2e

# E2E with UI (for debugging)
npm run test:e2e:ui
```

## Development Workflow

1. **Pull latest code**: `git pull origin main`
2. **Create feature branch**: `git checkout -b feature-name`
3. **Make changes**: Edit code, add tests
4. **Run tests**: `npm test`
5. **Check coverage**: `npm test:coverage`
6. **Lint code**: `npm run lint:fix`
7. **Manual test**: Desktop + mobile browsers
8. **Commit**: `git commit -m "type(scope): description"`
9. **Push**: `git push origin feature-name`
10. **Create PR**: If merging to main
11. **Delete branch**: After merge

## Notes

### Data Storage

- All data stored in localStorage (no backend required)
- Export/Import functionality for backups
- PWA support for offline use
- No account or internet connection required
- ES6 module support required (modern browsers)

### Performance

- Virtual scrolling for 50+ tasks (activates automatically)
- Passive event listeners for better scroll performance
- Debounced search input (300ms delay)
- Lazy-loaded modals and overlays

### Security

- No external API calls (except optional remote-storage)
- XSS prevention via `escapeHtml()` utility
- No server-side processing (all client-side)
- npm audit runs in CI/CD pipeline

### Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management in modals
- Screen reader friendly task structure
- High contrast mode support (via dark mode)

## Resources

- **README.md**: Comprehensive feature documentation and usage guide
- **docs/Development-Workflow.md**: Detailed development workflow guide
- **docs/BROWSER_TESTING_GUIDE.md**: Manual testing checklist
- **package.json**: Dependencies and scripts
- **jest.config.js**: Jest testing configuration
- **playwright.config.js**: E2E testing configuration
- **vite.config.js**: Vite build configuration
- **.github/workflows/ci.yml**: CI/CD pipeline definition

## Quick Reference

### Keyboard Shortcuts

- `Alt+N` - Global quick capture (works from anywhere)
- `Ctrl+K` - Focus quick add input
- `Ctrl+Z` - Undo
- `Ctrl+Y` / `Ctrl+Shift+Z` - Redo
- `Ctrl+B` - Toggle bulk selection
- `/` - Focus search
- `c` - Create new task
- `n` - Next view
- `i` - Inbox view
- `j` / `k` or `↑` / `↓` - Navigate tasks
- `Enter` - Open selected task / Save form
- `Escape` - Close modal / Cancel

### GTD Statuses

- **inbox** - Unprocessed items
- **next** - Actionable now (Next Actions)
- **waiting** - Blocked externally (Waiting For)
- **someday** - Future ideas (Someday/Maybe)
- **completed** - Done (archived)

### Energy Levels

- **high** - Requires high energy/focus
- **medium** - Moderate energy required
- **low** - Can do when tired

### Default Contexts

- @home, @work, @personal, @computer, @phone, @errand

---

**Remember**: Test thoroughly before committing, delegate to managers, follow
the established patterns, and always test mobile touch interactions!
