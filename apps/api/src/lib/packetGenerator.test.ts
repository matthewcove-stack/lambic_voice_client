import { describe, expect, it } from 'vitest';
import { extractJsonObject, generatePacket } from './packetGenerator.js';

describe('extractJsonObject', () => {
  it('parses plain json', () => {
    expect(extractJsonObject('{"a":1}')).toEqual({ a: 1 });
  });

  it('extracts json from wrapped output', () => {
    const parsed = extractJsonObject('Here is JSON:\n{"a":1,"b":2}\nThanks');
    expect(parsed).toEqual({ a: 1, b: 2 });
  });
});

describe('generatePacket', () => {
  it('returns deterministic packet without API key', async () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const result = await generatePacket({ rawText: 'buy eggs' });

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.packet.raw_text).toBe('buy eggs');
    }

    process.env.OPENAI_API_KEY = prev;
  });
});
