# Local inference validation log

This continues the historical cloud-only report. No paid API calls were made during the local migration. Independent expected labels remain unchanged.

## Initial observations

- Python installation initially failed on a slow download; retry with a 120-second read timeout and cached packages succeeded.
- Real A audio initialization succeeded: 29 speaker segments, two speaker IDs, 88.46 seconds of input. ASR inference took 9.007 seconds and CPU diarization 37.459 seconds; first model downloads/load added 51.777 seconds, plus process initialization. See `reports/local-initial/A.asr.json`.
- Speech cache loaded successfully with `HF_HUB_OFFLINE=1` in the real browser run.
- ASR omitted “marketing” in the announcement-cancellation context. The cancellation itself was transcribed. This remains an ASR error; the script was not fed back into the runtime transcript.
- Initial real browser A and B results were incorrectly `unusable`, with no final items after validation. These are failures, not passes: `reports/local-initial/A.actual.json` and `B.actual.json`. Processing was 242.406 and 243.487 seconds respectively.
- The first Ollama process used CPU despite an available RTX 4050. A direct loader test demonstrated that a relative/ASCII DLL path plus its dependencies exposes CUDA. The launcher was corrected with a temporary junction and process-only PATH; a subsequent model status showed GPU memory use.
- C was interrupted before completion to restart the owned local processes; no C result from that interrupted run is counted.
- Extraction-only transcript replays are explicitly labelled and do not count as full audio tests. They never read expected labels.
- A GPU replay reproduced the failure. Enabling Qwen3 thinking without supplying the schema text produced a complete but empty result after 276.155 seconds; this was another failure. Passing the schema in the prompt, as [Ollama recommends](https://docs.ollama.com/capabilities/structured-outputs), improved formatting but still misassigned wireframes to Maya, kept the old date, and omitted the proposal/open question. Those raw results are preserved in `reports/local-initial/A.extraction-*.json`.
- The validator now withholds a displayed deadline when it contradicts the final deadline change recorded in the same result. A regression test covers this observed failure. This consistency check does not replace semantic review.
- Qwen2.5 7B was selected for the next trial after these observed 4B failures. It is a separate local download, not a paid API or a change to gold labels.
- The first 7B replay also failed field accuracy: missing owners, old wireframe deadline, omitted dark-mode proposal and misclassified question. The inconsistent date was withheld by validation. See `A.extraction-7b.json`.
- After the next user-requested resume, the extraction contract was simplified: the model selects segment IDs, accepted changes, and final fields; the app attaches exact full-segment quotes and normalizes only explicit dates with a year. This reduces duplicate text generation and prevents fabricated quote strings. It does not prove semantic sufficiency.
- The compact 7B replay improved the changed deadline/proposal but still missed owners and marked accepted ownerless work unresolved. The actual output remains in `A.extraction-compact.json`; it is not a pass.
- A new date test exposed a timezone-dependent `Date.parse` conversion in the compact adapter. Explicit dates now use UTC calendar components and verify day/month/year, so local timezone cannot shift a deadline. The full unit suite passed afterward.
- Qwen3 4B with the compact schema and thinking enabled hit the 5,000-token output cap. This bounded failure is retained in `A.compact-4b-thinking.json`.
- A short unconstrained 7B reading correctly identified active owners/final deadlines, cancellation and ownerless accepted work. The runtime now uses two fixed local calls: concise decision reading, then compact structured extraction checked against the original transcript. These are measured stages, not automatic retries. Initial two-stage output fixed the active owner/date errors.
- Unresolved tasks duplicating the same cited open question are collapsed into that participant question. Short acceptance/cancellation fragments gain adjacent transcript context, labelled as context, to make bare “Agreed” replies auditable. For an inactive cancelled task only, one explicit cited first-person self-assignment can retain the prior executor when no ownership transfer was reported; ambiguous cases remain null. Unit tests cover these boundaries.
- A 14B backup download was started but cancelled when the two-stage 7B approach worked better. It was not used for inference. The failed 4B weights and the already-extracted installer ZIP were removed to reclaim workspace disk space; all evaluation reports remain.

Acoustic listening has not been performed. Browser playback checks establish seek/stop behavior only. Final results and counts will be recorded after regression tests and the fresh holdout.
