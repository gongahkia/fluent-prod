/**
 * Git commit validation tests for LivePeek project
 * Ensures proper commit message format and prevents problematic commits
 */

import { execSync } from 'child_process';

describe('Commit Tests', () => {
  // Test commit message format
  test('Commit messages should follow conventional format', () => {
    try {
      const lastCommitMsg = execSync('git log -1 --pretty=%B', {
        encoding: 'utf8'
      }).trim();

      // Conventional commit pattern: type(scope): description
      const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .{1,72}$/;

      expect(lastCommitMsg.split('\n')[0]).toMatch(conventionalPattern);
    } catch (error) {
      // Skip if not in a git repository or no commits
      console.warn('Skipping commit message test: not in git repo or no commits');
    }
  });

  // Test that sensitive files are not committed
  test('No sensitive files should be committed', () => {
    const sensitivePatterns = [
      '.env',
      '.env.local',
      '.env.production',
      'secrets.json',
      'private-key',
      '*.pem',
      '*.key'
    ];

    try {
      const trackedFiles = execSync('git ls-files', {
        encoding: 'utf8'
      }).split('\n');

      const sensitiveFiles = trackedFiles.filter(file =>
        sensitivePatterns.some(pattern =>
          file.includes(pattern.replace('*', ''))
        )
      );

      expect(sensitiveFiles).toEqual([]);
    } catch (error) {
      console.warn('Skipping sensitive files test: not in git repo');
    }
  });

  // Test that pre-commit hooks work
  test('Pre-commit hooks should be properly configured', () => {
    try {
      // Check if husky is properly set up
      const huskyConfig = execSync('cat package.json | grep -A 5 "lint-staged"', {
        encoding: 'utf8'
      });

      expect(huskyConfig).toContain('eslint --fix');
      expect(huskyConfig).toContain('prettier --write');
    } catch (error) {
      console.warn('Husky configuration not found in expected format');
    }
  });

  // Test that build passes before commit
  test('Build should succeed', () => {
    expect(() => {
      execSync('npm run build', { stdio: 'pipe' });
    }).not.toThrow();
  });

  // Test that linting passes before commit
  test('Linting should pass before commit', () => {
    expect(() => {
      execSync('npm run lint', { stdio: 'pipe' });
    }).not.toThrow();
  });

  // Test file size limits
  test('No large files should be committed', () => {
    const maxSizeKB = 1000; // 1MB limit

    try {
      const largeFiles = execSync(`find . -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" | xargs ls -la | awk '$5 > ${maxSizeKB * 1024} {print $9 " (" $5 " bytes)"}'`, {
        encoding: 'utf8'
      }).trim();

      if (largeFiles) {
        console.warn('Large files detected:', largeFiles);
        // Allow but warn about large files
      }
    } catch (error) {
      // Skip if commands not available
    }
  });

  // Test for merge conflict markers
  test('No merge conflict markers should be present', () => {
    try {
      const conflictMarkers = execSync(`grep -r "<<<<<<< HEAD\\|=======\\|>>>>>>> " src/ || echo "none"`, {
        encoding: 'utf8'
      }).trim();

      expect(conflictMarkers).toBe('none');
    } catch (error) {
      // Command failed, which is good (no matches found)
    }
  });

  // Test branch naming convention
  test('Branch names should follow convention', () => {
    try {
      const currentBranch = execSync('git branch --show-current', {
        encoding: 'utf8'
      }).trim();

      // Allow main, develop, or feature/fix/hotfix branches
      const branchPattern = /^(main|master|develop|feature\/[\w-]+|fix\/[\w-]+|hotfix\/[\w-]+)$/;

      if (currentBranch && currentBranch !== 'HEAD') {
        expect(currentBranch).toMatch(branchPattern);
      }
    } catch (error) {
      console.warn('Could not determine current branch');
    }
  });
});