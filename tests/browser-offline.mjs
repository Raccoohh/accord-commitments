// UI contract test ONLY. Clearly fabricated responses are intercepted in Playwright.
// They never reach production code or represent a real ASR/extraction evaluation.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {makeWav} from '../src/audio.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
await mkdir('reports/offline-browser',{recursive:true});
const page=await browser.newPage({baseURL:'http://127.0.0.1:3000',viewport:{width:1360,height:1000}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
function passed(name){checks.push({name,passed:true});console.log(name);}
try{
  await page.goto('http://127.0.0.1:3000');
  await page.locator('#file').setInputFiles({name:'wrong.txt',mimeType:'text/plain',buffer:Buffer.from('not audio')});
  assert.match(await page.locator('#error').innerText(),/Choose a WAV/);passed('Unsupported extension rejected in browser');
  await page.locator('#file').setInputFiles({name:'long.wav',mimeType:'audio/wav',buffer:makeWav(Buffer.alloc(32000*181))});
  await page.locator('#analyze').click();await page.locator('#error').waitFor();
  assert.match(await page.locator('#error').innerText(),/3 minutes/);passed('Over-three-minute audio rejected before upload');
  await page.locator('#reset').click();
  await page.locator('#file').setInputFiles({name:'broken.wav',mimeType:'audio/wav',buffer:Buffer.from('broken wav')});
  await page.locator('#analyze').click();await page.locator('#error').waitFor();
  assert.match(await page.locator('#error').innerText(),/could not be decoded/);passed('Corrupt audio rejected before upload');
  await page.locator('#reset').click();
  const silence=await readFile('fixtures/audio/D.wav');
  await page.locator('#dropzone').evaluate((element,bytes)=>{
    const dt=new DataTransfer();dt.items.add(new File([new Uint8Array(bytes)],'silence.wav',{type:'audio/wav'}));
    element.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:dt}));
  },Array.from(silence));
  await page.locator('#analyze').click();await page.locator('#results').waitFor();
  assert.match(await page.locator('#result-heading').innerText(),/No audible speech/);
  const silenceMetrics=JSON.parse(await page.locator('#metrics').textContent());assert.equal(silenceMetrics.calls.length,0);
  const silenceJob=await(await page.request.get(`/api/jobs/${silenceMetrics.id}`)).json();
  await writeFile('reports/offline-browser/D.actual.json',JSON.stringify({caseId:'D',job:silenceJob,clientMetrics:silenceMetrics.client},null,2)+'\n');
  passed('Real drag-and-drop silence upload returns unusable, no tasks and zero API calls');
  await page.screenshot({path:'reports/offline-browser/silence.png',fullPage:true});
  await page.locator('#reset').click();
  const absent=await page.request.get(`/api/jobs/${silenceMetrics.id}`);assert.equal(absent.status(),404);passed('Clear removes completed result from server');

  // Test-only response with conspicuous sentinel names, not expected A/B outputs.
  const ev={segmentId:'ui1',speakerId:'A',quote:'UI TEST: quoted text <script>window.bad=true</script>',role:'acceptance',start:0.3,end:0.9,validation:'transcript_match'};
  const item={id:'ui-only',task:'UI TEST ONLY — render a task',status:'confirmed',source:'commitment',reason:'Injected UI contract test, not AI output.',owner:null,ownerSpeakerId:null,deadlineOriginal:null,deadlineNormalized:null,dateContextQuote:null,uncertainties:['owner_unassigned','deadline_not_agreed'],evidence:[ev],history:[]};
  const fake={id:'offline-ui',status:'done',result:{outcome:'partial',message:'UI TEST ONLY — no AI inference performed.',items:[item,{...item,id:'cancelled',task:'UI TEST ONLY — cancelled',status:'cancelled'},{...item,id:'idea',task:'UI TEST ONLY — proposal',status:'proposed_not_accepted'},{...item,id:'question',task:'UI TEST ONLY — open question',status:'unresolved',source:'participant_question'}],speakers:[{speakerId:'A',name:'UI speaker',confidence:'supported',evidence:[]}],segments:[{id:'ui1',speakerId:'A',text:ev.quote,start:0.3,end:0.9}],warnings:['UI test warning'],clarifications:[{itemId:item.id,text:'UI TEST: Who owns this?',source:'system_clarification'}],timingPrecision:'segment'},metrics:{testOnly:true,calls:[]}};
  await page.route('**/api/jobs',r=>r.fulfill({status:202,json:{id:'offline-ui'}}));
  await page.route('**/api/jobs/offline-ui',r=>r.fulfill({status:200,json:fake}));
  await page.locator('#file').setInputFiles(resolve('fixtures/audio/A.wav'));await page.locator('#analyze').click();await page.locator('#results').waitFor();
  assert.equal(await page.locator('#confirmed article').count(),1);assert.equal(await page.locator('#inactive article').count(),2);assert.equal(await page.locator('#unresolved article').count(),1);
  assert.match(await page.locator('#confirmed').innerText(),/Owner not assigned/);assert.match(await page.locator('#confirmed').innerText(),/Deadline not agreed/);
  passed('UI contract: only confirmed in active list; unknown fields, open questions and inactive states separated');
  assert.equal(await page.evaluate(()=>window.bad),undefined);assert.match(await page.locator('blockquote').first().innerText(),/<script>/);passed('Transcript and task text render as escaped text');
  await page.locator('#confirmed .play').click();await page.waitForTimeout(200);
  const playing=await page.locator('#audio').evaluate(a=>({paused:a.paused,time:a.currentTime}));assert.equal(playing.paused,false);assert.ok(playing.time>=0.1&&playing.time<1.1);
  await page.waitForFunction(()=>document.querySelector('#audio').paused&&document.querySelector('#audio').currentTime>=0.9,{},{timeout:4000});
  const stopped=await page.locator('#audio').evaluate(a=>({paused:a.paused,time:a.currentTime}));assert.ok(stopped.time<=1.4);passed('UI contract: evidence seeks original audio and automatically stops at excerpt end');
  await page.screenshot({path:'reports/offline-browser/TEST-ONLY-result.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);passed('390px mobile layout has no horizontal overflow');
  await page.screenshot({path:'reports/offline-browser/TEST-ONLY-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);passed('No uncaught browser JavaScript errors');
  await writeFile('reports/offline-browser/playback.json',JSON.stringify({testOnly:true,playing,stopped,expectedEnd:1.1,acousticListening:'not performed'},null,2));
}finally{
  await page.screenshot({path:'reports/offline-browser/last-state.png',fullPage:true});
  console.log('Visible error:',await page.locator('#error').isVisible()?await page.locator('#error').innerText():'none');
  await writeFile('reports/offline-browser/checks.json',JSON.stringify({kind:'Offline browser contract tests; mocked result is not ASR evaluation',checks,errors},null,2)+'\n');
  await browser.close();
}
