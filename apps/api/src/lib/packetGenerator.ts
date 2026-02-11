import { randomUUID } from 'node:crypto';
import { lightIntentPacketSchema, type LightIntentPacket } from './contracts.js';

type GeneratePacketInput = {
  rawText: string;
  clarifications?: Record<string, unknown>;
  promptText?: string;
  source?: {
    device?: string;
    platform?: string;
    appVersion?: string;
  };
};

type GeneratePacketResult =
  | { status: 'ok'; packet: LightIntentPacket }
  | { status: 'repair_required'; error: string; raw_output: string };

const OPENAI_RESPONSE_URL = 'https://api.openai.com/v1/responses';

export function extractJsonObject(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('No JSON object found in model output');
    }
    return JSON.parse(match[0]);
  }
}

function buildDeterministicPacket(input: GeneratePacketInput): LightIntentPacket {
  return lightIntentPacketSchema.parse({
    schema_version: '1.0.0',
    id: randomUUID(),
    created_at: new Date().toISOString(),
    source: {
      channel: 'voice_intake_app',
      device: input.source?.device,
      platform: input.source?.platform,
      app_version: input.source?.appVersion ?? 'phase-3',
    },
    raw_text: input.rawText,
    language: 'en',
    clarifications: input.clarifications,
  });
}

export async function generatePacket(input: GeneratePacketInput): Promise<GeneratePacketResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { status: 'ok', packet: buildDeterministicPacket(input) };
  }

  const prompt =
    input.promptText ??
    [
      'Return only valid JSON for Light Intent Packet schema.',
      'Required keys: schema_version,id,created_at,source,raw_text.',
      `Raw text: ${input.rawText}`,
      `Clarifications: ${JSON.stringify(input.clarifications ?? {})}`,
    ].join('\n');

  const response = await fetch(OPENAI_RESPONSE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_PACKET_MODEL ?? 'gpt-4.1-mini',
      input: prompt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Packet generation failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    output_text?: string;
  };

  const rawOutput = payload.output_text ?? '';
  try {
    const parsed = extractJsonObject(rawOutput);
    const packet = lightIntentPacketSchema.parse(parsed);
    return { status: 'ok', packet };
  } catch (error) {
    return {
      status: 'repair_required',
      error: error instanceof Error ? error.message : 'Unknown parse error',
      raw_output: rawOutput,
    };
  }
}
