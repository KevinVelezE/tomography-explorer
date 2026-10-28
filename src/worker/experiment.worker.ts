import { calculateReply, transferableBuffers } from './handler';
import type { WorkerRequest } from './protocol';
self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const reply = calculateReply(event.data);
  self.postMessage(reply, { transfer: reply.ok ? transferableBuffers(reply.result) : [] });
});
