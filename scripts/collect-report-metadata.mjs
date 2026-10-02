import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readWav} from '../src/audio.mjs';
const require=createRequire(import.meta.url),pwPath=process.env.PLAYWRIGHT_MODULE||'playwright';
const {chromium}=require(pwPath),pkg=require(pwPath+'/package.json');
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
const versions={node:process.version,playwright:pkg.version,browser:await browser.version(),browserChannel:process.env.BROWSER_CHANNEL||'msedge',platform:process.platform};
await browser.close();
await writeFile('reports/tool-versions.json',JSON.stringify(versions,null,2)+'\n');
const fixtures=[];
for(const id of ['A','B','C','D','E']){
  const bytes=await readFile(`fixtures/audio/${id}.wav`),info=readWav(bytes);
  fixtures.push({id,durationSeconds:info.duration,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),peak:info.peak,synthetic:true,acousticReview:'pending'});
}
const gold=JSON.parse(await readFile('fixtures/cases.json','utf8')).cases;
const a=gold.find(x=>x.id==='A'),b=gold.find(x=>x.id==='B'),bTurns=structuredClone(a.turns);bTurns[b.replaceTurn.index].text=b.replaceTurn.text;
const changed=a.turns.flatMap((t,i)=>t.text!==bTurns[i].text?[i]:[]);
if(changed.length!==1)throw Error('Controlled A/B input changed more than one turn.');
await writeFile('reports/fixture-integrity.json',JSON.stringify({fixtures,controlledDifference:{changedTurnIndices:changed,expectedField:'wireframes.deadline',actualOutputInvariance:'not evaluated'},note:'Byte integrity, duration and controlled script difference only; not a listening audit.'},null,2)+'\n');
const logs=(await readFile('logs/runs.jsonl','utf8')).trim().split('\n').map(JSON.parse),diag=JSON.parse(await readFile('reports/access-diagnostic.json','utf8'));
logs.push(diag.metrics);logs.sort((a,b)=>a.startedAt.localeCompare(b.startedAt));
await writeFile('reports/run-metrics.jsonl',logs.map(x=>JSON.stringify(x)).join('\n')+'\n');
const failed=JSON.parse(await readFile('reports/initial/A.actual.json','utf8'));
failed.recoveredMetrics=logs.find(x=>x.calls.length&&x.id!==diag.metrics.id);
failed.recoveryNote='Metrics recovered from the original server log; no result or transcript was produced. Original UI wording was a generic rate-limit message, corrected after the separate diagnostic.';
await writeFile('reports/initial/A.actual.json',JSON.stringify(failed,null,2)+'\n');
console.log(JSON.stringify({versions,fixtureDurations:fixtures.map(f=>[f.id,f.durationSeconds]),loggedRuns:logs.length,realProviderCalls:logs.reduce((n,r)=>n+r.calls.length,0)},null,2));
