// Run only after successful speech initialization. Record identifiers, never credentials.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const speech=JSON.parse(await readFile('reports/local-initial/A.asr.json','utf8'));
if(!speech.result?.segments?.length)throw Error('Complete local-asr-check.mjs A first.');
const revision=async path=>(await readFile(path,'utf8')).trim();
const tags=await(await fetch('http://127.0.0.1:11435/api/tags')).json();
const model=tags.models.find(m=>m.name==='qwen2.5:7b');
if(!model)throw Error('Download qwen2.5:7b first.');
if(model.digest!=='845dbda0ea48ed749caafd9e6037047aa19acfcfd82e704d7ca97d631a0b697e')throw Error('The downloaded extraction model differs from the evaluated digest. Re-evaluate before marking setup ready.');
const manifest={createdAt:new Date().toISOString(),asr:{model:'Systran/faster-whisper-small.en',revision:await revision('.runtime/whisper/models--Systran--faster-whisper-small.en/refs/main')},diarization:{model:'pyannote/speaker-diarization-community-1',revision:await revision('.runtime/huggingface/hub/models--pyannote--speaker-diarization-community-1/refs/main')},extraction:{model:model.name,digest:model.digest,sizeBytes:model.size,details:model.details},speechDevice:'cpu',asrComputeType:'int8',apiChargesUsd:0,localComputeCostUsd:null};
await mkdir('reports',{recursive:true});
await writeFile('reports/local-models.json',JSON.stringify(manifest,null,2)+'\n');
await writeFile('.runtime/local-ready.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Local model identifiers recorded. Subsequent speech loads use the offline cache.');
