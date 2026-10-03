// Debug only: replay a saved REAL ASR transcript, never fixture scripts/expected labels.
// This is not an end-to-end audio evaluation.
import {readFile,writeFile} from 'node:fs/promises';
import {localExtract} from '../src/local-provider.mjs';
import {validateExtraction} from '../src/validate.mjs';
const source=JSON.parse(await readFile(process.argv[2],'utf8'));
const segments=source.job?.result?.segments??source.result?.segments;
if(!segments?.length||!segments[0].speakerId)throw Error('Provide a completed app result with real normalized ASR segments.');
const trace={calls:[]};
let raw,result,error;
try{raw=await localExtract(segments,trace,{...(process.argv[4]?{model:process.argv[4]}:{}),...(process.argv[5]==='think'?{think:true}:{})});result=validateExtraction(raw,segments);}catch(e){error=e.message;}
await writeFile(process.argv[3],JSON.stringify({kind:'extraction-only replay',source:process.argv[2],raw,result,error,trace},null,2)+'\n');
console.log(JSON.stringify({outcome:result?.outcome,error,items:result?.items.map(i=>({id:i.id,task:i.task,status:i.status,owner:i.owner,date:i.deadlineNormalized,uncertainties:i.uncertainties})),ms:trace.calls.reduce((sum,c)=>sum+c.ms,0)}));
if(error)process.exitCode=1;
