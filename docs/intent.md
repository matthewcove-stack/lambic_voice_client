# Intent

Build a lightweight, cross-platform **voice + text intake** client that helps Matthew capture tasks, reminders, and list items into Notion via the existing BrainOS pipeline.

The client will:
1) capture audio (or accept manual text input),
2) transcribe audio -> text,
3) create a **Light Intent Packet** from the text,
4) POST the packet to the **Intent Normaliser**,
5) display the normaliser response:
   - accepted / created,
   - or **clarification / validation request** requiring user selection or extra data.

## Users
- Primary: Matthew (single-user)
- Devices: iPhone/Android (mobile web installable), Windows workstation (browser)

## Scope boundaries
- This client does not execute actions itself (no direct Notion writes).
- It submits intents and provides clarifications when asked.
- It should remain minimal and robust.

## Core UX
- **One screen** default: Record button + text box + Submit.
- A **timeline/list** of recent submissions (local-only in Phase 1).
- A **clarification modal** when normaliser asks follow-ups.

## High-level architecture
- PWA frontend (Phase 1) using Web Audio / MediaRecorder.
- Transcription:
  - Phase 1: server-side transcription (simple API) OR manual text input only.
  - Phase 2: pluggable transcription provider (server proxy, local wasm, or platform APIs).
- Intent creation:
  - LLM call producing Light Intent Packet (schema versioned).
- Transport:
  - Direct HTTP POST to Intent Normaliser, with CORS handled.
