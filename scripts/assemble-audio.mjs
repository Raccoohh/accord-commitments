import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { makeWav,readWav } from '../src/audio.mjs';
import { createHash } from 'node:crypto';
const cases=JSON.parse(await readFile(process.argv[2]||'fixtures/cases.json','utf8')).cases;
await mkdir('fixtures/audio',{recursive:true});
for(const c of cases){
  const parts=[],timing=[];let cursor=0;
  if(c.silenceSeconds)parts.push(Buffer.alloc(c.silenceSeconds*32000));
  else {
    const manifest=JSON.parse((await readFile(`fixtures/.parts/${c.id}.json`,'utf8')).replace(/^\uFEFF/,''));
    for(const [index,entry]of manifest.entries()){
      const {data,duration}=readWav(await readFile(entry.path));
      timing.push({turn:index,speaker:entry.speaker,text:entry.text,voice:entry.voice,start:cursor,end:cursor+duration});
      parts.push(data,Buffer.alloc(11200));cursor+=duration+0.35;
    }
  }
  const audio=makeWav(Buffer.concat(parts));
  const {duration}=readWav(audio);
  await writeFile(`fixtures/audio/${c.id}.wav`,audio);
  await writeFile(`fixtures/audio/${c.id}.provenance.json`,JSON.stringify({synthetic:true,engine:'Windows System.Speech',duration,sha256:createHash('sha256').update(audio).digest('hex'),timing,scriptFidelityListening:'pending',evidenceListening:'pending'},null,2)+'\n');
  console.log(`${c.id}: ${duration.toFixed(2)} seconds`);
}
