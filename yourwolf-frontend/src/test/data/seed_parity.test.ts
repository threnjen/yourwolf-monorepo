import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {describe, expect, it} from 'vitest';

type JsonValue = boolean | JsonObject | JsonValue[] | null | number | string;
interface JsonObject {
  readonly [key: string]: JsonValue;
}

const TEST_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const BACKEND_SEED_DIRECTORY = resolve(
  TEST_DIRECTORY,
  '../../../../yourwolf-backend/app/seed/data',
);
const FRONTEND_SEED_DIRECTORY = resolve(TEST_DIRECTORY, '../../data/seed');

function readSeedFile(path: string): JsonValue {
  return JSON.parse(readFileSync(path, 'utf8')) as JsonValue;
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertSeedValuesParity(canonical: JsonValue, copy: JsonValue): void {
  expect(copy).toEqual(canonical);
}

function assertSeedParity(canonicalPath: string, copyPath: string): void {
  assertSeedValuesParity(readSeedFile(canonicalPath), readSeedFile(copyPath));
}

describe('frontend seed copies', () => {
  it('matches the canonical roles file', () => {
    assertSeedParity(
      resolve(BACKEND_SEED_DIRECTORY, 'roles.json'),
      resolve(FRONTEND_SEED_DIRECTORY, 'roles.json'),
    );
  });

  it('matches the canonical abilities file', () => {
    assertSeedParity(
      resolve(BACKEND_SEED_DIRECTORY, 'abilities.json'),
      resolve(FRONTEND_SEED_DIRECTORY, 'abilities.json'),
    );
  });

  it('fails when a copied seed is mutated', () => {
    const canonical = readSeedFile(
      resolve(BACKEND_SEED_DIRECTORY, 'abilities.json'),
    );
    const copy = readSeedFile(resolve(FRONTEND_SEED_DIRECTORY, 'abilities.json'));

    if (!Array.isArray(copy) || copy.length === 0 || !isJsonObject(copy[0])) {
      throw new Error('Expected abilities seed copy to contain an object entry');
    }

    const mutatedCopy = copy.map((entry, index) => {
      if (index !== 0 || !isJsonObject(entry)) {
        return entry;
      }

      return {...entry, name: `${String(entry.name)} (mutated)`};
    });

    expect(() => assertSeedValuesParity(canonical, mutatedCopy)).toThrow();
  });
});
