# CLAUDE.md - GTD Web Application Guide

This file provides essential information for Claude Code instances working on the GTD-web codebase.

## Essential Commands

### Development
```bash
npm start                    # Start dev server on http://localhost:8080
```

### Testing
```bash
npm test                     # Run all Jest unit tests
npm test:coverage            # Run tests with coverage report
npm test:watch               # Run tests in watch mode
npm test -- __tests__/filename.test.js  # Run single test file

# E2E Testing (Playwright)
npm run test:e2e             # Run all E2E tests
npm run test:e2e:ui          # Run E2E tests with UI
npm run test:e2e:headed      # Run E2E tests in headed mode
npm run test:e2e:debug       # Run E2E tests in debug mode
npm run test:e2e:install     # Install Playwright browsers
```

## High-Level Architecture

### Application Type
**Modular Monolithic Architecture** - Single-page application with ES6 modules organized by feature.

### Entry Point
```
index.html → js/app.js → initializes all manager modules
```

### Module Structure
```
js/
├── app.js                    # Main application controller (delegates to managers)
├── models.js                 # Data models (Task, Project, Reference)
├── storage.js                # LocalStorage wrapper with persistence
├── constants.js              # Configuration constants
├── dom-utils.js              # DOM manipulation utilities
├── nlp-parser.js             # Natural language parser for quick capture
└── modules/
    ├── core/                 # Core application logic
    │   └── app-state.js      # Centralized state management
    ├── ui/                   # UI-specific managers
    │   ├── dark-mode.js      # Dark mode functionality
    │   ├── context-menu.js   # Right-click context menu
    │   └── ...
    ├── features/             # Feature-specific managers
    │   ├── calendar.js       # Calendar view
    │   ├── archive.js        # Archive system
    │   ├── focus-mode.js     # Focus mode with Pomodoro
    │   └── ...
    └── views/                # View rendering logic
        └── task-renderer.js  # Task list rendering
```

### State Management
- **Centralized State**: `AppState` class in `js/modules/core/app-state.js`
- **Storage**: `StorageManager` in `js/storage.js` wraps localStorage
- **Flow**: UI → Manager Method → State Update → Storage → Render

### Key Design Patterns

#### 1. Manager Pattern (Feature Modules)
All feature modules follow this consistent structure:

```javascript
export class FeatureManager {
    constructor(state, app) {
        this.state = state;           // Reference to AppState
        this.app = app;               // Reference to main app (for delegation)
    }

    setupFeature() {
        // Initialize event listeners and DOM elements
    }

    featureMethod() {
        // Business logic implementation
        // Access state via: this.state.tasks, this.state.projects
        // Delegate to app via: this.app.showToast?.(), this.app.renderView?.()
    }
}
```

**Examples:**
- `DarkModeManager` (19 tests)
- `CalendarManager` (40 tests)
- `ArchiveManager` (38 tests)
- `ContextMenuManager` (46 tests)

#### 2. Delegation Pattern
Main app.js delegates to specialized managers:

```javascript
// In app.js constructor
this.contextMenu = new ContextMenuManager(this, this);
this.calendar = new CalendarManager(this, this);
this.archive = new ArchiveManager(this, this);

// Delegated methods
setupContextMenu() {
    this.contextMenu.setupContextMenu();
}

showContextMenu(event, taskId) {
    this.contextMenu.showContextMenu(event, taskId);
}
```

#### 3. Test-Driven Modularization
When extracting features to modules:
1. Write comprehensive tests **before** extraction
2. Run tests to establish baseline (all passing)
3. Extract to module following Manager pattern
4. Update app.js to import and delegate
5. Run tests again to verify no functionality broke
6. Manual browser testing (desktop + mobile)

## Important Conventions

### Code Style
- **ES6 Modules**: Use `import/export` for all modules
- **Async/Await**: Use async/await for async operations (not Promises)
- **Optional Chaining**: Use `?.()` for defensive calls (e.g., `this.app.showToast?.()`)
- **Consistent Naming**: Manager classes end with `Manager`

### Method Naming
- **Notifications**: Use `showToast()` (NOT `showNotification`)
- **Persistence**: Use `saveTasks()` to persist to localStorage
- **Rendering**: Use `renderView()` to re-render current view
- **State Updates**: Use `saveState(action)` to track undo/redo history

### Touch/Mobile Support
- **Touch Targets**: Minimum 44px for buttons
- **Long-Press**: 500ms delay for context menu on mobile
- **Passive Listeners**: Use `{ passive: true }` for touch events to improve scroll performance
- **Synthetic Events**: Store touch coordinates at touchstart, create synthetic event for setTimeout callbacks

Example mobile long-press pattern:
```javascript
let touchStartPos = null;

document.addEventListener('touchstart', (e) => {
    if (taskItem && e.touches.length > 0) {
        touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };

        this.longPressTimer = setTimeout(() => {
            // Verify still on same task
            const currentTaskItem = document.elementFromPoint(touchStartPos.x, touchStartPos.y)
                ?.closest('.task-item');

            if (currentTaskItem && currentTaskItem.dataset.taskId === taskItem.dataset.taskId) {
                const syntheticEvent = {
                    clientX: touchStartPos.x,
                    clientY: touchStartPos.y,
                    preventDefault: () => {}
                };
                this.showContextMenu(syntheticEvent, taskId);
            }
            touchStartPos = null;
        }, 500);
    }
}, { passive: true });

document.addEventListener('touchend', () => {
    clearTimeout(this.longPressTimer);
    touchStartPos = null;
});

document.addEventListener('touchmove', (e) => {
    // Cancel if moved more than 10px
    if (touchStartPos && e.touches.length > 0) {
        const moveX = Math.abs(e.touches[0].clientX - touchStartPos.x);
        const moveY = Math.abs(e.touches[0].clientY - touchStartPos.y);
        if (moveX > 10 || moveY > 10) {
            clearTimeout(this.longPressTimer);
            touchStartPos = null;
        }
    }
}, { passive: true });
```

