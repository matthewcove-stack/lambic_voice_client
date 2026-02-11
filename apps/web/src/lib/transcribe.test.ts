import { beforeEach, describe, expect, it, vi } from 'vitest';
import { transcribeAudio } from './transcribe';

describe('transcribeAudio', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns transcript from API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ text: 'buy milk' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const result = await transcribeAudio({ baseUrl: 'http://localhost:8787', blob: new Blob(['audio']) });

    expect(result.text).toBe('buy milk');
  });

  it('throws on non-200 responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));

    await expect(transcribeAudio({ baseUrl: 'http://localhost:8787', blob: new Blob(['audio']) })).rejects.toThrow(
      'Transcription failed',
    );
  });
});
