import { describe, expect, it } from 'vitest';
import { parseNormaliserResponse, parsePacket } from './schemas';

describe('schemas', () => {
  it('validates an intent packet', () => {
    const packet = parsePacket({
      kind: 'intent',
      schema_version: 'v1',
      intent_type: 'create_task',
      natural_language: 'Add milk to my shopping list',
      fields: { title: 'Add milk to my shopping list' },
    });

    expect(packet.natural_language).toContain('milk');
  });

  it('validates clarification response payload', () => {
    const response = parseNormaliserResponse({
      status: 'needs_clarification',
      intent_id: 'intent-1',
      correlation_id: 'corr-1',
      clarification: {
        clarification_id: 'clar-1',
        intent_id: 'intent-1',
        question: 'Which list?',
        expected_answer_type: 'choice',
        candidates: [
          { id: 'shopping', label: 'shopping' },
          { id: 'work', label: 'work' },
        ],
        status: 'open',
      },
    });

    expect(response.clarification?.candidates).toHaveLength(2);
  });
});
