"use strict";
/**
 * Unit test global mocks to external services.
 */
jest.mock('shelljs', () => ({
    exec: jest.fn(),
})); // Avoid running test commands in your computer (like a helm delete)
