// Real browser check through the public tunnel. Credentials stay in memory.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const config=JSON.parse((await readFile('.runtime/demo/config.json','utf8')).replace(/^\uFEFF/,''));
const base=config.publicOrigin;
if(!base?.startsWith('https://'))throw Error('Start the reviewer demo first.');
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const directory=base.includes('.ngrok')?'reports/ngrok-demo':'reports/public-demo';await mkdir(directory,{recursive:true});
const checks=[],errors=[];
const context=await browser.newContext({httpCredentials:{username:config.username,password:config.password,origin:base,send:'always'},viewport:{width:1440,height:1000}});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
try{
  const anonymous=await browser.newContext({extraHTTPHeaders:{'ngrok-skip-browser-warning':'1'}});
  const denied=await anonymous.request.get(base+'/api/health',{maxRetries:2});assert.equal(denied.status(),401);checks.push('Anonymous API access rejected');await anonymous.close();
  await page.goto(base,{waitUntil:'networkidle',timeout:45000});
  const visit=page.getByRole('button',{name:/visit site/i});
  if(await visit.isVisible()){
    await page.screenshot({path:`${directory}/provider-notice.png`,fullPage:true});
    await visit.click();await page.waitForLoadState('networkidle');
    checks.push('Free-tier provider notice can be dismissed by the reviewer');
  }
  assert.match(await page.locator('body').innerText(),/Reviewer demo/);checks.push('Password-authenticated HTTPS page loads');
  const sample=await context.request.get(base+'/demo/C.wav',{maxRetries:2});assert.equal(sample.status(),200);assert.equal((await sample.body()).subarray(0,4).toString(),'RIFF');checks.push('Fictional sample downloads');
  for(const id of ['D','C']){
    await page.locator('#file').setInputFiles(resolve(`fixtures/audio/${id}.wav`));
    await page.locator('#analyze').click();
    await page.waitForFunction(()=>!document.querySelector('#results').hidden||!document.querySelector('#error').hidden,{},{timeout:1_300_000});
    if(await page.locator('#results').isHidden())throw Error('Public audio analysis failed: '+await page.locator('#error').innerText());
    const metrics=JSON.parse(await page.locator('#metrics').textContent());
    const resultResponse=await context.request.get(base+'/api/jobs/'+metrics.id,{maxRetries:2});assert.equal(resultResponse.status(),200);const job=await resultResponse.json();
    await writeFile(`${directory}/${id}.actual.json`,JSON.stringify({caseId:id,publicOrigin:base,job,clientMetrics:metrics.client},null,2)+'\n');
    if(id==='D'){assert.equal(job.result.outcome,'unusable');assert.equal(job.metrics.calls.length,0);}
    else {assert.ok(job.result.items.some(i=>i.status==='confirmed'));assert.ok(job.metrics.calls.length>0);}
    checks.push(`${id}: real browser upload and analysis completed through public HTTPS`);
    await page.screenshot({path:`${directory}/${id}.png`,fullPage:true});
    if(id==='C'){
      const button=page.locator('button').filter({hasText:'Play evidence'}).first();await button.click();await page.waitForTimeout(500);
      assert.equal(await page.locator('#audio').evaluate(a=>a.paused),false);checks.push('Original audio evidence plays');await page.locator('#audio').evaluate(a=>a.pause());
    }
    const other=await browser.newContext({extraHTTPHeaders:{'ngrok-skip-browser-warning':'1'},httpCredentials:{username:config.username,password:config.password,origin:base,send:'always'}});
    assert.equal((await other.request.get(base+'/api/jobs/'+metrics.id,{maxRetries:2})).status(),404);await other.close();checks.push(`${id}: result inaccessible to another browser session`);
    await page.locator('#reset').click();assert.equal((await context.request.get(base+'/api/jobs/'+metrics.id,{maxRetries:2})).status(),404);
    console.log(`Public ${id}: completed, session isolation and clear verified.`);
  }
  assert.deepEqual(errors,[]);
  await writeFile(`${directory}/checks.json`,JSON.stringify({checkedAt:new Date().toISOString(),url:base,checks,browserErrors:errors,credentialsRecorded:false,limitation:'Host computer, internet and tunnel must remain running; provider quotas apply. An account-assigned domain does not guarantee uptime.'},null,2)+'\n');
  console.log('Public HTTPS end-to-end check passed. No credentials printed.');
}catch(error){
  // Playwright call logs may contain HTTP credentials; never emit its raw error.
  const summary=String(error.message??'Check failed').split('Call log:')[0].replaceAll(config.password,'[REDACTED]').trim();
  await writeFile(`${directory}/last-error.json`,JSON.stringify({checkedAt:new Date().toISOString(),url:base,checks,error:summary,credentialsRecorded:false},null,2)+'\n');
  console.error(summary);process.exitCode=1;
}finally{await browser.close();}
