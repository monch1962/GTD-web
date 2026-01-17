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

## Design Patterns

This codebase uses several established design patterns to maintain code quality,
testability, and scalability.

### 1. Manager Pattern (Feature Modules)

**Purpose**: Encapsulate feature-specific logic and state management.

All feature modules follow this consistent structure:

```javascript
export class FeatureManager {
    constructor(state, app) {
        this.state = state // Reference to AppState
        this.app = app // Reference to main app (for delegation)
    }

    setupFeature() {
        // Initialize event listeners and DOM elements
        // Called once during app initialization
    }

    featureMethod() {
        // Business logic implementation
        // Access state via: this.state.tasks, this.state.projects
        // Delegate to app via: this.app.showNotification?.(), this.app.renderView?.()
    }
}
```

**Benefits**:

- Clear separation of concerns
- Easy to test (mock state and app dependencies)
- Consistent structure across all features
- Simple to add new features

**Examples**:

- `DarkModeManager` (97% test coverage)
- `CalendarManager` (40 tests)
- `ArchiveManager` (38 tests)
- `ContextMenuManager` (46 tests)

**When to use**: Any new feature that needs UI, state interaction, or business
logic.

### 2. Delegation Pattern

**Purpose**: Main app.js delegates to specialized managers to avoid bloated
controller.

```javascript
// In app.js constructor
this.contextMenu = new ContextMenuManager(this.state, this);
this.calendar = new CalendarManager(this.state, this);
this.archive = new ArchiveManager(this.state, this);

// Delegated methods - thin wrappers that forward to managers
setupContextMenu() {
    this.contextMenu.setupContextMenu();
}

showContextMenu(event, taskId) {
    this.contextMenu.showContextMenu(event, taskId);
}

// Delegation with optional chaining (defensive)
this.app.someManager?.method?.();
```

**Benefits**:

- Main app.js stays lean (delegates to 42 managers)
- Each manager is independently testable
- Easy to add/remove features
- Clear ownership of functionality

### 3. Centralized State Pattern (Singleton)

**Purpose**: Single source of truth for all application state.

**Location**: `js/modules/core/app-state.js`

```javascript
export class AppState {
    constructor() {
        // Core data
        this.tasks = []
        this.projects = []
        this.templates = []

        // View state
        this.currentView = 'inbox'
        this.currentProjectId = null

        // Filters
        this.filters = { context: '', energy: '', time: '' }
        this.selectedContextFilters = new Set()

        // UI state
        this.selectedTaskId = null
        this.bulkSelectionMode = false

        // Undo/redo state
        this.history = []
        this.historyIndex = -1
        this.maxHistorySize = 50
    }

    getState() {
        // Returns plain object for persistence
        return {
            tasks: this.tasks.map((t) => t.toJSON()),
            projects: this.projects.map((p) => p.toJSON())
            // ... other state
        }
    }
}
```

**Benefits**:

- Single source of truth
- Easy to debug (log state in one place)
- Simple to persist
- Predictable state updates

**Usage pattern**:

```javascript
// Read state
const tasks = this.state.tasks.filter((t) => !t.completed)

// Update state (mutable)
task.status = 'next'

// Persist changes
await this.app.saveTasks()
```

### 4. Repository Pattern (Storage Abstraction)

**Purpose**: Abstract data persistence and provide clean API.

**Location**: `js/storage.js` and `js/modules/core/storage-ops.js`

```javascript
export class Storage {
    constructor(userId = null) {
        this.userId = userId || this.getUserId()
        this.listeners = new Map()
    }

    // CRUD operations
    async loadTasks() {
        const data = localStorage.getItem('gtd_tasks')
        return data ? JSON.parse(data) : []
    }

    async saveTasks(tasks) {
        localStorage.setItem('gtd_tasks', JSON.stringify(tasks))
        this.notifyListeners('tasks')
    }

    // Event notification for reactive updates
    addListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, [])
        }
        this.listeners.get(event).push(callback)
    }
}
```

**Benefits**:

- Swappable storage backend (localStorage → IndexedDB → remote)
- Centralized error handling
- Event listeners for reactive updates
- Quota management

### 5. Command Pattern (Undo/Redo)

**Purpose**: Encapsulate actions as reversible commands.

**Location**: `js/modules/features/undo-redo.js`

```javascript
// Saving state before changes
this.app.saveState('Create task');

// In UndoRedoManager
saveState(action) {
    // Remove any future history if we're not at the end
    if (this.state.historyIndex < this.state.history.length - 1) {
        this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
    }

    // Add current state to history
    this.state.history.push({
        action,
        tasks: JSON.stringify(this.state.tasks),
        projects: JSON.stringify(this.state.projects),
        timestamp: Date.now()
    });

    // Limit history size
    if (this.state.history.length > this.state.maxHistorySize) {
        this.state.history.shift();
    } else {
        this.state.historyIndex++;
    }

    this.updateButtonStates();
}

// Undo restores previous state
async undo() {
    if (this.state.historyIndex > 0) {
        this.state.historyIndex--;
        await this._restoreState(this.state.history[this.state.historyIndex]);
    }
}
```

