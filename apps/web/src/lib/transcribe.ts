export async function transcribeAudio(params: {
  baseUrl: string;
  blob: Blob;
  filename?: string;
}): Promise<{ text: string }> {
  const { baseUrl, blob, filename = "audio.webm" } = params;

  const form = new FormData();
  form.append("audio", blob, filename);

  const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/transcribe`, {
    method: "POST",
    body: form
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Transcription failed (${resp.status}): ${t}`);
  }

  const json = (await resp.json()) as { text?: unknown };
  if (typeof json.text !== "string") throw new Error("Bad transcription response");
  return { text: json.text };
}
