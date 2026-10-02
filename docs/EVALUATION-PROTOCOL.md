# Evaluation protocol

The gold A–D fixture content was frozen in commit `32b67be`, before the first analyzer attempt. The first implementation and audio were committed in `d90a247`. Fresh E was frozen in `0281e15` after local fixes and before any analysis of E. Do not rewrite expected outcomes to match model mistakes.

Only audio enters the application. `scripts/browser-check.mjs` uploads each WAV in a real Edge browser and saves the complete response, browser latency, screenshot and playback state. This is a **paid live test** for speech recordings. It must be run only after API balance is available and the user authorizes resuming paid requests. D can run without a provider call because the app detects digital silence locally.

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

After correcting implementation failures, rerun A–D and process E without adapting code to its content. E expects an accepted ownership transfer from Alex to Maya, two active tasks, one unapproved proposal, and one missing deadline. Any code change based on E invalidates it as a fresh holdout; create another independent recording.

Small synthetic tests only test these controlled scenarios. They do not establish accuracy on natural speech, accents, noise, overlapping speech, longer meetings or more speakers.
