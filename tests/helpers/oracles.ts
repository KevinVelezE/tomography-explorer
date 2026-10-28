import type { Disk } from '../../src/engine/types';

export function directDft(real: ArrayLike<number>, imaginary: ArrayLike<number>, inverse = false) {
  const n = real.length, outputReal = new Float64Array(n), outputImaginary = new Float64Array(n);
  for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) {
    const angle = (inverse ? 2 : -2) * Math.PI * k * j / n;
    outputReal[k] += (real[j] * Math.cos(angle) - imaginary[j] * Math.sin(angle)) / (inverse ? n : 1);
    outputImaginary[k] += (real[j] * Math.sin(angle) + imaginary[j] * Math.cos(angle)) / (inverse ? n : 1);
  }
  return { real: outputReal, imaginary: outputImaginary };
}

// Independent midpoint integration of the continuous object, not the chord formula.
export function integrateLine(disks: readonly Disk[], t: number, theta: number): number {
  const steps = 8192, ds = 3 / steps;
  let sum = 0;
  for (let i = 0; i < steps; i++) {
    const s = -1.5 + (i + 0.5) * ds;
    const x = t * Math.cos(theta) - s * Math.sin(theta);
    const y = t * Math.sin(theta) + s * Math.cos(theta);
    for (const disk of disks) if (Math.hypot(x - disk.x, y - disk.y) <= disk.radius) sum += disk.value * ds;
  }
  return sum;
}
