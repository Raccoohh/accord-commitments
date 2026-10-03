# Quality report

Evaluated on **3 October 2026**. The application performs real local audio analysis with no paid API fallback. All results below come from actual audio uploads through Microsoft Edge. Expected labels were frozen independently before analysis. Human acoustic review was reported complete by the project user on 3 October 2026, with no discrepancies noticed; see [the confirmation record](../reports/human-listening-review.json). Semantic review here means the assistant compared actual transcript text, evidence chains and output fields against those labels.

## Final synthetic evaluation

| Case | TP | FP | FN | Review |
| --- | ---: | ---: | ---: | --- |
| A | 2 | 0 | 0 | reviewed |
| B | 2 | 0 | 0 | reviewed |
| C | 1 | 0 | 0 | reviewed |
| D | 0 | 0 | 0 | passed |
| E | 2 | 0 | 0 | reviewed |
| F | 2 | 0 | 0 | reviewed |
| G | 2 | 0 | 0 | reviewed |

Task detection across speech cases: **TP 11, FP 0, FN 0**. D is a negative silence case and does not establish positive-task accuracy. Across 22 expected items, status matched 21, owner 21, and deadline 21. Evidence had structural matches for 21 items and text-reviewed final-state support for 21. Displayed items covered by user-reported acoustic listening: **21**. The missing F proposal has no displayed item to score; D was heard as intentional silence. Task detection and final-field counts do not score history completeness or role-label correctness; those are disclosed below.

[Complete field table](../reports/expected-vs-actual.md) · [Machine-readable counts](../reports/evaluation.json) · [Review mapping and notes](../reports/live/review-mapping.json).

## A/B controlled change

Final status, owner, source and all other deadline fields: **PASS**. Only the intended wireframe date changes from 2026-10-08 to 2026-10-09. Semantic task matching was reviewed before comparison. This is a final-field check, not a claim that every generated history or explanation is invariant. See [comparison](../reports/ab-comparison.json) and the case notes below.

## Measured latency and cost

All durations below are seconds. Browser preparation and upload-to-render are distinct client measurements. Server speech time includes Python initialization, ASR and diarization. Extraction includes both fixed local LLM calls. These measurements are from this machine, not a latency guarantee.

| Case | Audio | Browser preparation | Speech stage | Two LLM stages | Server processing | Browser upload-to-render | Calls |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A | 88.46 | 0.106 | 65.443 | 46.395 | 111.850 | 112.431 | 3 |
| B | 88.6 | 0.148 | 85.656 | 91.815 | 177.488 | 177.925 | 3 |
| C | 32.69 | 0.050 | 31.127 | 16.308 | 47.442 | 47.922 | 3 |
| D | 8 | 0.017 | 0.000 | 0.000 | 0.001 | 0.032 | 0 |
| E | 56.36 | 0.124 | 44.688 | 40.013 | 84.713 | 85.437 | 3 |
| F | 63.335 | 0.118 | 49.316 | 33.373 | 82.702 | 83.485 | 3 |
| G | 60.055 | 0.105 | 46.998 | 36.849 | 83.855 | 84.121 | 3 |

Every successful speech operation has one combined ASR/diarization call and two Ollama calls, with **zero automatic retries**. Actual per-call token usage and load/evaluation timings are in each [saved result](../reports/live/) and [run metrics](../reports/run-metrics.jsonl). Standalone and extraction-only experiments have separate [diagnostic traces](../reports/diagnostic-metrics.jsonl); [manual interruptions](../reports/interrupted-runs.json) disclose unrecovered timings/usage as null. Speech token billing is not applicable to local inference. D uses zero model calls. All final runs have **$0 metered API charges and $0 API cost per input minute**; hardware, electricity and local compute are unmeasured, represented by null. Windows TTS and hosting have no purchased metered service. [Cost method](COSTS.md) retains the separate historical cloud assumptions.

Pinned runtime: faster-whisper medium.en CPU INT8, pyannote Community-1 CPU, and Qwen2.5 7B Q4_K_M through portable Ollama. Exact revisions/digest are in [model manifest](../reports/local-models.json); package versions are locked. The language model uses the RTX 4050 where supported; CPU speech and model loading are included in timing.

## Verification and provenance

- **40 unit/contract tests passed**: [output](../reports/unit-tests.txt). Provider responses are mocked only in isolated tests.
- **5 HTTP checks** and **10 offline browser checks**: [HTTP](../reports/server-checks.json), [browser](../reports/offline-browser/checks.json). Offline UI mock results are labelled and are not speech-accuracy evidence.
- The real browser harness saved actual outputs, screenshots and original-audio seek/stop state for speech cases. These establish mechanics, not hearing. The separate [listening checklist](LISTENING-CHECKLIST.md) records the user's completed review.
- A–D labels were frozen in 32b67be. E and F became regression cases after their failures informed general fixes. F's first complete semantic result is preserved separately in local-regression-v9. Independent G's script and labels were frozen with the final semantic fix in 99f1bc2; its newly generated audio was committed in 370411b before any G analysis. No runtime change was based on G's content. Earlier interrupted and operationally failed F attempts remain disclosed in the failure log.
- Only audio enters the app. Models receive ASR segments, never fixture scripts, filenames or expected labels. There is no canned-answer branch.

