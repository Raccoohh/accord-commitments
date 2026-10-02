import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const base='http://127.0.0.1:3000',checks=[];
let response=await fetch(base+'/api/jobs',{method:'POST',headers:{'Content-Type':'text/plain'},body:'test'});assert.equal(response.status,415);checks.push('Unsupported content type rejected');
response=await fetch(base+'/api/jobs',{method:'POST',headers:{'Content-Type':'audio/wav',Origin:'https://unrelated.example'},body:'test'});assert.equal(response.status,403);checks.push('Cross-origin upload rejected');
response=await fetch(base+'/.env.local');assert.equal(response.status,404);checks.push('Secret env file is not served');
response=await fetch(base+'/fixtures/cases.json');assert.equal(response.status,404);checks.push('Expected evaluation data is not served');
response=await fetch(base+'/api/jobs',{method:'POST',headers:{'Content-Type':'audio/wav'},body:'not a wav'});assert.equal(response.status,202);
const {id}=await response.json();let job;
for(let i=0;i<30;i++){job=await(await fetch(base+'/api/jobs/'+id)).json();if(job.status==='error')break;await new Promise(r=>setTimeout(r,20));}
assert.equal(job.status,'error');assert.equal(job.metrics.calls.length,0);checks.push('Malformed audio fails before any provider call');
await writeFile('reports/server-checks.json',JSON.stringify({checks,malformedAudioJob:job},null,2)+'\n');console.log(checks.join('\n'));
