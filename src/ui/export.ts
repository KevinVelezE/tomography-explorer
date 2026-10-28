import type { EngineResult, ViewState } from '../engine/types';
import { validateConfig } from '../engine/config';
import { ROI_RADIUS } from '../engine/metrics';

export function serializeExperiment(result: EngineResult, view: ViewState): string {
  const config = validateConfig(result.config);
  if (!Number.isInteger(view.step) || view.step < 0 || view.step > 5 || !Number.isInteger(view.angleIndex) || view.angleIndex < 0 || view.angleIndex >= config.views || !['ramp', 'hann'].includes(view.filter)) throw new Error('Invalid experiment view.');
  for (const metric of Object.values(result.metrics)) {
    if (!Number.isFinite(metric.rmse) || (metric.relativeL2 !== null && !Number.isFinite(metric.relativeL2)) || !Number.isInteger(metric.sampleCount) || metric.sampleCount <= 0) throw new Error('Invalid metric values.');
  }
  return JSON.stringify({
    schemaVersion: 1, engineVersion: '0.1.0', config, view: { step: view.step, angleIndex: view.angleIndex, filter: view.filter },
    roiRadius: ROI_RADIUS,
    grid: { n: config.n, h: 2 / config.n, nFFT: 4 * config.n, angularWeight: Math.PI / config.views, detector: '(k-N/2)*h', imageX: '(col-N/2)*h', imageY: '(N/2-row)*h' },
    normalizations: { forwardFourier: 'exp(-2*pi*i*t*sigma)', inverseFFT: '1/nFFT', ramp: '|sigma|', hann: '|sigma|*(1+cos(pi*sigma/f_c))/2 for |sigma|<f_c; 0 otherwise', cutoff: 'alpha/(2*h)', noise: 'noiseLevel*max(abs(clean))', noiseGenerator: 'Mulberry32 + paired Box-Muller, engine 0.1.0' },
    metrics: result.metrics,
  }, null, 2);
}
