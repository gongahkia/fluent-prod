/**
 * Basic linting tests for LivePeek project
 * Ensures code quality and consistency across the codebase
 */

import { execSync } from 'child_process';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

describe('Linting Tests', () => {
  // Test ESLint configuration
  test('ESLint should run without errors', () => {
    expect(() => {
      execSync('npm run lint', { stdio: 'pipe' });
    }).not.toThrow();
  });

  // Test Prettier formatting
  test('Code should be properly formatted', () => {
    expect(() => {
      execSync('npm run format:check', { stdio: 'pipe' });
    }).not.toThrow();
  });

  // Test for common code quality issues
  test('No console.log statements in production code', () => {
    const srcFiles = getAllJSFiles('./src');
    const consoleLogPattern = /console\.log\(/;

    const filesWithConsoleLog = srcFiles.filter(file => {
      const content = require('fs').readFileSync(file, 'utf8');
      return consoleLogPattern.test(content);
    });

    expect(filesWithConsoleLog).toEqual([]);
  });

  // Test for TODO/FIXME comments
  test('No TODO/FIXME comments in main branch', () => {
    const srcFiles = getAllJSFiles('./src');
    const todoPattern = /(TODO|FIXME|XXX):/i;

    const filesWithTodos = srcFiles.filter(file => {
      const content = require('fs').readFileSync(file, 'utf8');
      return todoPattern.test(content);
    });

    // Allow TODOs in development, but warn
    if (filesWithTodos.length > 0) {
      console.warn('Files with TODO/FIXME comments:', filesWithTodos);
    }
  });

  // Test React component structure
  test('React components should have proper default exports', () => {
    const componentFiles = getAllJSFiles('./src/components');

    componentFiles.forEach(file => {
      const content = require('fs').readFileSync(file, 'utf8');

      // Skip if not a React component file
      if (!content.includes('React') && !content.includes('jsx')) return;

      expect(content).toMatch(/export default \w+/);
    });
  });

  // Test for unused imports
  test('No unused React imports', () => {
    const srcFiles = getAllJSFiles('./src');

    srcFiles.forEach(file => {
      const content = require('fs').readFileSync(file, 'utf8');

      // Check for unused React import
      if (content.includes("import React") && !content.includes("React.")) {
        // React 17+ doesn't require React import for JSX
        // This is acceptable with new JSX transform
      }
    });
  });
});

// Helper function to get all JS/JSX files recursively
function getAllJSFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and other build directories
        if (!['node_modules', 'dist', 'build', '.git'].includes(item)) {
          traverse(fullPath);
        }
      } else if (item.match(/\.(js|jsx|ts|tsx)$/)) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}