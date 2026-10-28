import type { FilterKind, Grid } from './types';
import { fft } from './fft';
import { assertSignal } from './validation';

export function filterProfiles(data: Float64Array, grid: Grid, alpha: number): { filtered: Record<FilterKind, Float64Array>; spectrumMagnitude: Float64Array; symbols: Record<FilterKind, Float64Array> } {
  assertSignal(data, grid.n * grid.views);
  if (!Number.isFinite(alpha) || alpha < 0.1 || alpha > 1) throw new Error('Invalid Hann cutoff.');
  const { n, nFFT, views, h } = grid;
  const symbols = { ramp: new Float64Array(nFFT), hann: new Float64Array(nFFT) };
  const cutoff = alpha / (2 * h);
  for (let k = 0; k < nFFT; k++) {
    const frequency = Math.abs(grid.frequencies[k]);
    symbols.ramp[k] = frequency;
    symbols.hann[k] = frequency < cutoff ? frequency * (1 + Math.cos(Math.PI * frequency / cutoff)) / 2 : 0;
  }
  const filtered = { ramp: new Float64Array(n * views), hann: new Float64Array(n * views) };
  const spectrumMagnitude = new Float64Array(nFFT * views), left = (nFFT - n) / 2;
  for (let angle = 0; angle < views; angle++) {
    const real = new Float64Array(nFFT), imaginary = new Float64Array(nFFT);
    real.set(data.subarray(angle * n, (angle + 1) * n), left);
    fft(real, imaginary);
    for (let k = 0; k < nFFT; k++) spectrumMagnitude[angle * nFFT + k] = h * Math.hypot(real[k], imaginary[k]);
    for (const kind of ['ramp', 'hann'] as const) {
      const re = real.slice(), im = imaginary.slice();
      for (let k = 0; k < nFFT; k++) { re[k] *= symbols[kind][k]; im[k] *= symbols[kind][k]; }
      fft(re, im, true);
      filtered[kind].set(re.subarray(left, left + n), angle * n);
    }
  }
  return { filtered, spectrumMagnitude, symbols };
}
