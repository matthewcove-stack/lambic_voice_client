import { parsePacket } from './schemas';
import type { IntentPacket } from './schemas';

export function buildPacket(rawText: string, clarifications?: Record<string, unknown>): IntentPacket {
  const trimmed = rawText.trim();
  const packet = {
    kind: 'intent' as const,
    schema_version: 'v1' as const,
    intent_type: 'create_task' as const,
    source: 'voice_intake_app',
    natural_language: trimmed,
    fields: {
      title: trimmed,
      ...(clarifications ?? {}),
    },
  };

  return parsePacket(packet);
}
