# Development Workflow Guide

**Note**: The codebase has been fully migrated to TypeScript (February 2025).
All development now uses TypeScript with strict type checking.

This document explains the development workflow for the GTD-web application,
including linting, testing, and CI/CD processes.

---

## Table of Contents

- [Local Development](#local-development)
- [Code Quality](#code-quality)
- [Git Workflow](#git-workflow)
- [Pre-commit Hooks](#pre-commit-hooks)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

---

## Local Development

### Initial Setup

```bash
# Install dependencies
npm install

# Set up pre-commit hooks (runs automatically with npm install)
npm run prepare
```

### Development Server

```bash
# Start the Vite development server (recommended)
npm run dev

# App will be available at http://localhost:8080
# Hot Module Replacement enabled

# Alternative: Preview production build locally
npm run preview
```

### Testing

```bash
# Run all unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (development)
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug
```

---

## Code Quality

### Linting

```bash
# Run ESLint to check for issues
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Strict linting (fails on any warning)
npm run lint:check
```

### Formatting

```bash
# Check formatting with Prettier
npx prettier --check "js/**/*.js" "__tests__/**/*.js" "*.json" "*.md"

# Auto-format code
npx prettier --write "js/**/*.js" "__tests__/**/*.js" "*.json" "*.md"
```

### ESLint Configuration

The project uses ESLint with Standard style and custom rules:

- **Config**: `.eslintrc.js`
- **Style**: Standard (with customizations)
- **Key Rules**:
    - No console statements allowed (except in logger)
    - Private methods use underscore prefix (\_method)
    - Optional chaining (?.) is allowed
    - Async functions without await are allowed
    - Import ordering is enforced

#### Custom Rules

```javascript
// ✅ Allowed: Private methods with underscore
_renderTasks() { }
_buildHTML() { }

// ✅ Allowed: Optional chaining
this.app.renderView?.()
this.app.showNotification?.()

// ✅ Allowed: Console in logger
this.logger.error('Error:', error)

// ❌ Not allowed: Console in regular code
console.log('Debug info')
```

---

## Git Workflow

### Branch Strategy

```
main          - Production-ready code
develop       - Development branch (optional)
feature/*     - Feature branches
bugfix/*      - Bug fix branches
hotfix/*      - Urgent production fixes
```

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation changes
- `test` - Adding/updating tests
- `chore` - Maintenance tasks
- `style` - Code style changes (formatting)
- `perf` - Performance improvements

**Examples:**

```bash
git commit -m "feat(task-modal): Add recurrence pattern support"

git commit -m "fix(renderer): Handle empty task list gracefully"

git commit -m "refactor(logger): Centralize logging system"
```

---

## Pre-commit Hooks

### What Runs on Commit?

When you commit code, the following runs automatically:

1. **ESLint**: Lints staged JavaScript files
2. **Jest**: Runs tests for changed files
3. **Prettier**: Formats staged files

### Pre-commit Configuration

Located in `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

### lint-staged Configuration

Located in `package.json`:

```json
{
    "lint-staged": {
        "js/**/*.js": [
            "eslint --fix",
            "jest --bail --passWithNoTests --findRelatedTests"
        ],
        "__tests__/**/*.js": ["eslint --fix"],
        "*.{js,json,css,md}": ["prettier --write"]
    }
}
```

### Skipping Pre-commit Hooks

**NOT RECOMMENDED**, but possible:

```bash
git commit --no-verify -m "WIP: work in progress"
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

File: `.github/workflows/ci.yml`

#### Jobs

**1. Lint & Code Quality**

- Checks out code
- Installs dependencies
- Runs ESLint
- Checks Prettier formatting

**2. Unit Tests**

- Runs Jest with coverage
- Uploads coverage to Codecov
- Archives coverage reports

**3. E2E Tests**

- Installs Playwright browsers
- Runs E2E tests
- Uploads test reports and screenshots

**4. Build Verification**

- Runs Vite build process
- Creates single-file bundle in `dist/` directory
- Checks bundle size in CI summary
- Uploads build artifacts for review

**5. Security Audit**

- Runs `npm audit`
- Checks for vulnerabilities
- Generates audit report

### Workflow Status

Check the Actions tab in GitHub to see:

- ✅ Passing runs
- ❌ Failed runs
- 🔄 In-progress runs

### Failed Build Checklist

If a build fails, check:

1. **Lint failures**: Run `npm run lint:fix` locally
2. **Test failures**: Run `npm test` locally
3. **E2E failures**: Run `npm run test:e2e` locally
4. **Security issues**: Review `npm audit` output

---

## Troubleshooting

### ESLint Issues

**Problem**: ESLint fails but code looks correct

**Solutions**:

```bash
# Check for specific issues
npm run lint -- --format=verbose

# Auto-fix what's possible
npm run lint:fix

# Clear ESLint cache
rm -rf .eslintcache
```

### Pre-commit Hook Issues

**Problem**: Pre-commit hook fails but code is fine

**Solutions**:

```bash
# Manually run lint-staged
npx lint-staged

# Check specific files
npx eslint js/modules/features/my-file.js

# Skip hooks temporarily (not recommended)
git commit --no-verify -m "WIP: work"
```

### Husky Issues

**Problem**: Husky hooks not running

**Solutions**:

```bash
# Reinstall Husky
npm run prepare

# Or manually
npx husky install

# Check hook permissions
ls -la .husky/pre-commit
```

### Test Failures in CI

**Problem**: Tests pass locally but fail in CI

**Solutions**:

```bash
# Check Node version (CI uses 20)
node --version

# Clear all caches and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests with same config as CI
npm run test:coverage
```

### Prettier Conflicts

**Problem**: ESLint and Prettier conflicts

**Solutions**:

```bash
# Let Prettier handle formatting
npx prettier --write .

# Then let ESLint handle code quality
npm run lint:fix

# If conflicts persist, check .eslintrc.js rules
```

---

## Best Practices

### Before Committing

1. ✅ Run tests: `npm test`
2. ✅ Run linter: `npm run lint:fix`
3. ✅ Format code: `npx prettier --write .`
4. ✅ Check E2E tests: `npm run test:e2e` (if relevant)

### Before Pushing

1. ✅ Ensure all tests pass locally
2. ✅ Check CI status in GitHub
3. ✅ Review code changes
4. ✅ Update documentation if needed

### Code Review Checklist

- [ ] Code follows project style guide
- [ ] Tests added/updated for new features
- [ ] No console.log statements (use logger)
- [ ] JSDoc comments on public APIs
- [ ] No sensitive data committed
- [ ] E2E tests for user-facing features
- [ ] Tests have adequate coverage

---

## Useful Commands Reference

```bash
# Development
npm run dev                        # Start Vite dev server
npm run build                      # Build for production
npm run preview                    # Preview production build
npm test                           # Run unit tests
npm run test:watch                # Watch mode testing
npm run test:e2e                  # Run E2E tests

# Code Quality
npm run lint                      # Check linting
npm run lint:fix                  # Auto-fix linting
npm run lint:check               # Strict linting
npx prettier --write .           # Format code

# Git
git status                        # Check status
git add .                         # Stage changes
git commit -m "type: message"    # Commit (runs hooks)
git push                          # Push to remote

# Troubleshooting
rm -rf node_modules              # Clean dependencies
npm install                       # Reinstall dependencies
npm run prepare                   # Reinstall Husky hooks
```

---

## Additional Resources

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [Husky Documentation](https://github.com/typicode/husky)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)

---

**Last Updated**: Phase 3 - ESLint, Pre-commit Hooks, CI/CD