## Remaining semantic observations

### A

- All final states, owners and deadlines match frozen expectations.
- Selected question evidence now includes the explicit not-decided reply.
- Structured deadline-change history is empty despite the accepted replacement; the complete four-fragment chain is present in main task evidence.

### B

- All final states, owners and deadlines match frozen expectations. Selected question evidence includes the not-decided reply.
- A/B final fields differ only in the intended wireframe date. Structured history completeness differs: B has a deadline-change entry while A does not; both include the complete main evidence chain.
- Cancellation evidence contains the explicit cancellation and acknowledgement, but individual model role labels are imperfect. Final cancelled status and active-list exclusion are correct.

### C

- Confirmed task, null owner, verbatim next Friday and null normalized date are correct. Evidence includes explicit ownership refusal and confirmation that the owner is unassigned. No fabricated participant question remains.

### E

- Both active tasks are assigned to Maya; the rollback checklist keeps November 3, 2026 and restore steps have no agreed deadline.
- The selected rollback evidence includes original assignment, acceptance, ownership transfer and acceptance. Structured owner-change history is empty, so history completeness is limited.
- The backups refusal is correctly quoted and final state is unapproved, but its evidence role is incorrectly labelled acceptance. Role-label accuracy is not counted as final-field accuracy.

### F

- Both accepted tasks are now active with correct owners; the refused December 7 proposal does not replace the agreed December 4 date.
- The inactive archive-exports suggestion is missing. It is not a false-positive active task, but item completeness fails and its expected row is scored missing.
- ASR merged the roles acceptance and exports suggestion in one segment; its text says do not prove rather than the scripted do not approve. This is a script/transcript discrepancy, not an acoustic listening verdict.
- Migration evidence contains original acceptance and final reaffirmation; the intervening counterproposal/refusal is available in the full transcript but is not among its selected excerpts.
- F is a regression case after its first semantic result informed the accepted-self-commitment consistency check; the original failure remains in local-regression-v9.

### G

- All four final task states, owners and deadlines match the independently frozen expectations. Names alex and maya differ only in capitalization; owner scoring ignores case, not spelling.
- Installer evidence includes the original assignment, acceptance, cancellation and a second-speaker statement that the task is cancelled.
- The support-notes review stays confirmed with no owner or deadline; the icons suggestion remains inactive.
- Several context quotes are labelled identity by the model. Their actual text supports the final state; role-label correctness is not claimed.
- G was evaluated after final semantic fixes and its results did not inform runtime changes.

Quotes match ASR text structurally; they can still contain misheard words or incorrect speaker alignment. Evidence-role labels, explanations and structured change histories are model interpretations, not independently verified facts. The user reported no audible discrepancies; the assistant did not independently listen or measure each boundary. This report does not convert that confirmation into a guarantee of perfect transcription. Natural speech, accents, noise, overlapping speakers, larger groups, non-English recordings, longer meetings and adversarial speech were not semantically validated.

## Retained failures and corrections

The first two cloud ASR attempts failed with exhausted credit. Paid calls were then stopped. Local Qwen3 trials returned empty or incorrect output, and one hit its token cap. Early Qwen2.5 output missed owners and final dates. A compact contract and two fixed reading/formatting stages improved those failures. The original failures remain in reports/initial and reports/local-initial.

The first local regression omitted Maya's name in E; medium.en recovered it from audio. The next run exposed punctuation/case-sensitive date rejection and missing introduction references. Grounding now recovers exact original spans and same-speaker introductions. Another E run failed closed on an invented segment ID. The first bounded-schema implementation accidentally shared enum constraints with free-text fields; a regression test exposed and protects the corrected independent schema leaves. The current decoder restricts only references to actual IDs; quotes are still structurally checked. Questions retain following real context, and never-approved tasks cannot carry a contradictory confirmed-to-proposed status history. See [detailed failure log](LOCAL-QUALITY.md) and preserved local-regression-v1/v2/v3/v4 folders.

A later B run exposed dependence on evidence-role labels for cancellation, followed by an explicitly unapproved suggestion labelled unresolved. Conservative checks now recognize quoted explicit cancellation and quoted suggestion plus non-approval, excluding conditional/negated cancellation and refused deadline changes. F then exposed dependency diagnostics contaminating Python stdout; a separate output descriptor now carries only JSON. All failed versions remain in local-regression-v6/v7/v8. Final B/F results were produced after these fixes; earlier A/C/D/E results are retained because their semantics were unaffected by the narrow checks and output-channel repair.

F's first completed extraction missed an accepted access-role task and omitted an inactive exports proposal. Its ASR merged adjacent same-speaker topics and misheard “don't approve” as “don't prove.” A further evidence-consistency guard recognizes unconditional self-commitment followed by another speaker's agreement, while excluding conditional or contradicted commitments. F was then rerun as a regression test; G is the new independent post-fix recording. The original failure is preserved, not replaced by a passing claim.

No public URL, GitHub publication or finished video is claimed. The runnable local package and [2:50 recording script](VIDEO-SCRIPT.md) are the permitted handoff fallback. Human listening is recorded as complete by user confirmation. The disclosed semantic limitations remain part of the handoff.
