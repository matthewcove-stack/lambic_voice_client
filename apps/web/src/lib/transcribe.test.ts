import { beforeEach, describe, expect, it, vi } from 'vitest';
import { transcribeBlob } from './transcribe';

describe('transcribeBlob', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns transcript from API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ transcript: 'buy milk' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const transcript = await transcribeBlob(new Blob(['audio']));

    expect(transcript).toBe('buy milk');
  });

  it('throws on non-200 responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));

    await expect(transcribeBlob(new Blob(['audio']))).rejects.toThrow('Transcription request failed');
  });
});
