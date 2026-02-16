import { z } from 'zod';

export const intentPacketSchema = z.object({
  kind: z.literal('intent'),
  schema_version: z.literal('v1').optional(),
  intent_type: z.enum(['create_task', 'update_task']).optional(),
  natural_language: z.string().optional(),
  fields: z.record(z.string(), z.unknown()).optional(),
  source: z.string().optional(),
  target: z
    .object({
      kind: z.string(),
      key: z.string().optional(),
    })
    .optional(),
});

export const clarificationCandidateSchema = z.object({
  id: z.string(),
  label: z.string(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const clarificationSchema = z
  .object({
    clarification_id: z.string(),
    intent_id: z.string(),
    question: z.string(),
    expected_answer_type: z.enum(['choice', 'free_text', 'date', 'datetime']),
    candidates: z.array(clarificationCandidateSchema),
    status: z.enum(['open', 'answered', 'expired']),
    answer: z.record(z.string(), z.unknown()).optional(),
    answered_at: z.iso.datetime().optional(),
  })
  .optional();

export const actionPacketSchema = z.object({
  kind: z.literal('action'),
  action: z.string().optional(),
  intent_id: z.string().optional(),
  correlation_id: z.string().optional(),
  idempotency_key: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const planSchema = z.object({
  actions: z.array(actionPacketSchema),
});

export const errorSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const normaliserResponseSchema = z
  .object({
    status: z.enum(['ready', 'needs_clarification', 'rejected', 'accepted', 'executed', 'failed']),
    intent_id: z.string(),
    correlation_id: z.string(),
    receipt_id: z.string().nullable().optional(),
    trace_id: z.string().nullable().optional(),
    idempotency_key: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
    error_code: z.string().nullable().optional(),
    details: z.record(z.string(), z.unknown()).nullable().optional(),
    plan: planSchema.nullable().optional(),
    clarification: clarificationSchema.nullable(),
    error: errorSchema.nullable().optional(),
  })
  .passthrough();

export const clarificationAnswerRequestSchema = z
  .object({
    choice_id: z.string().optional(),
    answer_text: z.string().optional(),
  })
  .refine((value) => Boolean(value.choice_id || value.answer_text), {
    message: 'choice_id or answer_text is required',
  });

export type IntentPacket = z.infer<typeof intentPacketSchema>;
export type Clarification = z.infer<typeof clarificationSchema>;
export type NormaliserResponse = z.infer<typeof normaliserResponseSchema>;
export type ClarificationAnswerRequest = z.infer<typeof clarificationAnswerRequestSchema>;

export function parsePacket(input: unknown): IntentPacket {
  return intentPacketSchema.parse(input);
}

export function parseNormaliserResponse(input: unknown): NormaliserResponse {
  return normaliserResponseSchema.parse(input);
}

export function parseClarificationAnswerRequest(input: unknown): ClarificationAnswerRequest {
  return clarificationAnswerRequestSchema.parse(input);
}
