import {describe, it, expect} from 'vitest';
import {extractApiErrorMessages} from '../../api/errors';

/**
 * Builds an axios-shaped rejection. The real client rejects with an Error that
 * carries `response`, so the tests mirror that rather than a bare object.
 */
function axiosError(status: number, data: unknown): Error {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: {status, data},
  });
}

describe('extractApiErrorMessages', () => {
  describe('pydantic 422 detail arrays', () => {
    it('reads the message out of a single-item detail array', () => {
      // Verbatim body from FastAPI for name="a" against min_length=2.
      const error = axiosError(422, {
        detail: [
          {
            type: 'string_too_short',
            loc: ['body', 'name'],
            msg: 'String should have at least 2 characters',
            input: 'a',
            ctx: {min_length: 2},
            url: 'https://errors.pydantic.dev/2.13/v/string_too_short',
          },
        ],
      });

      expect(extractApiErrorMessages(error)).toEqual([
        'name: String should have at least 2 characters',
      ]);
    });

    it('reads the message for an over-long name', () => {
      const error = axiosError(422, {
        detail: [
          {
            type: 'string_too_long',
            loc: ['body', 'name'],
            msg: 'String should have at most 50 characters',
            input: 'x'.repeat(60),
            ctx: {max_length: 50},
          },
        ],
      });

      expect(extractApiErrorMessages(error)).toEqual([
        'name: String should have at most 50 characters',
      ]);
    });

    it('reports every entry when several fields fail', () => {
      const error = axiosError(422, {
        detail: [
          {type: 'string_too_short', loc: ['body', 'name'], msg: 'String should have at least 2 characters'},
          {type: 'string_too_short', loc: ['body', 'description'], msg: 'String should have at least 1 character'},
        ],
      });

      expect(extractApiErrorMessages(error)).toEqual([
        'name: String should have at least 2 characters',
        'description: String should have at least 1 character',
      ]);
    });

    it('joins nested locations into a dotted path', () => {
      const error = axiosError(422, {
        detail: [
          {
            type: 'greater_than_equal',
            loc: ['body', 'ability_steps', 0, 'order'],
            msg: 'Input should be greater than or equal to 0',
          },
        ],
      });

      expect(extractApiErrorMessages(error)).toEqual([
        'ability_steps.0.order: Input should be greater than or equal to 0',
      ]);
    });

    it('falls back to the bare message when loc carries no field', () => {
      const error = axiosError(422, {
        detail: [{type: 'missing', loc: ['body'], msg: 'Field required'}],
      });

      expect(extractApiErrorMessages(error)).toEqual(['Field required']);
    });

    it('skips entries that carry no message', () => {
      const error = axiosError(422, {
        detail: [{type: 'weird', loc: ['body', 'name']}, {type: 'ok', loc: ['body', 'x'], msg: 'Bad'}],
      });

      expect(extractApiErrorMessages(error)).toEqual(['x: Bad']);
    });

    it('returns null when the detail array yields no usable message', () => {
      const error = axiosError(422, {detail: [{type: 'weird', loc: ['body']}]});

      expect(extractApiErrorMessages(error)).toBeNull();
    });
  });

  describe('domain-error string details', () => {
    it('reads a 400 string detail', () => {
      const error = axiosError(400, {detail: 'Wake order 5 is already taken'});

      expect(extractApiErrorMessages(error)).toEqual(['Wake order 5 is already taken']);
    });

    it('reads a 403 string detail', () => {
      const error = axiosError(403, {detail: 'Role is locked'});

      expect(extractApiErrorMessages(error)).toEqual(['Role is locked']);
    });

    it('reads a 404 string detail', () => {
      const error = axiosError(404, {detail: 'Role not found'});

      expect(extractApiErrorMessages(error)).toEqual(['Role not found']);
    });

    it('ignores a blank string detail', () => {
      const error = axiosError(400, {detail: '   '});

      expect(extractApiErrorMessages(error)).toBeNull();
    });
  });

  describe('errors the caller must handle itself', () => {
    it('returns null for a network error with no response', () => {
      expect(extractApiErrorMessages(new Error('Network Error'))).toBeNull();
    });

    it('returns null for a 500 with no detail', () => {
      expect(extractApiErrorMessages(axiosError(500, {}))).toBeNull();
    });

    it('returns null for an HTML error body', () => {
      expect(extractApiErrorMessages(axiosError(502, '<html>Bad Gateway</html>'))).toBeNull();
    });

    it('returns null for a non-error value', () => {
      expect(extractApiErrorMessages('boom')).toBeNull();
      expect(extractApiErrorMessages(null)).toBeNull();
      expect(extractApiErrorMessages(undefined)).toBeNull();
    });
  });
});
