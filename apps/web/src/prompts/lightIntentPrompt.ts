export function buildLightIntentPrompt(rawText: string, clarifications?: Record<string, unknown>): string {
  return [
    'You are a strict JSON generator for Light Intent Packet schema.',
    'Return only a JSON object with required keys.',
    `raw_text: ${rawText}`,
    `clarifications: ${JSON.stringify(clarifications ?? {})}`,
  ].join('\n');
}
