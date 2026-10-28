import { DEFAULT_CONFIG, validateConfig } from '../engine/config';
import type { EngineResult, ViewState } from '../engine/types';
import { createCoordinator } from '../worker/coordinator';
import type { CoordinatorState } from '../worker/protocol';
import { renderPlots } from './plots';
import { serializeExperiment } from './export';
import { createRequestScheduler } from './request-scheduler';

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const input = (id: string) => el<HTMLInputElement>(id);
let view: ViewState = { step: 0, angleIndex: 0, filter: 'ramp' };
let current: EngineResult | null = null, ready = false, inputValid = true;
let desired = { ...DEFAULT_CONFIG };
const root = el('workspace');

function labelPreview(status: 'ready' | 'calculating' | 'error') {
  const c = current?.config;
  const shown = c ? `Displayed: ${c.phantom}; ${c.views} views; noise ${c.noiseLevel.toFixed(3)}; seed ${c.seed}; Hann α ${c.alpha.toFixed(2)}.` : 'No completed image yet.';
  const prefix = status === 'ready' ? 'Ready. ' : status === 'error' ? 'Paused. ' : 'Updating… ';
  document.querySelectorAll<HTMLElement>('[data-preview-label]').forEach(label => { label.textContent = prefix + shown; });
}

function draw() {
  if (!current) return;
  renderPlots(root, current, view, Number(input('detector').value));
  for (const kind of ['ramp', 'hann'] as const) {
    const metric = current.metrics[kind];
    el(`${kind}-rmse`).textContent = metric.rmse.toFixed(5);
    el(`${kind}-relative`).textContent = metric.relativeL2 === null ? 'undefined' : metric.relativeL2.toFixed(5);
    el(`${kind}-count`).textContent = String(metric.sampleCount);
  }
}
function viewControls() {
  el('geometry-controls').hidden = ![0, 1, 3, 4].includes(view.step);
  el('detector-control').hidden = view.step !== 0;
  el('filter-controls').hidden = view.step < 4;
  el('noise-controls').hidden = view.step !== 5;
  el('metrics').hidden = view.step < 4 || !current;
  input('angle').max = String((current?.config.views ?? desired.views) - 1);
  input('angle').value = String(view.angleIndex);
  el<HTMLOutputElement>('angle-value').value = `${(view.angleIndex * 180 / (current?.config.views ?? desired.views)).toFixed(1)}°`;
  el<HTMLOutputElement>('detector-value').value = ((Number(input('detector').value) - 64) / 64).toFixed(3);
}
function navigate(step: number, focus = true) {
  view.step = Math.max(0, Math.min(5, step));
  document.querySelectorAll<HTMLElement>('[data-chapter]').forEach(section => { section.hidden = Number(section.dataset.chapter) !== view.step; });
  document.querySelectorAll<HTMLButtonElement>('[data-step]').forEach(button => {
    if (Number(button.dataset.step) === view.step) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
  });
  const chapter = document.querySelector(`[data-chapter="${view.step}"]`)!;
  chapter.querySelector('[data-controls-slot]')!.append(el('experiment-controls'));
  if (view.step === 5) chapter.querySelector('[data-filter-choice-slot]')!.append(el('filter-choice-control'));
  else el('filter-controls').prepend(el('filter-choice-control'));
  chapter.querySelector('[data-state-slot]')!.append(el('calculation'));
  chapter.querySelector('[data-metrics-slot]')!.append(el('metrics'));
  el('chapter-progress').textContent = `Step ${view.step + 1} of 6`; el('footer-progress').textContent = `${view.step + 1} / 6`;
  el<HTMLButtonElement>('previous').disabled = view.step === 0; el<HTMLButtonElement>('next').disabled = view.step === 5;
  viewControls(); if (focus) el(`title-${view.step}`).focus();
}
function update(state: CoordinatorState) {
  if (!inputValid) return;
  ready = state.status === 'ready' && JSON.stringify(state.current?.config) === JSON.stringify(desired);
  const status = state.status === 'error' ? 'error' : ready ? 'ready' : 'calculating';
  el('experiment-status').dataset.status = status;
  el('calculation').setAttribute('aria-busy', String(status === 'calculating'));
  el<HTMLButtonElement>('export').disabled = !ready;
  el('retry').hidden = state.status !== 'error';
  if (state.current && state.current !== current && state.status !== 'error') {
    current = state.current; view.angleIndex = Math.min(view.angleIndex, current.config.views - 1);
    const c = current.config;
    el('experiment-summary').textContent = `${c.phantom}; ${c.views} views; noise ${c.noiseLevel.toFixed(3)}; seed ${c.seed}; Hann α ${c.alpha.toFixed(2)}; 128 × 128. Computed in ${current.computeMs.toFixed(1)} ms.`;
    el('experiment-summary').dataset.computeMs = String(current.computeMs);
    viewControls(); draw();
  }
  if (state.status === 'error') {
    scheduler.cancel();
    el('experiment-status').textContent = `${state.error} Panels retain the last completed snapshot. Navigation remains available.`;
  } else el('experiment-status').textContent = ready ? 'Ready. All panels show the confirmed experiment.' : current ? 'Updating… Preview and metrics use the completed parameters below, not the pending controls. Export is disabled.' : 'Calculating the initial experiment…';
  labelPreview(status);
}
const coordinator = createCoordinator(() => {
  if (!('Worker' in window)) throw new Error('Web Workers are unavailable. Use a browser with JavaScript and Web Worker support.');
  return new Worker(new URL('../worker/experiment.worker.ts', import.meta.url), { type: 'module' });
}, update);
const scheduler = createRequestScheduler(config => coordinator.request(config));

