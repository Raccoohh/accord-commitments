# Requirement-by-requirement review

Done means implemented and checked to the stated scope. Partial identifies missing acoustic review or a remaining semantic limitation. A small synthetic test set is not a general accuracy guarantee.

| Brief requirement | Status | Evidence / remaining work |
| --- | --- | --- |
| New project structure and local Git repository | Done | Source, fixtures, tests, reports and docs; independent fixture commit 32b67be |
| Inspect environment/tools/access first; no purchases | Done | [Plan](PLAN.md), [work log](WORKLOG.md); existing hardware and local installs |
| English UI, recordings and delivery materials | Done | [UI](../public/index.html), [fixtures](../fixtures/README.md) |
| Plan, risks and readiness criteria | Done | [Plan](PLAN.md) |
| Eight-hour target and factual time log | Author-reported estimate within target | Approximately 6 hours 30 minutes total, reported by the author on 6 October 2026; [work log](WORKLOG.md) retains partial recorded windows. Not an independently measured total. |
| Secure credentials and no paid calls after user constraint | Done | Ignored server-only HF_TOKEN; active runtime is local; [delivery scan](../reports/delivery-verification.json) |
| English, two speakers, introductions, no overlap, up to 3 minutes | Done for tested scope | Guided input; actual byte/duration checks; two-speaker ASR/diarization; synthetic A–G |
| Upload and drag-and-drop; size/type/language/duration limits | Done | [Browser checks](../reports/offline-browser/checks.json) |
| Actual processing stages and errors, another-upload flow | Done | [Pipeline](../src/pipeline.mjs), real browser runs and HTTP checks |
| Real audio → timestamped ASR/diarization → model → validation | Done | [Local model manifest](../reports/local-models.json), actual A–G JSON under reports/live |
| No filename lookup, hidden transcript or expected-label input | Done | Audio bytes enter Python; only ASR segments reach Ollama; fixture data is test-only |
| Confirmed / proposed / cancelled / unresolved distinctions | Done on final synthetic set to reported scope | [Field-level evaluation](../reports/expected-vs-actual.md); limitations in quality report |
| Include accepted work with missing fields | Done on synthetic set | Accessibility audit and usability test remain active with null fields |
| Final accepted deadline; no earlier deadline in headline | Done on synthetic set | A/B final date fields and C relative-date behavior |
| Accurate structured change history | Partial | Final states and original quotes are reviewed; model-generated histories can omit transfers or misstate earlier status; see [quality report](QUALITY-REPORT.md) |
| Cancelled and unapproved work excluded from active list | Done on synthetic set | A/B cancellation and proposals; E/F suggestions |
| No invented owner/date; no upload/system-date normalization | Done to tested scope | Null handling, self-introduction grounding, explicit-year parser and C |
| Reliable voice/name mapping | Partial | Actual ASR text grounds names; user reported no voice discrepancies in the synthetic set; broader reliability is untested |
| Unclear agreement not promoted; transcript is untrusted data | Partial | Prompts and conservative validators tested; no broad adversarial/noisy-speech evaluation |
| Spoken questions separate from generated clarifications | Done to tested scope | Verbatim question filter, separate source values and UI sections |
| Structured model output checked against schema | Done | Compact schema plus strict final schema; 52 passing unit/contract/gateway checks |
| Segment IDs, exact quote text, speaker and time bounds | Done for structure | Authoritative ASR segments supply quotes/timestamps; [validation code](../src/validate.mjs) |
| Sufficient multi-fragment evidence for changes/cancellation | Partial | Main task chains reviewed in final results; evidence roles and some open-question context remain imperfect; user-reported acoustic review complete |
| Original-audio evidence playback and transcript | Done for mechanics | Real browser playback records for A/B/C/E/F/G; [listening checklist](LISTENING-CHECKLIST.md) remains separate |
| Bounded calls, timeouts and error handling | Done | One speech call and two fixed local LLM calls, no automatic retries, ten-minute timeout per call; D skips models |
| Actual privacy and retention explanation | Done | Local processing, loopback services, 30-minute in-memory results; [architecture](ARCHITECTURE.md) |
| Freeze A–D independent scripts and expectations before analysis | Done | Commit 32b67be; [frozen source](../fixtures/cases.json) |
| Two synthetic voices, WAVs, scripts, expected/actual files | Done | Windows David/Zira; A–G audio and provenance; [fixture integrity](../reports/fixture-integrity.json) |
| Listen to recordings and every evidence excerpt | User-reported complete | User confirmed listening on 3 October 2026 with no discrepancies noticed; no independent assistant hearing claim |
| Real browser end-to-end checks | Done | Actual uploads, outputs, screenshots, client/server measurements and playback under reports/live |
| TP/FP/FN separate from field/evidence accuracy | Done | [Counts](../reports/evaluation.json), [comparison](../reports/expected-vs-actual.md); assistant text review, not acoustic certification |
| Controlled A/B difference | Partial | Final-field comparison and any history differences are separately documented in quality report |
| Repeat testing after observed fixes | Done | Failed local runs preserved in local-initial and local-regression-v1/v2; final real run in live |
| Fresh recording after main fixes, no tuning to its content | Done | G labels 99f1bc2; fresh audio 370411b; actual result G |
| Duration, stage times, models, usage, retries and cost/minute | Done | Every final JSON contains metrics; speech subtimings and both LLM token counts; [costs](COSTS.md) |
| Separate TTS/hosting/compute costs; no invented zero compute cost | Done | API charges $0; hardware/electricity unmeasured, localComputeCostUsd null; no paid TTS/hosting |
| Runnable browser demo | Done locally | [Local URL](http://127.0.0.1:3000), launcher and [setup](LOCAL-SETUP.md) |
| Public evaluator URL | Protected ngrok dev domain; restart verified; host availability required | [Current demo](https://unread-sleek-renewably.ngrok-free.dev); [access and lifetime limits](REVIEWER-DEMO.md); host must remain running |
| GitHub repository | Published publicly; anonymous access verified | [Raccoohh/accord-commitments](https://github.com/Raccoohh/accord-commitments); setup instructions and fixture history included |
| README, env example, pinned dependencies and model revisions | Done | [README](../README.md), local/requirements.lock.txt, local/models.json |
| Actual outputs, failures, AI/reuse disclosure | Done | [Quality report](QUALITY-REPORT.md), [local failure log](LOCAL-QUALITY.md), [AI/reuse](AI-AND-REUSE.md) |
| Video up to 3 minutes | Final video pending | [Exact 2:50 recording script](VIDEO-SCRIPT.md); a revised 2:20 recording was reviewed locally; final edits and an accessible video link remain pending |
| English delivery notes and artifact links | Done | [Delivery notes](DELIVERY-NOTES.md) |
| No extra accounts/task integrations or employer sending | Done | Local prototype and evaluation artifacts only |

The local demo and reproducible package are available. The user confirmed the human listening audit without reported discrepancies on 3 October 2026. Disclosed semantic limitations remain, as do continuous availability of the host-based demo and the final video delivery link. Do not represent those unfinished steps as completed.





