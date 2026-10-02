import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
const output=process.env.EVAL_OUTPUT||'reports/initial';await mkdir(output,{recursive:true});
const page=await browser.newPage({viewport:{width:1360,height:1080}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:3000');
await page.screenshot({path:`${output}/upload.png`,fullPage:true});
const ids=process.argv.slice(2);if(!ids.length)ids.push('A','B','C','D');
for(const id of ids){
  console.log(`Browser upload: ${id}`);
  await page.locator('#file').setInputFiles(resolve(`fixtures/audio/${id}.wav`));
  await page.locator('#analyze').click();
  await page.waitForFunction(()=>!document.querySelector('#results').hidden||!document.querySelector('#error').hidden,{},{timeout:260000});
  const error=await page.locator('#error').isVisible()?await page.locator('#error').innerText():null;
  const metrics=error?null:JSON.parse(await page.locator('#metrics').innerText());
  let job=null;if(metrics?.id)job=await(await page.request.get(`/api/jobs/${metrics.id}`)).json();
  await writeFile(`${output}/${id}.actual.json`,JSON.stringify({caseId:id,error,job,clientMetrics:metrics?.client},null,2)+'\n');
  await page.screenshot({path:`${output}/${id}.png`,fullPage:true});
  console.log(JSON.stringify({caseId:id,error,status:job?.result?.outcome,items:job?.result?.items.map(i=>({task:i.task,status:i.status,owner:i.owner,deadline:i.deadlineOriginal,date:i.deadlineNormalized})),metrics:metrics?{seconds:metrics.audioSeconds,processingMs:metrics.processingMs,cost:metrics.cost}:null}));
  if(error)break;
  const play=page.locator('#confirmed .play').first();
  if(await play.count()){
    await play.click();await page.waitForTimeout(700);
    const playing=await page.locator('#audio').evaluate(a=>({paused:a.paused,time:a.currentTime,duration:a.duration}));
    const end=Number(await play.getAttribute('data-end'))+0.2;
    await page.waitForFunction(end=>document.querySelector('#audio').paused&&document.querySelector('#audio').currentTime>=end-0.35,end,{timeout:35000});
    const stopped=await page.locator('#audio').evaluate(a=>({paused:a.paused,time:a.currentTime}));
    await writeFile(`${output}/${id}.playback.json`,JSON.stringify({playing,stopped,expectedEnd:end,acousticListening:'not performed; playback state/timing verified'},null,2)+'\n');
    console.log(`Playback ${id}: ${!playing.paused&&stopped.paused?'passed':'FAILED'}`);
  }
  await page.locator('#reset').click();
}
await page.setViewportSize({width:390,height:844});await page.screenshot({path:`${output}/mobile.png`,fullPage:true});
await writeFile(`${output}/browser-errors.json`,JSON.stringify(errors,null,2));
await browser.close();
if(errors.length)process.exitCode=1;
