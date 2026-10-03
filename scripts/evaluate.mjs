// Offline scoring of saved REAL results. Never calls a model or infers gold labels from it.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const directory=process.argv[2]||'reports/live';
const nameKey=value=>typeof value==='string'?value.normalize('NFC').trim().toLowerCase():value;
async function json(path){try{return JSON.parse((await readFile(path,'utf8')).replace(/^\uFEFF/,''));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
const mappings=await json(`${directory}/review-mapping.json`)||{};
const rows=[],cases=[];
for(const id of ['A','B','C','D','E','F','G']){
  const expected=await json(`fixtures/${id}/expected.json`);
  const record=await json(`${directory}/${id}.actual.json`)||(id==='D'?await json('reports/offline-browser/D.actual.json'):null);
  const actual=record?.job?.result??record?.result;
  const map=mappings[id]?.matches;
  const available=!!actual&&!record?.error;
  if(!expected)continue;
  if(id==='D'&&available){cases.push({id,status:actual.outcome==='unusable'&&!actual.items.length?'passed':'failed',TP:0,FP:actual.items.filter(i=>i.status==='confirmed').length,FN:0,note:'Negative case only; no positive-task accuracy evidence.'});rows.push([id,'No tasks; request new recording',actual.outcome,'n/a','n/a','n/a','Local silence detection; no speech to listen to']);continue;}
  if(!available||!map){
    cases.push({id,status:available?'awaiting_human_matching':'not_evaluated',TP:null,FP:null,FN:null});
    for(const e of expected.items)rows.push([id,`${e.task}: ${e.status}`,available?'Awaiting review':'Unavailable',e.owner??'null',e.deadlineNormalized??e.deadlineOriginal??'null','Not evaluated','Not evaluated']);
    continue;
  }
  const used=new Set(),details=[];let TP=0,FN=0;
  for(const e of expected.items){
    const review=map[e.key],a=review?.actualId?actual.items.find(i=>i.id===review.actualId):null;
    if(a){if(used.has(a.id))throw Error(`Duplicate actual match in ${id}: ${a.id}`);used.add(a.id);}
    if(e.status==='confirmed'){if(a?.status==='confirmed')TP++;else FN++;}
    const statusCorrect=a?e.status===a.status:false,ownerCorrect=a?nameKey(e.owner)===nameKey(a.owner):false;
    const deadlineCorrect=a?(e.deadlineNormalized?e.deadlineNormalized===a.deadlineNormalized:e.deadlineOriginal===null?a.deadlineOriginal===null:review?.deadlineMeaningCorrect===true&&a.deadlineNormalized===null):false;
    const evidenceStructural=a?!!a.evidence.length&&a.evidence.every(v=>v.validation==='transcript_match'):false;
    const evidenceSemantic=review?.evidenceSupportsFinalState??null,listened=review?.listened??false;
    details.push({key:e.key,actualId:a?.id??null,statusCorrect,ownerCorrect,deadlineCorrect,evidenceStructural,evidenceSemantic,listened});
    rows.push([id,`${e.task}: ${e.status}`,a?.status??'Missing',`${ownerCorrect?'PASS':'FAIL'} (${a?.owner??'null'})`,`${deadlineCorrect?'PASS':'FAIL'} (${a?.deadlineNormalized??a?.deadlineOriginal??'null'})`,evidenceStructural?'Structural match':'FAIL',evidenceSemantic===null?'Pending':`${evidenceSemantic?'Supports':'Does not support'}; listened=${listened}`]);
  }
  const expectedByActual=new Map(Object.entries(map).filter(([,v])=>v.actualId).map(([key,v])=>[v.actualId,expected.items.find(e=>e.key===key)]));
  const FP=actual.items.filter(a=>a.status==='confirmed'&&expectedByActual.get(a.id)?.status!=='confirmed').length;
  cases.push({id,status:'reviewed',TP,FP,FN,details,unmatchedActual:actual.items.filter(a=>!used.has(a.id)).map(a=>({id:a.id,task:a.task,status:a.status})),reviewNotes:mappings[id]?.notes??[]});
}
await mkdir('reports',{recursive:true});
const reviewed=cases.filter(c=>c.status==='reviewed'),details=reviewed.flatMap(c=>c.details);
const summary={TP:reviewed.reduce((n,c)=>n+c.TP,0),FP:reviewed.reduce((n,c)=>n+c.FP,0),FN:reviewed.reduce((n,c)=>n+c.FN,0),expectedItems:details.length};
for(const field of ['statusCorrect','ownerCorrect','deadlineCorrect','evidenceStructural','evidenceSemantic','listened'])summary[field]=details.filter(d=>d[field]===true).length;
await writeFile('reports/evaluation.json',JSON.stringify({sourceDirectory:directory,reviewBasis:'Assistant review of actual transcript and frozen expected labels. Listening flags reflect the separately recorded human reviewer confirmation when present; see review-mapping.json. Owner names compare case-insensitively after NFC/trim; spelling differences are not normalized.',warning:'Task detection TP/FP/FN are separate from field accuracy. These synthetic examples do not establish general accuracy. See review notes for history and evidence limitations.',summary,cases},null,2)+'\n');
const table=['# Expected versus actual','','Expected labels were frozen before analysis. Unavailable is not a passing result. Owner/deadline shown on unavailable rows are EXPECTED values, not analyzer outputs.','','| Case | Expected task / status | Actual status | Owner | Deadline | Evidence structure | Evidence meaning / listening |','| --- | --- | --- | --- | --- | --- | --- |',...rows.map(r=>'| '+r.map(c=>String(c).replaceAll('|','/')).join(' | ')+' |')];
await writeFile('reports/expected-vs-actual.md',table.join('\n')+'\n');
console.log(JSON.stringify(cases.map(({id,status,TP,FP,FN})=>({id,status,TP,FP,FN})),null,2));

