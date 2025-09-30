# LivePeek Test Suite

Comprehensive testing suite for code quality, commit validation, and deployment safety.

## Test Categories

### 🔍 Linting Tests (`lint.test.js`)
- ESLint configuration validation
- Prettier formatting checks
- Code quality rules (no console.log, TODOs)
- React component structure validation
- Import/export consistency

### 📝 Commit Tests (`commit.test.js`)
- Conventional commit message format
- Sensitive file protection
- Pre-commit hook validation
- Build success verification
- Merge conflict detection
- Branch naming conventions

### 🚀 Push Tests (`push.test.js`)
- Full test suite execution
- Production build validation
- Code coverage thresholds
- Bundle size limits
- Dependency security audit
- Remote repository connectivity
- Performance budget compliance

## Usage

### Install Dependencies
```bash
cd tests
npm install
```

### Run Tests
```bash
# Run all tests
npm test

# Run specific test categories
npm run test:lint
npm run test:commit
npm run test:push

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Integration with CI/CD

Add to your main `package.json` scripts:
```json
{
  "scripts": {
    "test:quality": "cd tests && npm test",
    "precommit": "cd tests && npm run test:lint && npm run test:commit",
    "prepush": "cd tests && npm run test:push"
  }
}
```

### Git Hooks Integration

Update `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run format:check
cd tests && npm run test:lint
```

Update `.husky/pre-push`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

cd tests && npm run test:push
```

## Configuration

### Coverage Thresholds
Adjust in `package.json`:
```json
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

### Bundle Size Limits
Modify in `push.test.js`:
```javascript
const maxSizeKB = 5000; // Adjust as needed
```

### Commit Message Format
Standard conventional commits:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation
- `style:` formatting
- `refactor:` code restructuring
- `test:` adding tests
- `chore:` maintenance

## Benefits

✅ **Code Quality**: Ensures consistent formatting and linting
✅ **Security**: Prevents sensitive data commits
✅ **Performance**: Monitors bundle size and build times
✅ **Reliability**: Validates builds before deployment
✅ **Team Standards**: Enforces commit and branch conventions
✅ **Automated**: Runs automatically with git hooks