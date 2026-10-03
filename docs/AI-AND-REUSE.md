# Tools, reused components and original work

| Component | Reused service/library/tool | Use |
| --- | --- | --- |
| Development assistant | OpenAI Codex desktop; system identifies the assistant as GPT-6, exact serving model snapshot not exposed | Authored code, fixture dialogue, documentation; ran commands and examined results |
| API setup | OpenAI Developers encrypted-key connector | Created `TZ`; wrote it only to the approved ignored file. Secret not reproduced. |
| Active runtime ASR | faster-whisper 1.2.1, `Systran/faster-whisper-small.en` | Local CPU INT8 transcription and word timestamp estimates |
| Active runtime diarization | pyannote.audio 4.0.7, Community-1 | Local CPU two-speaker exclusive timelines; user accepted gated download conditions |
| Active runtime extraction | Portable Ollama 0.35.0, `qwen2.5:7b` Q4_K_M | Local schema-constrained final-state extraction; no paid fallback |
| Historical cloud adapters | OpenAI `gpt-4o-transcribe-diarize` and `gpt-4.1-mini-2025-04-14` | Two ASR calls failed due to exhausted balance; extraction never ran. Adapter retained only for isolated mocked tests |
| Runtime libraries | Node.js 24.19.0 built-ins; Web Audio and browser DOM APIs | Server, HTTPS requests, JSON, audio conversion/playback |
| Browser tests | Bundled Playwright and installed Microsoft Edge | Real UI interactions; explicitly intercepted responses only in offline contract tests |
| Test audio | Windows System.Speech; Microsoft David Desktop and Microsoft Zira Desktop | Two synthetic English voices; no paid TTS API |
| Version control | Git 2.55.0.windows.2 | Frozen independent expectations and local commits |

Original changes: entire app, visual layout, WAV validation, prompt and schema, evidence/name/date checks, final-state UI, original-audio fragment playback, cost/latency metrics, tests, fictional scripts and delivery materials. No app template, icon package, external fonts or copied product code was used. Official API documentation informed request shapes and rate assumptions.

Local Python package versions are frozen in `local/requirements.lock.txt`; model revisions and Ollama digest are recorded in `reports/local-models.json`. Local model output is evaluated against independent fixtures, never used to create or rewrite their expected labels.

Concrete verification of AI-written code: a unit test supplies an invented quote for a confirmed task. The validator rejects the quote, withholds evidence and demotes the item to unresolved. Another test supplies a normalized date for “next Friday” without calendar context; normalization is removed. Browser tests measured that evidence playback advances the original audio and pauses near the requested end. These checks validate implementation behavior, not real speech interpretation.

Failures were retained: quota misclassification on the first live request; corrected using the concrete diagnostic code `credit_balance_exhausted`. The browser harness originally read `innerText` from collapsed details and used an unset request base URL; both harness defects were corrected and rerun. See `docs/QUALITY-REPORT.md`.
