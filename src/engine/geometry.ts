import type { Grid } from './types';
export function createGrid(n: number, views: number): Grid {
  if (![32, 64, 128, 256].includes(n) || !Number.isInteger(views) || views < 2 || views > 720) throw new Error('Unsupported acquisition grid.');
  const h = 2 / n, nFFT = 4 * n;
  return {
    n, views, h, nFFT,
    x: Float64Array.from({ length: n }, (_, i) => (i - n / 2) * h),
    y: Float64Array.from({ length: n }, (_, i) => (n / 2 - i) * h),
    detector: Float64Array.from({ length: n }, (_, i) => (i - n / 2) * h),
    angles: Float64Array.from({ length: views }, (_, i) => i * Math.PI / views),
    frequencies: Float64Array.from({ length: nFFT }, (_, i) => (i < nFFT / 2 ? i : i - nFFT) / (nFFT * h)),
  };
}
