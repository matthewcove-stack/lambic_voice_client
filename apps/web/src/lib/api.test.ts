import { describe, expect, it, vi } from 'vitest';
import { submitClarificationAnswer, submitToNormaliser } from './api';

describe('submitToNormaliser', () => {
  it('sends request and parses response', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ status: 'accepted', intent_id: 'intent-1', correlation_id: 'corr-1' }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_NORMALISER_BEARER_TOKEN', 'token');

    const response = await submitToNormaliser({
      kind: 'intent',
      schema_version: 'v1',
      intent_type: 'create_task',
      fields: { title: 'test' },
    });

    expect(response.status).toBe('accepted');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('posts clarification answer', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ status: 'executed', intent_id: 'intent-1', correlation_id: 'corr-1' }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_NORMALISER_BEARER_TOKEN', 'token');

    const response = await submitClarificationAnswer('clar-1', { answer_text: 'Tomorrow' });

    expect(response.status).toBe('executed');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
