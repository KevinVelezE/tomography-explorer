import { describe, expect, it } from 'vitest';
import { validateConfig } from '../../src/engine/config';

const valid = { n: 128, phantom: 'asymmetric', views: 180, noiseLevel: 0, seed: 42, alpha: 0.65 };
describe('experiment boundary', () => {
  it('accepts finite boundary values and copies only known fields', () => {
    const input = { ...valid, extra: 'not part of the experiment' };
    expect(validateConfig(input)).toEqual(valid);
    expect(validateConfig(input)).not.toBe(input);
    expect(validateConfig({ ...valid, seed: 0, alpha: 0.1 })).toMatchObject({ seed: 0, alpha: 0.1 });
    expect(validateConfig({ ...valid, seed: 4294967295, alpha: 1, noiseLevel: 0.05, views: 360 })).toMatchObject({ noiseLevel: 0.05 });
  });
  for (const [field, values] of Object.entries({
    n: [0, 64, 256, NaN, Infinity, '128'],
    phantom: ['', 'clinical', null], views: [0, 721, 90.5, 13, '180', NaN],
    noiseLevel: [-0.01, 0.06, NaN, Infinity, '0'],
    alpha: [0, 1.01, NaN, Infinity, '0.65'], seed: [-1, 4294967296, 1.2, NaN, Infinity, '42'],
  })) for (const value of values) it(`rejects invalid ${field}=${String(value)}`, () => {
    expect(() => validateConfig({ ...valid, [field]: value })).toThrow();
  });
  it('rejects absent or malformed configuration', () => {
    for (const input of [null, undefined, 1, [], {}, 'configuration']) expect(() => validateConfig(input)).toThrow();
  });
});
