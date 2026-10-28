import { expect, it } from 'vitest';
import { createGrid } from '../../src/engine/geometry';
import { getDisks, samplePhantom } from '../../src/engine/phantoms';
import { projectDisks } from '../../src/engine/projection';
import { filterProfiles } from '../../src/engine/filters';
import { backproject } from '../../src/engine/backprojection';
import type { Grid } from '../../src/engine/types';

function relative(a: Float64Array, b: Float64Array) {
  let error = 0, norm = 0;
  for (let i = 0; i < a.length; i++) { error += (a[i] - b[i]) ** 2; norm += b[i] ** 2; }
  return Math.sqrt(error / norm);
}
function localMean(data: Float64Array, g: Grid, x: number, y: number, radius: number) {
  let sum = 0, count = 0;
  for (let r = 0; r < g.n; r++) for (let c = 0; c < g.n; c++) if ((g.x[c] - x) ** 2 + (g.y[r] - y) ** 2 <= radius ** 2) { sum += data[r * g.n + c]; count++; }
  return sum / count;
}
it('inverts the analytic disk without amplitude fitting', () => {
  const g = createGrid(128, 180), disks = getDisks('disk');
  const reconstructed = backproject(filterProfiles(projectDisks(disks, g), g, 0.65).filtered.ramp, g);
  const error = relative(reconstructed, samplePhantom(disks, g));
  console.info('disk relative L2', error);
  expect(error).toBeLessThan(0.15);
  expect(localMean(reconstructed, g, 0, 0, 0.35)).toBeGreaterThan(0.92);
  expect(localMean(reconstructed, g, 0, 0, 0.35)).toBeLessThan(1.08);
});
it('preserves the quadrant of an asymmetric inclusion', () => {
  const g = createGrid(128, 180);
  const image = backproject(filterProfiles(projectDisks(getDisks('asymmetric'), g), g, 0.65).filtered.ramp, g);
  const inclusion = localMean(image, g, 0.25, 0.2, 0.06);
  expect(inclusion - localMean(image, g, -0.25, 0.2, 0.06)).toBeGreaterThan(0.7);
  expect(inclusion - localMean(image, g, 0.25, -0.2, 0.06)).toBeGreaterThan(0.7);
});
it('reconstructs three independent smooth Gaussian fixtures within frozen tolerances', () => {
  for (const n of [64, 128, 256]) {
    const g = createGrid(n, 360), reference = new Float64Array(n * n), data = new Float64Array(n * 360), s = 0.15;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) reference[r * n + c] = Math.exp(-((g.x[c] - 0.1) ** 2 + (g.y[r] + 0.1) ** 2) / (2 * s * s));
    for (let a = 0; a < 360; a++) {
      const center = 0.1 * Math.cos(g.angles[a]) - 0.1 * Math.sin(g.angles[a]);
      for (let k = 0; k < n; k++) data[a * n + k] = Math.sqrt(2 * Math.PI) * s * Math.exp(-((g.detector[k] - center) ** 2) / (2 * s * s));
    }
    const error = relative(backproject(filterProfiles(data, g, 0.65).filtered.ramp, g), reference);
    console.info('Gaussian', n, error); expect(error).toBeLessThan(0.04);
  }
});
it('preserves zero and rejects non-finite or mismatched profiles', () => {
  const g = createGrid(32, 2);
  expect(backproject(new Float64Array(64), g).every(v => v === 0)).toBe(true);
  expect(() => backproject(new Float64Array(63), g)).toThrow();
  const data = new Float64Array(64); data[0] = Infinity;
  expect(() => backproject(data, g)).toThrow();
});
