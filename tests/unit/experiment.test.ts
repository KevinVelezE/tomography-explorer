import { expect, it } from 'vitest';
import { runExperiment } from '../../src/engine/experiment';
import { DEFAULT_CONFIG } from '../../src/engine/config';
import { filterProfiles } from '../../src/engine/filters';
import { backproject } from '../../src/engine/backprojection';
import { measure } from '../../src/engine/metrics';
import { addNoise } from '../../src/engine/noise';

it('builds both reconstructions from the very same noisy measurements', () => {
  const config = { ...DEFAULT_CONFIG, noiseLevel: 0.02 }, result = runExperiment(config);
  expect(result.config).toEqual(config); expect(result.config).not.toBe(config);
  expect(result.reference.length).toBe(128 ** 2);
  expect(result.noisy.length).toBe(128 * 180);
  expect(result.spectrumMagnitude.length).toBe(512 * 180);
  expect(result.noisy).toEqual(addNoise(result.clean, 0.02, 42));
  const filters = filterProfiles(result.noisy, result.grid, 0.65);
  for (const kind of ['ramp', 'hann'] as const) {
    expect(result.filtered[kind]).toEqual(filters.filtered[kind]);
    expect(result.reconstructions[kind]).toEqual(backproject(filters.filtered[kind], result.grid));
    expect(result.metrics[kind]).toEqual(measure(result.reconstructions[kind], result.reference, result.grid));
    expect(result.reconstructions[kind].every(Number.isFinite)).toBe(true);
  }
  for (const data of [result.clean, result.noisy, result.reference, result.backprojection, result.spectrumMagnitude]) expect(data.every(Number.isFinite)).toBe(true);
  expect(result.metrics.ramp.sampleCount).toBeGreaterThan(10000);
  expect(result.computeMs).toBeGreaterThanOrEqual(0);
});
it('validates configuration at runtime rather than trusting TypeScript', () => {
  expect(() => runExperiment({ ...DEFAULT_CONFIG, n: 999 } as never)).toThrow();
});
