import type { Grid, Metrics } from './types';
import { assertSignal } from './validation';
export const ROI_RADIUS = 0.9;

export function measure(result: Float64Array, reference: Float64Array, grid: Grid): Metrics {
  assertSignal(result, grid.n ** 2); assertSignal(reference, grid.n ** 2);
  let squaredError = 0, squaredNorm = 0, sampleCount = 0;
  for (let row = 0; row < grid.n; row++) for (let col = 0; col < grid.n; col++) {
    if (grid.x[col] ** 2 + grid.y[row] ** 2 > ROI_RADIUS ** 2) continue;
    const i = row * grid.n + col;
    squaredError += (result[i] - reference[i]) ** 2; squaredNorm += reference[i] ** 2; sampleCount++;
  }
  if (!sampleCount) throw new Error('The metric region contains no samples.');
  return { rmse: Math.sqrt(squaredError / sampleCount), relativeL2: squaredNorm === 0 ? null : Math.sqrt(squaredError / squaredNorm), sampleCount };
}
