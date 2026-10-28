import { expect, it } from 'vitest';
import { standardNoise, addNoise } from '../../src/engine/noise';

it('repeats the exact same finite noise stream and distinguishes seeds', () => {
  expect(standardNoise(129, 42)).toEqual(standardNoise(129, 42));
  expect(standardNoise(129, 42)).not.toEqual(standardNoise(129, 43));
  expect(standardNoise(129, 0).every(Number.isFinite)).toBe(true);
  expect(standardNoise(0, 42).length).toBe(0);
});
it('scales a single realization without modifying clean measurements', () => {
  const clean = new Float64Array([1, 0, 3, -1]), original = clean.slice();
  expect(addNoise(clean, 0, 42)).toEqual(clean);
  expect(addNoise(clean, 0, 42)).not.toBe(clean);
  const low = addNoise(clean, 0.01, 42), high = addNoise(clean, 0.02, 42);
  const z = standardNoise(4, 42);
  for (let i = 0; i < 4; i++) {
    expect(high[i] - clean[i]).toBeCloseTo(2 * (low[i] - clean[i]), 13);
    expect(low[i] - clean[i]).toBeCloseTo(0.01 * 3 * z[i], 13);
  }
  expect(clean).toEqual(original);
});
it('rejects invalid seeds, sizes and noise levels', () => {
  for (const seed of [-1, 1.5, 4294967296, NaN]) expect(() => standardNoise(4, seed)).toThrow();
  for (const n of [-1, 1.5, Infinity]) expect(() => standardNoise(n, 42)).toThrow();
  for (const level of [-1, 0.051, NaN]) expect(() => addNoise(new Float64Array(4), level, 42)).toThrow();
  expect(() => addNoise(new Float64Array([NaN]), 0, 42)).toThrow();
});
