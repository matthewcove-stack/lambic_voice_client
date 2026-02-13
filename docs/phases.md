# Phases

## Phase 1 — Minimal PWA + text intake + normaliser loop (MVP)
Goal: From a browser on phone/desktop, paste text and submit, receive response, handle clarifications.

Deliverables:
- `apps/web/` React + Vite PWA (or equivalent) with:
  - Text input box
  - Submit button
  - Response panel (accepted vs needs_clarification)
  - Clarification modal form (dynamic from schema)
  - Local-only list of recent submissions (localStorage)
- `contracts/` schemas implemented/validated in code
- `.env.example` with `NORMALISER_BASE_URL`
- CORS guidance (documented)
- Basic tests for schema validation and response handling

Exit criteria:
- `pnpm -C apps/web build` succeeds
- User can run on Windows + phone browser
- One happy path (create shopping list item) and one clarification path works

## Phase 2 — Voice recording + transcription
Goal: Record audio and convert to transcript.

Options (choose minimal first):
- A) Web MediaRecorder -> upload audio to a thin API proxy that transcribes
- B) Use platform speech APIs (where available) with graceful fallback
- C) Integrate a local model (later)

Deliverables:
- Audio record/stop UI
- Upload pipeline
- Transcript review/edit step before intent generation
- Error states and retries

Exit criteria:
- Reliable recording on mobile Safari/Chrome and desktop Chrome/Edge
- Transcript can be corrected before sending

## Phase 3 — Direct Light Intent Packet generation
Goal: Call an LLM to create a Light Intent Packet from transcript/text.

Deliverables:
- Provider adapter (LLM) + schema validation
- Prompt templates under `apps/web/src/prompts/`
- Strict JSON parsing with robust error handling
- Telemetry (local-only logs) and redaction of secrets

Exit criteria:
- Packet always validates against schema, or UI shows a repair flow

## Phase 4 — Hardening + ergonomics
- Background retry queue
- Offline-first (queue when offline)
- Better recent-history UI
- Optional auth (API key in header, etc.)
- Packaging (PWA install guidance)

---

## MVP to Market alignment

This repo ships in phases coordinated by `brain_os/docs/mvp_to_market.md`.

### Phase 1 (MVP vertical slice)
- Submit Light Intent Packet to `intent_normaliser` (`POST /v1/intents`)
- Use `Authorization: Bearer ...` (no x-api-key)
- Parse and render the canonical receipt/outcome envelope
- Minimal clarification UI (answer questions back to the normaliser)

### Phase 2 (daily-useful actions)
- Destination picker supports: Task, Shopping/List item, Note
- Packet includes a deterministic `target` for routing

### Phase 3 (launch packaging)
- Containerize web+api or provide a production runbook
- Health checks + rate limiting + minimal observability
