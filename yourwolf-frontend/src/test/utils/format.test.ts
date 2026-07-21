import {describe, it, expect} from 'vitest';
import {capitalize} from '../../utils/format';

describe('utils/format capitalize', () => {
  it('uppercases the first character and leaves the rest untouched', () => {
    expect(capitalize('village')).toBe('Village');
  });

  it('leaves an already-capitalized string unchanged', () => {
    expect(capitalize('Werewolf')).toBe('Werewolf');
  });

  it('returns an empty string unchanged', () => {
    expect(capitalize('')).toBe('');
  });

  it('does not lowercase the remainder of the string', () => {
    expect(capitalize('mcDONALD')).toBe('McDONALD');
  });
});
