# Accord — Recorded conversation → final commitments

An audio-first local browser prototype that extracts final accepted project tasks, owners, deadlines and open questions, with timestamped quotes and original-audio playback.

**Current status: implemented and locally tested, not yet validated for submission.** Live ASR attempts were rejected with `credit_balance_exhausted`. The user requested no further paid API calls. Real A–C/E interpretation, listening review and public deployment remain incomplete. There are no hardcoded demo answers in the app. Offline UI mocks exist only in a clearly labelled test file.

Submission deadline: **5 October 2026**. [Delivery notes](docs/DELIVERY-NOTES.md) · [Quality report](docs/QUALITY-REPORT.md) · [Requirement checklist](docs/REQUIREMENTS.md).

## Run locally

Requires Node.js 24 (developed on **24.19.0**). No runtime npm packages, package installation or build step is required. `package-lock.json` records the empty dependency graph. A modern browser with Web Audio is required; Edge was tested.

From the project folder:

```powershell
node --version
node --env-file-if-exists=.env.local src/server.mjs
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Keep the terminal running. Stop with Ctrl+C. If `node` is not on your PATH, use the Node executable supplied by your development environment or install Node 24 from [nodejs.org](https://nodejs.org/).

The current workspace already has a securely configured `.env.local`. Do not overwrite it. For a fresh checkout only:

```powershell
Copy-Item .env.example .env.local
```

Add your own project API key to `OPENAI_API_KEY` using a local editor or the secure OpenAI key setup flow. Never paste it into chat, commit it, or put it in browser JavaScript. API credits and model access are separate from ChatGPT/Codex subscription limits. [API billing](https://platform.openai.com/settings/organization/billing) and [limits](https://platform.openai.com/settings/organization/limits) must permit the selected models.

| Variable | Required | Meaning |
| --- | --- | --- |
| `OPENAI_API_KEY` | For real speech analysis | Server-only OpenAI project API key |
| `PORT` | No; default 3000 | Local HTTP port |

Models are intentionally fixed in `src/provider.mjs`: `gpt-4o-transcribe-diarize` and `gpt-4.1-mini-2025-04-14`. Changing a model requires rechecking capabilities, pricing and quality. The server binds to loopback and is not configured as a public service.

## Use

1. Choose or drag one English recording, up to **20 MB and 3 minutes**, with **two distinct speakers who introduce themselves** and take turns. WAV, MP3, M4A, OGG and WebM depend on browser decoding support.
2. Click **Find final commitments**. The browser converts audio locally to 16 kHz mono WAV; the server validates actual bytes and duration.
3. Review confirmed work, uncertainty, open questions and inactive items. Click **Play evidence** to hear the original file at the cited segment; playback stops after a small context margin.
4. Inspect the full transcript and processing/cost details. Use **Upload another recording** to clear the completed result and start again.

Silence can be rejected locally without API access. Actual speech requires API credit. A valid key alone does not prove billing or model availability. The app never falls back to canned results.

## Tests and fixtures

Local tests with no real provider calls:

```powershell
node --test tests/*.test.mjs
node tests/server-local.mjs
```

The second command needs the local server running. Unit tests mock provider responses in test scope only. They do not measure ASR/extraction accuracy.

Browser testing uses optional **Playwright 1.62.1**, available in the bundled development environment. It is not a runtime dependency. If absent, install that exact version in a separate test-tools directory (for example, `npm install --prefix .runtime/test-tools --save-exact playwright@1.62.1`) and use its package path. These commands use an existing Microsoft Edge installation:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\path\to\node_modules\playwright'
$env:BROWSER_CHANNEL = 'msedge'
node tests/browser-offline.mjs
```

This runs real upload/error/silence checks plus explicitly mocked UI contract checks. Screenshots prefixed `TEST-ONLY` are not real AI results.

**Paid live tests — currently blocked and not authorized to resume until the user says so:**

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\path\to\node_modules\playwright'
$env:EVAL_OUTPUT = 'reports/live'
node scripts/browser-check.mjs A B C D E
```

The server reads the key; the browser harness does not. Each speech file normally makes one ASR and one extraction call, with no automatic retries. A standalone audio-only runner is also available:

```powershell
node --env-file=.env.local scripts/run-audio.mjs fixtures/audio/A.wav reports/A-direct.json
```

Independently reviewed saved results can be scored without API calls:

```powershell
node scripts/evaluate.mjs reports/live
```

See the [evaluation protocol](docs/EVALUATION-PROTOCOL.md) for manual semantic matching, evidence listening and A/B invariance. Unavailable outputs remain unevaluated; they are never treated as passing empty answers.

Committed audio is ready to use. To regenerate on Windows with the same installed voices:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-audio.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-audio.ps1 -CasesPath fixtures/holdout.json
```

The scripts use Microsoft David Desktop and Zira Desktop through System.Speech. See [fixture provenance](fixtures/README.md). A/B differ in exactly one utterance. Each case has its own script and expected file, with audio and generation boundaries under `fixtures/audio/`.

## Project layout

```text
public/       Browser UI and audio preparation/playback
src/          Server, provider integration, schema, evidence checks, metrics
tests/        Unit, local HTTP and offline browser tests
scripts/      Audio generation, real browser evaluation and offline scoring
fixtures/     Frozen scripts, independent expectations, synthetic audio
reports/      Actual failures, measurements, screenshots and test results
docs/         Architecture, costs, quality, work log, delivery materials
logs/         Ignored operational metrics; no audio or transcript
.env.local    Ignored server secret, not included in delivery archives
```

## Limits and data handling

Segment timestamps are not word alignment. The model can mishear speech, confuse speakers or misinterpret agreement even when quotes structurally match. Overlap, more than two speakers, noise, accents, non-English speech and more than three minutes are outside this MVP's validated scope. Even in-scope speech is not yet validated because of the credit blocker. Relative deadlines without calendar context stay unresolved as dates. Exact digital silence detection does not cover every form of unintelligible audio.

Original audio remains in the browser; uploaded converted audio is held in server memory for processing and sent to OpenAI. Results stay in memory until cleared or for 30 minutes after completion. Local logs persist model IDs, usage, timings, retries and cost assumptions, without audio or transcript. Test scripts intentionally save fictional evaluation outputs. See [architecture/privacy](docs/ARCHITECTURE.md) and [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

No public URL, GitHub push or final video exists. No material was sent to an employer. [Recording script](docs/VIDEO-SCRIPT.md) is a script, not a completed video.
