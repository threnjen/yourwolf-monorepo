import {describe, it, expect, vi, beforeEach} from 'vitest';

// We need to test the client module, so we'll verify its configuration
describe('API Client', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('configuration', () => {
    it('exports apiClient', async () => {
      // Mock axios.create before importing the client
      const mockCreate = vi.fn().mockReturnValue({
        get: vi.fn(),
        post: vi.fn(),
        interceptors: {
          response: {
            use: vi.fn(),
          },
        },
      });
      
      vi.doMock('axios', () => ({
        default: {
          create: mockCreate,
        },
      }));

      const {apiClient} = await import('../api/client');
      
      expect(apiClient).toBeDefined();
    });

    it('creates axios instance with correct base config', async () => {
      const mockInterceptorUse = vi.fn();
      const mockInstance = {
        get: vi.fn(),
        post: vi.fn(),
        interceptors: {
          response: {
            use: mockInterceptorUse,
          },
        },
      };
      
      const mockCreate = vi.fn().mockReturnValue(mockInstance);
      
      vi.doMock('axios', () => ({
        default: {
          create: mockCreate,
        },
      }));

      await import('../api/client');
      
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
    });

    it('sets up response interceptor', async () => {
      const mockInterceptorUse = vi.fn();
      const mockInstance = {
        get: vi.fn(),
        post: vi.fn(),
        interceptors: {
          response: {
            use: mockInterceptorUse,
          },
        },
      };
      
      const mockCreate = vi.fn().mockReturnValue(mockInstance);
      
      vi.doMock('axios', () => ({
        default: {
          create: mockCreate,
        },
      }));

      await import('../api/client');
      
      expect(mockInterceptorUse).toHaveBeenCalled();
    });
  });

  describe('error handling interceptor', () => {
    it('logs error to console on API failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      let errorHandler: ((error: unknown) => Promise<never>) | undefined;
      
      const mockInterceptorUse = vi.fn((_successFn, errorFn) => {
        errorHandler = errorFn;
      });
      
      const mockInstance = {
        get: vi.fn(),
        post: vi.fn(),
        interceptors: {
          response: {
            use: mockInterceptorUse,
          },
        },
      };
      
      const mockCreate = vi.fn().mockReturnValue(mockInstance);
      
      vi.doMock('axios', () => ({
        default: {
          create: mockCreate,
        },
      }));

      await import('../api/client');
      
      // Call the error handler with a mock error
      const mockError = {
        response: {
          data: {message: 'Server error'},
        },
        message: 'Request failed',
      };
      
      if (errorHandler) {
        await expect(errorHandler(mockError)).rejects.toBe(mockError);
        expect(consoleSpy).toHaveBeenCalled();
      }

      consoleSpy.mockRestore();
    });

    it('rejects with original error', async () => {
      let errorHandler: ((error: unknown) => Promise<never>) | undefined;
      
      const mockInterceptorUse = vi.fn((_successFn, errorFn) => {
        errorHandler = errorFn;
      });
      
      const mockInstance = {
        get: vi.fn(),
        post: vi.fn(),
        interceptors: {
          response: {
            use: mockInterceptorUse,
          },
        },
      };
      
      const mockCreate = vi.fn().mockReturnValue(mockInstance);
      
      vi.doMock('axios', () => ({
        default: {
          create: mockCreate,
        },
      }));

      await import('../api/client');
      
      const mockError = new Error('Network error');
      
      if (errorHandler) {
        await expect(errorHandler(mockError)).rejects.toBe(mockError);
      }
    });
  });
});
