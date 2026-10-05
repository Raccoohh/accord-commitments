// Builds tables from saved REAL runs and separately authored semantic review mappings.
import {readFile,writeFile} from 'node:fs/promises';
const json=async path=>JSON.parse((await readFile(path,'utf8')).replace(/^\uFEFF/,''));
const evaluation=await json('reports/evaluation.json'),mapping=await json('reports/live/review-mapping.json');
const runs=Object.fromEntries(await Promise.all(['A','B','C','D','E','F','G'].map(async id=>[id,await json(`reports/live/${id}.actual.json`)])));
const a=runs.A.job.result,b=runs.B.job.result,rows=[];
for(const key of Object.keys(mapping.A.matches)){
  const first=a.items.find(i=>i.id===mapping.A.matches[key].actualId),second=b.items.find(i=>i.id===mapping.B.matches[key].actualId);
  if(!first||!second)throw Error(`Incomplete A/B manual match: ${key}`);
  rows.push({key,statusUnchanged:first.status===second.status,ownerUnchanged:first.owner===second.owner,sourceUnchanged:first.source===second.source,deadlineA:first.deadlineNormalized??first.deadlineOriginal,deadlineB:second.deadlineNormalized??second.deadlineOriginal,deadlineCorrect:key==='wireframes'?first.deadlineNormalized==='2026-10-08'&&second.deadlineNormalized==='2026-10-09':first.deadlineOriginal===second.deadlineOriginal});
}
const comparison={reviewBasis:'Manual semantic key matching; programmatic comparison of final fields.',finalFieldsPass:rows.every(r=>r.statusUnchanged&&r.ownerUnchanged&&r.sourceUnchanged&&r.deadlineCorrect),rows,historyAndEvidenceReview:mapping.A.notes.concat(mapping.B.notes),note:'Final-field invariance does not imply identical history completeness, wording or timestamps. Read the separate semantic review notes.'};
await writeFile('reports/ab-comparison.json',JSON.stringify(comparison,null,2)+'\n');
const fmt=ms=>(ms/1000).toFixed(3);
const timingRows=Object.entries(runs).map(([id,r])=>{
  const m=r.job.metrics,c=r.clientMetrics??{};
  return `| ${id} | ${m.audioSeconds} | ${fmt(c.preparationMs??0)} | ${fmt(m.stages.transcriptionMs??0)} | ${fmt(m.stages.extractionMs??0)} | ${fmt(m.processingMs)} | ${fmt(c.uploadToUsefulResultMs??0)} | ${m.calls.length} |`;
});
const scoreRows=evaluation.cases.map(c=>`| ${c.id} | ${c.TP??'n/a'} | ${c.FP??'n/a'} | ${c.FN??'n/a'} | ${c.status} |`);
const summary=evaluation.summary;
const notes=evaluation.cases.filter(c=>c.reviewNotes?.length).map(c=>`### ${c.id}\n\n${c.reviewNotes.map(n=>'- '+n).join('\n')}`).join('\n\n');
const content=`# Quality report

Evaluated on **3 October 2026**. The application performs real local audio analysis with no paid API fallback. All results below come from actual audio uploads through Microsoft Edge. Expected labels were frozen independently before analysis. Human acoustic review was reported complete by the project user on 3 October 2026, with no discrepancies noticed; see [the confirmation record](../reports/human-listening-review.json). Semantic review here means the assistant compared actual transcript text, evidence chains and output fields against those labels.

## Final synthetic evaluation

| Case | TP | FP | FN | Review |
| --- | ---: | ---: | ---: | --- |
${scoreRows.join('\n')}

Task detection across speech cases: **TP ${summary.TP}, FP ${summary.FP}, FN ${summary.FN}**. D is a negative silence case and does not establish positive-task accuracy. Across ${summary.expectedItems} expected items, status matched ${summary.statusCorrect}, owner ${summary.ownerCorrect}, and deadline ${summary.deadlineCorrect}. Evidence had structural matches for ${summary.evidenceStructural} items and text-reviewed final-state support for ${summary.evidenceSemantic}. Displayed items covered by user-reported acoustic listening: **${summary.listened}**. The missing F proposal has no displayed item to score; D was heard as intentional silence. Task detection and final-field counts do not score history completeness or role-label correctness; those are disclosed below.

[Complete field table](../reports/expected-vs-actual.md) · [Machine-readable counts](../reports/evaluation.json) · [Review mapping and notes](../reports/live/review-mapping.json).

## A/B controlled change

Final status, owner, source and all other deadline fields: **${comparison.finalFieldsPass?'PASS':'FAIL'}**. ${comparison.finalFieldsPass?'Only the intended wireframe date changes from 2026-10-08 to 2026-10-09.':'The intended wireframe date changes from 2026-10-08 to 2026-10-09, but additional differences remain; strict invariance is not achieved.'} Semantic task matching was reviewed before comparison. This is a final-field check, not a claim that every generated history or explanation is invariant. See [comparison](../reports/ab-comparison.json) and the case notes below.

## Measured latency and cost

All durations below are seconds. Browser preparation and upload-to-render are distinct client measurements. Server speech time includes Python initialization, ASR and diarization. Extraction includes both fixed local LLM calls. These measurements are from this machine, not a latency guarantee.

| Case | Audio | Browser preparation | Speech stage | Two LLM stages | Server processing | Browser upload-to-render | Calls |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${timingRows.join('\n')}

Every successful speech operation has one combined ASR/diarization call and two Ollama calls, with **zero automatic retries**. Actual per-call token usage and load/evaluation timings are in each [saved result](../reports/live/) and [run metrics](../reports/run-metrics.jsonl). Standalone and extraction-only experiments have separate [diagnostic traces](../reports/diagnostic-metrics.jsonl); [manual interruptions](../reports/interrupted-runs.json) disclose unrecovered timings/usage as null. Speech token billing is not applicable to local inference. D uses zero model calls. All final runs have **$0 metered API charges and $0 API cost per input minute**; hardware, electricity and local compute are unmeasured, represented by null. Windows TTS and hosting have no purchased metered service. [Cost method](COSTS.md) retains the separate historical cloud assumptions.

Pinned runtime: faster-whisper medium.en CPU INT8, pyannote Community-1 CPU, and Qwen2.5 7B Q4_K_M through portable Ollama. Exact revisions/digest are in [model manifest](../reports/local-models.json); package versions are locked. The language model uses the RTX 4050 where supported; CPU speech and model loading are included in timing.

## Verification and provenance

- Public tunnel smoke check: real D/C browser uploads, original-audio playback, session isolation and result clearing passed; see [external checks](../reports/public-demo/checks.json). This is separate from the original A–G semantic benchmark.
- **52 unit/contract/gateway checks passed**: [output](../reports/unit-tests.txt). Provider responses are mocked only in isolated tests.
- **5 HTTP checks** and **10 offline browser checks**: [HTTP](../reports/server-checks.json), [browser](../reports/offline-browser/checks.json). Offline UI mock results are labelled and are not speech-accuracy evidence.
- The real browser harness saved actual outputs, screenshots and original-audio seek/stop state for speech cases. These establish mechanics, not hearing. The separate [listening checklist](LISTENING-CHECKLIST.md) records the user's completed review.
- A–D labels were frozen in 32b67be. E and F became regression cases after their failures informed general fixes. F's first complete semantic result is preserved separately in local-regression-v9. Independent G's script and labels were frozen with the final semantic fix in 99f1bc2; its newly generated audio was committed in 370411b before any G analysis. No runtime change was based on G's content. Earlier interrupted and operationally failed F attempts remain disclosed in the failure log.
- Only audio enters the app. Models receive ASR segments, never fixture scripts, filenames or expected labels. There is no canned-answer branch.

## Remaining semantic observations

${notes}

Quotes match ASR text structurally; they can still contain misheard words or incorrect speaker alignment. Evidence-role labels, explanations and structured change histories are model interpretations, not independently verified facts. The user reported no audible discrepancies; the assistant did not independently listen or measure each boundary. This report does not convert that confirmation into a guarantee of perfect transcription. Natural speech, accents, noise, overlapping speakers, larger groups, non-English recordings, longer meetings and adversarial speech were not semantically validated.

## Retained failures and corrections

The first two cloud ASR attempts failed with exhausted credit. Paid calls were then stopped. Local Qwen3 trials returned empty or incorrect output, and one hit its token cap. Early Qwen2.5 output missed owners and final dates. A compact contract and two fixed reading/formatting stages improved those failures. The original failures remain in reports/initial and reports/local-initial.

The first local regression omitted Maya's name in E; medium.en recovered it from audio. The next run exposed punctuation/case-sensitive date rejection and missing introduction references. Grounding now recovers exact original spans and same-speaker introductions. Another E run failed closed on an invented segment ID. The first bounded-schema implementation accidentally shared enum constraints with free-text fields; a regression test exposed and protects the corrected independent schema leaves. The current decoder restricts only references to actual IDs; quotes are still structurally checked. Questions retain following real context, and never-approved tasks cannot carry a contradictory confirmed-to-proposed status history. See [detailed failure log](LOCAL-QUALITY.md) and preserved local-regression-v1/v2/v3/v4 folders.

A later B run exposed dependence on evidence-role labels for cancellation, followed by an explicitly unapproved suggestion labelled unresolved. Conservative checks now recognize quoted explicit cancellation and quoted suggestion plus non-approval, excluding conditional/negated cancellation and refused deadline changes. F then exposed dependency diagnostics contaminating Python stdout; a separate output descriptor now carries only JSON. All failed versions remain in local-regression-v6/v7/v8. Final B/F results were produced after these fixes; earlier A/C/D/E results are retained because their semantics were unaffected by the narrow checks and output-channel repair.

F's first completed extraction missed an accepted access-role task and omitted an inactive exports proposal. Its ASR merged adjacent same-speaker topics and misheard “don't approve” as “don't prove.” A further evidence-consistency guard recognizes unconditional self-commitment followed by another speaker's agreement, while excluding conditional or contradicted commitments. F was then rerun as a regression test; G is the new independent post-fix recording. The original failure is preserved, not replaced by a passing claim.

The repository is [Raccoohh/accord-commitments](https://github.com/Raccoohh/accord-commitments), public and readable without signing in. Temporary password-protected demo: [https://715ac629d4ca9a.lhr.life](https://715ac629d4ca9a.lhr.life); read [availability limits](REVIEWER-DEMO.md). The user supplied a revised 2:20 video; final editing and its delivery link remain pending. The local archive and [2:50 recording script](VIDEO-SCRIPT.md) support preparation but do not replace the employer-required demo, repository and video. Human listening is recorded as complete by user confirmation. The disclosed semantic limitations remain part of the handoff.
`;
await writeFile('docs/QUALITY-REPORT.md',content);
console.log(JSON.stringify({summary,abFinalFieldsPass:comparison.finalFieldsPass}));




