import type { CoordinatorState, WorkerPort, WorkerReply, WorkerRequest } from './protocol';
import type { ExperimentConfig } from '../engine/types';
import { validateConfig } from '../engine/config';

export function createCoordinator(makeWorker: () => WorkerPort, onState: (state: CoordinatorState) => void) {
  let worker: WorkerPort | null = null, disposed = false, sequence = 0;
  let active: WorkerRequest | null = null, pending: WorkerRequest | null = null;
  let state: CoordinatorState = { status: 'idle', requested: null, current: null, error: null };
  const emit = (changes: Partial<CoordinatorState>) => { state = { ...state, ...changes }; if (!disposed) onState(state); };
  const close = () => {
    worker?.removeEventListener('message', message);
    worker?.removeEventListener('error', crash);
    worker?.removeEventListener('messageerror', crash);
    worker?.terminate(); worker = null; active = null; pending = null;
  };
  const fail = (error: string) => { close(); emit({ status: 'error', error }); };
  const crash: EventListener = () => fail('The calculation worker stopped. Retry to start a new worker.');
  const send = (request: WorkerRequest) => {
    try {
      if (!worker) {
        worker = makeWorker(); worker.addEventListener('message', message);
        worker.addEventListener('error', crash); worker.addEventListener('messageerror', crash);
      }
      active = request; worker.postMessage(request);
    } catch (error) { fail(error instanceof Error ? error.message : 'Unable to start the calculation worker.'); }
  };
  const message: EventListener = event => {
    if (disposed) return;
    const reply = (event as MessageEvent<WorkerReply>).data;
    if (!active || reply?.id !== active.id) return;
    if (!reply.ok) { fail(reply.message); return; }
    if (pending) {
      const next = pending; pending = null; active = null;
      emit({ status: 'calculating', current: reply.result, error: null });
      send(next); return;
    }
    active = null; emit({ status: 'ready', current: reply.result, error: null });
  };
  const request = (input: ExperimentConfig) => {
    if (disposed) return;
    const config = validateConfig(input), next = { id: ++sequence, config };
    emit({ status: 'calculating', requested: config, error: null });
    if (active) pending = next; else send(next);
  };
  return {
    request,
    retry() { if (!disposed && state.status === 'error' && state.requested) request(state.requested); },
    dispose() { disposed = true; close(); state = { ...state, current: null, requested: null }; },
  };
}
