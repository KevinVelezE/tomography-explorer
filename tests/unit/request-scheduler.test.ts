import { afterEach, expect, it, vi } from 'vitest';
import { createRequestScheduler } from '../../src/ui/request-scheduler';
import { DEFAULT_CONFIG } from '../../src/engine/config';

afterEach(() => vi.useRealTimers());
it('submits during sustained input instead of waiting for a quiet interval', () => {
  vi.useFakeTimers(); vi.setSystemTime(0);
  const sent: { time: number; seed: number }[] = [];
  const scheduler = createRequestScheduler(c => sent.push({ time: Date.now(), seed: c.seed }));
  scheduler.schedule({ ...DEFAULT_CONFIG, seed: 0 });
  expect(sent).toEqual([{ time: 0, seed: 0 }]);
  for (let seed = 1; seed <= 15; seed++) {
    vi.advanceTimersByTime(40); scheduler.schedule({ ...DEFAULT_CONFIG, seed });
  }
  expect(sent.length).toBeGreaterThanOrEqual(4);
  expect(sent.some(s => s.time > 0 && s.time < 600)).toBe(true);
  vi.advanceTimersByTime(150);
  expect(sent.at(-1)?.seed).toBe(15);
  for (let i = 1; i < sent.length; i++) expect(sent[i].time - sent[i - 1].time).toBeGreaterThanOrEqual(150);
  scheduler.dispose();
});
it('cancels pending input and releases work permanently on disposal', () => {
  vi.useFakeTimers(); vi.setSystemTime(0);
  const seeds: number[] = [], scheduler = createRequestScheduler(c => seeds.push(c.seed));
  scheduler.schedule({ ...DEFAULT_CONFIG, seed: 1 });
  scheduler.schedule({ ...DEFAULT_CONFIG, seed: 2 }); scheduler.cancel();
  vi.advanceTimersByTime(200); expect(seeds).toEqual([1]);
  scheduler.schedule({ ...DEFAULT_CONFIG, seed: 3 });
  scheduler.schedule({ ...DEFAULT_CONFIG, seed: 4 }); scheduler.dispose();
  vi.advanceTimersByTime(200); scheduler.schedule({ ...DEFAULT_CONFIG, seed: 5 });
  expect(seeds).toEqual([1, 3]);
});
