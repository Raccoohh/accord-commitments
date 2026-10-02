# Architecture and trust boundaries

Browser audio selection → local Web Audio decoding/resampling → 16 kHz mono PCM WAV upload → server byte-level validation → timestamped diarized transcription → schema-constrained final-state extraction → local schema/evidence validation → browser results and original-audio playback.

The original file is retained as a browser object URL. The converted recording has the same timeline; it is sent as audio bytes. No transcript input UI exists. The server passes a generic `recording.wav` filename to ASR and never reads fixtures or expected outcomes. The extraction request receives only system rules and ASR segments, with no upload date or filename.

Runtime: Node 24 built-in HTTP, fetch, FormData, Blob, crypto and filesystem modules; plain HTML/CSS/JavaScript and Web Audio. No runtime packages or build step. Test-only Playwright is provided by the development environment; Windows System.Speech generates fictional synthetic test audio.

`gpt-4o-transcribe-diarize` returns speaker-labeled segments. `gpt-4.1-mini-2025-04-14` reads the full transcript and returns strict JSON. Provider requests have a 120-second timeout each and no automatic retries. Stored Responses are disabled. The ASR alias is not an immutable snapshot; the requested model ID and returned model field, when available, are logged.

The model selects exact quotes and segment IDs. The validator derives each quote's speaker/start/end from ASR, checks exact substring matching, checks valid segment bounds, requires acceptance/cancellation evidence by status, validates self-introductions, and rejects dates without quoted year context. This does **not** prove the model interpreted acceptance correctly, or that ASR heard the correct words. Live semantic evaluation and listening remain mandatory.

Missing owner/deadline follow-ups are generated separately as system clarifications. Cancelled and proposed work never appears in the active UI. History carries superseded values. Unverified evidence is withheld and the item is demoted to unresolved. Relative dates without calendar context remain relative.

Security and privacy: API key only in ignored `.env.local`; no browser key. Loopback binding and Host/Origin checks. Static routes are an explicit allowlist. No transcript/audio on disk in normal app operation. Jobs expire from memory 30 minutes after completion or on clear/replacement; audio references end after processing. Timing/usage logs remain locally until manually deleted and contain no audio or transcript. Test scripts explicitly save only fictional evaluation results in `reports/`. Browser text is HTML-escaped. Audio and transcript instructions remain untrusted data; prompt safeguards have not been proven against all attacks.

OpenAI's [data controls](https://developers.openai.com/api/docs/guides/your-data) list no retention for transcription; analysis can be retained in abuse monitoring up to 30 days. Account-specific controls have not been independently inspected.

The server is a local prototype, not a public multi-user service. Public hosting requires a deliberate deployment setup, server-side secret configuration, access/spend protection and an accessible URL. No calendar, accounts, payments, task sending or team workspace was added.
