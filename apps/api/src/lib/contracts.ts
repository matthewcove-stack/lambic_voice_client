import { z } from 'zod';

export const sourceSchema = z.object({
  channel: z.literal('voice_intake_app'),
  device: z.string().optional(),
  platform: z.string().optional(),
  app_version: z.string().optional(),
});

export const lightIntentPacketSchema = z.object({
  schema_version: z.string(),
  id: z.string(),
  created_at: z.string().datetime(),
  source: sourceSchema,
  raw_text: z.string().min(1),
  language: z.string().optional(),
  clarifications: z.record(z.string(), z.unknown()).optional(),
  attachments: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type LightIntentPacket = z.infer<typeof lightIntentPacketSchema>;
