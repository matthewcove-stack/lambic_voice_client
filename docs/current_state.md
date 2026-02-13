# Current State (authoritative)

Status: **Phase 1 vertical slice aligned with intent_normaliser contract.**

## Implemented
- Web app submits intents to `POST /v1/intents` using bearer auth.
- Web app parses the canonical response envelope (`executed`, `failed`, `needs_clarification`, etc.).
- Clarification flow is wired to `POST /v1/clarifications/{clarification_id}/answer`.
- Destination picker routes intents to:
  - Task
  - Shopping List Item
  - Note
- Response panel renders receipt metadata:
  - `receipt_id`
  - `trace_id`
  - `idempotency_key`
  - `intent_id`
  - `details.notion_task_id` when executed
- Voice transcription flow remains available via `apps/api` `POST /v1/transcribe`.

## Required env vars

Web (`apps/web/.env`):
- `VITE_NORMALISER_BASE_URL=http://localhost:8000`
- `VITE_NORMALISER_BEARER_TOKEN=<INTENT_SERVICE_TOKEN>`
- `VITE_TRANSCRIBE_BASE_URL=http://localhost:8787`

API (`apps/api/.env`):
- `OPENAI_API_KEY=...`
- optional overrides: `TRANSCRIBE_MODEL`, `OPENAI_BASE_URL`, `PORT`, `CORS_ORIGINS`

## Manual test script
1. Start stack:
   - `docker compose -f brain_os/docker-compose.yml up --build`
2. Start voice app:
   - `pnpm -C lambic_voice_client install`
   - `pnpm -C lambic_voice_client/apps/api dev`
   - `pnpm -C lambic_voice_client/apps/web dev`
3. Submit the same intent text twice.
4. Confirm:
   - response status is `executed` (or `needs_clarification` if input is ambiguous)
   - receipt metadata is shown
   - second identical submit returns the same `idempotency_key` and no duplicate task is created
