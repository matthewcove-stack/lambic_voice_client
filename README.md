# Lambic Voice Intake

A tiny voice memo + text intake app for BrainOS that generates **Light Intent Packets** and sends them to the **Intent Normaliser**.

> Truth hierarchy: if any docs conflict, `docs/current_state.md` is authoritative.

## Implemented
- Web app (`apps/web`) for text + voice intake
- API proxy (`apps/api`) for transcription + packet generation
- Clarification and packet-repair loops
- Offline queue and background retry

## Quick start
1. `corepack pnpm install`
2. `corepack pnpm -C apps/api dev`
3. `corepack pnpm -C apps/web dev`

## Verification
- `corepack pnpm -C apps/web lint`
- `corepack pnpm -C apps/web typecheck`
- `corepack pnpm -C apps/web test`
- `corepack pnpm -C apps/web build`
- `corepack pnpm -C apps/api lint`
- `corepack pnpm -C apps/api typecheck`
- `corepack pnpm -C apps/api test`
- `corepack pnpm -C apps/api build`

## Links
- `docs/intent.md`
- `docs/phases.md`
- `docs/current_state.md`
- `docs/cors_guidance.md`
- `docs/pwa_install_guidance.md`
