# Lambic Voice Intake

A tiny voice memo + text intake app for BrainOS that generates **Light Intent Packets** and sends them straight to the **Intent Normaliser**.

> Truth hierarchy: if any docs conflict, `docs/current_state.md` is authoritative.

## What you can do (target MVP)
- Tap to record, stop to save
- Auto-transcribe (local or server)
- Generate Light Intent Packet (LLM)
- Submit to Intent Normaliser
- If normaliser returns *needs_clarification*, answer via quick UI and resubmit

## Quick start (after Phase 1 implementation)
- `pnpm install`
- `pnpm -C apps/web dev`

## Links
See:
- `docs/intent.md`
- `docs/phases.md`
- `docs/current_state.md`
- `docs/PHASE_EXECUTION_PROMPT.md`
