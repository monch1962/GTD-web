# AGENTS.md - GTD Web Application Guide for AI Agents

Essential information for AI agents working on the GTD-web codebase.

## Quick Start Commands

### Development

```bash
npm run dev                  # Start Vite dev server (localhost:8080)
npm run build                # Build production bundle (single-file)
npm run preview              # Preview production build
```

### Testing

```bash
npm test                     # Run all Jest tests (51 test files)
npm test:coverage            # Tests with coverage (>70% target)
npm test:watch               # Watch mode for TDD
npm test -- __tests__/filename.test.js  # Single test file
npm run test:e2e             # Playwright E2E tests
```

### Code Quality

```bash
npm run lint                 # Check linting issues
npm run lint:fix             # Auto-fix linting
npm run lint:check           # Strict linting (fails on warnings)
```

### Pre-commit Hooks

- Husky runs ESLint on staged files
- Prettier auto-formats files
- Commits blocked if linting fails

## Essential Guidelines

### Code Style

- **TypeScript**: All new code must be TypeScript, avoid `any` types
- **Imports**: ES6 modules, specific imports, grouped: external → internal →
  relative
- **Formatting**: No semicolons, single quotes, 4-space indentation, 100 char
  line length
- **Naming**: PascalCase classes, camelCase vars/funcs, UPPER_SNAKE_CASE
  constants
- **Manager Pattern**: All features use `FeatureManager(state, app)` pattern
- **State Management**: Centralized mutable state, always call
  `await this.app.saveTasks()` after changes
- **Error Handling**: Use `try/catch`, show notifications:
  `this.app.showNotification?.('Error', 'error')`
- **DOM Safety**: Always escape user content with `escapeHtml()` from
  `dom-utils.ts`
- **Type Safety**: Use proper TypeScript types, prefer `unknown` over `any` with
  type guards

### TDD Workflow (Required)

1. **RED**: Write failing tests in `__tests__/feature.test.ts`
2. **GREEN**: Minimal implementation in `js/modules/[type]/feature.ts`
3. **REFACTOR**: Clean up while tests pass
4. **INTEGRATE**: Import in `app.ts`, add to setup
5. **DOCUMENT**: Update docs after feature complete

### Before Committing

1. Run all tests: `npm test`
2. Check coverage: `npm test:coverage` (>70% required)
3. Fix linting: `npm run lint:fix`
4. Manual test on desktop + mobile

## TypeScript Migration Plan

### 10-Week Progressive Migration - ✅ COMPLETED

1. **✅ Week 1-2**: Setup + Core Models (`models.ts`, `constants.ts`)
2. **✅ Week 3**: Utilities (`storage.ts`, `dom-utils.ts`, `validation.ts`)
3. **✅ Week 4-8**: Feature Modules (simple → complex managers) - All 41 modules
   migrated
4. **✅ Week 9**: Test Migration (`*.test.js` → `*.test.ts`) - 8/58 tests
   migrated, ongoing
5. **✅ Week 10**: Final Integration + Documentation - Main app.ts migrated,
   build working

### Current Status (February 2025)

- **✅ All core application code is TypeScript** (44 `.ts` files)
- **✅ Main application controller** (`app.ts`) fully typed
- **✅ All feature modules** (41 modules) migrated to TypeScript
- **✅ Build system works** with TypeScript compilation
- **✅ Tests passing** with TypeScript and JavaScript tests
- **🔄 Test migration in progress** (8/58 test files migrated)
- **🔄 Linting improvements ongoing** (reducing `any` type usage)

### Migration Statistics

- **TypeScript Files**: 44 (100% of application code)
- **JavaScript Test Files**: 50 (migration in progress)
- **TypeScript Test Files**: 8 (migrated)
- **Build Status**: ✅ Working
- **Test Status**: ✅ Passing

### Key Conventions

- **Strict Mode**: Enable all strict options
- **No `any`**: Use `unknown` with type guards
- **Interfaces**: Prefer over type aliases
- **Migration Safety**: Dual compilation, incremental testing, backward
  compatibility

### Installation

```bash
npm install --save-dev typescript @types/jest @types/node
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

## File Organization

```
js/
├── app.ts              # Main application controller (TypeScript)
├── models.ts           # Data models (Task, Project, Reference)
├── storage.ts          # LocalStorage wrapper
├── constants.ts        # Configuration constants
├── dom-utils.ts        # DOM manipulation utilities
└── modules/
    ├── core/           # Core application logic
    ├── features/       # Feature-specific managers (41 modules, all TypeScript)
    ├── ui/             # UI-specific managers (8 modules, all TypeScript)
    ├── views/          # View rendering logic (3 modules, all TypeScript)
    └── utils/          # Utility modules (2 modules, all TypeScript)
```

## Common Patterns

### State Access

```javascript
const tasks = this.state.tasks.filter((t) => !t.completed)
task.status = 'next'
await this.app.saveTasks()
this.app.renderView?.()
```

### Notifications & Undo

```javascript
this.app.showNotification?.('Task created', 'success')
this.app.saveState?.('Create task') // Before making changes
```

### Manager Structure

```javascript
export class FeatureManager {
    constructor(state, app) {
        this.state = state // Reference to AppState
        this.app = app // Reference to main app
    }

    setupFeature() {
        // Initialize once during app setup
    }

    featureMethod() {
        // Business logic
        // Access: this.state.tasks, this.state.projects
        // Delegate: this.app.method?.()
    }
}
```

## Important Notes

- **TypeScript**: All application code migrated to TypeScript
- **Client-Side Only**: LocalStorage, no backend
- **Single-File Bundle**: Vite builds to single HTML with inlined assets
- **PWA Support**: Service worker for offline functionality
- **Virtual Scrolling**: Auto-activates for 50+ items
- **Mobile First**: 44px touch targets, responsive design

## References

- **User Stories**: `USER_STORIES.md` - 12 core workflows for UI testing
- **TypeScript Details**: See TypeScript Migration Plan section above
- **TDD Examples**: See existing `__tests__/` files for patterns

## Deployment

1. Build: `npm run build` (creates `dist/index.html`)
2. Test: `npm run preview` (verify locally)
3. Version: Update `package.json` (semantic versioning)
4. Release: GitHub release with build artifacts
5. Deploy: Single-file bundle to static hosting
