# Delivery notes

**Accord — Recorded conversation → final commitments**

Deadline: 5 October 2026. This package contains a working local browser prototype, real local audio-analysis results and a reproducible evaluation. No paid API calls are needed. Human acoustic review remains pending; model interpretation and history limitations are disclosed in the quality report. No public demo, GitHub push or completed video is claimed.

- [Run instructions](../README.md), [one-time local setup](LOCAL-SETUP.md)
- [Local demo](http://127.0.0.1:3000) — only while the local server runs; not public
- [Architecture and privacy](ARCHITECTURE.md), [pinned model manifest](../reports/local-models.json)
- [Frozen A–D scenarios](../fixtures/cases.json), [E regression](../fixtures/holdout.json), [F fresh scenario](../fixtures/fresh-local.json), [F generation checkpoint](../reports/F-generation.json)
- Audio: [A](../fixtures/audio/A.wav), [B](../fixtures/audio/B.wav), [C](../fixtures/audio/C.wav), [D](../fixtures/audio/D.wav), [E](../fixtures/audio/E.wav), [F](../fixtures/audio/F.wav)
- Expectations: [A](../fixtures/A/expected.json), [B](../fixtures/B/expected.json), [C](../fixtures/C/expected.json), [D](../fixtures/D/expected.json), [E](../fixtures/E/expected.json), [F](../fixtures/F/expected.json); script.txt is beside each file
- Actual results: [A](../reports/live/A.actual.json), [B](../reports/live/B.actual.json), [C](../reports/live/C.actual.json), [D](../reports/live/D.actual.json), [E](../reports/live/E.actual.json), [F](../reports/live/F.actual.json)
- [Quality report](QUALITY-REPORT.md), [retained local failures](LOCAL-QUALITY.md), [expected versus actual](../reports/expected-vs-actual.md), [counts](../reports/evaluation.json)
- [Unit tests](../reports/unit-tests.txt), [browser checks](../reports/offline-browser/checks.json), [HTTP checks](../reports/server-checks.json)
- [Run metrics](../reports/run-metrics.jsonl), [cost accounting](COSTS.md), [historical API failure](../reports/access-diagnostic.json)
- [Listening checklist](LISTENING-CHECKLIST.md), [evaluation protocol](EVALUATION-PROTOCOL.md)
- [Saved-result listening page](../reports/listening-review.html) — open in a browser from the project folder; all original audio links remain local
- [Tools and original work](AI-AND-REUSE.md), [time log](WORKLOG.md), [requirement checklist](REQUIREMENTS.md)
- [Exact 2:50 video script](VIDEO-SCRIPT.md) — the allowed fallback, not a finished video

The source ZIP and Git bundle are generated from the final committed snapshot in delivery/accord-source.zip and delivery/accord-repository.bundle. They exclude secrets, model weights, Python/Ollama runtimes, operational logs and temporary synthesis parts. The ZIP includes fictional audio and actual test reports. Recover the repository using `git clone delivery/accord-repository.bundle accord`, then follow local setup on the receiving computer. Keep the archive outside the cloned repository to avoid duplicate delivery files.

For GitHub publication, supply an empty destination repository URL with connector or Git write access. The connector account is authenticated, but no accessible repository or remote was selected. For a public demo, provide an authorized machine capable of running the local models and an access plan; static hosting cannot run this inference backend. No subscription or hosting purchase is needed to use the local handoff. No material has been sent to an employer or other people.

Final independent case: [G script and labels](../fixtures/fresh-final.json), [G audio](../fixtures/audio/G.wav), [G expected](../fixtures/G/expected.json), [G actual](../reports/live/G.actual.json). F is now a regression case; its first semantic failure is retained separately. The final review includes A–G and does not hide missing inactive items or model-history limitations.
