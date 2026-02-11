import { beforeEach, describe, expect, it } from 'vitest';
import { enqueueSubmission, processQueue, readQueue } from './queue';

describe('queue', () => {
  const packet = {
    schema_version: '1.0.0',
    id: 'p-1',
    created_at: new Date().toISOString(),
    source: { channel: 'voice_intake_app' as const },
    raw_text: 'buy milk',
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('enqueues submissions locally', () => {
    enqueueSubmission(packet, 'buy milk');

    expect(readQueue()).toHaveLength(1);
  });

  it('drains queue after successful processing', async () => {
    enqueueSubmission(packet, 'buy milk');

    const remaining = await processQueue(async () => {});

    expect(remaining).toHaveLength(0);
    expect(readQueue()).toHaveLength(0);
  });
});
