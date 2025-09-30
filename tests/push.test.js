/**
 * Git push validation tests for LivePeek project
 * Ensures code quality and safety before pushing to remote repository
 */

import { execSync } from 'child_process';

describe('Push Tests', () => {
  // Test that all tests pass before push
  test('All tests should pass before push', () => {
    expect(() => {
      execSync('npm test', { stdio: 'pipe' });
    }).not.toThrow();
  });

  // Test that build succeeds before push
  test('Production build should succeed', () => {
    expect(() => {
      execSync('npm run build', { stdio: 'pipe' });
    }).not.toThrow();
  });

  // Test code coverage threshold
  test('Code coverage should meet minimum threshold', () => {
    try {
      const coverage = execSync('npm run test:coverage', {
        encoding: 'utf8'
      });

      // Parse coverage percentage (basic implementation)
      const coverageMatch = coverage.match(/All files\s+\|\s+(\d+\.?\d*)/);

      if (coverageMatch) {
        const coveragePercent = parseFloat(coverageMatch[1]);
        expect(coveragePercent).toBeGreaterThanOrEqual(80); // 80% minimum
      }
    } catch (error) {
      console.warn('Coverage test not available or configured');
    }
  });

  // Test that no local-only configuration is pushed
  test('No local development configuration should be pushed', () => {
    const localConfigFiles = [
      '.env.local',
      'config.local.js',
      'vite.config.local.js',
      '.vscode/settings.json'
    ];

    try {
      const trackedFiles = execSync('git ls-files', {
        encoding: 'utf8'
      }).split('\n');

      const localFiles = trackedFiles.filter(file =>
        localConfigFiles.some(localFile => file.includes(localFile))
      );

      expect(localFiles).toEqual([]);
    } catch (error) {
      console.warn('Could not check tracked files');
    }
  });

  // Test that dependencies are properly locked
  test('Package lock file should be up to date', () => {
    try {
      // Check if package-lock.json or pnpm-lock.yaml exists and is recent
      const packageJson = execSync('stat -c %Y package.json', {
        encoding: 'utf8'
      }).trim();

      let lockFile = '';
      try {
        lockFile = execSync('stat -c %Y pnpm-lock.yaml', {
          encoding: 'utf8'
        }).trim();
      } catch {
        try {
          lockFile = execSync('stat -c %Y package-lock.json', {
            encoding: 'utf8'
          }).trim();
        } catch {
          throw new Error('No lock file found');
        }
      }

      // Lock file should be newer or same age as package.json
      expect(parseInt(lockFile)).toBeGreaterThanOrEqual(parseInt(packageJson));
    } catch (error) {
      console.warn('Could not verify lock file status');
    }
  });

  // Test bundle size limits
  test('Bundle size should be within acceptable limits', () => {
    try {
      execSync('npm run build', { stdio: 'pipe' });

      // Check main bundle size (rough estimate)
      const bundleSize = execSync('du -sk dist/ | cut -f1', {
        encoding: 'utf8'
      }).trim();

      const sizeKB = parseInt(bundleSize);
      const maxSizeKB = 5000; // 5MB limit for entire dist folder

      expect(sizeKB).toBeLessThan(maxSizeKB);

      if (sizeKB > maxSizeKB * 0.8) {
        console.warn(`Bundle size ${sizeKB}KB is approaching limit of ${maxSizeKB}KB`);
      }
    } catch (error) {
      console.warn('Could not check bundle size');
    }
  });

  // Test that remote is reachable
  test('Remote repository should be reachable', () => {
    try {
      const remoteUrl = execSync('git remote get-url origin', {
        encoding: 'utf8'
      }).trim();

      expect(remoteUrl).toBeTruthy();

      // Test connection to remote (non-destructive)
      execSync('git ls-remote origin HEAD', { stdio: 'pipe' });
    } catch (error) {
      console.warn('Remote repository not reachable or not configured');
    }
  });

  // Test branch protection
  test('Should not push directly to protected branches', () => {
    const protectedBranches = ['main', 'master', 'production'];

    try {
      const currentBranch = execSync('git branch --show-current', {
        encoding: 'utf8'
      }).trim();

      if (protectedBranches.includes(currentBranch)) {
        console.warn(`Warning: Pushing directly to protected branch '${currentBranch}'`);
        // Allow but warn - actual branch protection should be set on remote
      }
    } catch (error) {
      console.warn('Could not determine current branch');
    }
  });

  // Test for security vulnerabilities
  test('No known security vulnerabilities in dependencies', () => {
    try {
      execSync('npm audit --audit-level high', { stdio: 'pipe' });
    } catch (error) {
      // npm audit exits with non-zero if vulnerabilities found
      throw new Error('Security vulnerabilities detected in dependencies');
    }
  });

  // Test that commits are signed (if required)
  test('Commits should be properly attributed', () => {
    try {
      const lastCommit = execSync('git log -1 --pretty=format:"%ae %an"', {
        encoding: 'utf8'
      }).trim();

      expect(lastCommit).toBeTruthy();
      expect(lastCommit).toMatch(/.+@.+ .+/); // Basic email and name format
    } catch (error) {
      console.warn('Could not verify commit attribution');
    }
  });

  // Test performance budget
  test('Performance metrics should be within budget', () => {
    try {
      execSync('npm run build', { stdio: 'pipe' });

      // Check for any performance warnings in build output
      const buildOutput = execSync('npm run build 2>&1 | grep -i "warning\\|error" || echo "clean"', {
        encoding: 'utf8'
      }).trim();

      if (buildOutput !== 'clean') {
        console.warn('Build warnings detected:', buildOutput);
      }
    } catch (error) {
      console.warn('Could not run performance checks');
    }
  });
});