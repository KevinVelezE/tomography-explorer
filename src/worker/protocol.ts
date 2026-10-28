import type { EngineResult, ExperimentConfig } from '../engine/types';
export type WorkerRequest = { id: number; config: ExperimentConfig };
export type WorkerReply = { id: number; ok: true; result: EngineResult } | { id: number; ok: false; message: string };
export type WorkerPort = Pick<Worker, 'postMessage' | 'terminate' | 'addEventListener' | 'removeEventListener'>;
// current is the last completed snapshot; only ready guarantees it is requested.
export type CoordinatorState = { status: 'idle' | 'calculating' | 'ready' | 'error'; requested: ExperimentConfig | null; current: EngineResult | null; error: string | null };
