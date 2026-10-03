import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readWav,makeWav} from '../src/audio.mjs';
import {normalizeSegments,validateEvidence,validateExtraction} from '../src/validate.mjs';
import {validateSchema} from '../src/schema.mjs';
import {calculateCost} from '../src/cost.mjs';
import {analyze} from '../src/pipeline.mjs';

const segments=[{id:'intro',speakerId:'A',start:0,end:2,text:"I'm Robin."},{id:'agree',speakerId:'A',start:2,end:6,text:"I will send the report by next Friday."},{id:'reply',speakerId:'B',start:6,end:7,text:'Agreed.'}];
const ref=(segmentId,quote,role)=>({segmentId,quote,role});
function sample(){return {outcome:'complete',message:'One task',warnings:[],speakers:[{speakerId:'A',name:'Robin',confidence:'supported',evidence:[ref('intro',"I'm Robin.",'identity')]}],items:[{id:'task',task:'Send report',status:'confirmed',source:'commitment',reason:'Explicit self-commitment.',owner:'Robin',ownerSpeakerId:'A',deadlineOriginal:'next Friday',deadlineNormalized:null,dateContextQuote:null,uncertainties:[],evidence:[ref('agree',segments[1].text,'acceptance')],history:[]}]};}

test('exact quotes get authoritative segment timestamps, not invented word alignment',()=>{
  assert.deepEqual(validateEvidence(ref('agree','send the report','acceptance'),segments),{segmentId:'agree',quote:'send the report',role:'acceptance',speakerId:'A',start:2,end:6,validation:'transcript_match'});
  assert.throws(()=>validateEvidence(ref('missing','send the report','acceptance'),segments));
  assert.throws(()=>validateEvidence(ref('agree','send the summary','acceptance'),segments));
});
test('unverified evidence demotes a confirmed task and withholds quotes',()=>{const s=sample();s.items[0].evidence[0].quote='Fabricated agreement';const r=validateExtraction(s,segments);assert.equal(r.items[0].status,'unresolved');assert.equal(r.items[0].source,'clarification');assert.equal(r.items[0].evidence.length,0);assert.equal(r.outcome,'partial');});
test('a proposal-only citation cannot establish confirmed acceptance',()=>{const s=sample(),ss=structuredClone(segments);ss[1].text='We could send the report by next Friday.';s.items[0].evidence[0].quote=ss[1].text;s.items[0].evidence[0].role='proposal';assert.equal(validateExtraction(s,ss).items[0].status,'unresolved');});
test('an explicit self-commitment remains acceptance even if the model labels its role proposal',()=>{const s=sample();s.items[0].evidence[0].role='proposal';assert.equal(validateExtraction(s,segments).items[0].status,'confirmed');});
test('a conditional self-proposal is not upgraded to acceptance',()=>{const s=sample(),ss=structuredClone(segments);ss[1].text="I'll send the report if we get approval.";s.items[0].evidence[0]={segmentId:'agree',quote:ss[1].text,role:'proposal'};assert.equal(validateExtraction(s,ss).items[0].status,'unresolved');});

test('explicit cancellation text supports cancelled status even with a mistaken evidence role',()=>{
  for(const text of ['Cancel my task to write the report.','That report task is cancelled.']){
    const s=sample(),ss=structuredClone(segments);ss[2].text=text;s.items[0].status='cancelled';s.items[0].evidence.push(ref('reply',text,'context'));
    assert.equal(validateExtraction(s,ss).items[0].status,'cancelled');
  }
});

test('hypothetical or negated cancellation cannot validate cancelled status',()=>{
  for(const text of ['If that report task is cancelled, tell me.','That report task is not cancelled.','We could cancel my task.']){
    const s=sample(),ss=structuredClone(segments);ss[2].text=text;s.items[0].status='cancelled';s.items[0].evidence.push(ref('reply',text,'context'));
    assert.equal(validateExtraction(s,ss).items[0].status,'unresolved');
  }
});

