# Current State (authoritative)

Status: **Phase 3 completed, Phase 4 in progress.**

## Implemented
- Repo kickoff artifacts and contracts.
- Phase 1 web client in `apps/web`:
  - Text intake
  - Normaliser integration
  - Clarification loop
  - Local recent history
  - Schema validation + tests
- Phase 2 voice and transcription:
  - Voice recording UI (start/stop)
  - Transcription API upload flow
  - Editable transcript review before submit
  - Thin transcription proxy in `apps/api`
  - Tests for transcription web/api paths
- Phase 3 packet generation:
  - LLM packet-generation endpoint in `apps/api` (`POST /v1/generate-packet`)
  - Provider adapter with deterministic fallback when key is absent
  - Strict JSON extraction and schema validation
  - Prompt template in `apps/web/src/prompts/lightIntentPrompt.ts`
  - Web integration to generate packet before normaliser submit
  - Repair flow UI for invalid model output
  - Local telemetry with secret redaction and tests

## Not implemented
- Phase 4 hardening (offline queue, background retry, ergonomics)

## Next step
Implement **Phase 4** from `docs/phases.md`: offline queue, background retry, improved history UX, optional API-key auth support, and PWA install guidance.
