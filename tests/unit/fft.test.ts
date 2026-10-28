import { expect, it } from 'vitest';
import fc from 'fast-check';
import { fft } from '../../src/engine/fft';
import { filterProfiles } from '../../src/engine/filters';
import { createGrid } from '../../src/engine/geometry';
import { directDft } from '../helpers/oracles';

it('matches independent complex DFT values and inverse normalization', () => {
  for (const n of [2, 4, 8, 16, 32]) {
    const r = Float64Array.from({ length: n }, (_, i) => Math.sin(i * 0.7) + i / 10);
    const im = Float64Array.from({ length: n }, (_, i) => Math.cos(i * 0.3) / 3);
    const expected = directDft(r, im), originalR = r.slice(), originalI = im.slice();
    fft(r, im);
    for (let i = 0; i < n; i++) { expect(Math.abs(r[i] - expected.real[i])).toBeLessThan(1e-10 * n); expect(Math.abs(im[i] - expected.imaginary[i])).toBeLessThan(1e-10 * n); }
    fft(r, im, true);
    for (let i = 0; i < n; i++) { expect(r[i]).toBeCloseTo(originalR[i], 10); expect(im[i]).toBeCloseTo(originalI[i], 10); }
  }
});

it('preserves inverse, energy and linearity over generated complex vectors', () => {
  const sample = fc.oneof(fc.integer({ min: -200, max: 200 }).map(n => n / 100), fc.double({ min: -2, max: 2, noNaN: true }));
  const vectors = fc.constantFrom(2, 4, 8, 16, 32).chain(n => fc.tuple(...Array.from({ length: 4 }, () => fc.array(sample, { minLength: n, maxLength: n }))));
  fc.assert(fc.property(vectors, ([a, b, c, d]) => {
    const real = Float64Array.from(a), imaginary = Float64Array.from(b);
    fft(real, imaginary);
    const before = a.reduce((sum, v, i) => sum + v * v + b[i] * b[i], 0);
    const after = real.reduce((sum, v, i) => sum + v * v + imaginary[i] ** 2, 0) / a.length;
    expect(Math.abs(before - after)).toBeLessThanOrEqual(1e-9 * Math.max(1, before));
    const cr = Float64Array.from(c), ci = Float64Array.from(d); fft(cr, ci);
    const sr = Float64Array.from(a, (v, i) => v + c[i]), si = Float64Array.from(b, (v, i) => v + d[i]); fft(sr, si);
    for (let i = 0; i < a.length; i++) { expect(Math.abs(sr[i] - real[i] - cr[i])).toBeLessThan(1e-9); expect(Math.abs(si[i] - imaginary[i] - ci[i])).toBeLessThan(1e-9); }
    fft(real, imaginary, true);
    for (let i = 0; i < a.length; i++) { expect(Math.abs(real[i] - a[i])).toBeLessThan(1e-9); expect(Math.abs(imaginary[i] - b[i])).toBeLessThan(1e-9); }
  }), { numRuns: 100, seed: 20261028 });
});

it('rejects invalid FFT arrays rather than propagating malformed values', () => {
  for (const n of [0, 1, 3, 5]) expect(() => fft(new Float64Array(n), new Float64Array(n))).toThrow();
  expect(() => fft(new Float64Array(4), new Float64Array(8))).toThrow();
  expect(() => fft(new Float64Array([1, NaN]), new Float64Array(2))).toThrow();
});

it('keeps ramp/Hann symbols even and in native frequency order, without changing input', () => {
  const g = createGrid(32, 2), data = new Float64Array(64), original = data.slice();
  const result = filterProfiles(data, g, 0.65);
  expect(data).toEqual(original); expect(result.filtered.ramp.every(x => x === 0)).toBe(true);
  expect(result.symbols.ramp[0]).toBe(0); expect(result.symbols.hann[0]).toBe(0);
  const cutoff = 0.65 / (2 * g.h);
  for (let k = 0; k < g.nFFT; k++) {
    expect(result.symbols.ramp[k]).toBe(Math.abs(g.frequencies[k]));
    expect(result.symbols.hann[k]).toBeGreaterThanOrEqual(0);
    expect(result.symbols.hann[k]).toBeLessThanOrEqual(result.symbols.ramp[k]);
    if (Math.abs(g.frequencies[k]) >= cutoff) expect(result.symbols.hann[k]).toBe(0);
    if (k) expect(result.symbols.hann[k]).toBeCloseTo(result.symbols.hann[g.nFFT - k], 10);
  }
});

it('matches direct DFT centered padding, ramp multiplication and central crop', () => {
  const g = createGrid(32, 2), data = Float64Array.from({ length: 64 }, (_, i) => i % 7 === 0 ? 1.3 : Math.sin(i * 0.5));
  const original = data.slice(), out = filterProfiles(data, g, 0.65);
  for (let angle = 0; angle < 2; angle++) {
    const padded = new Float64Array(128); padded.set(data.subarray(angle * 32, (angle + 1) * 32), 48);
    const spectral = directDft(padded, new Float64Array(128));
    for (let k = 0; k < 128; k++) {
      const f = Math.min(k, 128 - k) / (128 * (2 / 32));
      expect(out.spectrumMagnitude[angle * 128 + k]).toBeCloseTo(Math.hypot(spectral.real[k], spectral.imaginary[k]) * (2 / 32), 9);
      spectral.real[k] *= f; spectral.imaginary[k] *= f;
    }
    const expected = directDft(spectral.real, spectral.imaginary, true);
    for (let k = 0; k < 32; k++) expect(out.filtered.ramp[angle * 32 + k]).toBeCloseTo(expected.real[48 + k], 9);
  }
  expect(data).toEqual(original);
});
