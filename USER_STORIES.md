# USER_STORIES.md - GTD Web Application User Stories for UI Testing

This document provides comprehensive user stories for the GTD-web application,
organized for UI test planning and development.

## Core GTD Workflow Stories

### 1. Task Capture & Processing

**As a user, I want to:**

- Quickly capture tasks from any view using Alt+N shortcut
- Process my inbox by assigning tasks to projects or contexts
- Use natural language parsing for quick task entry
- See tasks automatically move from Inbox to Next Actions when assigned

**Acceptance Criteria:**

- Alt+N opens global quick capture overlay from any view
- Natural language parsing extracts contexts, energy levels, and due dates
- Tasks with assigned projects move from Inbox to Next Actions view
- Quick capture widget is accessible from all views

### 2. Task Management

**As a user, I want to:**

- Create, edit, and delete tasks with all properties (title, description, due
  date, etc.)
- Mark tasks as complete/incomplete with visual feedback
- Star important tasks to keep them at the top
- Add subtasks and checklists to break down complex tasks
- Add detailed notes to tasks for context

**Acceptance Criteria:**

- Task modal supports all task properties
- Completion toggles show visual feedback (strikethrough, checkmarks)
- Starred tasks appear at top of lists
- Subtasks support completion tracking
- Notes are preserved and displayed

### 3. Project Management

**As a user, I want to:**

- Create projects with titles, descriptions, and contexts
- Convert tasks to projects when they become multi-step
- See project health indicators and completion percentages
- Archive or delete completed/empty projects
- View Gantt charts for project dependencies

**Acceptance Criteria:**

- Project modal supports project creation and editing
- Task-to-project conversion preserves all data
- Health indicators update based on task completion
- Archived projects are hidden from active views
- Gantt charts visualize task dependencies and timelines

### 4. Context & Filter Management

**As a user, I want to:**

- Filter tasks by context (@work, @home, @computer, etc.)
- Create custom contexts that auto-format with @ prefix
- Use saved filter presets for frequent searches
- Clear all filters with one click
- See task counts per context in the sidebar

**Acceptance Criteria:**

- Context filter dropdown shows all available contexts
- Custom contexts are saved and auto-formatted
- Filter presets can be saved and loaded
- Clear filters button resets all active filters
- Sidebar shows accurate task counts per context

## Advanced Feature Stories

### 5. Dependencies & Waiting For

**As a user, I want to:**

- Set task dependencies via drag-and-drop
- See visual indicators for blocked tasks
- Mark tasks as "Waiting For" with descriptions
- View dependency chains and critical paths
- Have circular dependencies automatically prevented

**Acceptance Criteria:**

- Drag-and-drop creates dependencies between tasks
- Blocked tasks show visual indicators (lock icons, grayed out)
- Waiting For tasks include description of what's being waited on
- Dependency visualization shows chains and critical paths
- Circular dependency detection prevents invalid dependencies

### 6. Recurrence & Scheduling

**As a user, I want to:**

- Set advanced recurrence patterns (specific weekdays, nth weekday monthly)
- See recurrence labels that explain the pattern
- Set recurrence end dates
- Have recurring tasks automatically regenerate

**Acceptance Criteria:**

