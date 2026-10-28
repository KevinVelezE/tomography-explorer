import type { ExperimentConfig } from '../engine/types';
export function createRequestScheduler(submit: (config: ExperimentConfig) => void, intervalMs = 150) {
  let lastSent = -Infinity, pending: ExperimentConfig | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined, disposed = false;
  const flush = () => {
    timer = undefined;
    if (disposed || !pending) return;
    const config = pending; pending = null; lastSent = Date.now(); submit(config);
  };
  const cancel = () => { clearTimeout(timer); timer = undefined; pending = null; };
  return {
    schedule(config: ExperimentConfig) {
      if (disposed) return;
      pending = { ...config };
      if (timer !== undefined) return;
      const remaining = intervalMs - (Date.now() - lastSent);
      if (remaining <= 0) flush(); else timer = setTimeout(flush, remaining);
    },
    cancel,
    dispose() { disposed = true; cancel(); },
  };
}
