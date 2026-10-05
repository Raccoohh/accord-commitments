# Accord — Recorded conversation → final commitments

An audio-first local browser prototype that extracts final accepted project tasks, owners, deadlines and open questions, with timestamped quotes and original-audio playback.

**Current status: working local audio pipeline; human listening review completed by user confirmation on 3 October 2026.** The active pipeline uses faster-whisper, pyannote Community-1 and Ollama Qwen2.5 7B on this computer. Real browser results, field-level evaluation and remaining limitations are in the quality report. No paid API calls or automatic cloud fallback are used. Historical OpenAI attempts failed due to exhausted credit and are preserved in reports. There are no hardcoded demo answers in the app. Offline UI mocks exist only in a clearly labelled test file.

Submission deadline: **5 October 2026**. [Delivery notes](docs/DELIVERY-NOTES.md) · [Quality report](docs/QUALITY-REPORT.md) · [Requirement checklist](docs/REQUIREMENTS.md).

Final synthetic checks found all **11 accepted tasks**, with **0 extra active tasks and 0 missed accepted tasks**. One inactive proposal in F is omitted, and generated histories/role labels remain imperfect. These are small synthetic tests, not a general accuracy guarantee. The [saved-result listening page](reports/listening-review.html) provides all original audio and selected excerpts for the human audit, now recorded in [the user confirmation](reports/human-listening-review.json); open the HTML in a browser from the project folder.

## Reviewer access

Repository: [Raccoohh/accord-commitments](https://github.com/Raccoohh/accord-commitments) (private; evaluator access must be granted). Public demo access and the final video link are pending. The employer requires a working browser demo, a repository with setup instructions and an actual video up to three minutes; an archive or script is not a substitute.

The tested setup is Windows with Python 3.12 and Node 24. Model weights are downloaded separately and are excluded from Git. Start with the [delivery notes](docs/DELIVERY-NOTES.md) and [measured quality report](docs/QUALITY-REPORT.md).

## Run locally

Requires Node.js 24 (developed on **24.19.0**), Python 3.12, the local speech dependencies and portable Ollama. There are no runtime npm packages or frontend build steps. A modern browser with Web Audio is required; Edge was tested. Follow [local model setup](docs/LOCAL-SETUP.md) once before starting.

From the project folder:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The launcher starts hidden local processes and waits for readiness. It finds Node 24 on PATH, in `.runtime/node/node.exe`, in the standard Windows installation folder, or in the current user's Codex runtime. You can also pass `-NodePath 'C:\path\to\node.exe'`. If none is available, install Node 24 from [nodejs.org](https://nodejs.org/).

The current workspace already has a securely configured `.env.local`. Do not overwrite it. For a fresh checkout only:

```powershell
Copy-Item .env.example .env.local
```

Accept the [pyannote Community-1 conditions](https://huggingface.co/pyannote/speaker-diarization-community-1), then add a read-scoped Hugging Face token to `HF_TOKEN` using a local editor. Never paste it into chat, commit it, or put it in browser JavaScript. The token permits model downloads; audio is processed locally. No OpenAI key or API balance is required by the active application.

| Variable | Required | Meaning |
| --- | --- | --- |
| `HF_TOKEN` | Initial gated model download | Server-only Hugging Face read token |
| `PORT` | No; default 3000 | Local HTTP port |

Models and revisions are fixed in `local/models.json`: `Systran/faster-whisper-medium.en`, `pyannote/speaker-diarization-community-1`, and `qwen2.5:7b`. Extraction uses two measured local calls: a concise decision reading followed by structured extraction. Changing a model requires rechecking quality. The app and Ollama bind to loopback and are not configured as public services.

## Use

1. Choose or drag one English recording, up to **20 MB and 3 minutes**, with **two distinct speakers who introduce themselves** and take turns. WAV, MP3, M4A, OGG and WebM depend on browser decoding support.
2. Click **Find final commitments**. The browser converts audio locally to 16 kHz mono WAV; the server validates actual bytes and duration.
3. Review confirmed work, uncertainty, open questions and inactive items. Click **Play evidence** to hear the original file at the cited segment; playback stops after a small context margin.
4. Inspect the full transcript and processing/cost details. Use **Upload another recording** to clear the completed result and start again.

Silence is rejected before inference. Actual speech requires the downloaded local models and sufficient memory. The app never falls back to canned results.

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

**Real local audio tests — no metered API calls:**

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\path\to\node_modules\playwright'
$env:EVAL_OUTPUT = 'reports/live'
node scripts/browser-check.mjs A B C D E F G
```

The server launches local speech inference, then calls Ollama on loopback. There are no automatic retries. A standalone audio-only runner is also available:

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
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-audio.ps1 -CasesPath fixtures/fresh-local.json
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-audio.ps1 -CasesPath fixtures/fresh-final.json
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

Segment timestamps are estimates, not manually verified word alignment. The model can mishear speech, confuse speakers or misinterpret agreement even when quotes structurally match. Overlap, more than two speakers, noise, accents, non-English speech and more than three minutes are outside this MVP's tested scope. Validation covers only a small synthetic set; see the quality report for actual outcomes and the user-reported listening audit. Relative deadlines without calendar context stay unresolved as dates. Exact digital silence detection does not cover every form of unintelligible audio.

Original audio remains in the browser; converted audio is held in server/Python memory and processed on this computer. The transcript is sent only to local Ollama. Results stay in memory until cleared or for 30 minutes after completion. Local logs persist model IDs, usage, timings, retries and cost assumptions, without audio or transcript. Test scripts intentionally save fictional evaluation outputs. See [architecture/privacy](docs/ARCHITECTURE.md).

No public URL, GitHub push or final video exists. No material was sent to an employer. [Recording script](docs/VIDEO-SCRIPT.md) is a script, not a completed video.
