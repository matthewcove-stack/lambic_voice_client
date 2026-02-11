# Lambic Voice Intake (BrainOS)

## Purpose
A minimal, platform-independent voice (and text) capture app that:
1) records audio (or accepts pasted text),
2) transcribes speech to text,
3) turns the transcript into a **Light Intent Packet**,
4) sends it directly to the **Intent Normaliser** (bypassing Action Relay for now),
5) handles **clarification / validation** responses from the normaliser with a simple back-and-forth UI.

This repo is intentionally narrow: it is an **input client** for BrainOS, not the full reasoning loop.

## Non-goals
- Not a ChatGPT clone.
- No long-term conversation memory or knowledge-base reasoning loop (will integrate later via Context API).
- No Notion writing logic in this client beyond submitting intents and responding to clarifications.
- No account system / multi-user auth in MVP.

## Repos / Dependencies
This client integrates with:
- `intent_normaliser` (HTTP API)
Optionally later:
- `context_api` (for retrieval + reasoning loop)
- `action_relay` (if/when we reintroduce relay semantics)

## Local commands (expected)
- Frontend dev: `pnpm install && pnpm dev`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Test: `pnpm test`

## Edit map
- `docs/` — project intent, phases, current state, rules, execution prompt.
- `contracts/` — stable JSON schemas for request/response payloads.
- `apps/web/` — PWA frontend (Phase 1).
- `apps/api/` — optional thin proxy for transcription / LLM (Phase 2+).

## Verification commands
When implementing any phase, report:
- `pnpm -C apps/web lint`
- `pnpm -C apps/web typecheck`
- `pnpm -C apps/web test` (or explain why tests are not yet present)
- `pnpm -C apps/web build`
