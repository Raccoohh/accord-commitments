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

Two real ASR calls were attempted and rejected; the diagnostic reported `credit_balance_exhausted`. No successful live speech result or extraction call exists. Model-access GET checks succeeded but did not establish available credit. Subsequent work was local/offline as the user requested. Runtime measurements are in `reports/run-metrics.jsonl`; there were no automatic retries, purchases or public publication.
