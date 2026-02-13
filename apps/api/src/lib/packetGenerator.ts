import { intentPacketSchema, type IntentPacket } from "./contracts.js";

type GeneratePacketInput = {
  rawText: string;
  clarifications?: Record<string, unknown>;
  source?: {
    device?: string;
    platform?: string;
    appVersion?: string;
  };
};

export type GeneratePacketResult =
  | {
      status: "ok";
      packet: IntentPacket;
      confidence: number;
      clarifying_questions: string[];
    }
  | { status: "repair_required"; error: string; raw_output: string };

const OPENAI_RESPONSE_PATH = "/responses";
const MAX_ATTEMPTS = 2;

export function extractJsonObject(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No JSON object found in model output");
    }
    return JSON.parse(match[0]);
  }
}

function buildDeterministicPacket(input: GeneratePacketInput): IntentPacket {
  return intentPacketSchema.parse({
    kind: "intent",
    schema_version: "v1",
    intent_type: "create_task",
    natural_language: input.rawText,
    source: "voice_intake_app",
    fields: {
      title: input.rawText,
      ...(input.clarifications ?? {}),
    },
  });
}

function systemPrompt(rawText: string, clarifications?: Record<string, unknown>): string {
  return [
    "Return only valid JSON. No markdown.",
    "Output must validate against this shape:",
    '{"kind":"intent","schema_version":"v1","intent_type":"create_task|update_task(optional)","natural_language":"string(optional)","source":"voice_intake_app(optional)","fields":{"..."},"target":{"kind":"...","key":"...(optional)"} }',
    "If text looks like a shopping list item, use target {kind:\"list\",key:\"shopping_list\"}.",
    "If text looks like a note, use target {kind:\"notes\"}.",
    "Otherwise use create_task with fields.title.",
    `raw_text: ${rawText}`,
    `clarifications: ${JSON.stringify(clarifications ?? {})}`,
  ].join("\n");
}

async function callModel(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const response = await fetch(`${baseUrl}${OPENAI_RESPONSE_PATH}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_PACKET_MODEL ?? "gpt-4.1-mini",
      input: prompt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Packet generation failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    output_text?: string;
  };

  return payload.output_text ?? "";
}

function inferConfidence(rawText: string, packet: IntentPacket): { confidence: number; clarifyingQuestions: string[] } {
  const text = rawText.trim();
  const fields = packet.fields ?? {};

  if (packet.target?.kind === "list" && !packet.target?.key) {
    return { confidence: 0.55, clarifyingQuestions: ["Which list should this item go to?"] };
  }
  if (packet.intent_type === "update_task" && !fields.task_id && !fields.notion_page_id) {
    return { confidence: 0.5, clarifyingQuestions: ["Which task should be updated?"] };
  }
  if (text.length < 5) {
    return { confidence: 0.45, clarifyingQuestions: ["Can you add a little more detail?"] };
  }
  return { confidence: 0.82, clarifyingQuestions: [] };
}

export async function generatePacket(input: GeneratePacketInput): Promise<GeneratePacketResult> {
  if (!process.env.OPENAI_API_KEY) {
    const packet = buildDeterministicPacket(input);
    return { status: "ok", packet, confidence: 0.4, clarifying_questions: [] };
  }

  let lastRawOutput = "";
  let lastError = "Unknown parse error";
  let prompt = systemPrompt(input.rawText, input.clarifications);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      lastRawOutput = await callModel(prompt);
      const parsed = extractJsonObject(lastRawOutput);
      const packet = intentPacketSchema.parse(parsed);
      const { confidence, clarifyingQuestions } = inferConfidence(input.rawText, packet);
      return {
        status: "ok",
        packet,
        confidence,
        clarifying_questions: clarifyingQuestions,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown parse error";
      prompt = [
        "Repair the following output into strict valid JSON matching the required packet shape.",
        "Return only JSON.",
        `invalid_output: ${lastRawOutput}`,
        `validation_error: ${lastError}`,
      ].join("\n");
    }
  }

  return {
    status: "repair_required",
    error: lastError,
    raw_output: lastRawOutput,
  };
}
