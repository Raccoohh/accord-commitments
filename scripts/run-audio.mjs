import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {analyze} from '../src/pipeline.mjs';
const file=process.argv[2];if(!file)throw Error('Usage: node --env-file=.env.local scripts/run-audio.mjs recording.wav output.json');
const target=process.argv[3]||`reports/run-${Date.now()}.json`;await mkdir('reports',{recursive:true});
let metrics;const record={inputFile:file};
try{record.result=await analyze(await readFile(file),{id:randomUUID(),onStage:console.log,onMetrics:m=>metrics=m});}
catch(e){record.error=e.message;}
record.metrics=metrics;
await writeFile(target,JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify(record.error?{error:record.error,calls:metrics.calls}:{outcome:record.result.outcome,itemCount:record.result.items.length,processingMs:metrics.processingMs}));
if(record.error)process.exitCode=1;
