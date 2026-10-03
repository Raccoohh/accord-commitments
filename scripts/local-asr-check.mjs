import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {localTranscribe} from '../src/local-provider.mjs';
const id=process.argv[2]??'A';
await mkdir('reports/local-initial',{recursive:true});
const trace={calls:[]};
try{const result=await localTranscribe(await readFile(`fixtures/audio/${id}.wav`),trace);await writeFile(`reports/local-initial/${id}.asr.json`,JSON.stringify({result,trace},null,2));console.log(JSON.stringify({segments:result.segments.length,speakers:[...new Set(result.segments.map(s=>s.speaker))],metadata:result.localMetadata}));}
catch(e){console.error(e.message);process.exitCode=1;}
