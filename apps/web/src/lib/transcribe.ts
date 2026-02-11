const TRANSCRIBE_BASE_URL = import.meta.env.VITE_TRANSCRIBE_BASE_URL ?? 'http://localhost:8787';

type TranscribeResponse = {
  transcript: string;
};

export async function transcribeBlob(blob: Blob): Promise<string> {
  if (!TRANSCRIBE_BASE_URL) {
    throw new Error('Missing VITE_TRANSCRIBE_BASE_URL');
  }

  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');

  const response = await fetch(`${TRANSCRIBE_BASE_URL}/v1/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription request failed with ${response.status}`);
  }

  const payload = (await response.json()) as TranscribeResponse;
  if (!payload.transcript) {
    throw new Error('Transcription response missing transcript');
  }

  return payload.transcript;
}
