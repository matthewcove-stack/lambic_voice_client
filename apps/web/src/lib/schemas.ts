import { z } from 'zod';

export const sourceSchema = z.object({
  channel: z.literal('voice_intake_app'),
  device: z.string().optional(),
  platform: z.string().optional(),
  app_version: z.string().optional(),
});

export const attachmentSchema = z.object({
  type: z.enum(['audio', 'image', 'file']),
  uri: z.string(),
  mime_type: z.string().optional(),
  sha256: z.string().optional(),
});

export const lightIntentPacketSchema = z.object({
  schema_version: z.string(),
  id: z.string(),
  created_at: z.iso.datetime(),
  source: sourceSchema,
  raw_text: z.string().min(1),
  language: z.string().optional(),
  clarifications: z.record(z.string(), z.unknown()).optional(),
  attachments: z.array(attachmentSchema).optional(),
});

export const clarificationQuestionSchema = z.object({
  key: z.string(),
  prompt: z.string(),
  type: z.enum(['string', 'choice', 'boolean', 'number', 'project_ref']),
  choices: z.array(z.string()).optional(),
});

export const clarificationSchema = z
  .object({
    questions: z.array(clarificationQuestionSchema),
  })
  .nullable()
  .optional();

export const normaliserResponseSchema = z.object({
  status: z.enum(['accepted', 'needs_clarification', 'rejected', 'error']),
  request_id: z.string(),
  message: z.string().optional(),
  result: z.record(z.string(), z.unknown()).nullable().optional(),
  clarification: clarificationSchema,
});

export type LightIntentPacket = z.infer<typeof lightIntentPacketSchema>;
export type ClarificationQuestion = z.infer<typeof clarificationQuestionSchema>;
export type NormaliserResponse = z.infer<typeof normaliserResponseSchema>;

export function parsePacket(input: unknown): LightIntentPacket {
  return lightIntentPacketSchema.parse(input);
}

export function parseNormaliserResponse(input: unknown): NormaliserResponse {
  return normaliserResponseSchema.parse(input);
}