**Benefits**:

- Full undo/redo history (up to 50 states)
- Actions are reversible
- Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
- Button state management

### 6. Factory Pattern (Model Creation)

**Purpose**: Create model instances with consistent serialization.

**Location**: `js/models.js`

```javascript
export class Task {
    constructor(data = {}) {
        this.id = data.id || this.generateId()
        this.title = data.title || ''
        this.status = data.status || 'inbox'
        // ... other properties
    }

    // Serialization
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            status: this.status
            // ... all properties
        }
    }

    // Deserialization (Factory method)
    static fromJSON(json) {
        const task = new Task(json)
        // Restore Date objects
        if (json.dueDate) task.dueDate = new Date(json.dueDate)
        if (json.deferDate) task.deferDate = new Date(json.deferDate)
        return task
    }

    // Business logic methods
    isOverdue() {
        if (!this.dueDate) return false
        return new Date(this.dueDate) < new Date().setHours(0, 0, 0, 0)
    }

    areDependenciesMet(tasks) {
        if (!this.waitingForTaskIds || this.waitingForTaskIds.length === 0) {
            return true
        }
        return this.getPendingDependencies(tasks).length === 0
    }
}
```

**Benefits**:

- Consistent object creation
- Built-in serialization/deserialization
- Business logic encapsulated with data
- Easy to extend with new properties

### 7. Observer Pattern (Event Listeners)

**Purpose**: React to state changes and user interactions.

```javascript
// Setting up listeners
setupFeature() {
    // DOM event listeners
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            this.undo();
        }
    });

    // Custom event listeners
    this.state.storage.addListener('tasks', () => {
        this.renderView();
    });
}

// Clean up
destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.state.storage.removeListener('tasks', this.renderListener);
}
```

**Benefits**:

- Reactive UI updates
- Decoupled components
- Easy to add/remove listeners

### 8. Strategy Pattern (Sorting Strategies)

**Purpose**: Encapsulate sorting algorithms.

**Location**: `js/modules/views/task-renderer.js` (\_sortTasks method)

```javascript
_sortTasks(tasks) {
    const sortOption = this.state.advancedSearchFilters.sort || 'updated';

    return tasks.sort((a, b) => {
        // First sort by starred status (universal rule)
        if (a.starred !== b.starred) {
            return a.starred ? -1 : 1;
        }

        // Then sort by position if set
        if (a.position !== b.position) {
            return a.position - b.position;
        }

        // Then apply selected sort strategy
        switch (sortOption) {
            case 'due':
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'created':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'time':
                return b.time - a.time;
            case 'title':
                return a.title.localeCompare(b.title);
            case 'updated':
            default:
                return new Date(b.updatedAt) - new Date(a.updatedAt);
        }
    });
}
```

**Benefits**:

- Easy to add new sort options
- Consistent sorting logic
- Composable strategies (starred + position + custom)

### 9. Virtual Scrolling Pattern

**Purpose**: Efficiently render large lists (performance optimization).

**Location**: `js/modules/ui/virtual-scroll.js`

```javascript
export class VirtualScrollManager {
    constructor(container, options = {}) {
        this.container = container
        this.itemHeight = options.itemHeight || 100
        this.bufferItems = options.bufferItems || 5
        this.items = []
    }

    setItems(items, renderItem) {
        this.items = items
        this.renderItem = renderItem
        this.render()
    }

    render() {
        const { visibleStart, visibleEnd } = this._getVisibleRange()

        // Render only visible items + buffer
        const fragment = document.createDocumentFragment()
        for (let i = visibleStart; i <= visibleEnd; i++) {
            const element = this.renderItem(this.items[i], i)
            fragment.appendChild(element)
        }

        this.container.innerHTML = ''
        this.container.appendChild(fragment)

        // Set container height to enable scrolling
        this.container.style.height = `${this.items.length * this.itemHeight}px`
    }

    _getVisibleRange() {
        const scrollTop = this.container.scrollTop
        const containerHeight = this.container.clientHeight

        const startIndex = Math.floor(scrollTop / this.itemHeight)
        const endIndex = Math.ceil(
            (scrollTop + containerHeight) / this.itemHeight
        )

        return {
            visibleStart: Math.max(0, startIndex - this.bufferItems),
            visibleEnd: Math.min(
                this.items.length - 1,
                endIndex + this.bufferItems
            )
        }
    }
}
```

**Benefits**:

- Renders 50+ items efficiently
- Smooth scrolling performance
- Automatic activation (threshold: 50 items)
- Memory efficient

### 10. Optional Chaining Pattern (Defensive Programming)

**Purpose**: Safe method calls on potentially undefined objects.

```javascript
// Defensive calls - no errors if app or method doesn't exist
this.app.showNotification?.('Task created', 'success')
this.app.renderView?.()
this.app.saveTasks?.()

// More defensive chaining
this.app.someManager?.method?.()

// Safe property access
const projectId = this.app.state?.currentProjectId || null
```

**Benefits**:

- No runtime errors from undefined methods
- Easy to add optional features
- Clean code (no if statements everywhere)
- Flexible architecture

