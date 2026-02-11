# PHASE 1 EXECUTION PROMPT — Lambic Voice Intake

You are Codex operating under **Matthew Cove AI‑First Engineering v2** rules.

## Phase scope (ONLY implement Phase 1)
Implement **text-only intake** PWA that:
1) accepts pasted/typed text,
2) constructs a **Light Intent Packet** (mocked for now OR minimal deterministic builder),
3) POSTs it to the Intent Normaliser endpoint,
4) renders the response,
5) supports a clarification loop.

Do NOT implement audio recording or transcription in Phase 1.

## Assumptions (minimal + safe)
- The Intent Normaliser is reachable via `NORMALISER_BASE_URL` (set via env).
- The normaliser accepts `POST /v1/normalise` with JSON body matching `contracts/light_intent_packet.schema.json`.
- The normaliser returns JSON matching `contracts/normaliser_response.schema.json`.

If the existing normaliser differs, keep adapters isolated and document the delta in `docs/current_state.md`.

## Required files / structure
Create:
- `apps/web/` (React + Vite + TypeScript)
- `apps/web/src/` with:
  - `lib/schemas.ts` (zod validators compiled from JSON schema or mirrored)
  - `lib/api.ts` (normaliser client)
  - `components/ClarificationModal.tsx`
  - `components/RecentList.tsx`
  - `App.tsx`
- `apps/web/.env.example` with `VITE_NORMALISER_BASE_URL=...`
- `apps/web/package.json` with scripts: dev, build, preview, lint, typecheck, test
- `apps/web/vite.config.ts` (PWA optional; keep minimal)

Update:
- `docs/current_state.md` at end of phase with what is implemented and next step

## Implementation notes
- Build a **deterministic** Light Intent Packet builder in Phase 1:
  - Wrap the raw text as `raw_text`
  - Set `schema_version`
  - Set `source` metadata (device, timestamp)
  - Leave the LLM step for Phase 3
- Clarification loop:
  - If response is `needs_clarification`, show questions and collect answers.
  - Resubmit the packet with `clarifications` filled (see schema).

## Verification
Run and report:
- `pnpm -C apps/web install` (or `pnpm install` if workspace)
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web test` (add minimal tests if none)
- `pnpm -C apps/web build`

## Output
Commit-ready changes. Do not include unrelated refactors.
