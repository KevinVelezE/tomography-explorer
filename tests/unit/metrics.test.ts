import { expect, it } from 'vitest';
import { measure } from '../../src/engine/metrics';
import { createGrid } from '../../src/engine/geometry';

const g = { ...createGrid(32, 2), n: 2, x: new Float64Array([-0.2, 0.2]), y: new Float64Array([0.2, -0.2]) };
it('computes literal ROI RMSE and relative error, with null for zero reference', () => {
  expect(measure(new Float64Array([2, 2, 2, 2]), new Float64Array([1, 1, 1, 1]), g)).toEqual({ rmse: 1, relativeL2: 1, sampleCount: 4 });
  expect(measure(new Float64Array([2, 2, 2, 2]), new Float64Array(4), g)).toEqual({ rmse: 2, relativeL2: null, sampleCount: 4 });
});
it('excludes the outer background instead of diluting error', () => {
  const roi = { ...g, x: new Float64Array([0, 1]), y: new Float64Array([0, 1]) };
  expect(measure(new Float64Array([2, 0, 0, 0]), new Float64Array([1, 0, 0, 0]), roi)).toEqual({ rmse: 1, relativeL2: 1, sampleCount: 1 });
});
it('rejects incompatible and non-finite metric inputs', () => {
  expect(() => measure(new Float64Array(3), new Float64Array(4), g)).toThrow();
  expect(() => measure(new Float64Array([NaN, 0, 0, 0]), new Float64Array(4), g)).toThrow();
});