**When to use**: Calling methods on app or managers that may not exist in all
contexts.

### 11. Composition Pattern (Task Composition)

**Purpose**: Build complex tasks from smaller components.

```javascript
// Task can contain subtasks
class Task {
    constructor(data = {}) {
        this.subtasks = data.subtasks || [];
        this.waitingForTaskIds = data.waitingForTaskIds || [];
    }

    addSubtask(title) {
        this.subtasks.push({
            id: this.generateId(),
            title,
            completed: false
        });
    }

    getProgress() {
        if (this.subtasks.length === 0) return 1.0;
        const completed = this.subtasks.filter(s => s.completed).length;
        return completed / this.subtasks.length;
    }
}

// Task can depend on other tasks
areDependenciesMet(tasks) {
    if (!this.waitingForTaskIds || this.waitingForTaskIds.length === 0) {
        return true;
    }
    return this.getPendingDependencies(tasks).length === 0;
}
```

**Benefits**:

- Hierarchical task structure
- Reusable components
- Natural domain modeling

### 12. Lazy Loading Pattern

**Purpose**: Load resources only when needed.

```javascript
// Modals are created only when opened
showTaskModal(task = null) {
    // Lazy-load modal DOM
    if (!document.getElementById('task-modal')) {
        this._createTaskModal();
    }

    // Show modal
    document.getElementById('task-modal').classList.add('active');
}

// Virtual scrolling activates only for large lists
if (filteredTasks.length >= 50) {
    this._renderWithVirtualScroll(container, filteredTasks);
} else {
    this._renderRegular(container, filteredTasks);
}
```

**Benefits**:

- Faster initial page load
- Lower memory usage
- Better performance

### 13. Module Pattern (ES6 Modules)

**Purpose**: Encapsulation and dependency management.

```javascript
// state.js - Encapsulated state
export class AppState {
    constructor() {
        this.tasks = []
    }
}

// task-operations.js - Imports only what it needs
import { AppState } from '../core/app-state.js'

export class TaskOperations {
    constructor(state, app) {
        this.state = state // Injected dependency
        this.app = app
    }
}

// app.js - Composition root
import { AppState } from './modules/core/app-state.js'
import { TaskOperations } from './modules/features/task-operations.js'

export class App {
    constructor() {
        this.state = new AppState()
        this.taskOps = new TaskOperations(this.state, this)
    }
}
```

**Benefits**:

- Clear dependencies
- No global namespace pollution
- Tree-shaking support
- Explicit imports/exports

### 14. Template Method Pattern

**Purpose**: Define skeleton of algorithm, let subclasses override steps.

```javascript
// Base rendering pattern
class Renderer {
    render(items) {
        this.beforeRender(items)
        const elements = items.map((item) => this.renderItem(item))
        this.afterRender(elements)
        return elements
    }

    renderItem(item) {
        throw new Error('Subclass must implement renderItem')
    }

    beforeRender(items) {
        /* Hook */
    }
    afterRender(elements) {
        /* Hook */
    }
}

class TaskRenderer extends Renderer {
    renderItem(task) {
        // Task-specific rendering
        return createTaskElement(task)
    }

    afterRender(elements) {
        // Attach task-specific listeners
        elements.forEach((el) => this.attachTaskListeners(el))
    }
}
```

**Benefits**:

- Consistent rendering flow
- Hooks for customization
- Code reuse

### Anti-Patterns to Avoid

❌ **Don't modify state without persisting**:

```javascript
// WRONG
task.status = 'next'

// RIGHT
task.status = 'next'
await this.app.saveTasks()
```

❌ **Don't access DOM directly from state**:

```javascript
// WRONG
this.state.tasks.push(task)
document.getElementById('task-list').appendChild(taskElement)

// RIGHT
this.state.tasks.push(task)
await this.app.saveTasks()
this.app.renderView()
```

❌ **Don't create circular dependencies**:

```javascript
// WRONG - manager.js imports app, app imports manager
import { App } from './app.js'

// RIGHT - Both receive state and app as constructor params
export class Manager {
    constructor(state, app) {
        this.state = state
        this.app = app
    }
}
```

## Pattern Selection Guide

| Need                 | Pattern             | Example                          |
| -------------------- | ------------------- | -------------------------------- |
| New feature          | Manager Pattern     | `new FeatureManager(state, app)` |
| Undo capability      | Command Pattern     | `this.app.saveState('action')`   |
| Data persistence     | Repository Pattern  | `this.app.saveTasks()`           |
| Large list rendering | Virtual Scrolling   | Activates at 50+ items           |
| Multiple behaviors   | Strategy Pattern    | Sorting, filtering               |
| Safe method calls    | Optional Chaining   | `this.app.method?.()`            |
| Component assembly   | Composition Pattern | Task with subtasks               |
| State management     | Centralized State   | `this.state.tasks`               |
| Decoupling           | Delegation Pattern  | `this.manager.handle()`          |
| Object creation      | Factory Pattern     | `Task.fromJSON(json)`            |

---

**Key Takeaway**: These patterns work together to create a maintainable,
testable, and scalable codebase. Follow the established patterns when adding new
features.

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