test('an explicitly unapproved suggestion is not ambiguous agreement',()=>{
  const s=sample(),ss=structuredClone(segments);s.items[0].status='unresolved';s.items[0].owner=null;s.items[0].ownerSpeakerId=null;s.items[0].deadlineOriginal=null;
  ss[1].text='We could redesign the form.';ss[2].text='We are not approving that redesign today.';
  s.items[0].evidence=[ref('agree',ss[1].text,'proposal'),ref('reply',ss[2].text,'context')];
  assert.equal(validateExtraction(s,ss).items[0].status,'proposed_not_accepted');
  ss[2].text='We are not approving that deadline today.';s.items[0].evidence[1].quote=ss[2].text;
  assert.equal(validateExtraction(s,ss).items[0].status,'unresolved');
});
test('speaker names must be supported by self-introduction on the same speaker',()=>{const s=sample();s.speakers[0].name='Sam';s.items[0].owner='Sam';const r=validateExtraction(s,segments);assert.equal(r.speakers[0].name,null);assert.equal(r.items[0].owner,null);assert.ok(r.clarifications.some(c=>c.text.startsWith('Who')));});
test('next Friday never receives a date from upload or system time',()=>{const s=sample();s.items[0].deadlineNormalized='2026-10-09';s.items[0].dateContextQuote='next Friday';const r=validateExtraction(s,segments);assert.equal(r.items[0].deadlineOriginal,'next Friday');assert.equal(r.items[0].deadlineNormalized,null);assert.ok(r.items[0].uncertainties.includes('missing_date_context'));});
test('impossible dates are rejected even if a quoted year exists',()=>{const s=sample(),ss=structuredClone(segments);ss[1].text='I will send the report by February 30, 2026.';s.items[0].evidence[0].quote=ss[1].text;s.items[0].deadlineOriginal='February 30, 2026';s.items[0].deadlineNormalized='2026-02-30';s.items[0].dateContextQuote='February 30, 2026';assert.equal(validateExtraction(s,ss).items[0].deadlineNormalized,null);});
test('a final deadline inconsistent with verified change history is withheld',()=>{
  const s=sample(),ss=structuredClone(segments);
  ss.push({id:'change',speakerId:'B',start:7,end:10,text:'Agreed, use next Monday instead.'});
  s.items[0].history=[{field:'deadline',previousValue:'next Friday',replacementValue:'next Monday',evidence:[ref('change',ss[3].text,'change')]}];
  const result=validateExtraction(s,ss);
  assert.equal(result.items[0].deadlineOriginal,null);assert.equal(result.outcome,'partial');
  assert.ok(result.items[0].uncertainties.includes('deadline_history_conflict'));
});
test('unassigned owner and deadline create system clarifications, not invented participant quotes',()=>{const s=sample();s.items[0].owner=null;s.items[0].ownerSpeakerId=null;s.items[0].deadlineOriginal=null;const r=validateExtraction(s,segments);assert.equal(r.items[0].status,'confirmed');assert.equal(r.clarifications.length,2);assert.ok(r.clarifications.every(c=>c.source==='system_clarification'&&!('quote'in c)));});
test('strict schema rejects extra properties, missing fields and wrong types',()=>{const extra=sample();extra.apiKey='not-a-secret';assert.throws(()=>validateSchema(extra));const missing=sample();delete missing.items[0].status;assert.throws(()=>validateSchema(missing));const wrong=sample();wrong.items[0].owner=42;assert.throws(()=>validateSchema(wrong));});
test('invalid, duplicate and out-of-bounds ASR segments are rejected',()=>{assert.throws(()=>normalizeSegments([{id:'1',text:'Hi',speaker:'A',start:2,end:99}],5));assert.throws(()=>normalizeSegments([{id:'1',text:'Hi',speaker:'A',start:0,end:1},{id:'1',text:'Hello',speaker:'B',start:1,end:2}],5));assert.throws(()=>normalizeSegments([{text:'',speaker:'A',start:0,end:1}],5));});
test('WAV validator checks actual bytes, format and duration',()=>{const w=makeWav(Buffer.alloc(32000));assert.equal(readWav(w).duration,1);assert.throws(()=>readWav(w.subarray(0,40)));assert.throws(()=>readWav(makeWav(Buffer.alloc(32000*181))));const bad=Buffer.from(w);bad.writeUInt16LE(2,22);assert.throws(()=>readWav(bad));});
test('silence returns unusable without making a provider request',async()=>{let metrics;const r=await analyze(await readFile('fixtures/audio/D.wav'),{onMetrics:m=>metrics=m});assert.equal(r.outcome,'unusable');assert.deepEqual(r.items,[]);assert.equal(metrics.calls.length,0);assert.equal(metrics.cost.totalVariableOperationUsd,0);});
test('cost includes measured token usage and labels unknown failed request charges',()=>{const cost=calculateCost({audioSeconds:60,calls:[{stage:'asr',status:200},{stage:'extraction',status:200,usage:{input_tokens:1000,input_tokens_details:{cached_tokens:100},output_tokens:500}}]});assert.ok(Math.abs(cost.estimatedKnownUsd-0.00717)<1e-10);assert.equal(cost.costPerAudioMinute,cost.estimatedKnownUsd);assert.equal(calculateCost({audioSeconds:60,calls:[{stage:'asr',status:429}]}).totalVariableOperationUsd,null);});
