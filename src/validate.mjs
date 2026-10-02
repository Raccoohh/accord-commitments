import {validateSchema} from './schema.mjs';

export function normalizeSegments(raw,duration){
  if(!Array.isArray(raw))throw new Error('The transcription service returned no timestamped speaker segments.');
  const segments=raw.map((s,i)=>({id:String(s.id??`s${i}`),speakerId:String(s.speaker??'unknown'),text:s.text,start:s.start,end:s.end}));
  const ids=new Set();let lastStart=-1;
  for(const s of segments){
    if(ids.has(s.id)||typeof s.text!=='string'||!s.text.trim()||!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end<=s.start||s.end>duration+0.05||s.start<lastStart)throw new Error('The transcription service returned invalid segments or timestamps. Please try another recording.');
    ids.add(s.id);lastStart=s.start;s.end=Math.min(duration,s.end);
  }
  return segments;
}

export function validateEvidence(ref,segments){
  const s=segments.find(s=>s.id===ref.segmentId);
  if(!s||!ref.quote.trim()||!s.text.includes(ref.quote))throw new Error('Evidence quote does not match its transcript segment.');
  return {...ref,speakerId:s.speakerId,start:s.start,end:s.end,validation:'transcript_match'};
}

export function validateExtraction(raw,segments){
  validateSchema(raw);
  const result=structuredClone(raw),issues=[];
  const validateRefs=refs=>refs.map(ref=>validateEvidence(ref,segments));
  const uniqueIds=new Set();
  for(const s of result.speakers){
    try{
      if(uniqueIds.has(s.speakerId))throw Error('Duplicate speaker mapping.');
      uniqueIds.add(s.speakerId);
      s.evidence=validateRefs(s.evidence);
      if(s.confidence==='supported'&&(!s.name||!s.evidence.some(e=>e.speakerId===s.speakerId&&new RegExp("\\b(?:I(?:'m| am)|my name is)\\s+"+s.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i').test(e.quote))))throw Error('Speaker name is not grounded in a self-introduction.');
    }catch{ s.name=null;s.confidence='uncertain';s.evidence=[];issues.push('A speaker name could not be verified from a self-introduction.'); }
  }
  const ids=new Set();
  for(const item of result.items){
    if(ids.has(item.id))throw Error('Duplicate item ID in structured result.');ids.add(item.id);
    let invalid=false;
    try{
      item.evidence=validateRefs(item.evidence);
      item.history=item.history.map(h=>({...h,evidence:validateRefs(h.evidence)}));
      if(item.source!=='clarification'&&!item.evidence.length)throw Error('Missing evidence.');
      if(item.status==='confirmed'&&!item.evidence.some(e=>e.role==='acceptance'))throw Error('Missing acceptance evidence.');
      if(item.status==='cancelled'&&!item.evidence.some(e=>e.role==='cancellation'))throw Error('Missing cancellation evidence.');
    }catch{invalid=true;item.evidence=[];item.history=[];}
    if(invalid){item.status='unresolved';item.source='clarification';item.uncertainties.push('evidence_validation_failed');item.reason='Evidence could not be validated. Review the transcript or record a clarification.';issues.push(`Evidence withheld for: ${item.task}`);}
    if(item.ownerSpeakerId){
      const speaker=result.speakers.find(s=>s.speakerId===item.ownerSpeakerId&&s.confidence==='supported'&&s.name===item.owner);
      if(!speaker){item.owner=null;item.ownerSpeakerId=null;item.uncertainties.push('speaker_identity_uncertain');}
    }
    if(item.owner&&!item.ownerSpeakerId&&!item.evidence.some(e=>e.quote.toLowerCase().includes(item.owner.toLowerCase()))){item.owner=null;item.uncertainties.push('owner_not_supported');}
    if(item.deadlineOriginal&&!item.evidence.some(e=>e.quote.includes(item.deadlineOriginal))){item.deadlineOriginal=null;item.deadlineNormalized=null;item.uncertainties.push('deadline_not_supported');}
    if(item.deadlineNormalized){
      const d=item.deadlineNormalized,q=item.dateContextQuote;
      const valid=/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
      const context=typeof q==='string'&&/\b(?:19|20|21)\d{2}\b/.test(q)&&segments.some(s=>s.text.includes(q));
      if(!valid||!context||!item.deadlineOriginal){item.deadlineNormalized=null;item.uncertainties.push('missing_date_context');}
    }
    if(item.deadlineOriginal&&!item.deadlineNormalized&&/\b(next|tomorrow|today|this|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i.test(item.deadlineOriginal))item.uncertainties.push('missing_date_context');
    if(item.status==='confirmed'){
      if(!item.owner)item.uncertainties.push('owner_unassigned');
      if(!item.deadlineOriginal)item.uncertainties.push('deadline_not_agreed');
    }
    item.uncertainties=[...new Set(item.uncertainties)];
  }
  result.clarifications=result.items.filter(i=>i.status==='confirmed').flatMap(i=>[
    ...(!i.owner?[{itemId:i.id,text:`Who will own: ${i.task}?`,source:'system_clarification'}]:[]),
    ...(!i.deadlineOriginal?[{itemId:i.id,text:`What is the agreed deadline for: ${i.task}?`,source:'system_clarification'}]:[]),
    ...(i.uncertainties.includes('missing_date_context')?[{itemId:i.id,text:`Which calendar date does “${i.deadlineOriginal}” refer to for: ${i.task}?`,source:'system_clarification'}]:[])
  ]);
  if(new Set(segments.map(s=>s.speakerId)).size!==2)issues.push('Expected two distinct speakers. Speaker attribution needs review.');
  if(result.outcome==='unusable')result.items=[];
  if(issues.length&&result.outcome!=='unusable')result.outcome='partial';
  result.warnings=[...new Set([...result.warnings,...issues])];
  return result;
}
