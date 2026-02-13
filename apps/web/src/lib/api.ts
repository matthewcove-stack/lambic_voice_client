import { parseNormaliserResponse } from './schemas';
import { parseClarificationAnswerRequest } from './schemas';
import type { ClarificationAnswerRequest, IntentPacket, NormaliserResponse } from './schemas';

const BASE_URL = import.meta.env.VITE_NORMALISER_BASE_URL ?? 'http://localhost:8000';

function buildAuthHeaders(): Record<string, string> {
  const bearerToken = import.meta.env.VITE_NORMALISER_BEARER_TOKEN ?? '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (!bearerToken) {
    throw new Error('Missing VITE_NORMALISER_BEARER_TOKEN');
  }
  headers.Authorization = `Bearer ${bearerToken}`;
  return headers;
}

export async function submitToNormaliser(packet: IntentPacket): Promise<NormaliserResponse> {
  if (!BASE_URL) {
    throw new Error('Missing VITE_NORMALISER_BASE_URL');
  }

  const response = await fetch(`${BASE_URL}/v1/intents`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(packet),
  });

  if (!response.ok) {
    throw new Error(`Normaliser request failed with ${response.status}`);
  }

  const payload: unknown = await response.json();
  return parseNormaliserResponse(payload);
}

export async function submitClarificationAnswer(
  clarificationId: string,
  answer: ClarificationAnswerRequest,
): Promise<NormaliserResponse> {
  if (!BASE_URL) {
    throw new Error('Missing VITE_NORMALISER_BASE_URL');
  }

  const parsedAnswer = parseClarificationAnswerRequest(answer);
  const response = await fetch(`${BASE_URL}/v1/clarifications/${clarificationId}/answer`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: JSON.stringify(parsedAnswer),
  });

  if (!response.ok) {
    throw new Error(`Clarification answer failed with ${response.status}`);
  }

  const payload: unknown = await response.json();
  return parseNormaliserResponse(payload);
}
