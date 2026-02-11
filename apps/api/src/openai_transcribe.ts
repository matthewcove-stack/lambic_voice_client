import { File, FormData } from "formdata-node";
import { fetch } from "undici";
import type { BodyInit } from "undici";
import type { Env } from "./env.js";

export async function transcribeAudio(params: {
  env: Env;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ text: string }> {
  const { env, filename, mimeType, buffer } = params;

  const form = new FormData();
  form.set("model", env.TRANSCRIBE_MODEL);
  form.set("language", "en");

  const file = new File([buffer], filename, { type: mimeType });
  form.set("file", file);

  const resp = await fetch(`${env.OPENAI_BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: form as unknown as BodyInit,
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`OpenAI transcription failed (${resp.status}): ${errText}`);
  }

  const json = (await resp.json()) as { text?: unknown };
  const text = typeof json.text === "string" ? json.text : "";
  if (!text) throw new Error("OpenAI transcription returned no text");
  return { text };
}
