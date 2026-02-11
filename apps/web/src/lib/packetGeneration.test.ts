import { describe, expect, it, vi } from 'vitest';
import { generatePacketFromText } from './packetGeneration';

describe('generatePacketFromText', () => {
  it('returns parsed packet on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            status: 'ok',
            packet: {
              schema_version: '1.0.0',
              id: 'p1',
              created_at: new Date().toISOString(),
              source: { channel: 'voice_intake_app' },
              raw_text: 'test',
            },
          }),
          { status: 200 },
        ),
      ),
    );

    const result = await generatePacketFromText('test');
    expect(result.status).toBe('ok');
  });

  it('surfaces repair-required payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({ status: 'repair_required', error: 'bad json', raw_output: '{oops' }),
          { status: 200 },
        ),
      ),
    );

    const result = await generatePacketFromText('test');
    expect(result.status).toBe('repair_required');
  });
});
