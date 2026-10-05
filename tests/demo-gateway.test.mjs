import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {createDemoGateway} from '../src/demo-gateway.mjs';
import {MAX_BYTES} from '../src/audio.mjs';

test('Reviewer gateway protects ingress and isolates browser results',async t=>{
  const upstreamRequests=[];
  const app=http.createServer(async(req,res)=>{
    const chunks=[];for await(const c of req)chunks.push(c);
    upstreamRequests.push({url:req.url,headers:req.headers,body:Buffer.concat(chunks)});
    if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<div class="section-label"><span>01</span> YOUR RECORDING</div><p>Audio and transcript are processed on this computer by local speech and language models.</p>');return;}
    res.setHeader('Content-Type','application/json');
    if(req.method==='POST'){res.statusCode=202;res.end(JSON.stringify({id:randomUUID()}));return;}
    res.end(JSON.stringify({ready:true,provider:'local',status:'done'}));
  });
  app.listen(0,'127.0.0.1');await once(app,'listening');
  const config={username:'reviewer',password:'test-only-demo-password-not-a-real-secret',publicOrigin:'https://review.example'};
  const gateway=createDemoGateway({getConfig:async()=>config,port:0,upstream:`http://127.0.0.1:${app.address().port}`});
  gateway.listen(0,'127.0.0.1');await once(gateway,'listening');
  const base=`http://127.0.0.1:${gateway.address().port}`;
  const auth='Basic '+Buffer.from(config.username+':'+config.password).toString('base64');
  const headers={Host:'review.example',Authorization:auth};
  const request=(path,options={})=>new Promise((resolve,reject)=>{
    const body=options.body===undefined?null:Buffer.from(options.body);
    const requestHeaders={...headers,...options.headers,...(body?{'Content-Length':body.length}:{})};
    const req=http.request(base+path,{method:options.method??'GET',headers:requestHeaders},res=>{
      const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve(new Response(Buffer.concat(chunks),{status:res.statusCode,headers:res.headers})));
    });req.on('error',reject);req.end(body);
  });
  try{
    await t.test('Requires authentication before serving data',async()=>{const r=await request('/',{headers:{Authorization:''}});assert.equal(r.status,401);assert.match(r.headers.get('www-authenticate'),/Basic/);assert.equal(upstreamRequests.length,0);});
    await t.test('Rejects foreign host and origin',async()=>{assert.equal((await request('/',{headers:{Host:'evil.example'}})).status,403);assert.equal((await request('/api/jobs',{method:'POST',headers:{Origin:'https://evil.example'}})).status,403);assert.equal((await request('/api/jobs',{method:'POST',headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);});
    await t.test('Redirects public HTTP before requesting a password',async()=>{const r=await request('/',{headers:{Authorization:'','X-Forwarded-Proto':'http'}});assert.equal(r.status,308);assert.equal(r.headers.get('location'),config.publicOrigin+'/');assert.equal(r.headers.get('www-authenticate'),null);});
    let cookie;
    await t.test('Discloses remote audio path and sets secure session cookie',async()=>{const r=await request('/');assert.equal(r.status,200);const html=await r.text();assert.match(html,/Uploads pass through the tunnel service/);assert.doesNotMatch(html,/processed on this computer/);const c=r.headers.get('set-cookie');assert.match(c,/Secure/);assert.match(c,/HttpOnly/);assert.match(c,/SameSite=Strict/);cookie=c.split(';')[0];assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow');});
    await t.test('Keeps secrets and model files inaccessible',async()=>{for(const path of ['/.env.local','/.runtime/demo/config.json','/fixtures/A/expected.json','/demo/Z.wav'])assert.equal((await request(path)).status,404);});
    await t.test('Serves only allowed fictional sample audio',async()=>{const r=await request('/demo/D.wav');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/audio\/wav/);assert.equal(Buffer.from(await r.arrayBuffer()).subarray(0,4).toString(),'RIFF');});
    await t.test('Rejects invalid upload format and oversized body',async()=>{assert.equal((await request('/api/jobs',{method:'POST',body:'text'})).status,415);assert.equal((await request('/api/jobs',{method:'POST',headers:{'Content-Type':'audio/wav'},body:Buffer.alloc(MAX_BYTES+1)})).status,413);});
    let id;
    await t.test('Forwards upload with local origin and without password',async()=>{const r=await request('/api/jobs',{method:'POST',headers:{Cookie:cookie,Origin:config.publicOrigin,'Content-Type':'audio/wav'},body:Buffer.from('test audio bytes')});assert.equal(r.status,202);id=(await r.json()).id;const last=upstreamRequests.at(-1);assert.equal(last.headers.authorization,undefined);assert.equal(last.headers.origin,`http://127.0.0.1:${app.address().port}`);assert.equal(last.body.toString(),'test audio bytes');});
    await t.test('Rejects access from another browser session',async()=>{assert.equal((await request('/api/jobs/'+id)).status,404);assert.equal((await request('/api/jobs/'+id,{method:'DELETE'})).status,404);assert.equal((await request('/api/jobs/'+id,{headers:{Cookie:cookie}})).status,200);});
    await t.test('Clearing removes browser ownership',async()=>{assert.equal((await request('/api/jobs/'+id,{method:'DELETE',headers:{Cookie:cookie,Origin:config.publicOrigin}})).status,200);assert.equal((await request('/api/jobs/'+id,{headers:{Cookie:cookie}})).status,404);});
    await t.test('Rejects missing or weak access configuration',async()=>{config.password='short';assert.equal((await request('/')).status,503);});
  }finally{gateway.closeAllConnections();app.closeAllConnections();await Promise.all([new Promise(r=>gateway.close(r)),new Promise(r=>app.close(r))]);}
});
