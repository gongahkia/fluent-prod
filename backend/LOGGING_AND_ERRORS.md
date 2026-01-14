# Logging and Error Reporting Guide

## Centralized Logging
- All backend scripts and services use Winston (see `backend/utils/logger.js`).
- Usage:
  ```js
  import logger from '../utils/logger.js';
  logger.info('Message');
  logger.warn('Warning');
  logger.error('Error', { error });
  ```
- Logs include timestamps, levels, and stack traces for errors.

## Standardized API Error Reporting
- API-like functions and scripts return errors as objects:
  ```js
  {
    error: {
      code: 'ERROR_CODE',
      message: 'Human-readable message'
    },
    ...otherFields
  }
  ```
- Thrown errors in backend scripts include a `.code` property for programmatic handling.
- All thrown errors are logged before being rethrown.

## Admin Server
- All errors are logged and returned as `{ error: '...' }` JSON responses.
- Success responses use `{ message: '...' }`.

## Recommendations
- Use `logger` for all logs and errors.
- Always include a unique error code for thrown errors.
- For new endpoints, follow the `{ error: { code, message } }` pattern for error responses.
