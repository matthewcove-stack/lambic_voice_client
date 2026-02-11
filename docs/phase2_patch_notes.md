# Phase 2 patch notes

This overlay adds:
- `apps/api/` — a thin server that accepts an audio upload and calls OpenAI Speech-to-Text
- Voice recording + upload + transcript review in `apps/web/`

Key env vars:
- `apps/api/.env`:
  - `OPENAI_API_KEY=...`
  - `TRANSCRIBE_MODEL=gpt-4o-mini-transcribe` (default)
  - `PORT=8787`
- `apps/web/.env`:
  - `VITE_TRANSCRIBE_BASE_URL=http://localhost:8787` (default)

API:
- `POST /v1/transcribe` (multipart form-data)
  - field: `audio` (file blob)
  - returns: `{ "text": "..." }`

UI flow (web):
- Record -> Stop
- Upload -> get transcript
- User can edit transcript
- Generate/send Light Intent Packet exactly like Phase 1 (but using transcript instead of typed text)

Notes:
- This uses the OpenAI Audio `audio/transcriptions` endpoint with `gpt-4o-mini-transcribe` by default. citeturn0search5turn0search1turn0search2
- If you later want low-latency incremental transcription, switch to Realtime transcription sessions. citeturn0search9turn0search4
