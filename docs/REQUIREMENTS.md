# Requirement-by-requirement review

Done = implemented and the cited check supports the stated claim. Partial = implemented/prepared but required live or listening validation is missing. Not done = no completed deliverable. This checklist does not turn offline tests into evidence of model accuracy.

| Brief requirement | Status | Evidence / remaining work |
| --- | --- | --- |
| New project structure and local Git repository | Done | `public/`, `src/`, `tests/`, `scripts/`, `fixtures/`, `docs/`, `reports/`; commits `32b67be`, `d90a247`, `0281e15` |
| Inspect tools, files, keys and runtime first | Done | [Plan/environment](PLAN.md), [work log](WORKLOG.md) |
| Safe API-key setup | Done | Ignored `.env.local`; key never in browser/repository; metadata-only verification |
| English interface, fixtures and evaluator materials | Done | [UI](../public/index.html), [fixtures](../fixtures/README.md), English docs |
| Short plan, risks and readiness criteria | Done | [Plan](PLAN.md) |
| Up to 8 focused hours and factual time log | Partial | [Work log](WORKLOG.md); measured wall-clock checkpoints, initial unmeasured inspection disclosed |
| English, ≤3 min, two speakers with introductions, no overlap | Partial | UI guidance, byte/duration validation and generated recordings; speaker/English correctness awaits live checks |
| Audio-first upload and drag-and-drop | Done | Real browser file and drag/drop tests in [checks](../reports/offline-browser/checks.json) |
| Visible file size/type/duration/language limits | Done | [Upload screenshot](../reports/initial/upload.png) |
| Real progress states and actionable errors | Partial | Actual stages emitted by [pipeline](../src/pipeline.mjs); real 429 surfaced, quota wording fixed and locally tested |
| Real ASR → extraction → evidence-validation pipeline | Partial | Real provider adapters implemented; first ASR blocked by credit balance; no completed speech pipeline |
| Distinguish confirmed / proposed / cancelled / unresolved | Partial | Schema, prompt, validator and UI contract tested; semantic correctness unmeasured |
| Include all accepted work, even without owner/deadline | Partial | Prompt and null handling; no successful speech output yet |
| Final corrected deadline only; history for previous values | Partial | Model contract/UI history implemented; A/B runtime validation pending |
| Cancelled work excluded from active list | Partial | UI filtering tested; real cancellation interpretation pending |
| No invented owner or deadline; relative dates preserved | Partial | Validator tests pass; [C expectations](../fixtures/C/expected.json), live case blocked |
| Reliable voice/name mapping and uncertainty | Partial | Self-introduction checks tested with local data; acoustic/ASR identity check pending |
| Unclear agreement stays unresolved/partial | Partial | Prompt/validator behavior implemented; no live ambiguous speech verification |
| Participant questions separate from app clarifications | Partial | UI/source separation and deterministic clarifications tested; live content pending |
| Treat transcript/audio as data, not instructions | Partial | Prompt and serialized input boundary tested; no universal injection-resistance claim |
| Structured result and schema validation | Done for implementation | [Schema](../src/schema.mjs), [unit output](../reports/unit-tests.txt); live service response still unobserved |
| Verify segment existence, exact quotes, speaker IDs and time bounds | Done for structural checks | [Validator](../src/validate.mjs), unit tests; semantic/acoustic validation pending |
| Multiple evidence fragments for changes/cancellations | Partial | Array schema, full-transcript prompt, UI; real evidence sufficiency pending |
| Timestamped quotes and Play evidence on original audio | Partial | Seek/stop tested in [playback](../reports/offline-browser/playback.json); actual quote audibility not audited |
| Full transcript and unresolved questions | Partial | Rendering tested with labelled UI fixtures; no real speech transcript yet |
| Bounded retries, timeouts, empty/service-error handling | Done for implementation | Zero automatic retries, 120 s/provider timeout; local provider tests; actual quota failure retained |
| Honest data-location/retention disclosure | Done | UI privacy panel, [architecture](ARCHITECTURE.md) |
| A–D scripts and independent expectations frozen before analysis | Done | Commit `32b67be`; [source](../fixtures/cases.json) |
| Two synthetic voices and audio for every case | Done | [Audio](../fixtures/audio/), System.Speech provenance; A 88.46 s/B 88.60 s/C 32.69 s/D 8 s |
| Listen to generated audio and every evidence timestamp | Not done | [Pending checklist](LISTENING-CHECKLIST.md); no acoustic listening claim |
| Real browser upload → analysis → result → evidence | Partial | Upload/error/silence real; speech result/evidence semantics blocked |
| TP/FP/FN and status/owner/deadline/evidence table | Partial | [Comparison](../reports/expected-vs-actual.md), [counts](../reports/evaluation.json); A/B/C/E unavailable, D negative-only counts |
| Controlled A/B difference validated | Not done | Inputs differ in one final date; actual outputs unavailable |
| Repeat checks after fixes | Partial | Local tests rerun successfully; real paid regression run blocked |
| Fresh recording after fixes | Partial | [E](../fixtures/holdout.json) frozen and synthesized; not analyzed |
| Per-run duration, stage time, models, usage, retries, cost/minute | Partial | [Run metrics](../reports/run-metrics.jsonl), [cost method](COSTS.md); no successful speech cost/latency measurement |
| Verify official prices and disclose estimates | Done with explicit uncertainty | Token rates verified; diarize minute fallback explicitly assumed in [costs](COSTS.md) |
| Separate TTS and hosting costs | Done | No paid TTS/hosting; local compute excluded in [costs](COSTS.md) |
| Runnable local demo | Done with live-analysis blocker | [Local URL](http://127.0.0.1:3000), [README](../README.md) |
| Public demo URL | Not done | No hosting configured; localhost is not public |
| GitHub repository | Not done | Local Git repository and offline delivery bundle prepared; no remote configured |
| README, env example and pinned dependencies | Done | [README](../README.md), `.env.example`, `.node-version`, `package-lock.json` |
| Actual outputs, failures, reused tools and AI models | Done for available evidence | [Quality report](QUALITY-REPORT.md), [AI/reuse](AI-AND-REUSE.md), `reports/` |
| ≤3 minute final video | Not done; fallback prepared | [2:50 recording script](VIDEO-SCRIPT.md), explicitly not a completed video |
| English delivery notes and all artifact links | Done | [Delivery notes](DELIVERY-NOTES.md) |
| No extra features, purchases or sending to employer | Done | Local prototype only; no calendar/accounts/payments/task integrations |

Overall: **partial / not yet ready to submit as a fully working AI demo**. The critical next step is funded, authorized real-audio testing, followed by listening review and completion of the evaluation and demonstration.
