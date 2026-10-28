import type { EngineResult, ViewState } from '../engine/types';
import { imagePixels, renderImage } from './images';

function maximum(data: Float64Array) { let max = 0; for (const value of data) max = Math.max(max, value); return max; }
const format = (value: number) => value.toFixed(3);

function chart(canvas: HTMLCanvasElement, x: Float64Array, curves: { data: Float64Array; color: string }[], xlabel: string, ylabel: string, selected?: number) {
  const ctx = canvas.getContext('2d')!, left = 66, right = 488, top = 48, bottom = 440;
  ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, 0, 512, 512);
  let low = 0, high = 0;
  for (const curve of curves) for (const value of curve.data) { low = Math.min(low, value); high = Math.max(high, value); }
  if (high === low) high = low + 1;
  const px = (value: number) => left + (value - x[0]) / (x[x.length - 1] - x[0]) * (right - left);
  const py = (value: number) => bottom - (value - low) / (high - low) * (bottom - top);
  ctx.strokeStyle = '#c5d1e0'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = top + i * (bottom - top) / 4;
    ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke();
  }
  ctx.fillStyle = '#52627a'; ctx.font = '17px system-ui';
  ctx.fillText(format(high), 5, top + 5); ctx.fillText(format(low), 5, bottom);
  ctx.fillText(format(x[0]), left, bottom + 25); ctx.fillText(format(x[x.length - 1]), right - 45, bottom + 25);
  ctx.fillText(xlabel, left + 24, 494); ctx.fillText(ylabel, left, 25);
  for (const curve of curves) {
    ctx.strokeStyle = curve.color; ctx.lineWidth = 2;
    ctx.beginPath(); curve.data.forEach((v, i) => i === 0 ? ctx.moveTo(px(x[i]), py(v)) : ctx.lineTo(px(x[i]), py(v))); ctx.stroke();
  }
  if (selected !== undefined) {
    ctx.fillStyle = '#7256a8'; ctx.beginPath(); ctx.arc(px(x[selected]), py(curves[0].data[selected]), 5, 0, 2 * Math.PI); ctx.fill();
  }
  return `Vertical range [${format(low)}, ${format(high)}].`;
}

