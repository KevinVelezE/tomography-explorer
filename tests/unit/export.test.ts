import { expect, it } from 'vitest';
import { serializeExperiment } from '../../src/ui/export';
import { runExperiment } from '../../src/engine/experiment';
import { DEFAULT_CONFIG } from '../../src/engine/config';
const result = runExperiment({ ...DEFAULT_CONFIG, views: 12 });
const view = { step: 5, angleIndex: 11, filter: 'hann' as const };
it('exports deterministic confirmed parameters, metrics and numerical conventions without image arrays', () => {
  const text = serializeExperiment(result, view), data = JSON.parse(text);
  expect(text).toBe(serializeExperiment(result, view));
  expect(data).toMatchObject({ schemaVersion: 1, engineVersion: '0.1.0', config: result.config, view, roiRadius: 0.9, metrics: result.metrics });
  expect(data.grid).toMatchObject({ n: 128, h: 1 / 64, nFFT: 512, angularWeight: Math.PI / 12 });
  expect(data.normalizations).toMatchObject({ ramp: '|sigma|', inverseFFT: '1/nFFT' });
  expect(text).not.toContain('reference'); expect(text).not.toContain('computeMs'); expect(text.length).toBeLessThan(3000);
});
it('rejects misleading view indices and non-finite metric values', () => {
  for (const bad of [{ ...view, step: 6 }, { ...view, step: -1 }, { ...view, angleIndex: 12 }, { ...view, angleIndex: 0.5 }, { ...view, filter: 'unknown' }]) expect(() => serializeExperiment(result, bad as never)).toThrow();
  expect(() => serializeExperiment({ ...result, metrics: { ...result.metrics, ramp: { ...result.metrics.ramp, rmse: Infinity } } }, view)).toThrow();
});
