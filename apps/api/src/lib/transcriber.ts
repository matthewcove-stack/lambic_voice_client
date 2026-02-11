type TranscribeInput = {
  buffer: Buffer;
  mimetype: string;
  filename: string;
};

const OPENAI_TRANSCRIPT_URL = 'https://api.openai.com/v1/audio/transcriptions';

export async function transcribeAudio(input: TranscribeInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return `Transcribed audio (${input.mimetype}, ${input.buffer.byteLength} bytes)`;
  }

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(input.buffer)], { type: input.mimetype });
  formData.append('file', blob, input.filename);
  formData.append('model', process.env.OPENAI_TRANSCRIBE_MODEL ?? 'gpt-4o-mini-transcribe');

  const response = await fetch(OPENAI_TRANSCRIPT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription provider failed with ${response.status}`);
  }

  const json = (await response.json()) as { text?: string };
  if (!json.text) {
    throw new Error('Transcription provider returned no text');
  }

  return json.text;
}
