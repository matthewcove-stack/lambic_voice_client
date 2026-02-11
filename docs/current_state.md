# Current State (authoritative)

Status: **Phase 2 implemented (voice recording + transcription).**

## Implemented
- Existing Phase 1 text intake + normaliser submission flow remains available.
- `apps/api` now provides a Fastify transcription service:
  - `POST /v1/transcribe` accepts multipart audio field `audio`
  - Forwards audio to OpenAI `audio/transcriptions`
  - Returns `{ "text": "..." }`
  - Model controlled via `TRANSCRIBE_MODEL` (default `gpt-4o-mini-transcribe`, can set `gpt-4o-transcribe`)
- `apps/web` now supports voice capture and transcript review:
  - Record/stop with `MediaRecorder`
  - Upload audio to `apps/api`
  - Editable transcript panel
  - "Send to normaliser" submits transcript when present, otherwise typed text fallback

## Not implemented in this phase
- LLM-generated Light Intent Packet creation (Phase 3)
- Context API / reasoning loop integration
- Realtime streaming transcription

## Known limitations
- Browser support depends on `MediaRecorder` availability.
- Mobile reliability depends on browser microphone permissions and codecs.

## Next step
Proceed to Phase 3: provider-backed Light Intent Packet generation with strict JSON validation and repair handling.