- Recurrence modal supports all pattern types
- Labels clearly explain recurrence patterns (e.g., "Every Monday, Wednesday,
  Friday")
- End dates stop recurrence generation
- Completed recurring tasks regenerate based on pattern

### 7. Time Management

**As a user, I want to:**

- Start/stop timers on tasks to track time spent
- Enter time estimates for tasks
- See time analytics by context and project
- Use Focus Mode with integrated Pomodoro timer
- Get smart time-based task suggestions

**Acceptance Criteria:**

- Timer buttons start/stop and track elapsed time
- Time estimates are displayed and used in suggestions
- Analytics dashboard shows time spent by category
- Focus Mode provides distraction-free environment with Pomodoro timer
- Smart suggestions consider available time and task estimates

### 8. Analytics & Insights

**As a user, I want to:**

- View productivity heatmap showing 365 days of activity
- See task completion velocity and trends
- Get smart suggestions based on my patterns
- View dashboard with completion statistics
- See priority scores for tasks (0-100)

**Acceptance Criteria:**

- Heatmap renders 365 days with activity levels
- Velocity charts show completion trends over time
- Smart suggestions consider patterns and priorities
- Dashboard shows comprehensive statistics
- Priority scores are calculated and displayed

## User Experience Stories

### 9. Navigation & Views

**As a user, I want to:**

- Switch between views (Inbox, Next, Waiting, Someday, Projects, Calendar)
- Use keyboard shortcuts for common actions
- Have a responsive interface that works on mobile
- Use dark mode for reduced eye strain
- See personalized greeting messages with task statistics

**Acceptance Criteria:**

- View switching updates content and highlights active view
- Keyboard shortcuts work consistently (Ctrl+Z, Alt+N, etc.)
- Interface adapts to mobile screen sizes
- Dark mode toggles and respects system preferences
- Greeting messages show relevant task statistics

### 10. Bulk Operations

**As a user, I want to:**

- Select multiple tasks for bulk actions
- Change status, energy, or context for multiple tasks at once
- Set due dates on multiple tasks simultaneously
- Use right-click context menu for quick actions

**Acceptance Criteria:**

- Multiple task selection with checkboxes or shift-click
- Bulk edit modal supports all task properties
- Due date picker works for multiple tasks
- Context menu provides relevant quick actions

### 11. Data Management

**As a user, I want to:**

- Export my data as JSON for backup
- Import data from previous exports
- Have all data stored locally in my browser
- Install as a Progressive Web App for offline use

**Acceptance Criteria:**

- Export creates complete JSON backup
- Import restores all data structures
- LocalStorage persists data across sessions
- PWA installation works and supports offline use

### 12. Mobile Experience

**As a user, I want to:**

- Use touch-friendly controls with 44px touch targets
- Have full-screen modals on mobile
- Use long-press for context menus
- Have responsive layouts that adapt to screen size

**Acceptance Criteria:**

- All interactive elements meet 44px minimum touch target
- Modals use full screen on mobile devices
- Long-press triggers context menus on touch devices
- Layouts adapt to different screen sizes and orientations

## UI Test Categories

### A. Core Functionality Tests

1. **Task CRUD Operations**: Create, read, update, delete tasks
2. **Project Lifecycle**: Create, archive, restore, delete projects
3. **View Navigation**: Switch between all views
4. **Filtering**: Context, status, energy, and date filters

### B. Advanced Feature Tests

1. **Dependency Management**: Drag-and-drop, visualization, circular detection
2. **Recurrence Patterns**: All recurrence types and edge cases
3. **Time Tracking**: Timer start/stop, time accumulation
4. **Analytics**: Heatmap rendering, statistics calculation

### C. User Experience Tests

1. **Keyboard Navigation**: All keyboard shortcuts
2. **Mobile Responsiveness**: Touch targets, layout adaptation
3. **Accessibility**: Screen reader support, keyboard focus
4. **Performance**: Virtual scrolling, large dataset handling

### D. Data Integrity Tests

1. **Import/Export**: Data preservation through export/import cycle
2. **LocalStorage**: Data persistence across sessions
3. **Undo/Redo**: History tracking and restoration
4. **Error Recovery**: Graceful handling of corrupted data

## Test Implementation Strategy

### 1. Playwright E2E Tests

- **Purpose**: End-to-end user workflow testing
- **Scope**: Complete user journeys across multiple features
- **Examples**:
    - New user onboarding journey
    - Daily review workflow
    - Project creation and management
    - Data export/import cycle

### 2. Jest Unit Tests

- **Purpose**: Individual component and function testing
- **Scope**: Isolated unit tests for managers and utilities
- **Examples**:
    - Task model methods
    - Navigation manager logic
    - Validation functions
    - Date calculation utilities

### 3. Visual Regression Tests

- **Purpose**: UI consistency and visual correctness
- **Scope**: Screenshot comparison across views and states
- **Examples**:
    - View rendering consistency
    - Modal appearance
    - Dark/light mode transitions
    - Mobile layout adaptations

### 4. Performance Tests

- **Purpose**: Large dataset handling and responsiveness
- **Scope**: Performance with 1000+ tasks/projects
- **Examples**:
    - Virtual scrolling activation
    - Filter performance with large datasets
    - Search responsiveness
    - Memory usage monitoring

### 5. Cross-browser Tests

- **Purpose**: Compatibility across browsers
- **Scope**: Chrome, Firefox, Safari, Edge
- **Examples**:
    - Feature parity across browsers
    - CSS rendering consistency
    - JavaScript compatibility
    - PWA installation support

## Test Coverage Guidelines

### Happy Path Tests

- **Goal**: Verify normal usage scenarios work correctly
- **Examples**:
    - Creating a task with all properties
    - Completing a task and seeing it move to completed
    - Filtering tasks by context
    - Exporting and importing data

### Edge Case Tests

- **Goal**: Verify boundary conditions and error scenarios
- **Examples**:
    - Creating task with empty title
    - Setting due date in the past
    - Creating circular dependencies
    - Importing malformed JSON data

### Accessibility Tests

- **Goal**: Verify keyboard navigation and screen reader support
- **Examples**:
    - Tab navigation through all interactive elements
    - Screen reader announcements for state changes
    - ARIA labels on all interactive elements
    - Color contrast compliance

### Mobile Tests

- **Goal**: Verify touch interactions and responsive layouts
- **Examples**:
    - Touch target sizing (44px minimum)
    - Gesture support (swipe, long-press)
    - Viewport adaptation
    - Touch keyboard interactions

## Test Data Management

### Test Fixtures

- **Purpose**: Consistent test data for reproducible tests
- **Examples**:
    - Standard task sets (empty, small, large)
    - Project hierarchies
    - Dependency chains
    - Recurrence patterns

### Test Isolation

- **Purpose**: Prevent test interference
- **Methods**:
    - Clean LocalStorage before each test
    - Reset application state
    - Use unique identifiers
    - Mock external dependencies

### Test Reporting

- **Purpose**: Clear test results and debugging
- **Outputs**:
    - HTML test reports
    - Screenshots on failure
    - Video recordings of test runs
    - Console logs for debugging

## Integration with Development Workflow

### TDD Integration

- Write UI tests before implementing features
- Use tests to define acceptance criteria
- Refactor tests when requirements change
- Maintain test coverage >70%

### CI/CD Pipeline

- Run tests on every commit
- Block merges on test failures
- Generate test coverage reports
- Deploy only after all tests pass

### Test Maintenance

- Review and update tests with feature changes
- Remove obsolete tests
- Add tests for bug fixes
- Regular test performance optimization
