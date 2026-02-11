import { describe, expect, it } from 'vitest';
import { parseNormaliserResponse, parsePacket } from './schemas';

describe('schemas', () => {
  it('validates a light intent packet', () => {
    const packet = parsePacket({
      schema_version: '1.0.0',
      id: 'abc-123',
      created_at: new Date().toISOString(),
      source: { channel: 'voice_intake_app' },
      raw_text: 'Add milk to my shopping list',
    });

    expect(packet.raw_text).toContain('milk');
  });

  it('validates clarification response payload', () => {
    const response = parseNormaliserResponse({
      status: 'needs_clarification',
      request_id: 'req-1',
      clarification: {
        questions: [
          {
            key: 'list_name',
            prompt: 'Which list?',
            type: 'choice',
            choices: ['shopping', 'work'],
          },
        ],
      },
    });

    expect(response.clarification?.questions).toHaveLength(1);
  });
});
