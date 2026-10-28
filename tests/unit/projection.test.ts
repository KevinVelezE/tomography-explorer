import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createGrid } from '../../src/engine/geometry';
import { getDisks, samplePhantom } from '../../src/engine/phantoms';
import { projectAt, projectDisks } from '../../src/engine/projection';
import { integrateLine } from '../helpers/oracles';

describe('geometry and forward operator', () => {
  it('keeps Cartesian coordinates distinct from downward image rows', () => {
    const g = createGrid(128, 180);
    expect(g.h).toBe(1 / 64); expect(g.nFFT).toBe(512);
    expect(g.x[0]).toBe(-1); expect(g.y[0]).toBe(1);
    expect(g.x[64]).toBe(0); expect(g.y[64]).toBe(0); expect(g.detector[64]).toBe(0);
    expect(g.angles[0]).toBe(0); expect(g.angles[179]).toBeLessThan(Math.PI);
    expect(g.frequencies[1]).toBe(0.125); expect(g.frequencies[511]).toBe(-0.125);
    expect(() => createGrid(100, 180)).toThrow(); expect(() => createGrid(128, 0)).toThrow();
  });
  it('matches hand-computed central, tangent and off-center chord lengths', () => {
    const disks = [{ x: 0, y: 0, radius: 0.65, value: 1 }];
    expect(projectAt(disks, 0, 0)).toBeCloseTo(1.3, 12);
    expect(projectAt(disks, 0, Math.PI / 2)).toBeCloseTo(1.3, 12);
    expect(projectAt(disks, 0.39, 0)).toBeCloseTo(1.04, 12);
    expect(projectAt(disks, 0.65, 0)).toBe(0); expect(projectAt(disks, 0.9, 0)).toBe(0);
  });
  it('samples the actual geometric object and stores angle-major profiles', () => {
    const g = createGrid(128, 90), disks = getDisks('asymmetric');
    const image = samplePhantom(disks, g), data = projectDisks(disks, g);
    expect(image.length).toBe(16384); expect(data.length).toBe(11520);
    expect(image[64 * 128 + 64]).toBe(0.8);
    expect(image[51 * 128 + 80]).toBe(2.1);
    expect(image[77 * 128 + 80]).toBe(0.8);
    expect(data[0]).toBe(0);
    expect(data[64]).toBeCloseTo(projectAt(disks, 0, 0), 12);
    expect(data[128 + 64]).toBeCloseTo(projectAt(disks, 0, Math.PI / 90), 12);
  });
  it('agrees with independent line integration at fixed boundary and oblique rays', () => {
    const disks = getDisks('asymmetric');
    for (const [t, theta] of [[0, 0], [0.39, 0], [0.62, 0], [-0.7, 0], [0, Math.PI / 2], [0.2, Math.PI / 4], [-0.3, Math.PI / 3], [0.9, 1.1], [0.08, 2.2]]) {
      expect(Math.abs(projectAt(disks, t, theta) - integrateLine(disks, t, theta))).toBeLessThan(0.01);
    }
  });
  it('obeys line reversal symmetry and linearity for generated compact disks', () => {
    const finite = (min: number, max: number) => fc.double({ min, max, noNaN: true });
    const disk = fc.record({ x: finite(-0.1, 0.1), y: finite(-0.1, 0.1), radius: finite(0.2, 0.5), value: finite(0, 2) });
    fc.assert(fc.property(disk, disk, finite(-1, 1), finite(-Math.PI, Math.PI), (a, b, t, theta) => {
      const p = projectAt([a, b], t, theta), reversed = projectAt([a, b], -t, theta + Math.PI);
      expect(Math.abs(p - reversed)).toBeLessThanOrEqual(1e-7 + 1e-10 * Math.abs(p));
      expect(Math.abs(p - projectAt([a], t, theta) - projectAt([b], t, theta))).toBeLessThan(1e-10);
    }), { numRuns: 100, seed: 20261027 });
  });
});
