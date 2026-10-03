import test from 'node:test';
import assert from 'node:assert/strict';
import {expandLocalExtraction} from '../src/local-extraction.mjs';
import {validateExtraction} from '../src/validate.mjs';
const segments=[{id:'intro',speakerId:'P',start:0,end:1,text:"I'm Sam."},{id:'work',speakerId:'P',start:1,end:4,text:"I'll send the draft by March 12th, 2027."}];
const record=()=>({speakers:[{speakerId:'P',name:'Sam',introductionSegmentId:'intro'}],tasks:[{task:'Send draft',evidence:[{segmentId:'work',role:'acceptance'}],changes:[],reason:'Explicit self-commitment.',status:'confirmed',owner:'P',deadline:'March 12th, 2027'}],openQuestions:[],warnings:[],recordingStatus:'readable'});
test('compact model references expand only to authoritative transcript text and speaker identity',()=>{
  const raw=expandLocalExtraction(record(),segments),r=validateExtraction(raw,segments);
  assert.equal(r.items[0].owner,'Sam');assert.equal(r.items[0].deadlineNormalized,'2027-03-12');
  assert.equal(r.items[0].evidence[0].quote,segments[1].text);assert.equal(r.items[0].evidence[0].start,1);
});
test('nonexistent segment references fail closed instead of fabricating evidence',()=>{
  const r=record();r.tasks[0].evidence[0].segmentId='invented';assert.throws(()=>expandLocalExtraction(r,segments),/nonexistent/);
});
test('relative dates stay relative and unassigned owners stay null',()=>{
  const r=record();r.tasks[0].deadline='next Tuesday';r.tasks[0].owner=null;
  const s=structuredClone(segments);s[1].text='We agreed to send the draft by next Tuesday, with no owner yet.';
  const actual=validateExtraction(expandLocalExtraction(r,s),s);
  assert.equal(actual.items[0].owner,null);assert.equal(actual.items[0].deadlineNormalized,null);
  assert.ok(actual.clarifications.some(c=>c.text.startsWith('Which calendar')));
});
test('short agreement receives real neighboring context, without generated quotes',()=>{
  const r=record(),s=[...segments,{id:'yes',speakerId:'Q',start:5,end:6,text:'Agreed.'},{id:'detail',speakerId:'Q',start:6,end:8,text:'Keep that final date.'}];
  r.tasks[0].evidence=[{segmentId:'yes',role:'acceptance'}];
  const result=expandLocalExtraction(r,s);
  assert.deepEqual(result.items[0].evidence.map(e=>e.segmentId),['work','yes','detail']);
  assert.equal(result.items[0].evidence[0].quote,segments[1].text);
});
test('one unanswered question is not duplicated as an unresolved task',()=>{
  const s=structuredClone(segments);s[1].text='Which draft should we use?';
  const r=record();r.tasks[0].status='unresolved';r.openQuestions=[{question:s[1].text,segmentIds:['work']}];
  const result=expandLocalExtraction(r,s);assert.equal(result.items.length,1);assert.equal(result.items[0].source,'participant_question');
  r.tasks[0].status='confirmed';assert.equal(expandLocalExtraction(r,s).items.length,2);
  r.tasks[0].status='proposed_not_accepted';assert.equal(expandLocalExtraction(r,s).items.length,1);
});

test('date capitalization and commas are grounded back to the literal transcript span',()=>{
  const s=structuredClone(segments);s[1].text="i'll send the draft by march 12th 2027";
  const actual=validateExtraction(expandLocalExtraction(record(),s),s);
  assert.equal(actual.items[0].deadlineOriginal,'march 12th 2027');assert.equal(actual.items[0].deadlineNormalized,'2027-03-12');
  const r=record();r.tasks[0].deadline='March 13th, 2027';
  assert.equal(validateExtraction(expandLocalExtraction(r,s),s).items[0].deadlineOriginal,null);
});

test('missing introduction reference is recovered only from that speaker stating the selected name',()=>{
  const r=record();r.speakers[0].introductionSegmentId=null;
  assert.equal(validateExtraction(expandLocalExtraction(r,segments),segments).items[0].owner,'Sam');
  const s=structuredClone(segments);s[0].speakerId='SomeoneElse';
  assert.equal(validateExtraction(expandLocalExtraction(r,s),s).items[0].owner,null);
});

test('verbatim requests are not unanswered participant questions and unchanged values are not changes',()=>{
  const r=record(),s=[...segments,{id:'request',speakerId:'Q',start:5,end:7,text:'Please send the draft.'}];
  r.openQuestions=[{question:'Please send the draft.',segmentIds:['request']}];
  r.tasks[0].changes=[{field:'owner',previousValue:'Sam',replacementValue:'Sam',evidence:[]}];
  const actual=expandLocalExtraction(r,s);assert.equal(actual.items.length,1);assert.deepEqual(actual.items[0].history,[]);
});
test('inferred questions cannot be presented as participant quotes',()=>{
  const r=record();r.openQuestions=[{question:'Who will do this?',segmentIds:['work']}];
  assert.equal(expandLocalExtraction(r,segments).items.filter(i=>i.source==='participant_question').length,0);
});
test('superseded or unagreed timing is removed from action titles',()=>{
  const r=record();r.tasks[0].task='Send draft by March 1st, 2027';
  assert.equal(expandLocalExtraction(r,segments).items[0].task,'Send draft');
  r.tasks[0].task='Review before release checklist';
  assert.equal(expandLocalExtraction(r,segments).items[0].task,'Review before release checklist');
});
test('cancelled tasks retain one quoted prior self-assignment, never invent an active owner',()=>{
  const r=record();r.tasks[0].status='cancelled';r.tasks[0].owner=null;
  assert.equal(expandLocalExtraction(r,segments).items[0].owner,'Sam');
  r.tasks[0].status='confirmed';assert.equal(expandLocalExtraction(r,segments).items[0].owner,null);
  r.tasks[0].status='cancelled';r.tasks[0].changes=[{field:'owner',previousValue:'Sam',replacementValue:'Another person',evidence:[]}];
  assert.equal(expandLocalExtraction(r,segments).items[0].owner,null);
});
