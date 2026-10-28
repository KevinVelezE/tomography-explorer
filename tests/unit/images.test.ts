import { expect, it } from 'vitest';
import { imagePixels } from '../../src/ui/images';
it('uses one explicit scale for all pixels, counts clipping and never alters input', () => {
  const data = new Float64Array([-1, 0, 0.5, 1, 2]), copy = data.slice();
  const a = imagePixels(data, { min: 0, max: 1 }), b = imagePixels(new Float64Array([0, 0.5, 1, 2]), { min: 0, max: 1 });
  expect(a.below).toBe(1); expect(a.above).toBe(1);
  expect(a.pixels.slice(4)).toEqual(b.pixels); expect(a.pixels[3]).toBe(255);
  expect(a.pixels.slice(0, 4)).toEqual(a.pixels.slice(4, 8));
  expect(data).toEqual(copy);
  expect(() => imagePixels(data, { min: 1, max: 1 })).toThrow();
});
