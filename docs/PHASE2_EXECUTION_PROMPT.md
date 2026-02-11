# PHASE 2 EXECUTION PROMPT — Voice recording + transcription

You are Codex operating under **Matthew Cove AI‑First Engineering v2** rules.

## Phase scope (ONLY implement Phase 2)
Add **voice recording** + **speech-to-text transcription**.

Do NOT implement:
- Light Intent Packet generation by LLM (Phase 3)
- Context API / knowledge base reasoning loop
- Realtime streaming transcription (optional later)

## Model choice
Use OpenAI Speech-to-Text via the Audio Transcriptions API:
- Default model: `gpt-4o-mini-transcribe` (good quality/cost)
- Allow switching to `gpt-4o-transcribe` via env for higher accuracy citeturn0search5turn0search2

## Architecture
- Keep OpenAI API key off the client.
- Implement a thin server `apps/api` that:
  - accepts multipart audio uploads,
  - forwards them to OpenAI `audio/transcriptions`,
  - returns `{ text }`.

- Web app `apps/web`:
  - Record audio with `MediaRecorder`
  - Upload blob to `apps/api`
  - Show transcript (editable) before submit to normaliser

## Required deliverables
### Server: `apps/api`
- Fastify + TypeScript API:
  - `POST /v1/transcribe`
- `.env.example`
- Scripts: dev, build, start, lint, typecheck, test (minimal)

### Client: `apps/web`
- Add a record/stop control
- Add upload + transcript panel
- The "Send to normaliser" uses transcript (editable), falling back to typed text if no audio

### Docs
- Update `docs/current_state.md` at end of Phase 2 (what works, what doesn't, next step)

## Verification
Run and report:
- `pnpm -C apps/api install`
- `pnpm -C apps/api lint`
- `pnpm -C apps/api typecheck`
- `pnpm -C apps/api test` (or explain why)
- `pnpm -C apps/api build`

- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web test` (or explain why)
- `pnpm -C apps/web build`
