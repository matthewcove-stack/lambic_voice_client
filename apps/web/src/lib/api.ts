import { parseNormaliserResponse } from './schemas';
import type { LightIntentPacket, NormaliserResponse } from './schemas';

const BASE_URL = import.meta.env.VITE_NORMALISER_BASE_URL ?? 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_NORMALISER_API_KEY ?? '';

export async function submitToNormaliser(packet: LightIntentPacket): Promise<NormaliserResponse> {
  if (!BASE_URL) {
    throw new Error('Missing VITE_NORMALISER_BASE_URL');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }

  const response = await fetch(`${BASE_URL}/v1/normalise`, {
    method: 'POST',
    headers,
    body: JSON.stringify(packet),
  });

  if (!response.ok) {
    throw new Error(`Normaliser request failed with ${response.status}`);
  }

  const payload: unknown = await response.json();
  return parseNormaliserResponse(payload);
}