export function renderPlots(root: HTMLElement, result: EngineResult, view: ViewState, detectorIndex = 64): void {
  const { grid: g } = result, angleIndex = Math.min(view.angleIndex, g.views - 1), angle = g.angles[angleIndex];
  const commonMax = maximum(result.reference), cleanMax = maximum(result.clean);
  for (const canvas of root.querySelectorAll<HTMLCanvasElement>('canvas[data-kind]')) {
    const kind = canvas.dataset.kind!, ctx = canvas.getContext('2d')!;
    let note = '';
    const profile = (data: Float64Array) => data.subarray(angleIndex * g.n, (angleIndex + 1) * g.n);
    if (['reference', 'object', 'selected', 'ramp', 'hann', 'bp', 'error'].includes(kind)) {
      const reconstruction = result.reconstructions[view.filter];
      const data = kind === 'bp' ? result.backprojection : kind === 'selected' ? reconstruction : kind === 'ramp' || kind === 'hann' ? result.reconstructions[kind] : kind === 'error' ? Float64Array.from(reconstruction, (v, i) => Math.abs(v - result.reference[i])) : result.reference;
      const max = kind === 'bp' ? maximum(data) || 1 : commonMax || 1;
      const clipping = renderImage(canvas, data, g, { min: 0, max });
      note = `Scale [0, ${format(max)}]. Display clipped: ${clipping.below} below, ${clipping.above} above. ${kind === 'error' || kind === 'selected' ? `Filter: ${view.filter}.` : ''}`;
      ctx.fillStyle = '#fff'; ctx.font = '16px system-ui'; ctx.fillText('y ↑', 12, 25); ctx.fillText('x →', 452, 492);
      if (kind === 'object') {
        const t = g.detector[detectorIndex], cosine = Math.cos(angle), sine = Math.sin(angle);
        const toX = (x: number) => (x + 1) * 256, toY = (y: number) => (1 - y) * 256;
        ctx.strokeStyle = '#73e3d3'; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(toX(t * cosine + 2 * sine), toY(t * sine - 2 * cosine));
        ctx.lineTo(toX(t * cosine - 2 * sine), toY(t * sine + 2 * cosine)); ctx.stroke();
        ctx.strokeStyle = '#d5bdff'; ctx.beginPath(); ctx.moveTo(256, 256); ctx.lineTo(toX(0.4 * cosine), toY(0.4 * sine)); ctx.stroke();
        const labelX = toX(0.4 * cosine) - 35, labelY = toY(0.4 * sine) - 10;
        ctx.fillStyle = '#13263a'; ctx.fillRect(labelX - 6, labelY - 22, 100, 29);
        ctx.fillStyle = '#fff'; ctx.fillText('normal ω', labelX, labelY);
      }
    } else if (kind === 'profile') {
      note = chart(canvas, g.detector, [{ data: profile(result.clean), color: '#3156a4' }, { data: profile(result.noisy), color: '#147d78' }], 't: detector position', 'projection', detectorIndex);
      note += ` Blue: clean; teal: used data. g(t,θ)=${format(profile(result.noisy)[detectorIndex])}.`;
    } else if (kind === 'filtered') {
      note = chart(canvas, g.detector, [{ data: profile(result.filtered[view.filter]), color: '#147d78' }], 't: detector position', `filtered (${view.filter})`);
    } else if (kind === 'symbol' || kind === 'spectrum') {
      const shift = (data: Float64Array) => Float64Array.from({ length: g.nFFT }, (_, i) => data[(i + g.nFFT / 2) % g.nFFT]);
      const x = shift(g.frequencies);
      const curves = kind === 'symbol' ? [{ data: shift(result.symbols.ramp), color: '#3156a4' }, { data: shift(result.symbols.hann), color: '#147d78' }] : [{ data: shift(result.spectrumMagnitude.subarray(angleIndex * g.nFFT, (angleIndex + 1) * g.nFFT)), color: '#7256a8' }];
      note = chart(canvas, x, curves, 'σ: cycles per unit', kind === 'symbol' ? 'multiplier' : 'h |DFT(g)|');
    } else if (kind === 'sinogram') {
      const ordered = new Float64Array(g.n * g.views);
      for (let k = 0; k < g.n; k++) for (let a = 0; a < g.views; a++) ordered[k * g.views + a] = result.noisy[a * g.n + k];
      const { pixels, below, above } = imagePixels(ordered, { min: 0, max: cleanMax || 1 });
      const tmp = document.createElement('canvas'); tmp.width = g.views; tmp.height = g.n;
      tmp.getContext('2d')!.putImageData(new ImageData(pixels, g.views, g.n), 0, 0);
      ctx.fillStyle = '#13263a'; ctx.fillRect(0, 0, 512, 512); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tmp, 56, 35, 432, 410);
      ctx.strokeStyle = '#73e3d3'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(56 + (angleIndex + 0.5) / g.views * 432, 35); ctx.lineTo(56 + (angleIndex + 0.5) / g.views * 432, 445); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '17px system-ui'; ctx.fillText('−1', 16, 48); ctx.fillText('1', 22, 443); ctx.fillText('t', 16, 248); ctx.fillText('0', 56, 473); ctx.fillText('π', 470, 473); ctx.fillText('θ: projection angle', 165, 500);
      note = `Scale [0, ${format(cleanMax)}]. Display clipped: ${below} below, ${above} above.`;
    } else if (kind === 'radial') {
      ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = '#c5d1e0'; ctx.lineWidth = 1;
      for (const radius of [50, 100, 150, 200]) { ctx.beginPath(); ctx.arc(256, 256, radius, 0, 2 * Math.PI); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(35, 256); ctx.lineTo(477, 256); ctx.moveTo(256, 35); ctx.lineTo(256, 477); ctx.stroke();
      ctx.strokeStyle = '#7256a8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(256 - 200 * Math.cos(angle), 256 + 200 * Math.sin(angle)); ctx.lineTo(256 + 200 * Math.cos(angle), 256 - 200 * Math.sin(angle)); ctx.stroke();
      ctx.fillStyle = '#52627a'; ctx.font = '18px system-ui'; ctx.fillText('ξ₁', 477, 282); ctx.fillText('ξ₂', 270, 37); ctx.fillText('Conceptual radial geometry', 127, 500);
      note = `Selected direction θ=${(angle * 180 / Math.PI).toFixed(1)}°. Not a computed 2D spectrum.`;
    }
    canvas.closest('figure')!.querySelector('[data-scale]')!.textContent = note;
  }
}
