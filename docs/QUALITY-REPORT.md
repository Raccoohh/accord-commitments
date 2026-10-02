# Quality report

Status on 2 October 2026: **local implementation tested; real speech correctness is not validated and the submission is incomplete**. Paid requests were stopped at the user's request after the API-credit failure.

## What actually ran

| Verification | Result | Evidence |
| --- | --- | --- |
| Node unit/provider-contract tests | 18 passed, 0 failed | [Output](../reports/unit-tests.txt) |
| Offline browser checks | 10 passed, 0 uncaught JS errors | [Checks](../reports/offline-browser/checks.json) |
| Local HTTP checks | 5 passed | [Report](../reports/server-checks.json) |
| Real A upload through Edge | Failed: ASR returned HTTP 429; no transcript or commitments | [Original result](../reports/initial/A.actual.json), [screenshot](../reports/initial/A.png) |
| Real C diagnostic audio request | Failed: `credit_balance_exhausted`, type `insufficient_quota` | [Diagnostic](../reports/access-diagnostic.json) |
| Real D drag-and-drop through Edge | Passed: unusable, no tasks, no provider calls | [Actual result](../reports/offline-browser/D.actual.json), [screenshot](../reports/offline-browser/silence.png) |
| Evidence playback mechanics | Passed against a deliberately mocked UI response while playing the original local A audio | [Playback state](../reports/offline-browser/playback.json) |
| Fresh E recording | Script/expectations frozen and audio generated after local fixes; not analyzed | [Holdout](../fixtures/holdout.json), [audio](../fixtures/audio/E.wav) |

Offline UI tests use conspicuously labelled fabricated output solely to test rendering, escaping, status sections, seek/stop and layout. Their “evidence” is not asserted to occur in the real audio. They are not demo outputs, ASR tests or commitment-accuracy results. The app contains no demo branch or fixture-name lookup.

## Semantic evaluation

[Expected versus actual](../reports/expected-vs-actual.md) and [machine-readable counts](../reports/evaluation.json) separate status, owner, deadline, structural evidence and evidence meaning/listening.

| Case | Expected active tasks | Semantic result | TP | FP | FN |
| --- | ---: | --- | --- | --- | --- |
| A | 2 | No output: provider failure | Not evaluable | Not evaluable | Not evaluable |
| B | 2 | Not run | Not evaluable | Not evaluable | Not evaluable |
| C | 1 | No output: provider failure | Not evaluable | Not evaluable | Not evaluable |
| D | 0 | No speech, no commitments | 0 | 0 | 0 |
| E | 2 | Not run | Not evaluable | Not evaluable | Not evaluable |

A failed provider operation is an operational failure, not an empty successful extraction. D has no positive tasks; its zero counts do not imply positive-task precision/recall. No aggregate speech-accuracy percentage is reported. A/B invariance, correct voice-to-name mapping, final deadlines, cancellation interpretation and completeness all remain pending live verification. Expected labels were not changed in response to analyzer output; no analyzer output exists for the speech cases.

## Timing and cost observations

A: 88.46 seconds of audio; failed after **1,385 ms processing / 1,411 ms including server upload**. C diagnostic: see the exact recorded milliseconds in `access-diagnostic.json`; no useful result was produced. These are failure latencies, not time-to-useful-result claims.

The final local D browser run: **8 seconds** of silence; **16 ms** browser preparation, **33 ms** click-to-render measurement, **4 ms** server processing. These tiny silence-path measurements do not predict speech-pipeline latency. The harness records the result render in the client; it does not claim human comprehension time.

The final playback test observed the original audio playing at **0.272844 s**, then paused at **1.057884 s** for a requested context end of **1.1 s**. This verifies seek/stop mechanics, not acoustic correctness or word alignment.

Two real provider calls were attempted, both ASR and both rejected; no live extraction call occurred. No automatic retry was used. Unknown charges are `null`, not reported as zero. D made zero API calls. [Run metrics](../reports/run-metrics.jsonl) preserve each logged run and the separate diagnostic. See [cost assumptions](COSTS.md).

## Failures and corrections

1. Git initially refused sandbox ownership. Commands used a per-invocation `safe.directory` exception for this exact workspace; no global trust setting was changed. Independent expectations were committed before the first ASR attempt.
2. Sandboxed shell startup began returning an environment setup error. Authorized commands ran through reviewed escalation. This was a tooling issue, not an application test failure.
3. The initial app classified every unknown HTTP 429 as a transient rate limit. One diagnostic identified `credit_balance_exhausted`. Classification now recognizes quota-related codes/messages and surfaces billing/limit guidance; a mocked-provider regression test passes. It has not been rechecked against a paid live request.
4. The browser harness initially read `innerText` inside a closed details element, obtaining an empty string. It now reads `textContent`. A subsequent harness error used relative request URLs without a base URL; the context now specifies its local base. Final offline browser reruns passed.
5. Cost code initially used an ASR per-minute estimate without explicitly distinguishing it from a verified diarize rate. It now records verified token rates and labels the duration fallback as an assumption.
6. An automatic approval review could not complete because Codex usage was exhausted. The rejected action did not run. Work resumed after the user renewed the Codex limit; the separate API balance remained exhausted. No approval bypass was used.

## Remaining work and limitations

Restore API credit and explicitly authorize live tests; run A–D, inspect and correct actual errors, then use a fresh unseen holdout if E has already influenced any implementation changes. Perform and record full-audio and evidence listening. Produce the real A/B comparison and field-level metrics. Record the final video and configure public demo/repository access if required.

No listening audit is claimed. Generated timings are not acoustic verification. Natural speech, overlapping voices, ambiguous consent, noise, non-English audio, more speakers and adversarial transcript instructions have not received live semantic evaluation. Structural checks cannot establish that a quoted statement actually constitutes agreement.

No universal accuracy, completed public deployment, finished video, successful new-audio extraction, or submission readiness is claimed.
