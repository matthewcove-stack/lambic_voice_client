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
              kind: 'intent',
              schema_version: 'v1',
              source: 'voice_intake_app',
              intent_type: 'create_task',
              natural_language: 'test',
              fields: { title: 'test' },
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
