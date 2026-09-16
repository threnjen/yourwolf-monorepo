import '@testing-library/jest-dom';
import {vi} from 'vitest';

// Mock axios for API tests
vi.mock('axios', () => {
  const rejectGamesRequest = (url: unknown) => {
    if (typeof url === 'string' && url.includes('/games')) {
      throw new Error(`Forbidden games request: ${url}`);
    }
  };
  return {
    default: {
      create: vi.fn(() => ({
        get: vi.fn((url: unknown) => { rejectGamesRequest(url); }),
        post: vi.fn((url: unknown) => { rejectGamesRequest(url); }),
        put: vi.fn(),
        delete: vi.fn((url: unknown) => { rejectGamesRequest(url); }),
        interceptors: {
          request: {use: vi.fn()},
          response: {use: vi.fn()},
        },
      })),
    },
  };
});
