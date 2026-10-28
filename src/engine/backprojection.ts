import type { Grid } from './types';
import { assertSignal } from './validation';

/** Linear detector interpolation, with zero extension and angular quadrature. */
export function backproject(data: Float64Array, grid: Grid): Float64Array {
  const { n, views, h, x, y, angles } = grid;
  assertSignal(data, n * views);
  const image = new Float64Array(n * n), weight = Math.PI / views;
  for (let a = 0; a < views; a++) {
    const cosine = Math.cos(angles[a]), sine = Math.sin(angles[a]), offset = a * n;
    for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
      const detector = (x[col] * cosine + y[row] * sine) / h + n / 2;
      const left = Math.floor(detector), fraction = detector - left;
      const lo = left >= 0 && left < n ? data[offset + left] : 0;
      const hi = left + 1 >= 0 && left + 1 < n ? data[offset + left + 1] : 0;
      image[row * n + col] += ((1 - fraction) * lo + fraction * hi) * weight;
    }
  }
  return image;
}
