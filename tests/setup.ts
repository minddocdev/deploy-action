/**
 * Unit test global mocks to external services.
 */

jest.mock('shelljs', () => ({
  exec: jest.fn(() => ({ code: 0 })),
})); // Avoid running test commands in your computer (like a helm delete)
