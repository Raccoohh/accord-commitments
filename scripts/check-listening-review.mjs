import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(resolve('reports/listening-review.html')).href);
  assert.equal(await page.locator('audio').count(),7);
  await page.waitForFunction(()=>[...document.querySelectorAll('audio')].every(a=>Number.isFinite(a.duration)));
  const button=page.locator('button[data-audio]').first(),end=Number(await button.getAttribute('data-end'));
  await button.click();await page.waitForTimeout(500);
  const playing=await page.locator('#audio-A').evaluate(a=>({paused:a.paused,time:a.currentTime}));
  assert.equal(playing.paused,false);
  await page.waitForFunction(end=>{const a=document.querySelector('#audio-A');return a.paused&&a.currentTime>=end-.3;},end,{timeout:25000});
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'reports/listening-review.png'});
  await writeFile('reports/listening-review-check.json',JSON.stringify({audioFilesLoaded:7,excerptPlaybackAndStop:true,browserErrors:errors,acousticListening:'not performed'},null,2)+'\n');
  console.log('Saved review: seven real audio files load; excerpt play/stop works; no JS errors. No acoustic listening claim.');
}finally{await browser.close();}
