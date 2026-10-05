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


## User listening confirmation — 3 October 2026

The user reported listening to all cases and, after clarification that D intentionally contains eight seconds of silence, reported no discrepancies. Updated the review provenance, checklist, evaluation and delivery package. The preceding pending status is a historical checkpoint. This reporting-only follow-up does not rerun inference or change runtime behavior; its work window began at approximately 17:05 Kyiv.
Follow-up reporting checkpoint: approximately 17:05–17:07 Kyiv (about two minutes), plus final packaging immediately afterward. No model calls.

## Launcher repair — 5 October 2026

The user's ordinary PowerShell session could not resolve Node after a reboot. Added Node 24 discovery (including the existing per-user Codex runtime), an explicit NodePath override, and an app readiness check. Verified startup from System32 in Windows PowerShell with Node removed from PATH, repeat startup and rejection of a nonexistent override. See reports/launcher-check.json. No inference or paid API calls were made; acoustic results are unchanged. This brief follow-up was not separately timed. Rebuilt the delivery archives.

## GitHub preparation — 5 October 2026

The full employer email clarified that evaluator demo access, a repository and an actual video of at most three minutes are required; earlier documentation incorrectly described archives/scripts as permitted substitutes. Corrected that interpretation before publication. Preparing a private repository, preserving independent fixture history and retained failures. Also repaired first-time setup so it can start services before model downloads and use the discovered Node executable without PATH changes. This follow-up is not separately timed. No paid API requests.

## Reviewer access — 5 October 2026

The user authorized a free demo on this computer and agreed to keep it powered and online. Added an authenticated loopback gateway, per-browser result isolation, sample downloads and temporary awake/start/stop helpers. Cloudflare quick-tunnel setup failed with connection timeouts; localhost.run provided a temporary HTTPS endpoint. A long Codex-limit pause occurred between approximately 16:20 and 20:27 Kyiv; it is excluded from focused work. Resumed availability checks afterward. The free domain is explicitly not presented as a stable multi-day hosting solution. Gateway HTTP checks and real public browser runs are reported separately from the original semantic benchmark. No paid API calls. This follow-up was not independently timed; no exact focused-hours completion claim is made.

## Account-assigned ngrok demo — 6 October 2026

The user requested more reliable reviewer access and supplied an Authtoken in ignored local configuration. Installed the official signed ngrok 3.39.11 client, added account-based startup and safe missing-token preflight, disabled local request-body inspection, and verified that a full gateway/tunnel restart retained the same URL. Updated stale submission links and the listening checklist row. An approval-review quota interruption delayed the restart; it resumed after the user reported renewed limits. Gateway checks passed after rerunning outside the sandbox's loopback restriction. The first ngrok browser diagnostic hit the free-tier notice; the harness now distinguishes that notice from application authentication. No paid API calls. This follow-up was not independently timed; no exact focused-hours claim is made.
