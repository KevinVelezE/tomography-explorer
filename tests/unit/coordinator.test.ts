import { expect, it } from 'vitest';
import { createCoordinator } from '../../src/worker/coordinator';
import { DEFAULT_CONFIG } from '../../src/engine/config';
import { runExperiment } from '../../src/engine/experiment';
import type { CoordinatorState, WorkerPort, WorkerReply, WorkerRequest } from '../../src/worker/protocol';

class Transport extends EventTarget {
  sent: WorkerRequest[] = [];
  terminated = false;
  postMessage(request: WorkerRequest) { this.sent.push(request); }
  terminate() { this.terminated = true; }
  reply(reply: WorkerReply) { this.dispatchEvent(new MessageEvent('message', { data: reply })); }
}
function setup() {
  const ports: Transport[] = [], states: CoordinatorState[] = [];
  const coordinator = createCoordinator(() => { const p = new Transport(); ports.push(p); return p as unknown as WorkerPort; }, state => states.push(state));
  return { ports, states, coordinator };
}
const result = runExperiment({ ...DEFAULT_CONFIG, views: 12 });
it('publishes completed previews, skips replaced work and reserves ready for the latest request', () => {
  const { ports, states, coordinator } = setup();
  const a = { ...DEFAULT_CONFIG, seed: 1 }, b = { ...DEFAULT_CONFIG, seed: 2 }, c = { ...DEFAULT_CONFIG, seed: 3 };
  coordinator.request(a); coordinator.request(b); coordinator.request(c);
  const p = ports[0]; expect(p.sent.map(r => r.config.seed)).toEqual([1]);
  p.reply({ id: p.sent[0].id, ok: true, result: { ...result, config: a } });
  expect(states.at(-1)?.status).toBe('calculating'); expect(states.some(s => s.status === 'ready')).toBe(false);
  expect(states.at(-1)).toMatchObject({ current: { config: a }, requested: c });
  expect(p.sent.map(r => r.config.seed)).toEqual([1, 3]);
  p.reply({ id: p.sent[0].id, ok: true, result: { ...result, config: a } });
  expect(states.at(-1)?.status).toBe('calculating');
  p.reply({ id: p.sent[1].id, ok: true, result: { ...result, config: c } });
  expect(states.at(-1)).toMatchObject({ status: 'ready', current: { config: c }, requested: c, error: null });
});
it('keeps an older-view preview coherent while a reduced acquisition is pending', () => {
  const { ports, states, coordinator } = setup();
  const first = { ...DEFAULT_CONFIG }, last = { ...DEFAULT_CONFIG, views: 12 as const };
  const originalAcquisition = runExperiment(first);
  coordinator.request(first); coordinator.request(last);
  ports[0].reply({ id: ports[0].sent[0].id, ok: true, result: originalAcquisition });
  expect(states.at(-1)).toMatchObject({ status: 'calculating', requested: last, current: { config: first, grid: { views: 180 } } });
  expect(states.at(-1)?.current?.noisy.length).toBe(128 * 180);
  ports[0].reply({ id: ports[0].sent[1].id, ok: true, result: { ...result, config: last } });
  expect(states.at(-1)).toMatchObject({ status: 'ready', requested: last, current: { config: last } });
});
it.each(['reply', 'error', 'messageerror'])('recovers from %s failure with a fresh worker and latest configuration', kind => {
  const { ports, states, coordinator } = setup();
  coordinator.request(DEFAULT_CONFIG); coordinator.request({ ...DEFAULT_CONFIG, seed: 9 });
  if (kind === 'reply') ports[0].reply({ id: ports[0].sent[0].id, ok: false, message: 'Calculation failed' });
  else ports[0].dispatchEvent(new Event(kind));
  expect(states.at(-1)?.status).toBe('error'); expect(ports[0].terminated).toBe(true);
  coordinator.retry(); expect(ports.length).toBe(2); expect(ports[1].sent[0].config.seed).toBe(9);
  ports[1].reply({ id: ports[1].sent[0].id, ok: true, result: { ...result, config: { ...DEFAULT_CONFIG, seed: 9 } } });
  expect(states.at(-1)?.status).toBe('ready');
});
it('ignores late replies and requests after disposal', () => {
  const { ports, states, coordinator } = setup(); coordinator.request(DEFAULT_CONFIG);
  coordinator.dispose(); const count = states.length;
  ports[0].reply({ id: ports[0].sent[0].id, ok: true, result });
  coordinator.request(DEFAULT_CONFIG); coordinator.retry();
  expect(states.length).toBe(count); expect(ports[0].terminated).toBe(true); expect(ports.length).toBe(1);
});