function schedule() {
  inputValid = false; ready = false; el<HTMLButtonElement>('export').disabled = true;
  try {
    desired = validateConfig({ n: 128, phantom: input('phantom').value, views: Number(input('views').value), noiseLevel: Number(input('noise').value), seed: input('seed').value === '' ? NaN : Number(input('seed').value), alpha: Number(input('alpha').value) });
    inputValid = true;
    el('input-error').hidden = true;
    el<HTMLOutputElement>('noise-value').value = desired.noiseLevel.toFixed(3); el<HTMLOutputElement>('alpha-value').value = desired.alpha.toFixed(2);
    el('experiment-status').dataset.status = 'calculating'; el('calculation').setAttribute('aria-busy', 'true');
    el('experiment-status').textContent = current ? 'Updating… Preview and metrics use the completed parameters below, not the pending controls. Export is disabled.' : 'Calculating…';
    labelPreview('calculating');
    scheduler.schedule(desired);
  } catch (error) {
    scheduler.cancel();
    el('input-error').hidden = false; el('input-error').textContent = error instanceof Error ? error.message : 'Invalid parameters.';
    el('experiment-status').dataset.status = 'error'; el('calculation').setAttribute('aria-busy', 'false');
    el('experiment-status').textContent = 'Correct the invalid parameter. Panels show the previous confirmed experiment.';
    labelPreview('error');
  }
}
for (const id of ['phantom', 'views', 'noise', 'alpha', 'seed']) input(id).addEventListener('input', schedule);
input('angle').addEventListener('input', () => { view.angleIndex = Number(input('angle').value); viewControls(); draw(); });
input('detector').addEventListener('input', () => { viewControls(); draw(); });
input('filter').addEventListener('change', () => { view.filter = input('filter').value as ViewState['filter']; draw(); });
document.querySelectorAll<HTMLButtonElement>('[data-step]').forEach(button => button.addEventListener('click', () => navigate(Number(button.dataset.step))));
el('previous').addEventListener('click', () => navigate(view.step - 1)); el('next').addEventListener('click', () => navigate(view.step + 1));
el('retry').addEventListener('click', () => { if (inputValid) { scheduler.cancel(); coordinator.request(desired); } });
el('export').addEventListener('click', () => {
  if (!ready || !current) return;
  const url = URL.createObjectURL(new Blob([serializeExperiment(current, view)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'tomography-experiment.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
window.addEventListener('pagehide', event => {
  // A persisted page is frozen, not destroyed: its worker and queued intent
  // must remain usable when the browser restores the same document.
  if (!event.persisted) { scheduler.dispose(); coordinator.dispose(); }
});
navigate(0, false); coordinator.request(desired);
