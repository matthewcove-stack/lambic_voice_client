import { describe, expect, it, vi } from 'vitest';
import { submitToNormaliser } from './api';

describe('submitToNormaliser', () => {
  it('sends request and parses response', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ status: 'accepted', request_id: 'r1' }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await submitToNormaliser({
      schema_version: '1.0.0',
      id: '1',
      created_at: new Date().toISOString(),
      source: { channel: 'voice_intake_app' },
      raw_text: 'test',
    });

    expect(response.status).toBe('accepted');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
