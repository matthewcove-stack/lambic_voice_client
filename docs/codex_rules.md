# Codex Rules

- Implement **requested phase only**. Do not pre-empt later phases.
- Keep code small and readable. Prefer minimal dependencies.
- Always validate JSON against `contracts/` schemas at runtime.
- Never log secrets (API keys, tokens). Redact by default.
- Update `docs/current_state.md` as part of every phase completion.
- If you introduce a new command, add it to `AGENTS.md` verification commands.
- Prefer deterministic behavior: explicit states, explicit error surfaces.
