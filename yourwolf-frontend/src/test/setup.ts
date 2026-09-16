import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
import {vi} from 'vitest';

// Mock axios for API tests
vi.mock('axios', () => {
  const rejectGamesRequest = (url: unknown) => {
    if (typeof url === 'string' && url.includes('/games')) {
      throw new Error(`Forbidden games request: ${url}`);
    }
    if (typeof url === 'string' && url.includes('/roles/preview-script')) {
      throw new Error(`Forbidden local preview request: ${url}`);
    }
  };
  const rejectCatalogRead = (url: unknown) => {
    if (typeof url !== 'string') return;
    const path = url.split('?')[0];
    if (path === '/roles' || (path !== '/roles/check-name' && /^\/roles\/[^/]+$/.test(path)) || path === '/abilities') {
      throw new Error(`Forbidden catalog request: ${path}`);
    }
  };
  return {
    default: {
      create: vi.fn(() => ({
        get: vi.fn((url: unknown) => {
          rejectGamesRequest(url);
          rejectCatalogRead(url);
        }),
        post: vi.fn((url: unknown) => {
          rejectGamesRequest(url);
          if (url === '/roles') {
            throw new Error(`Forbidden role creation request: ${url}`);
          }
        }),
        put: vi.fn((url: unknown) => { rejectGamesRequest(url); }),
        patch: vi.fn((url: unknown) => { rejectGamesRequest(url); }),
        delete: vi.fn((url: unknown) => { rejectGamesRequest(url); }),
        interceptors: {
          request: {use: vi.fn()},
          response: {use: vi.fn()},
        },
      })),
    },
  };
});
