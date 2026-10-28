import type { Grid } from '../engine/types';
export function imagePixels(data: Float64Array, range: { min: number; max: number }) {
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.max <= range.min || !data.every(Number.isFinite)) throw new Error('Invalid display scale or image.');
  const pixels = new Uint8ClampedArray(data.length * 4);
  let below = 0, above = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i] < range.min) below++; if (data[i] > range.max) above++;
    const fraction = Math.max(0, Math.min(1, (data[i] - range.min) / (range.max - range.min)));
    pixels[i * 4] = 19 + 220 * fraction; pixels[i * 4 + 1] = 38 + 208 * fraction; pixels[i * 4 + 2] = 58 + 190 * fraction; pixels[i * 4 + 3] = 255;
  }
  return { pixels, below, above };
}
export function renderImage(canvas: HTMLCanvasElement, data: Float64Array, grid: Grid, range: { min: number; max: number }) {
  const { pixels, below, above } = imagePixels(data, range);
  const temporary = document.createElement('canvas'); temporary.width = grid.n; temporary.height = grid.n;
  temporary.getContext('2d')!.putImageData(new ImageData(pixels, grid.n, grid.n), 0, 0);
  const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(temporary, 0, 0, canvas.width, canvas.height);
  return { below, above };
}
