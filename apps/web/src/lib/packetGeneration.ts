import { buildLightIntentPrompt } from '../prompts/lightIntentPrompt';
import { parsePacket, type IntentPacket } from './schemas';

const LLM_BASE_URL = import.meta.env.VITE_PACKET_BASE_URL ?? import.meta.env.VITE_TRANSCRIBE_BASE_URL ?? 'http://localhost:8787';

type GeneratePacketResponse =
  | { status: 'ok'; packet: IntentPacket; confidence?: number; clarifying_questions?: string[] }
  | { status: 'repair_required'; error: string; raw_output: string };

export async function generatePacketFromText(
  rawText: string,
  clarifications?: Record<string, unknown>,
): Promise<GeneratePacketResponse> {
  const response = await fetch(`${LLM_BASE_URL}/v1/generate-packet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw_text: rawText,
      clarifications,
      prompt: buildLightIntentPrompt(rawText, clarifications),
      source: {
        device: navigator.userAgent,
        platform: navigator.platform,
        appVersion: 'phase-3',
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Packet generation request failed with ${response.status}`);
  }

  const payload = (await response.json()) as GeneratePacketResponse;
  if (payload.status === 'ok') {
    return { status: 'ok', packet: parsePacket(payload.packet) };
  }
  return payload;
}
