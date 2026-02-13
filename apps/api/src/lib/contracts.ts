import { z } from 'zod';

export const targetSchema = z.object({
  kind: z.string(),
  key: z.string().optional(),
});

export const intentPacketSchema = z.object({
  kind: z.literal('intent'),
  schema_version: z.literal('v1').optional(),
  intent_type: z.enum(['create_task', 'update_task']).optional(),
  natural_language: z.string().optional(),
  fields: z.record(z.string(), z.unknown()).optional(),
  source: z.string().optional(),
  target: targetSchema.optional(),
});

export type IntentPacket = z.infer<typeof intentPacketSchema>;
