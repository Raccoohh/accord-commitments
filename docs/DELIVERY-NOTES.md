# Delivery notes

**Accord — Recorded conversation → final commitments**

Deadline: 5 October 2026. Current delivery is a local prototype and reproducible test package. It is **not yet a fully validated submission**: OpenAI ASR returned `credit_balance_exhausted`, and further paid calls were stopped at the user's request. No successful speech analysis, public demo, GitHub push or final video is claimed.

- [Run/setup instructions](../README.md)
- [Local demo](http://127.0.0.1:3000) — available only while the local server is running; not a public URL
- [Architecture and privacy](ARCHITECTURE.md)
- [Frozen scenarios A–D](../fixtures/cases.json), [fresh holdout E](../fixtures/holdout.json)
- Audio: [A](../fixtures/audio/A.wav), [B](../fixtures/audio/B.wav), [C](../fixtures/audio/C.wav), [D](../fixtures/audio/D.wav), [E](../fixtures/audio/E.wav)
- Scripts/expectations: [A](../fixtures/A/expected.json), [B](../fixtures/B/expected.json), [C](../fixtures/C/expected.json), [D](../fixtures/D/expected.json), [E](../fixtures/E/expected.json); script.txt is next to each expected file
- [Quality report with failures](QUALITY-REPORT.md), [expected versus actual](../reports/expected-vs-actual.md), [evaluation counts](../reports/evaluation.json)
- [Local test output](../reports/unit-tests.txt), [browser checks](../reports/offline-browser/checks.json), [HTTP checks](../reports/server-checks.json)
- [API failure diagnostic](../reports/access-diagnostic.json), [run metrics](../reports/run-metrics.jsonl), [cost assumptions](COSTS.md)
- [Listening review checklist](LISTENING-CHECKLIST.md), [evaluation protocol](EVALUATION-PROTOCOL.md)
- [Reused components and AI tools](AI-AND-REUSE.md), [time log](WORKLOG.md), [requirements checklist](REQUIREMENTS.md)
- [2:50 video recording script](VIDEO-SCRIPT.md) — not a finished video

Local repository root: the project folder. The initial independent fixture commit is `32b67be`. Delivery archives exclude `.env.local`, runtime logs and temporary synthesis parts. A Git bundle preserves the local commit history; the source ZIP contains the committed snapshot. No files were sent to an employer or uploaded publicly.

Offline handoff files, generated after the final commit: `delivery/accord-source.zip` and `delivery/accord-repository.bundle`. To recover a standalone repository: `git clone delivery/accord-repository.bundle accord`. Add your own ignored `.env.local` before live use. The source ZIP includes reports, fictional audio, scripts and documentation.

To finish: restore API credit and explicitly authorize paid testing, execute and review A–D, fix observed semantic errors, evaluate an unseen holdout, listen to the evidence, record the demonstration, and provide a public URL/GitHub remote if required. Preserve all failed runs and update these notes around the final verified state.
