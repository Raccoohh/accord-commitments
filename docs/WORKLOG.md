# Work log

Submission deadline: 2026-10-05 (provided by the user). Target: at most eight focused hours.

| Start (Europe/Kyiv) | End | Activity | Timing basis |
| --- | --- | --- | --- |
| Before 2026-10-02 19:05 | 19:05 | Read brief; discover tools, runtime, voices and credential presence | Initial inspection not timed; excluded from measured total, not claimed as zero |
| 2026-10-02 19:05:26 | 19:09:31 | Freeze independent A–D scenarios; secure API-key setup and local Git | Wall-clock checkpoints |
| 2026-10-02 19:09:31 | 19:25:17 | Implement app, validators and synthetic audio; commit before first ASR attempt | Wall-clock checkpoints |
| 2026-10-02 19:25:17 | 19:35:36 | First failed ASR run, quota diagnostic, local tests; Codex-limit interruption | Includes a brief unmeasured pause and tool waits; not all focused work |
| 2026-10-02 19:35:36 | 19:42:00 | Resume without paid API requests; fix harness and quota classification; rerun local tests; freeze E | User renewed Codex limit, explicitly kept paid API requests paused |
| 2026-10-02 19:42:00 | 19:52:18 | Generate E; produce evaluation protocol, README, reports, checklist and recording script; verify delivery files | Wall-clock checkpoints |

Measured window through 19:52:18: **46 minutes 52 seconds**, including waits and the Codex interruption. This is not presented as exact human focused labor. Initial environment inspection was not timed; it is excluded and not treated as zero. Final archive/commit housekeeping occurs after this checkpoint. No eight-hour completion claim is made.

At that historical cloud checkpoint, two real ASR calls had been attempted and rejected; the diagnostic reported `credit_balance_exhausted`. No successful cloud speech result or extraction call existed. Model-access GET checks succeeded but did not establish available credit. Subsequent work switched to local inference as the user requested. Runtime measurements are in `reports/run-metrics.jsonl`; there were no purchases or public publication.

## Local migration (continuation)

| Start (Europe/Kyiv) | End | Activity | Timing basis |
| --- | --- | --- | --- |
| 2026-10-02 20:13:18 | approximately 20:30 | Verify hardware and gated model access; implement local adapters; install portable Ollama and download Qwen3 4B; start Python dependencies | Tool checkpoints; includes download waits |
| approximately 2026-10-02 20:30 | 2026-10-03 00:36:18 | Codex-limit pause | Excluded from active work; Python package download failed with a network read timeout |
| 2026-10-03 00:36:18 | approximately 01:18 | Complete dependencies and speech downloads; test real ASR; diagnose GPU path; retain failed 4B/7B extraction trials; rerun UI tests | Wall-clock checkpoints, including installation/model waits |
| approximately 2026-10-03 01:18 | 05:37:52 | Paused before user resumed after limits reset | Excluded from active work |
| 2026-10-03 05:37:52 | approximately 06:20 | Compact two-stage extraction, GPU/runtime checks, real A–E, medium.en upgrade and initial grounding fixes | Work window includes local inference and download waits |
| approximately 2026-10-03 06:20 | 11:23:30 | Codex-limit interruption; earlier browser batch completed unattended | Pause excluded from active work; test compute is retained in run metrics |
| 2026-10-03 11:23:30 | approximately 11:54 | Resume; repair date/identity grounding, bounded citation schema and evidence context; freeze post-fix F; final browser evaluation and delivery package | Wall-clock checkpoints, including model waits |

The earlier cloud-only status above is a historical checkpoint. The user explicitly retained the no-paid-API constraint and authorized local models and Hugging Face access. API credentials are never included in reports.

| Start (Europe/Kyiv) | End | Activity | Timing basis |
| --- | --- | --- | --- |
| approximately 2026-10-03 11:54 | 16:31:01 | Codex-limit pause | Excluded from active work |
| 2026-10-03 16:31:01 | 16:49:51 | Isolate Python diagnostics; verify B/F; fix accepted self-commitment status; freeze and test independent G; finalize review artifacts, reports and archive preparation | Wall-clock checkpoints, including local inference waits |

Approximate combined work windows through this checkpoint: **3 hours 17 minutes**, including model/download waits. Long Codex-limit pauses above are excluded. Several endpoints are approximate, initial inspection was not timed, and final commit/archive housekeeping follows this checkpoint. This is not an exact focused-labor total or a claim that every submission requirement is finished. Human listening remains pending.

