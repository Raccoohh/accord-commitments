# Cost methodology

## Active local pipeline (2026-10-03)

The application now uses faster-whisper, pyannote Community-1 and Ollama Qwen2.5 7B on the user's computer. Each real local run has **$0 metered API charges**. There is no paid fallback. Local hardware, electricity and compute cost are **unmeasured**, not zero; metrics explicitly retain `localComputeCostUsd: null`. API cost per audio minute is zero, but total economic cost per minute is not measured.

Speech and extraction durations, model identifiers, token counts, audio duration and retry count are recorded per operation. Initial downloads/loading are distinguished from inference where the runtime reports them. No automatic retry is configured. Initial model downloads require several GB; Python dependencies and portable binaries also use disk space. Synthetic audio uses existing Windows voices with no metered TTS API.

A successful speech operation records three calls: combined local ASR/diarization, local decision reading, and local structured extraction. The two language-model calls are fixed stages, not retries. The ASR/diarization call includes separate load/inference timings in its metadata. CPU speech models are reloaded per request; the language model may be warm or cold depending on Ollama's five-minute keep-alive. Compare actual runs rather than treating one timing as a service guarantee. The final timing table is in [the quality report](QUALITY-REPORT.md); extraction-only experiments retain their own traces under `reports/local-initial/`.

## Historical cloud plan (inactive)

Checked 2026-10-02 against official OpenAI documentation. These are USD list rates, not evidence of this account's invoice.

| Component | Model | Rate / basis | Source |
| --- | --- | --- | --- |
| ASR with built-in diarization | `gpt-4o-transcribe-diarize` | Input $2.50 / million tokens; output $10 / million tokens | [Model page](https://developers.openai.com/api/docs/models/gpt-4o-transcribe-diarize), also retrieved as `.md` |
| Extraction | `gpt-4.1-mini-2025-04-14` | Input $0.40, cached input $0.10, output $1.60 / million tokens | [Model page](https://developers.openai.com/api/docs/models/gpt-4.1-mini) |
| ASR duration fallback | Assumption only | $0.006 / input minute, using the published estimate for related `gpt-4o-transcribe`. A diarize-specific minute rate was not verified. | [Pricing](https://developers.openai.com/api/docs/pricing) |
| Separate diarization / alignment | None | No additional API call; timestamps are segments, not words | Implementation |
| Test audio creation | Windows System.Speech | No metered API service used | `scripts/generate-audio.ps1` |
| Hosting | Local Windows machine | No purchased hosting. Hardware, electricity, OS license and local compute are excluded, not valued at zero. | Actual deployment |
| Paid intermediaries | None | Direct HTTPS requests to OpenAI | `src/provider.mjs` |

For token usage: `(uncached_input × input_rate + cached_input × cached_rate + output × output_rate) / 1,000,000`. For duration-only ASR usage, use the clearly labelled assumed minute estimate. Returned provider usage is preserved verbatim in run metrics. No ASR token usage has yet been observed in a successful live response; confirm the accounting against the first real successful response.

`cost per audio minute = total variable operation cost / (audio duration seconds / 60)`.

Every request has a call record. Automatic retries are disabled: exactly one attempt per stage, at most two provider calls for a successful run. An explicit user rerun is a new operation with its own metrics. Failed requests with unknown billing produce `totalVariableOperationUsd: null` and `unknownChargesPossible: true`; zero known charges does not mean zero billed charges. Free credits do not change list-price variable cost.

Historical cloud observations: two transcription attempts were rejected before a usable result. The diagnostic returned `credit_balance_exhausted`. No successful cloud speech-pipeline cost or latency was measured. D (digital silence) is detected locally without provider requests; its API variable cost is $0, with local compute excluded. See `reports/access-diagnostic.json`, `reports/initial/` and `reports/offline-browser/D.actual.json`.

The development assistant's subscription cost is separate from runtime operation cost. No purchases, paid TTS, public hosting, or subscriptions were initiated.
