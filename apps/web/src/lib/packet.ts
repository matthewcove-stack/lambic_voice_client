import { parsePacket } from './schemas';
import type { LightIntentPacket } from './schemas';

export function buildPacket(rawText: string, clarifications?: Record<string, unknown>): LightIntentPacket {
  const trimmed = rawText.trim();
  const packet = {
    schema_version: '1.0.0',
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    source: {
      channel: 'voice_intake_app' as const,
      device: navigator.userAgent,
      platform: navigator.platform,
      app_version: 'phase-1',
    },
    raw_text: trimmed,
    language: 'en',
    clarifications,
  };

  return parsePacket(packet);
}
