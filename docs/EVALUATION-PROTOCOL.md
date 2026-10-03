# Evaluation protocol

The gold A–D fixture content was frozen in commit `32b67be`, before the first analyzer attempt. E (`0281e15`) and F (`9faa729`) later became regression cases after their failures informed general fixes. Independent G's script and labels were frozen with the final semantic fix in `99f1bc2`; its new audio was committed in `370411b` before analysis. G is the final untouched holdout. Do not rewrite expected outcomes to match model mistakes. Earlier attempts and synthesis checkpoints remain in the local validation log and Git history.

Only audio enters the application. `scripts/browser-check.mjs` uploads each WAV in a real Edge browser and saves the complete response, browser latency, screenshot and playback state. The active application now uses **local inference with no paid API calls**. D skips inference because the app detects digital silence locally. Historical failed cloud runs remain in `reports/initial/`; first local results are retained in `reports/local-initial/` and final regression results in `reports/live/`.

For every returned task, manually match its meaning to the independent expected key. Inspect status, owner and deadline separately. A matching title is not enough. Check the full evidence chain: proposed work, acceptance, correction/cancellation, later acceptance. Verify that each quoted statement is audibly present in the excerpt and that voice-to-name mapping follows self-introduction. Record uncertainty and every discrepancy.

Create `reports/live/review-mapping.json` only after independent review. Example shape (illustration, not an actual review):

```json
{
  "A": {
    "matches": {
      "wireframes": {
        "actualId": "REPLACE_WITH_REVIEWED_ACTUAL_ID",
        "deadlineMeaningCorrect": true,
        "evidenceSupportsFinalState": true,
        "listened": true
      }
    }
  }
}
```

Every expected item needs a mapping; a missing expected task has `actualId: null`. Actual active items without a matching expected confirmed task count as FP. An expected confirmed task not returned active counts as FN. A matched active task counts as TP for **task detection only**, while wrong owner/deadline/status/evidence are separately exposed. Failed provider operations have no semantic output: report the operational failure and mark semantic metrics unavailable, rather than pretending it was an empty successful result. D has no positive labels, so TP=0/FP=0/FN=0 is not evidence of positive-task accuracy.

Run `node scripts/evaluate.mjs reports/live` to generate the comparison table and counts. The evaluator performs no model calls. It refuses duplicate one-to-one task matches. It does not automate semantic matching or listening. Review the generated rows and retain failed runs.

A/B invariance review: match every item by the independently defined key. Their final statuses, owners, task meaning and other deadlines must remain unchanged. Only wireframes' normalized date changes from 2026-10-08 to 2026-10-09 and the corresponding quote changes. Timestamp shifts are allowed. Missing-owner/deadline clarifications should have the same meaning. Record pass/fail and mismatches; do not infer the outcome from fixture similarity.

After correcting implementation failures, rerun affected regression cases and process a newly created recording without adapting runtime code to its content. The final independent G tests a dated self-assignment, accepted cancellation, ownerless agreed work and an unapproved suggestion. Any runtime change based on G would invalidate it as the final holdout and require another new recording.

The development assistant can review actual transcript text, fields and evidence chains against frozen labels, but cannot certify acoustic listening. Assistant-only review uses `listened: false`. After the user explicitly confirmed listening to all recordings and reported no discrepancies on 3 October 2026, displayed matched items were marked `listened: true`, with provenance in reports/human-listening-review.json. The missing F proposal remains false because it has no displayed evidence. Never silently promote a text review to a listening pass. Preserve the small-model A–E run in `reports/local-regression-v1/` when replacing `reports/live/` with the final regression run.

Owner identity comparison ignores capitalization and surrounding whitespace after Unicode NFC normalization; different spellings are not treated as equal. For example, ASR-derived `alex` and expected `Alex` refer to the same named speaker when the introduction evidence supports that identity. This scoring normalization does not modify the actual app output.

Small synthetic tests only test these controlled scenarios. They do not establish accuracy on natural speech, accents, noise, overlapping speech, longer meetings or more speakers.




