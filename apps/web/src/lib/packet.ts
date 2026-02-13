import { parsePacket } from './schemas';
import type { IntentPacket } from './schemas';

export type Destination = 'task' | 'shopping_list' | 'note';

export function buildPacket(
  rawText: string,
  destination: Destination,
  clarifications?: Record<string, unknown>,
): IntentPacket {
  const trimmed = rawText.trim();
  const base = {
    kind: 'intent' as const,
    schema_version: 'v1' as const,
    source: 'voice_intake_app',
    natural_language: trimmed,
  };

  const packet =
    destination === 'shopping_list'
      ? {
          ...base,
          target: { kind: 'list', key: 'shopping_list' },
          fields: {
            item: trimmed,
            ...(clarifications ?? {}),
          },
        }
      : destination === 'note'
        ? {
            ...base,
            target: { kind: 'notes' },
            fields: {
              content: trimmed,
              ...(clarifications ?? {}),
            },
          }
        : {
            ...base,
            intent_type: 'create_task' as const,
            fields: {
              title: trimmed,
              ...(clarifications ?? {}),
            },
          };

  return parsePacket(packet);
}