### Testing Conventions
- **Unit Tests**: Located in `__tests__/` directory
- **Test Environment**: Jest with jsdom
- **Coverage**: Run `npm test:coverage` before committing
- **Manual Testing**: Always test on desktop and mobile browsers after changes

### DOM Manipulation
- **Use escapeHtml()**: Always escape user-generated content with `escapeHtml()` from `dom-utils.js`
- **Safe DOM Creation**: Prefer `document.createElement()` over `innerHTML` for user content
- **Event Delegation**: Use event delegation for dynamic content

### State Management
- **Read State**: Access via `this.state.tasks`, `this.state.projects`, etc.
- **Update State**: Modify state objects directly
- **Persist State**: Call `await this.app.saveTasks()` after modifications
- **Undo/Redo**: Call `this.app.saveState('Action description')` before changes

## GTD Methodology Context

This app implements David Allen's **Getting Things Done** methodology:

### Core Workflow
1. **Capture** - Collect all tasks, ideas, commitments in Inbox
2. **Clarify** - Process inbox items: actionable? delete? delegate? defer?
3. **Organize** - Put tasks in right buckets (Next Actions, Waiting, Someday, Projects)
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
- Task management with GTD statuses
- Project management with health indicators
- Context system (default + custom contexts)
- Task dependencies (drag-and-drop or manual)
- Recurring tasks (daily, weekly, monthly, yearly)
- Natural language parsing for quick entry
- Time tracking with analytics

### Advanced Features
- **Dark Mode**: Toggle with system preference detection
- **Calendar View**: Visual calendar showing tasks by due date
- **Focus Mode**: Full-screen single-task focus with Pomodoro timer
- **Archive System**: Archive completed tasks to reduce clutter
- **Quick Actions Context Menu**: Right-click (desktop) / Long-press (mobile) for fast operations
- **Productivity Heatmap**: GitHub-style contribution calendar (365 days)
- **Global Quick Capture**: Alt+N hotkey for instant task capture
- **Task Priority Scoring**: Automatic 0-100 scores based on multiple factors
- **Smart Date Suggestions**: Natural language date parsing (in 3 days, tomorrow, next week)
- **Task Templates**: Reusable task templates for repetitive workflows
- **Daily Review Mode**: Quick daily workflow with urgent tasks overview
- **Undo/Redo System**: Full history tracking with Ctrl+Z/Ctrl+Y

## Recent Modularization History

The application has been systematically refactored to use the Manager pattern:

1. **Dark Mode** (19 tests) ✓
2. **Calendar View** (40 tests) ✓
3. **Archive System** (38 tests) ✓
4. **Context Menu** (46 tests) ✓ - Just completed with mobile touch support fixes

All modules follow the same pattern and conventions. Use these as examples when adding new features.

## Common Tasks

### Adding a New Feature
1. Write tests in `__tests__/feature-name.test.js`
2. Run tests to establish baseline
3. Create manager in `js/modules/[type]/feature-name.js`
4. Follow the Manager pattern (constructor, setup, methods)
5. Import and delegate in app.js
6. Run tests again to verify
7. Manual browser testing (desktop + mobile)

### Fixing a Bug
1. Write a failing test that reproduces the bug
2. Fix the bug
3. Verify test passes
4. Check for related code that might have same issue
5. Manual browser testing

### Updating UI
1. Modify CSS in `css/styles.css`
2. Update DOM manipulation in relevant manager
3. Test on multiple screen sizes (mobile, tablet, desktop)
4. Verify touch interactions on mobile

## Development Workflow

1. **Make Changes**
2. **Run Tests**: `npm test`
3. **Check Coverage**: `npm test:coverage` (aim for high coverage)
4. **Manual Testing**:
   - Desktop browser (Chrome/Firefox)
   - Mobile browser (iOS Safari, Android Chrome)
   - Test touch interactions, long-press, responsive design
5. **Commit**: Clear commit messages describing what and why

## Browser Testing Priorities

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Android Chrome
- **Key Interactions to Test**:
  - Context menu (right-click desktop, long-press mobile)
  - Touch targets (44px minimum)
  - Responsive layout (mobile, tablet, desktop)
  - Form inputs (no accidental zoom on focus)
  - Scroll performance (passive event listeners)

## Notes

- All data stored in localStorage (no backend)
- PWA support for offline use
- Export/Import for data backup
- No account or internet connection required
- ES6 module support required (modern browsers)

## Resources

- **README.md**: Comprehensive feature documentation and usage guide
- **package.json**: Dependencies and scripts
- **jest.config.js**: Jest testing configuration
- **playwright.config.js**: E2E testing configuration

---

**Remember**: Test thoroughly before committing, delegate to managers, follow the established patterns, and always test mobile touch interactions!
