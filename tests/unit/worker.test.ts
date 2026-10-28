import { expect, it } from 'vitest';
import { calculateReply, transferableBuffers } from '../../src/worker/handler';
import { DEFAULT_CONFIG } from '../../src/engine/config';
it('validates worker requests and transfers each actual result buffer once', () => {
  const reply = calculateReply({ id: 7, config: { ...DEFAULT_CONFIG, views: 12 } });
  expect(reply.ok).toBe(true); expect(reply.id).toBe(7);
  if (!reply.ok) throw new Error(reply.message);
  const buffers = transferableBuffers(reply.result);
  expect(new Set(buffers).size).toBe(buffers.length);
  expect(buffers).toContain(reply.result.reference.buffer);
  const clone = structuredClone(reply, { transfer: buffers });
  expect(reply.result.reference.byteLength).toBe(0);
  expect(clone.result.reference.length).toBe(16384);
  expect(clone.result.noisy.length).toBe(1536);
  expect(calculateReply({ id: 8, config: { ...DEFAULT_CONFIG, views: 0 } } as never)).toMatchObject({ id: 8, ok: false });
});
