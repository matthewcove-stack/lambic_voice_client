import { beforeEach, describe, expect, it } from 'vitest';
import { logTelemetry, readTelemetry, redactSecrets } from './telemetry';

describe('telemetry', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redacts known secret patterns', () => {
    expect(redactSecrets('api_key=sk-abcdef')).toContain('[REDACTED]');
  });

  it('stores redacted telemetry locally', () => {
    logTelemetry('packet_error', { message: 'Token sk-secret should hide' });

    const entries = readTelemetry();
    expect(entries).toHaveLength(1);
    expect(JSON.stringify(entries[0])).not.toContain('sk-secret');
  });
});
