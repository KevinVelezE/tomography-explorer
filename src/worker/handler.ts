import type { EngineResult } from '../engine/types';
import type { WorkerReply, WorkerRequest } from './protocol';
import { runExperiment } from '../engine/experiment';
export function calculateReply(request: WorkerRequest): WorkerReply {
  try {
    if (!Number.isSafeInteger(request?.id) || request.id < 1) throw new Error('Invalid calculation request.');
    return { id: request.id, ok: true, result: runExperiment(request.config) };
  } catch (error) { return { id: request?.id, ok: false, message: error instanceof Error ? error.message : 'Calculation failed.' }; }
}
export function transferableBuffers(result: EngineResult): ArrayBuffer[] {
  const buffers = new Set<ArrayBuffer>();
  const visit = (value: unknown) => {
    if (value instanceof Float64Array) buffers.add(value.buffer as ArrayBuffer);
    else if (value && typeof value === 'object') for (const child of Object.values(value)) visit(child);
  };
  visit(result); return [...buffers];
}
