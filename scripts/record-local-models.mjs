// Run only after successful speech initialization. Record identifiers, never credentials.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import config from '../local/models.json' with {type:'json'};
const speech=JSON.parse(await readFile(process.argv[2]??'reports/local-setup/A.asr.json','utf8'));
if(!speech.result?.segments?.length)throw Error('Complete local-asr-check.mjs A first.');
if(speech.result.localMetadata.models[0]!==config.asr.id||speech.result.localMetadata.revisions[0]!==config.asr.revision)throw Error('Speech initialization does not match the pinned model.');
const tags=await(await fetch('http://127.0.0.1:11435/api/tags')).json();
const model=tags.models.find(m=>m.name===config.extraction.id);
if(!model)throw Error('Download qwen2.5:7b first.');
if(model.digest!==config.extraction.digest)throw Error('The downloaded extraction model differs from the evaluated digest. Re-evaluate before marking setup ready.');
const manifest={createdAt:new Date().toISOString(),asr:{model:config.asr.id,revision:config.asr.revision},diarization:{model:config.diarization.id,revision:config.diarization.revision},extraction:{model:model.name,digest:model.digest,sizeBytes:model.size,details:model.details},speechDevice:'cpu',asrComputeType:'int8',apiChargesUsd:0,localComputeCostUsd:null};
await mkdir('reports',{recursive:true});
await writeFile('reports/local-models.json',JSON.stringify(manifest,null,2)+'\n');
await writeFile('.runtime/local-ready.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Local model identifiers recorded. Subsequent speech loads use the offline cache.');
