import '@testing-library/jest-dom';
import {vi} from 'vitest';

// Mock axios for API tests
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: {
          request: {use: vi.fn()},
          response: {use: vi.fn()},
        },
      })),
    },
  };
});
