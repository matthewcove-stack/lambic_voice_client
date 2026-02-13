import { beforeEach, describe, expect, it } from 'vitest';
import { enqueueSubmission, processQueue, readQueue } from './queue';

describe('queue', () => {
  const packet = {
    kind: 'intent' as const,
    schema_version: 'v1' as const,
    intent_type: 'create_task' as const,
    source: 'voice_intake_app',
    natural_language: 'buy milk',
    fields: { title: 'buy milk' },
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
